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
          , VK_ENCODING: 'UTF-8'
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
  params['VK_RETURN'] = 'http://localhost:4000/'
  return params
}

IpizzaBank.prototype.genMac_ = function (params) {
  var pack = _.reduce(params, function (memo, val, key) {
    val = val.toString()
    if (!~['VK_MAC', 'VK_RETURN', 'VK_LANG', 'VK_ENCODING'].indexOf(key)) {
      memo += S('0').repeat(3 - val.length.toString().length).toString()
        + val.length + val
    }
    return memo
  }, '')
  var signer = crypto.createSign('RSA-SHA1')
  signer.update(pack)
  return signer.sign(this.get('privateKey').toString('utf8'), 'base64')
}

module.exports = IpizzaBank
