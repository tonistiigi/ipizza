var crypto = require('crypto')
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
          //, VK_ENCODING: 'UTF-8'
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
          //, VK_ENCODING: 'UTF-8'
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
  if (this.get('encoding')) params['VK_ENCODING'] = this.get('encoding')
  
  params['VK_MAC'] = this.genMac_(params)
  var ipizza = require('ipizza')
  params['VK_RETURN'] = ipizza.get('hostname') + ipizza.get('response') + '/'
    + this.get('provider')
  return params
}

IpizzaBank.prototype.genPackage_ = function (params) {
  console.log(params)
  return _.reduce(params, function (memo, val, key) {
    val = val.toString()
    memo += S('0').repeat(3 - val.length.toString().length).toString()
      + val.length + val
    return memo
  }, '')
}

IpizzaBank.prototype.genMac_ = function (params) {
  var pack = this.genPackage_(_.reduce(params, function (memo, val, key) {
    if (!~['VK_MAC', 'VK_RETURN', 'VK_LANG', 'VK_ENCODING'].indexOf(key)) {
      memo[key] = val
    }
    return memo
  }, {}))
  var signer = crypto.createSign('RSA-SHA1')
  signer.update(pack)
  return signer.sign(this.get('privateKey').toString('utf8'), 'base64')
}

IpizzaBank.prototype.response = function (req, resp) {
  console.log(req.body)
  var service = req.body.VK_SERVICE
  var pack = this.genPackage_(_.reduce(IpizzaBank.services[service],
    function (memo, val, key) {
      if (val) {
        memo[key] = unescape(req.body[key]).replace(/\+/g, ' ')
      }
      return memo
    }, {}))
  var verifier = crypto.createVerify('RSA-SHA1')
  verifier.update(pack)
  var signer = crypto.createSign('RSA-SHA1')
  signer.update(pack)
  console.log(pack)
  var ret = verifier.verify(this.get('certificate').toString('utf8'), req.body.VK_MAC, 'base64')
  console.log(ret, this.get('certificate').toString('utf8'), req.body.VK_MAC, 'base64')
  resp.end(JSON.stringify(req.body));
}
/*
004 1101
003 008
002 HP
009 uid202196
004 1234
005 13915
005 19.00
003 EUR
000
000
012 221234567897
015 Tõõger Leõpäöld
009 121312952
005 goods
010 22.08.2012
*/
module.exports = IpizzaBank
