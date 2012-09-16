var assert = require('assert')
  , path = require('path')

describe('swedbank', function() {
  beforeEach(function() {
    var ipizza = require('../ipizza')
    ipizza.set('logLevel', 'error')
  })
  afterEach(function() {
    delete require.cache[require.resolve('../ipizza')]
  })

  it('is on by default', function() {
    var ipizza = require('../ipizza')
    assert.doesNotThrow(function() {
      ipizza.provider('swedbank')
    })
  })
  it('has gateway URLs for dev/production', function() {
    var ipizza = require('../ipizza')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('swedbank')
    var gw = payment.get('gateway')
    assert.ok(gw.length > 0)
    ipizza.set('env', 'development')
    var payment2 = ipizza.payment('swedbank')
    var gw2 = payment2.get('gateway')
    assert.ok(gw2.length > 0)
    assert.notEqual(gw, gw2)
  })
  it('package generation uses string length', function() {
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('swedbank', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/swedbank.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/swedbank.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    })
    payment.json()

    var result = '0041002003008003abc0021000510.00003EUR000008öäüõÖÄÜÕ'
    assert.strictEqual(payment.lastPackage_ , result)

  })
  it('generates valid mac for utf8', function() {

  })

  it('generates valid mac for iso', function() {

  })

  it('validates utf8 mac', function() {

  })

  it('validates iso mac', function() {

  })

  it('errors for invalid mac', function() {

  })
})