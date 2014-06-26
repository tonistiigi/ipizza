var assert = require('assert')
  , path = require('path')

describe('ec', function() {
  beforeEach(function() {
    var ipizza = require('../ipizza')
    ipizza.set('logLevel', 'error')
  })
  afterEach(function() {
    delete require.cache[require.resolve('../ipizza')]
  })

  it('is on by default', function() {
    var ipizza = require('../')
    assert.doesNotThrow(function() {
      ipizza.provider('ec')
    })
  })
  it('has gateway URLs for dev/production', function() {
    var ipizza = require('../')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('ec')
    var gw = payment.get('gateway')
    assert.ok(gw.length > 0)
    ipizza.set('env', 'development')
    var payment2 = ipizza.payment('ec')
    var gw2 = payment2.get('gateway')
    assert.ok(gw2.length > 0)
    assert.notEqual(gw, gw2)
  })

  it('generates valid mac', function() {
    var ipizza = require('../ipizza')
    var json = ipizza.payment('ec', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/lhv.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/lhv.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'utf8'
    }).json('2014-06-26')

    var result = '4a0a3c5706577add5de387d6f06fdebf8aa0d419830d2369b7d14b7860e893c1918a40ae3701ce3c9d83beb83f29dd2662e500590bbab683140bfe33d3ad7876b411a6cb6f75f9820e6b65b09df5a391c92bf2c2fe331701b916b7564b89ae12b8650db274765031f2740b6324d3749e43f3b80029fe0955d4b3b476c78fa155c06dfba243fa6413e91bbf8b741c0c0dfe28e3a3e8ac0e33780c348e919b32c7d0b96ec5c9c29a334640998abbe1e48b7d29c4692bb496940d264bf3b5da9814b8c04d8e828d2524c34b3d9dc0b76bca3b1a21174cc7a63aab2d60d8e6be10ef6bbb6e4c504f0755d5a23b9683ee0eec111d9215c7f0acde1b2eeafd690682d5'

    assert.strictEqual(json.mac, result)
  })


  it('validates mac', function() {
    var params = {
      action: 'afb',
      ver: '004',
      id: 'uid512446',
      ecuno: '201406100123',
      receipt_no: '96226',
      eamount: '000000000295',
      cur: 'EUR',
      respcode: '000',
      datetime: '20140626125504',
      msgdata: 'Tõõger Leõpäöld',
      actiontext: 'OK, tehing autoriseeritud',
      charEncoding: 'UTF-8',
      mac: '789fb97750ad3eaf8d47b10c2e2164a4035735cc88cabfc1ca2bff74a81662b6bf0671905d34e6e41596e1fc99e1c6775c59b234226959910c271082af3550fdf3a54253298091dcaaa0817a631c21c24d12bc80daf52d85e647e30fe8237439fe2f936e6b11afbcb8f41a95ec7540ee398d84e518eb13f237803f5a3f0e00f7' }
    var ipizza = require('../')
    var payment = ipizza.payment('ec', {
      certificate: path.join(__dirname, '../sample/keys/ec.cert.pem'),
      clientId: 'uid512446'
    })
    assert.ok(payment.verify_(params))

    params.eamount = '000000000195'
    assert.ok(!payment.verify_(params))
  })


})