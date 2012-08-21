var IpizzaBank = require('./ipizzabank')

function Swedbank (opt) {
  this.name = 'swedbank'
  IpizzaBank.apply(this, arguments)
}
Swedbank.prototype = Object.create(IpizzaBank.prototype)

module.exports = Swedbank