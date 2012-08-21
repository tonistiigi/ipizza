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


ipizza.set({ appHandler: null
           , hostname: require('os').hostname()
           , logLevel: process.env.NODE_ENV == 'production' ? 'info' : 'verbose'
           , env: process.env.NODE_ENV || 'development'
           })

module.exports = ipizza