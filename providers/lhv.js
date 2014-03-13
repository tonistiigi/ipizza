var IpizzaBank = require('./ipizzabank')

function LHV (opt) {
  this.name = 'lhv'
  IpizzaBank.apply(this, arguments)
}
LHV.prototype = Object.create(IpizzaBank.prototype)

LHV.prototype.gateways =
  { development: 'https://pangalink.net/banklink/lhv'
  , production: 'https://www.lhv.ee/banklink'
  }


module.exports = LHV