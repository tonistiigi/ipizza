var IpizzaBank = require('./ipizzabank')

function Swedbank (opt) {
  this.name = 'swedbank'
  IpizzaBank.super.apply(this, arguments)
}
IpizzaBank.prototype = Object.create(require('events').EventEmitter.prototype)

