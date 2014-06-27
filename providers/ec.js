var crypto = require('crypto')
var log = require('npmlog')
var moment = require('moment')
var _ = require('lodash')._
var IpizzaBank = require('./ipizzabank')

// http://www.estcard.ee/publicweb/files/ecomdevel/e-comDocENG.html

var paddings = {
    eamount: ['0', 12, true]
  , ver: ['0', 3, true]
  , feedBackUrl: [' ', 128, false]
  , id: [' ', 10, false]
  , msgdata: [' ', 40, false]
  , actiontext: [' ', 40, false]
  , respcode: ['0', 3, true]
  , receipt_no: ['0', 6, true]
}

function EC (opt) {
  this.name = 'ec'
  IpizzaBank.apply(this, arguments)
}
EC.prototype = Object.create(IpizzaBank.prototype)

//https://pangalink.net/banklink/ec
//https://pos.estcard.ee/test-pos/servlet/iPAYServlet
EC.prototype.gateways =
  { development: 'https://pangalink.net/banklink/ec'
  , production: 'https://pos.estcard.ee/webpos/servlet/iPAYServlet'
  }

EC.prototype.json = function (dateOverride) {
  this.validate_();
  var ipizza = require(__dirname + '/..')
  var params = {}

  var dt = moment(dateOverride || undefined)

  params['lang'] = getIso639Lang(this.get('lang'))
  params['action'] = 'gaf'
  params['ver'] = '004'
  params['id'] = this.get('clientId')
  params['ecuno'] = getEcuno(dt, this.get('id'))

  var amountInCents = Math.floor(parseFloat(this.get('amount') * 100))
  params['eamount'] = amountInCents
  params['cur'] = this.get('curr')
  params['datetime'] = dt.format('YYYYMMDDHHmmss')
  params['charEncoding'] = 'UTF-8' // spec says this is int?
  params['feedBackUrl'] = this.get('return') || ipizza.get('hostname') +
    ipizza.get('returnRoute').replace(':provider', this.get('provider'))
  params['delivery'] = 'S'

  params['mac'] = this.genMac_(params)

  log.verbose('req body', params)
  return params
}

EC.prototype.genMac_ = function (params) {
  var fields = ['ver', 'id', 'ecuno', 'eamount', 'cur', 'datetime',
    'feedBackUrl', 'delivery']

  var pack = fields.reduce(function(memo, val) {
    var v = params[val]
    if (paddings[val]) v = pad.apply(v, paddings[val])
    memo += v
    return memo
  }, '')

  log.verbose('req package', pack)
  var signer = crypto.createSign('RSA-SHA1')
  signer.update(pack)
  return signer.sign(this.get('privateKey').toString('utf8'), 'hex')
}

EC.prototype.verify_ = function (body) {
  var cert = this.get('certificate').toString('utf8')
  var self = this

  var fields = ['ver', 'id', 'ecuno', 'receipt_no', 'eamount', 'cur',
    'respcode', 'datetime', 'msgdata', 'actiontext']

  var pack = fields.reduce(function(memo, val) {
    var v = body[val]

    if (val === 'id') {
      v = self.get('clientId')
    }

    if (paddings[val]) v = pad.apply(v, paddings[val])

    memo += v
    return memo
  }, '')

  log.verbose('resp package', pack)
  log.verbose('resp mac', body.mac)

  var verifier = crypto.createVerify('RSA-SHA1')
  verifier.update(pack, 'utf8')

  return verifier.verify(cert, body.mac || '', 'hex')
}

EC.prototype.response = function (req, resp) {
  var ipizza = require(__dirname + '/..')
  var self = this;

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
        bankId: 'ec'
      , clientId: self.get('id')
      , id: parseEcuno(params.ecuno)
      , msg: params.msgdata
      , date: parseEcdate(params.datetime)
      , lang: 'ENG'
      })
      if (params.respcode !== '000') {
        ipizza.emit('error', _.extend({type: 'not paid'}, reply), req, resp)
      }
      else {
        reply = _.extend(reply, {
          ref: parseInt(params.receipt_no)
        , curr: params.cur
        , amount: parseEamount(params.eamount)
        })
        ipizza.emit('success', reply, req, resp)
      }
    }
  }
}

function parseEcuno(ecuno) {
  var e = parseInt(ecuno.substr(6))
  if (e >= 1e5 && e < 2e5) { // matching our own generation.
    e = e % 1e5
  }
  return e.toString()
}

function parseEcdate(date) {
  return moment(date, 'YYYYMMDDHHmmss').format('DD.MM.YYYY')
}

function parseEamount(amount) {
  return parseInt(amount, 10) / 100
}

function getIso639Lang(l) {
  return ({
    'EST': 'et',
    'ENG': 'en',
    'RUS': 'ru'
  })[l] || 'et'
}

function getEcuno(dt, id) {
  // spec says to use random. i try to make something more similar to other.
  // let me know if this may cause issues. @tonis
  var sfx = parseInt(id, 10)
  if (sfx < 1e5) sfx = 1e5 + sfx
  return dt.format('YYYYMM') + (sfx % 1e6)
}

// this function is called with this = string
function pad(char, limit, front) {
  var s = this.toString()
  while (s.length < limit) {
    if (front) {
      s = char + s
    }
    else {
      s += char
    }
  }
  return s
}

module.exports = EC