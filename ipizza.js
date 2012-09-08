var S = require('string')
  , log = require('npmlog')
  , _ = require('underscore')._

var ipizza = Object.create(require('events').EventEmitter.prototype)
  , opt = {}
  , providers = {}
  , routes = {}

log.heading = 'ipizza'
log.stream = process.stdout

ipizza.error_ = function (pfx, message) {
  if (ipizza.get('throwOnErrors')) {
    throw(new Error(pfx + ' ' + message))
  }
  else {
    log.error(pfx, message)
  }
}

function setupAppHandler() {
  var app = ipizza.get('appHandler')
    , response = ipizza.get('response')
  if (app && response) {
    _.forEach(providers, function (v, k) {
      var route = response + '/' + k
      if (!routes[route]) {
        app.all(route, function (req, resp) {
          ipizza.response(k, req, resp)
        })
      }
    })
  }
}

ipizza.makeRefNumber = function (base) {
  var total = base.toString().split('').reverse().reduce(
    function (memo, num, i) {
      return memo + parseInt(num) * [7, 3, 1][i % 3]
    }, 0)
  return parseInt(base.toString() + (Math.ceil(total / 10) * 10 - total))
}

ipizza.set = function (key, val) {
  if (typeof key !== 'string') {
    for (var i in key) {
      if (key.hasOwnProperty(i)) ipizza.set(i, key[i])
    }
    return
  }

  key = S(key).camelize().toString()

  opt[key] = val

  if (key === 'logLevel') log.level = key
  if (key === 'appHander' || key === 'response') setupAppHandler()
}

ipizza.get = function (key) {
  if (!arguments.length) return opt

  key = S(key).camelize().toString()
  if (opt[key] === undefined) {
    log.error('Can\'t get option %s. No such option.')
    return
  }
  return opt[key]
}

ipizza.provider = function (provider, opt) {
  if (provider instanceof Array) {
    return provider.forEach(ipizza.provider, opt)
  }
  if (typeof provider === 'string') opt.provider = provider
  else opt = provider
  var p = providers[opt.provider]
  if (opt.alias) {
    p = providers[opt.alias] = {klass: p.klass}
  }
  if (!p) {
    log.error('provider setup', 'No such provider %s', opt.provider)
  }
  else {
    p.opt = opt
    setupAppHandler() // todo: wrong
  }
}

ipizza.payment = function (provider, opt) {
  if (typeof provider === 'string') opt.provider = opt
  else opt = provider

  if (!providers[opt.provider]) {
    log.error('provider for request', 'No such provider %s', opt.provider)
    return
  }
  return new providers[opt.provider].klass(
    _.extend({}, providers[opt.provider].opt, opt))
}

ipizza.response = function (provider, req, resp) {
  if (providers[provider]) {
    var payment = new providers[provider].klass(providers[provider].opt)
    payment.response(req, resp)
  }
  else {
    log.error('provider for response', 'No such provider %s.', provider)
  }
}

ipizza.define = function (provider, klass) {
  providers[provider] = {klass: klass, opt: {}}
}

// Default parameters.
ipizza.set(
  { appHandler: null
  , response: '/api/payment/response'
  , hostname: 'http://' + require('os').hostname()
  , logLevel: process.env.NODE_ENV == 'production' ? 'info' : 'verbose'
  , env: process.env.NODE_ENV || 'development'
  , throwOnErrors: true
  })


// Define providers.
;[ 'swedbank'
, 'seb'
, 'sampo'
, 'krediidipank'
, 'lhv'
, 'nordea'].forEach(function (provider) {
  ipizza.define(provider, require(__dirname + '/providers/' + provider + '.js'))
})

module.exports = ipizza
