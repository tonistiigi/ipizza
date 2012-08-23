var Buffer = require('buffer').Buffer
  , crypto = require('crypto')
  , fs = require('fs')
  , Iconv  = require('iconv').Iconv
  , S = require('string')
  , log = require('npmlog')
  , _ = require('underscore')._

function IpizzaBank (opt) {
  this.opt = {}
  this.set(opt)

  if (!this.get('gateway')) {
    var ipizza = require('ipizza')
    this.set('gateway', this.gateways[ipizza.get('env')])
  }
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
  if (this.get('encoding') && this.name != 'krediidipank') {
    // Krediidipank uses ISO-8859-13 as alernative.
    // I see no reason to support it.
    params['VK_ENCODING'] = params['VK_CHARSET'] = this.get('encoding')
  }

  if (this.name != 'swedbank') delete params['VK_ENCODING']
  if (!~['seb', 'krediidipank', 'lhv'].indexOf(this.name)) {
    delete params['VK_CHARSET']
  }

  this.utf8_ = params['VK_ENCODING'] === 'UTF-8'
               || params['VK_CHARSET'] == 'UTF-8'

  params['VK_MAC'] = this.genMac_(params)

  log.verbose('req mac', params['VK_MAC'])

  var ipizza = require('ipizza')
  params['VK_RETURN'] = ipizza.get('hostname') + ipizza.get('response') + '/'
    + this.get('provider')
  log.verbose('req body', params)
  return params
}

IpizzaBank.prototype.genPackage_ = function (params) {
  return _.reduce(params, function (memo, val, key) {
    val = val.toString()
    var len = ['seb', 'lhv'].indexOf(this.name) && this.utf8_ ?
      Buffer.byteLength(val, 'utf8') : val.length
    memo += S('0').repeat(3 - len.toString().length).toString()
      + len + val
    return memo
  }, '', this)
}

IpizzaBank.prototype.genMac_ = function (params) {
  var pack = this.genPackage_(_.reduce(params, function (memo, val, key) {
    if (!~['VK_MAC', 'VK_RETURN', 'VK_LANG', 'VK_ENCODING',
           'VK_CHARSET'].indexOf(key)) {
      memo[key] = val
    }
    return memo
  }, {}))
  if (this.utf8_) {
    var iconv = new Iconv('ISO-8859-1', 'UTF-8')
    pack = iconv.convert(pack.toString()).toString('utf8')
  }

  log.verbose('req package', pack)
  var signer = crypto.createSign('RSA-SHA1')
  signer.update(pack)
  return signer.sign(this.get('privateKey').toString('utf8'), 'base64')
}

IpizzaBank.prototype.response = function (req, resp) {
  log.verbose('resp body', req.body)
  var service = req.body.VK_SERVICE
    , cert = this.get('certificate').toString('utf8')
  this.utf8_ = req.body['VK_ENCODING'] === 'UTF-8'
               || req.body['VK_CHARSET'] == 'UTF-8'
  var params = _.reduce(IpizzaBank.services[service],
    function (memo, val, key) {
      if (val) {
        memo[key] = unescape(req.body[key]).replace(/\+/g, ' ')
      }
      return memo
    }, {})
  var pack = this.genPackage_(params)
  if (req.body.VK_ENCODING === 'UTF-8' || req.body.VK_CHARSET === 'UTF-8') {
    var iconv = new Iconv('ISO-8859-1', 'UTF-8');
    pack = iconv.convert(pack).toString('utf8');
  }
  log.verbose('resp package', pack)
  log.verbose('resp mac', req.body.VK_MAC)
  var verifier = crypto.createVerify('RSA-SHA1')
  verifier.update(pack)
  var ret = verifier.verify(cert, req.body.VK_MAC, 'base64')
  var ipizza = require('ipizza')
  var reply = { provider: this.name
              , bankId: params.VK_SND_ID
              , clientId: params.VK_REC_ID
              , id: params.VK_STAMP
              , ref: params.VK_REF
              , msg: params.VK_MSG
              , lang: req.body.VK_LANG
              , isAuto: req.body.VK_AUTO === 'Y'
              }
  if (!ret) {
    ipizza.emit('error', _.extend({type: 'not verified'}, reply), req, resp)
  }
  else if (req.body.VK_SERVICE === '1901') {
    ipizza.emit('error', _.extend({type: 'not paid'}, reply), req, resp)
  }
  else {
    ipizza.emit('success', _.extend({ transactionId: params.VK_T_NO
                                    , amount: parseFloat(params.VK_AMOUNT)
                                    , curr: params.VK_CURR
                                    , receiver: params.VK_REC_ACC
                                    , receiverName: params.VK_REC_NAME
                                    , sender: params.VK_SND_ACC
                                    , senderName: params.VK_SND_NAME
                                    , date: params.VK_T_DATE
                                    }, reply), req, resp)
  }
}

IpizzaBank.prototype.html = function () {
  var uid = this.get('provider') + ((Math.random() * 1e6) | 0)
    , params = this.json()
    , html = '<form action="' + this.get('gateway') +'" method="post" id="'
        + uid + '">'
  html += '<input type="submit">'
  for (var i in params) {
   html += '<input type="hidden" name="' + i + '" value="' + params[i] + '">'
  }
  html += '</form>'
  html += '<script type="text/javascript">//document.getElementById("'
    + uid + '").submit()</script>'
  return html
}

IpizzaBank.prototype.pipe = function (resp) {
  var html = '<!doctype html><html><head>'
  html += '<meta http-equiv="Content-Type" content="text/html; charset='
    + (this.utf8_ ? 'utf-8' : 'iso-8859-1') + '">'
  html += '</head><body>'
  html += this.html()
  html += '</body></html>'
  resp.set('Content-Type', 'text/html; charset='
    + (this.utf8_ ? 'utf-8' : 'iso-8859-1'))
  if (!this.utf8_) {
    var iconv = new Iconv( 'UTF-8', 'ISO-8859-1')
    resp.end(iconv.convert(html))
  }
  else {
    resp.end(html)
  }
}

module.exports = IpizzaBank
