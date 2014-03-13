var IpizzaBank = require('./ipizzabank')

function Swedbank (opt) {
  this.name = 'swedbank'
  IpizzaBank.apply(this, arguments)
}
Swedbank.prototype = Object.create(IpizzaBank.prototype)

Swedbank.prototype.gateways =
  { development: 'https://pangalink.net/banklink/swedbank'
  , production: 'https://www.swedbank.ee/banklink'
  }


module.exports = Swedbank