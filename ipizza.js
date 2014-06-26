var Buffer = require('buffer').Buffer
  , fs = require('fs')
  , routes = require('routes')
  , S = require('string')
  , log = require('npmlog')
  , _ = require('lodash')._

var ipizza = Object.create(require('events').EventEmitter.prototype)
  , opt = {}
  , providers = {}

log.heading = 'ipizza'

ipizza.toString = function() {
  return 'ipizza'
}

ipizza.error_ = function (pfx, message) {
  if (ipizza.get('throwOnErrors')) {
    throw(new Error(pfx + ' ' + message))
  }
  else {
    log.error(pfx, message)
  }
}

ipizza.file_ = function (data) {
  if (Buffer.isBuffer(data)) {
    return data.toString('utf8')
  }
  else if (typeof data === 'string' && data.length) {
    if (data.length < 200) { // Path.
      return fs.readFileSync(data, 'utf8')
    }
    else { // Contents.
      return data
    }
  }
  else {
    ipizza.error_('file', 'is in unknown format')
  }
}

var router;

var handler;
function createHandler() {
  if (handler) {
    handler.stop()
  }
  var stopped = false;
  handler = function(req, resp, next) {
    // Weird detection to allow simple mocks in tests.
    if (!req || !req.url || !resp || typeof next !== 'function') {
      return ipizza.error_(
        'Request handler', 'invoked with invalid arguments. ' +
        'Expected: http.ServerRequest, http.ServerResponse, function. ' +
        'Got: ' + req + ', ' + res + ', ' + next)
    }
    if (!router) {
      return ipizza.error_('Handler function called before routes setup.')
    }
    if (stopped) {
      next()
      return false
    }
    var match = router.match(req.url.split('?')[0])
    if (!match || !providers[match.params.provider]) {
      next()
      return false
    }
    if (resp.write) {
      match.fn(match.params.provider, req, resp)
    }
    return true
  }
  handler.stop = function() {
    stopped = true;
  }
  return handler
}

ipizza.makeRefNumber = function (base) {
  if (!(typeof base === 'string' && parseInt(base) > 0)
      && !(base && parseInt(base) === base)) {
        ipizza.error_('Reference number', 'can\'t be generated from ' + base)
      }
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

  if (key === 'appHandler') {
    if (!(val === undefined || typeof val.all === 'function')) {
      return ipizza.error_('appHandler', 'is not valid' + val)
    }
    var f = createHandler()
    if (val) {
      val.all('*', f)
    }
    val = f
  }
  else if (key === 'returnRoute' || key === 'env') {
    if (!(typeof val === 'string' && val.length)) {
      return ipizza.error_('returnRoute', 'is not valid' + val)
    }
    if (key === 'returnRoute') {
      if (!/\/\:provider(\/|$)/.test(val)) {
        if (val.substr(-1) !== '/') {
          val += '/'
        }
        val += ':provider'
      }
      router = new routes.Router()
      router.addRoute(val, ipizza.response)
    }
  }

  opt[key] = val

  if (key === 'logLevel') log.level = val
  if (key === 'logStream') log.stream = val

}

ipizza.get = function (key) {
  if (!arguments.length) return opt

  key = S(key).camelize().toString()
  if (!opt.hasOwnProperty(key)) {
    log.error('Can\'t get option ' + key + '. No such option.')
    return
  }
  return opt[key]
}

ipizza.provider = function (provider, opt) {
  if (provider instanceof Array) {
    return provider.forEach(ipizza.provider, opt)
  }
  opt = opt || {}
  if (typeof provider === 'string') opt.provider = provider
  else opt = provider

  if (opt.privateKey) {
    opt.privateKey = ipizza.file_(opt.privateKey)
  }
  if (opt.certificate) {
    opt.certificate = ipizza.file_(opt.certificate)
  }

  var p = providers[opt.provider]
  if (opt.alias) {
    p = providers[opt.alias] = providers[opt.alias] || {klass: p.klass, opt: {}}
  }
  if (!p) {
    ipizza.error_('provider setup', 'No such provider ' + opt.provider)
  }
  else {
    p.opt = _.extend(p.opt, opt)
  }
}

ipizza.payment = function (provider, opt) {
  opt = opt || {}
  if (typeof provider === 'string') opt.provider = provider
  else opt = provider
  if (!providers[opt.provider]) {
    ipizza.error_('provider for request', 'No such provider ' + opt.provider)
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
    ipizza.error_('provider for response', 'No such provider ' + provider)
  }
}

ipizza.define = function (provider, klass) {
  providers[provider] = {klass: klass, opt: {}}
}

// Default parameters.
ipizza.set(
  { appHandler: undefined
  , returnRoute: '/api/payment/response'
  , hostname: 'http://' + require('os').hostname()
  , logLevel: process.env.NODE_ENV == 'production' ? 'info' : 'verbose'
  , logStream: process.stdout
  , env: process.env.NODE_ENV || 'development'
  , throwOnErrors: true
  })

ipizza.IpizzaBank = require(__dirname + '/providers/ipizzabank.js')

// Define providers.
;[ 'swedbank'
, 'seb'
, 'sampo'
, 'krediidipank'
, 'lhv'
, 'nordea'
, 'ec'].forEach(function (provider) {
  ipizza.define(provider, require(__dirname + '/providers/' + provider + '.js'))
})

module.exports = ipizza
