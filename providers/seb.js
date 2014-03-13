var IpizzaBank = require('./ipizzabank')

function Seb (opt) {
  this.name = 'seb'
  IpizzaBank.apply(this, arguments)
}
Seb.prototype = Object.create(IpizzaBank.prototype)

Seb.prototype.gateways =
  { development: 'https://pangalink.net/banklink/seb'
  , production: 'https://www.seb.ee/cgi-bin/unet3.sh/un3min.rk'
  }


module.exports = Seb