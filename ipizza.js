var S = require('string')
  , log = require('npmlog')
  , _ = require('underscore')._

var ipizza = Object.create(require('events').EventEmitter.prototype)
  , opt = {}
  , providers = {}
  , routes = {}

log.heading = 'ipizza'
log.stream = process.stdout

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
    return provider.forEach(ipizza.provider)
  }
  if (typeof provider === 'string') opt.provider = provider
  else opt = provider
  if (!providers[opt.provider]) {
    log.error('provider setup', 'No such provider %s', opt.provider)
  }
  else {
    providers[opt.provider].opt = opt
    setupAppHandler()
  }
}

ipizza.payment = function (provider, opt) {
  if (typeof provider === 'string') opt.provider = opt
  else opt = provider

  if (!providers[opt.provider]) {
    log.error('provider for request', 'No such provider %s', opt.provider)
    return
  }
  var payment = new providers[opt.provider].klass(
    _.extend({}, providers[opt.provider].opt, opt))
  return payment
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

ipizza.set({ appHandler: null
           , response: '/api/payment/response'
           , hostname: 'http://' + require('os').hostname()
           , logLevel: process.env.NODE_ENV == 'production' ? 'info' : 'verbose'
           , env: process.env.NODE_ENV || 'development'
           })

ipizza.define('swedbank', require(__dirname + '/providers/swedbank.js'))
ipizza.define('seb', require(__dirname + '/providers/seb.js'))
ipizza.define('sampo', require(__dirname + '/providers/sampo.js'))
ipizza.define('krediidipank', require(__dirname + '/providers/krediidipank.js'))
ipizza.define('lhv', require(__dirname + '/providers/lhv.js'))
ipizza.define('nordea', require(__dirname + '/providers/nordea.js'))

/*
ipizza.define('swedbank_est', require(__dirname + '/providers/swedbank.js'))
ipizza.define('swedbank_lat', require(__dirname + '/providers/swedbank_lat.js'))
ipizza.define('swedbank_ltl', require(__dirname + '/providers/swedbank_ltl.js'))
*/

module.exports = ipizza