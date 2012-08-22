var IpizzaBank = require('./ipizzabank')

function Sampo (opt) {
  this.name = 'sampo'
  IpizzaBank.apply(this, arguments)
}
Sampo.prototype = Object.create(IpizzaBank.prototype)

module.exports = Sampo