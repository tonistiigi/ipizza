var S = require('string')
  , log = require('npmlog')

var ipizza = Object.create(require('events').EventEmitter.prototype)
  , opt = {}

log.heading = 'ipizza'
log.stream = process.stdout

ipizza.set = function (key, val) {
  if (typeof key !== 'string') {
    for (var i in key) {
      if (key.hasOwnProperty(i)) ipizza.set(i, key[i])
    }
    return
  }
  
  key = S(key).camelize().toString()
  
  if (key === 'logLevel') log.level = key

  opt[key] = val

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
  if (typeof provider === 'string') opt.provider = opt
  else opt = provider
  
}

ipizza.payment = function (provider, opt) {
  if (typeof provider === 'string') opt.provider = opt
  else opt = provider
  
  
}

ipizza.response = function (provider, cb) {
  
}

ipizza.define = function (provider, klass) {
  
}

ipizza.set({ appHandler: null
           , hostname: require('os').hostname()
           , logLevel: process.env.NODE_ENV == 'production' ? 'info' : 'verbose'
           , env: process.env.NODE_ENV || 'development'
           })

ipizza.define('swedbank', require(__dirname + '/providers/swedbank.js'))
/*
ipizza.define('swedbank_est', require(__dirname + '/providers/swedbank.js'))
ipizza.define('swedbank_lat', require(__dirname + '/providers/swedbank_lat.js'))
ipizza.define('swedbank_ltl', require(__dirname + '/providers/swedbank_ltl.js'))
ipizza.define('lhv', require(__dirname + '/providers/lhv.js'))
ipizza.define('seb', require(__dirname + '/providers/seb.js'))
ipizza.define('sampo', require(__dirname + '/providers/sampo.js'))
ipizza.define('krediidipank', require(__dirname + '/providers/krediidipank.js'))
ipizza.define('nordea', require(__dirname + '/providers/nordea.js'))
*/

module.exports = ipizza