var Buffer = require('buffer').Buffer
  , crypto = require('crypto')
  , fs = require('fs')
  , S = require('string')
  , log = require('npmlog')
  , _ = require('underscore')._

function IpizzaBank (opt) {
  this.opt = {}
  this.set(opt)
}
IpizzaBank.prototype = Object.create(require('events').EventEmitter.prototype)

IpizzaBank.services = 
  { 1001: { VK_SERVICE: 1001
          , VK_VERSION: '008'
          , VK_SND_ID: ''
          , VK_STAMP: ''
          , VK_AMOUNT: '0.00'
          , VK_CURR: 'EUR'
          , VK_ACC: ''
          , VK_NAME: ''
          , VK_REF: ''
          , VK_MSG: ''
          , VK_MAC: ''
          , VK_RETURN: ''
          , VK_LANG: 'ENG'
          , VK_ENCODING: 'UTF-8'
          , VK_CHARSET: 'UTF-8'
          }
  , 1002: { VK_SERVICE: 1002
          , VK_VERSION: '008'
          , VK_SND_ID: ''
          , VK_STAMP: ''
          , VK_AMOUNT: '0.00'
          , VK_CURR: 'EUR'
          , VK_REF: ''
          , VK_MSG: ''
          , VK_MAC: ''
          , VK_RETURN: ''
          , VK_LANG: 'ENG'
          , VK_ENCODING: 'UTF-8'
          , VK_CHARSET: 'UTF-8'
          }
  , 1101: { VK_SERVICE: true
          , VK_VERSION: true
          , VK_SND_ID: true
          , VK_REC_ID: true
          , VK_STAMP: true
          , VK_T_NO: true
          , VK_AMOUNT: true
          , VK_CURR: true
          , VK_REC_ACC: true
          , VK_REC_NAME: true
          , VK_SND_ACC: true
          , VK_SND_NAME: true
          , VK_REF: true
          , VK_MSG: true
          , VK_T_DATE: true
          , VK_MAC: false
          , VK_LANG: false
          , VK_AUTO: false
          , VK_ENCODING: false
          }
  , 1901: { VK_SERVICE: true
          , VK_VERSION: true
          , VK_SND_ID: true
          , VK_REC_ID: true
          , VK_STAMP: true
          , VK_REF: true
          , VK_MSG: true
          , VK_MAC: false
          , VK_LANG: false
          , VK_AUTO: false
          , VK_ENCODING: false
          }
  }

IpizzaBank.prototype.set = function (key, val) {
  if (typeof key !== 'string') {
    for (var i in key) {
      if (key.hasOwnProperty(i)) this.set(i, key[i])
    }
    return
  }
  
  key = S(key).camelize().toString()
  if (key == 'privateKey') val = fs.readFileSync(val)
  if (key == 'certificate') val = fs.readFileSync(val)
  this.opt[key] = val
}

IpizzaBank.prototype.get = function (key) {
  if (!arguments.length) return this.opt
  key = S(key).camelize().toString()
  return this.opt[key]
}


IpizzaBank.prototype.json = function () {
  var params = _.clone(IpizzaBank.services[1002])
  if (this.get('account') && this.get('accountName')) {
    params = _.clone(IpizzaBank.services[1001])
    _.extend(params, { VK_NAME: this.get('accountName')
                     , VK_ACC: this.get('account')})
  }
  
  _.extend(params, { VK_SND_ID: this.get('clientId')
                   , VK_STAMP: this.get('id')
                   , VK_AMOUNT: parseFloat(this.get('amount')).toFixed(2)
                   , VK_REF: this.get('ref')
                   , VK_MSG: this.get('msg')
                   })
  
  if (this.get('curr')) params['VK_CURR'] = this.get('curr')
  if (this.get('return')) params['VK_RETURN'] = this.get('return')
  if (this.get('lang')) params['VK_LANG'] = this.get('lang')
  if (this.get('encoding')) {
    params['VK_ENCODING'] = params['VK_CHARSET'] = this.get('encoding')
  } 
  
  if (this.name == 'swedbank') delete params['VK_CHARSET']
  if (this.name == 'seb') delete params['VK_ENCODING']
  
  
  params['VK_MAC'] = this.genMac_(params)

  log.verbose('req mac', params['VK_MAC'])
  
  var ipizza = require('ipizza')
  params['VK_RETURN'] = ipizza.get('hostname') + ipizza.get('response') + '/'
    + this.get('provider')
  return params
}

IpizzaBank.prototype.genPackage_ = function (params) {
  return _.reduce(params, function (memo, val, key) {
    val = val.toString()
    var len = Buffer.byteLength(val, 'utf8')
    memo += S('0').repeat(3 - len.toString().length).toString()
      + len + val
    return memo
  }, '')
}

IpizzaBank.prototype.genMac_ = function (params) {
  var pack = this.genPackage_(_.reduce(params, function (memo, val, key) {
    if (!~['VK_MAC', 'VK_RETURN', 'VK_LANG', 'VK_ENCODING', 'VK_CHARSET'].indexOf(key)) {
      memo[key] = val
    }
    return memo
  }, {}))
  log.verbose('req package', pack)
  var signer = crypto.createSign('RSA-SHA1')
  signer.update(pack)
  return signer.sign(this.get('privateKey').toString('utf8'), 'base64')
}

IpizzaBank.prototype.response = function (req, resp) {
  log.verbose('resp body', req.body)
  var service = req.body.VK_SERVICE
    , cert = this.get('certificate').toString('utf8')
  var pack = this.genPackage_(_.reduce(IpizzaBank.services[service],
    function (memo, val, key) {
      if (val) {
        memo[key] = unescape(req.body[key]).replace(/\+/g, ' ')
      }
      return memo
    }, {}))
  if (req.body.VK_ENCODING === 'UTF-8' || req.body.VK_CHARSET == 'UTF-8') {
    var Iconv  = require('iconv').Iconv
      , iconv = new Iconv('ISO-8859-1', 'UTF-8');
    pack = iconv.convert(pack).toString('utf8');
  }
  log.verbose('resp package', pack)
  log.verbose('resp mac', req.body.VK_MAC)
  var verifier = crypto.createVerify('RSA-SHA1')
  verifier.update(pack)
  var ret = verifier.verify(cert, req.body.VK_MAC, 'base64')
  resp.end(ret.toString());
}

module.exports = IpizzaBank
