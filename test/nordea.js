var assert = require('assert')
  , path = require('path')

function validOpt() {
  return {
    provider: 'nordea'
  , clientId: 'abc'
  , id: 10
  , msg: 'blah'
  , amount: 10
  , mac: '123'
  }
}

describe('nordea', function() {
  beforeEach(function() {
    var ipizza = require('../ipizza')
    ipizza.set('logLevel', 'error')
  })
  afterEach(function() {
    delete require.cache[require.resolve('../ipizza')]
  })

  it('doesn\'t throw on valid options', function() {
    var ipizza = require('../ipizza')
    assert.doesNotThrow(function() {
      ipizza.payment(validOpt()).json()
    })
  })

  it('throws on no mac', function() {
    var ipizza = require('../ipizza')
    var opt = validOpt()
    delete opt.mac
    assert.throws(function() {
      ipizza.payment(opt).json()
    }, /mac/)
  })

  it('has default mac algorithm', function() {
    var ipizza = require('../ipizza')
    var payment = ipizza.payment(validOpt())
    assert.equal(payment.get('algorithm'), 'sha1')
  })

  it('throws on invalid algorithm', function() {
    var ipizza = require('../ipizza')
    assert.throws(function () {
      ipizza.payment({provider: 'nordea', algorithm: 'sha'})
    })
    assert.throws(function () {
      ipizza.payment({provider: 'nordea', algorithm: 123})
    })
    assert.doesNotThrow(function () {
      ipizza.payment({provider: 'nordea', algorithm: 'SHA1'})
    })
    assert.doesNotThrow(function () {
      ipizza.payment({provider: 'nordea', algorithm: 'md5'})
    })
    assert.doesNotThrow(function () {
      ipizza.payment({provider: 'nordea', algorithm: 'SHA256'})
    })
  })

  it('is on by default', function() {
    var ipizza = require('../ipizza')
    assert.doesNotThrow(function() {
      ipizza.provider('nordea')
    })
  })
  it('has gateway URLs for dev/production', function() {
    var ipizza = require('../ipizza')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('nordea')
    var gw = payment.get('gateway')
    assert.ok(gw.length > 0)
    ipizza.set('env', 'development')
    var payment2 = ipizza.payment('nordea')
    var gw2 = payment2.get('gateway')
    assert.ok(gw2.length > 0)
    assert.notEqual(gw, gw2)
  })

  it('generates a reference number if none set', function() {
    var ipizza = require('../ipizza')
    var json = ipizza.payment('nordea', {
      clientId: 'abc'
    , mac: 'pw'
    , id: 9999
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'utf8'
    }).json()

    assert.strictEqual(json.SOLOPMT_REF, 99998)
  })
  it('generates valid mac for utf8', function() {
    var ipizza = require('../ipizza')
    var json = ipizza.payment('nordea', {
      clientId: 'abc'
    , mac: 'pw'
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'utf8'
    }).json()

    var result = 'E9777B29C55ECB77CAB5DCFC19DD250DE646C446'

    assert.strictEqual(json.SOLOPMT_MAC, result)
  })

  it('validates utf8 mac', function() {
    var params = {
      SOLOPMT_RETURN_VERSION: '0003',
      SOLOPMT_RETURN_STAMP: '10',
      SOLOPMT_RETURN_REF: '107',
      SOLOPMT_RETURN_PAID: 'EPM1234567890',
      SOLOPMT_RETURN_MAC: 'C0E80C8D6DAF9613D7A5226770A38D4F'
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('nordea', {
      mac: 'LEHTI'
    , algorithm: 'md5'
    })
    assert.ok(payment.verify_(params))

    params.SOLOPMT_RETURN_REF = '108'
    assert.ok(!payment.verify_(params))
  })

})