var crypto = require('crypto')
  , path = require('path')
  , IpizzaBank = require('./ipizzabank')
  , _ = require('lodash')._

function Nordea (opt) {
  this.name = 'nordea'
  if (!opt.algorithm) opt.algorithm = 'sha1'

  // Pangalink.net uses ISO (like the spec) but Nordeas test site is UTF8.
  this.utf8_ = opt.forceISO ? false : true
  IpizzaBank.apply(this, arguments)
}
Nordea.prototype = Object.create(IpizzaBank.prototype)

Nordea.prototype.gateways =
  { development: 'https://pangalink.net/banklink/nordea'
  , production: 'https://netbank.nordea.com/pnbepay/epayn.jsp'
  }

Nordea.prototype.requiredFields_ = function () {
  return ['clientId', 'id', 'amount', 'algorithm', 'mac']
}

Nordea.prototype.json = function () {
  this.validate_();
  var ipizza = require(__dirname + '/../ipizza.js')
  var params = {}
  params.SOLOPMT_VERSION = '0003'
  params.SOLOPMT_STAMP = this.get('id')
  params.SOLOPMT_RCV_ID = this.get('clientId')
  if (this.get('account') && this.get('accountName')) {
    params.SOLOPMT_RCV_ACCOUNT = this.get('account')
    params.SOLOPMT_RCV_NAME = this.get('accountName')
  }
  params.SOLOPMT_LANGUAGE = this.get('lang') === 'EST' ? '4' : '3'
  params.SOLOPMT_AMOUNT = parseFloat(this.get('amount')).toFixed(2)
  params.SOLOPMT_REF = this.get('ref') || ipizza.makeRefNumber(this.get('id'))
  params.SOLOPMT_DATE = 'EXPRESS'
  params.SOLOPMT_MSG = this.get('msg')
  params.SOLOPMT_RETURN = params.SOLOPMT_CANCEL = params.SOLOPMT_REJECT =
    this.get('return') || ipizza.get('hostname') +
      ipizza.get('returnRoute').replace(':provider', this.get('provider'))

  params.SOLOPMT_KEYVERS = '0001'
  params.SOLOPMT_CUR = this.get('curr')
  params.SOLOPMT_CONFIRM = 'YES'
  var pack = [ params.SOLOPMT_VERSION
             , params.SOLOPMT_STAMP
             , params.SOLOPMT_RCV_ID
             , params.SOLOPMT_AMOUNT
             , params.SOLOPMT_REF
             , params.SOLOPMT_DATE
             , params.SOLOPMT_CUR
             , this.get('mac')
             , ''].join('&')
  var hash = crypto.createHash(this.get('algorithm'))
  hash.update(pack)
  params.SOLOPMT_MAC = hash.digest('hex').toUpperCase()
  return params
}

Nordea.prototype.verify_ = function (params) {
  var pack = [ params.SOLOPMT_RETURN_VERSION
             , params.SOLOPMT_RETURN_STAMP
             , params.SOLOPMT_RETURN_REF
             , params.SOLOPMT_RETURN_PAID
             , this.get('mac')
             , ''
             ]
  if (!params.SOLOPMT_RETURN_PAID) {
    pack.splice(3, 1)
  }
  pack = pack.join('&')
  var hash = crypto.createHash(this.get('algorithm').toLowerCase())
  hash.update(pack)
  return hash.digest('hex').toUpperCase() === params.SOLOPMT_RETURN_MAC
}

Nordea.prototype.response = function (req, resp) {
  var ipizza = require(path.join(__dirname, '../ipizza'))
  params = req.query
  try {
    if (!params) {
      params = require('querystring').parse(req.url.split('?')[1])
    }

    var ret = this.verify_(params)
  }
  catch (e) {
    ret = 0
  }
  var reply = { provider: this.name }
  if (!ret) {
    ipizza.emit('error', _.extend({type: 'not verified'}, reply), req, resp)
  }
  else {
    reply = _.extend(reply, {
        bankId: 'nordea'
      , clientId: this.get('clientId')
      , id: params.SOLOPMT_RETURN_STAMP
      , ref: params.SOLOPMT_RETURN_REF
    })
    if (!params.SOLOPMT_RETURN_PAID) {
      ipizza.emit('error', _.extend({type: 'not paid'}, reply), req, resp)
    }
    else {
      ipizza.emit('success', _.extend(
        {transactionId: params.SOLOPMT_RETURN_PAID}, reply), req, resp)
    }
  }
}

module.exports = Nordea