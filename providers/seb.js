var IpizzaBank = require('./ipizzabank')

function Seb (opt) {
  this.name = 'seb'
  IpizzaBank.apply(this, arguments)
}
Seb.prototype = Object.create(IpizzaBank.prototype)

module.exports = Seb