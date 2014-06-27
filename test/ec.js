var assert = require('assert')
  , path = require('path')

describe('ec', function() {
  beforeEach(function() {
    var ipizza = require('../ipizza')
    ipizza.set('logLevel', 'error')
    ipizza.set('hostname', 'http://my.fake.domain.com')
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
    }).json('2014-06-26 12:00:00')

    var result = '6941442e04f6eff1984aea157074c15cc671ea97854c8717650bec1fbefa2874c520f320795901627ed6ccd8d14e7d14d609387a99ac414504c6e5270c2b0abe077689b2bbf5fc479977e3c533a5c88da34f1935d9b6a76d6a533bb949840d0742eef5d6eaa574cd5b70f98afd16ea9711cb3d080117a80f36cf5a1498f7bf2d9664a31b22a320142eb793457b15012fb56c55975234a60390719a7dbf4a7dc5a8aada2d92afd41abe7552bb25974ae4570b59f88fdc62169600afbb8491d56cc4592f141a59e83b738ced480777607c6f02790b74eee870983c6a7dc6fa1dd6d31c36cec5fbd57a146c6024c3dfa01cf0606a8379378b8552d590e1241c9d70'

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