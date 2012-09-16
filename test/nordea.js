var assert = require('assert')

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

  it('generates a reference number if none set', function() {

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