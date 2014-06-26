var Buffer = require('buffer').Buffer
  , crypto = require('crypto')
  , fs = require('fs')
  , iconv = require('iconv-lite')
  , S = require('string')
  , log = require('npmlog')
  , formidable = require('formidable')
  , _ = require('lodash')._

function IpizzaBank (opt) {
  this.opt = {}

  this.set(_.extend({
    curr: 'EUR'
  , msg: 'Goods'
  , lang: 'ENG'
  , encoding: 'utf'
  }, opt))

  if (!this.get('gateway')) {
    var ipizza = require(__dirname + '/../ipizza.js')
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
  var ipizza = require(__dirname + '/../ipizza')
  if (typeof key !== 'string') {
    for (var i in key) {
      if (key.hasOwnProperty(i)) this.set(i, key[i])
    }
    return
  }

  key = S(key).camelize().toString()
  switch (key) {
    case 'privateKey':
    case 'certificate':
      val = ipizza.file_(val)
      if (key === 'privateKey' && !/private key/i.test(val)) {
        ipizza.error_('privateKey', 'is in wrong format')
      }
      if (key === 'certificate' && !/certificate|public key/i.test(val)) {
        ipizza.error_('certificate', 'is in wrong format')
      }
    break

    case 'amount':
      var amount = parseFloat(val)
      if (isNaN(amount) || amount <= 0) {
        return ipizza.error_('amount', 'is in wrong format')
      }
    break

    case 'curr':
      val = val.toUpperCase()
      if (val !== 'EUR') { // @todo: more supported?
        return ipizza.error_('currency', 'is in wrong format')
      }
    break

    case 'ref':
      if (val !== '' && val != ipizza.makeRefNumber(
          val.toString().substr(0, val.toString().length - 1))) {
            return ipizza.error_('reference number', 'is in wrong format')
        }
    break

    case 'lang':
      try {
        val = val.toUpperCase()
        if (!_.include(['EST', 'ENG', 'RUS'], val)) {
          throw(new Error)
        }
      }
      catch (e) {
        return ipizza.error_('language', val + ' is unknown for ipizza')
      }
    break

    case 'encoding':
      try {
        val = val.toLowerCase()
        if (_.include(['utf', 'utf8', 'utf-8'], val)) {
          val = 'UTF-8'
        }
        else if (_.include(['iso', 'iso-8859', 'iso-8859-1'], val)) {
          val = 'ISO-8859-1'
        }
        else {
          throw(new Error)
        }
      }
      catch (e) {
        return ipizza.error_('encoding', val + ' is unknown for ipizza')
      }
    break

    case 'algorithm':
      try {
        val = val.toLowerCase()
        if (!val || !_.include(['md5', 'sha1', 'sha256'], val)) {
          throw(new Error)
        }
      }
      catch (e) {
        return ipizza.error_('algorithm', val + ' is unknown for ipizza ')
      }
    break

  }

  this.opt[key] = val
}

IpizzaBank.prototype.get = function (key) {
  if (!arguments.length) return this.opt
  key = S(key).camelize().toString()
  return this.opt[key]
}

IpizzaBank.prototype.requiredFields_ = function () {
  return ['clientId', 'id', 'amount', 'privateKey', 'certificate']
}

IpizzaBank.prototype.validate_ = function () {
  var ipizza = require(__dirname + '/../ipizza')

  var requiredFields = this.requiredFields_()

  var self = this
  requiredFields.forEach(function (field) {
    if (!self.get(field)) {
      return ipizza.error_('payment', 'started without ' + field)
    }
  })

}

IpizzaBank.prototype.json = function () {
  this.validate_();
  var params = _.clone(IpizzaBank.services[1002])
  if (this.get('account') && this.get('accountName')) {
    params = _.clone(IpizzaBank.services[1001])
    _.extend(params, { VK_NAME: this.get('accountName')
                     , VK_ACC: this.get('account')})
  }

  _.extend(params, { VK_SND_ID: this.get('clientId')
                   , VK_STAMP: this.get('id')
                   , VK_AMOUNT: parseFloat(this.get('amount')).toFixed(2)
                   , VK_REF: this.get('ref') || ''
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

  var ipizza = require(__dirname + '/../ipizza.js')
  params['VK_RETURN'] = this.get('return') || ipizza.get('hostname') +
    ipizza.get('returnRoute').replace(':provider', this.get('provider'))
  log.verbose('req body', params)
  return params
}

IpizzaBank.prototype.genPackage_ = function (params) {
  return this.lastPackage_ = _.reduce(params, function (memo, val, key) {
    val = val.toString()
    var len = (~['seb', 'lhv', 'krediidipank'].indexOf(this.name)) && this.utf8_ ?
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
    pack = iconv.decode(Buffer(pack.toString()), 'ISO-8859-1')
  }

  log.verbose('req package', pack)
  var signer = crypto.createSign('RSA-SHA1')
  signer.update(pack)
  return signer.sign(this.get('privateKey').toString('utf8'), 'base64')
}

IpizzaBank.prototype.verify_ = function (body) {
  var service = body.VK_SERVICE
    , cert = this.get('certificate').toString('utf8')
  this.utf8_ = body['VK_ENCODING'] === 'UTF-8'
               || body['VK_CHARSET'] === 'UTF-8'
  var params = _.reduce(IpizzaBank.services[service],
    function (memo, val, key) {
      if (val) {
        memo[key] = body[key] = unescape(body[key]).replace(/\+/g, ' ')
      }
      return memo
    }, {})
  var pack = this.genPackage_(params)
  if (this.utf8_) {
    pack = iconv.decode(Buffer(pack), 'ISO-8859-1').toString('utf8')
  }
  log.verbose('resp package', pack)
  log.verbose('resp mac', body.VK_MAC)
  var verifier = crypto.createVerify('RSA-SHA1')
  verifier.update(pack)

  return verifier.verify(cert, body.VK_MAC || '', 'base64')
}

IpizzaBank.prototype._parsePostRequest = function(req, next) {
  if (req.body) {
    return next(req.body)
  }

  var form = new formidable.IncomingForm()
  form.parse(req, function(err, fields, files) {
    next(err ? {} : fields)
  })

}

IpizzaBank.prototype.response = function (req, resp) {
  var ipizza = require(__dirname + '/..')
  var self = this

  this._parsePostRequest(req, response)

  function response (params) {
    try {
      log.verbose('resp body', params)

      var ret = self.verify_(params)
      var reply = { provider: self.name };
    }
    catch (e) {
      ret = 0
    }

    if (!ret) {
      ipizza.emit('error', _.extend({type: 'not verified'}, reply), req, resp)
    }
    else {
      reply = _.extend(reply, {
        bankId: params.VK_SND_ID
      , clientId: params.VK_REC_ID
      , id: params.VK_STAMP
      , ref: params.VK_REF
      , msg: params.VK_MSG
      , lang: params.VK_LANG
      , isAuto: params.VK_AUTO === 'Y'
      })
      if (params.VK_SERVICE === '1901') {
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
  }
}

IpizzaBank.prototype.html = function () {
  var uid = this.get('provider') + ((Math.random() * 1e6) | 0)
    , params = this.json()
    , html = '<form action="' + this.get('gateway') +'" method="post" id="'
        + uid + '">'
  //html += '<input type="submit">'
  for (var i in params) {
   html += '<input type="hidden" name="' + i + '" value="' + params[i] + '">'
  }
  html += '</form>'
  html += '<script type="text/javascript">document.getElementById("'
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
  resp.setHeader('Content-Type', 'text/html; charset='
    + (this.utf8_ ? 'utf-8' : 'iso-8859-1'))
  if (!this.utf8_) {
    resp.end(iconv.encode(html, 'ISO-8859-1'))
  }
  else {
    resp.end(html)
  }
}

module.exports = IpizzaBank
