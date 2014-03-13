var IpizzaBank = require('./ipizzabank')

function Sampo (opt) {
  this.name = 'sampo'
  IpizzaBank.apply(this, arguments)
}
Sampo.prototype = Object.create(IpizzaBank.prototype)
 
Sampo.prototype.gateways = 
  { development: 'https://pangalink.net/banklink/sampo'
  , production: 'https://www2.danskebank.ee/ibank/pizza/pizza'
  }


module.exports = Sampo