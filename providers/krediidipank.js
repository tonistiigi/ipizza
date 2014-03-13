var IpizzaBank = require('./ipizzabank')

function Krediidipank (opt) {
  this.name = 'krediidipank'
  IpizzaBank.apply(this, arguments)
}
Krediidipank.prototype = Object.create(IpizzaBank.prototype)

Krediidipank.prototype.gateways =
  { development: 'https://pangalink.net/banklink/krediidipank'
  , production: 'https://i-pank.krediidipank.ee/teller/maksa'
  }


module.exports = Krediidipank