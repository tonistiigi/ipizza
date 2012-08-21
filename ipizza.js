var string = require('string')

var ipizza = Object.create(require('events').EventEmitter.prototype)
  , opt = {}


ipizza.set = function (key, val) {
  
}

ipizza.get = function (key) {
  
}


ipizza.set({ appHandler: null
           , hostname: require('os').hostname()
           , logLevel: process.env.NODE_ENV == 'production' ? 'info' : 'verbose'
           , env: process.env.NODE_ENV || 'development'
           })

module.exports = ipizza