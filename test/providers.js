var assert = require('assert')

describe('providers', function() {
  afterEach(function() {
    delete require.cache[require.resolve('../ipizza')]
  })

  it('throws on unknown provider', function() {
    var ipizza = require('../ipizza')
    assert.throws(function() {
      ipizza.provider('unknown', {})
    })
  })
  it('supports passing in provider as string or property', function() {
    var ipizza = require('../ipizza')
    assert.doesNotThrow(function() {
      ipizza.provider('swedbank', {})
    })
    assert.doesNotThrow(function() {
      ipizza.provider({provider: 'seb'})
    })
  })
  it('supports setting aliases', function() {
    var ipizza = require('../ipizza')
    assert.throws(function() {
      ipizza.payment('swedbank2', {})
    })
    ipizza.provider('swedbank', {alias: 'swedbank2'})
    assert.doesNotThrow(function() {
      ipizza.payment('swedbank2', {})
    })
  })
  it('supports passing provider options multiple times', function() {
    var ipizza = require('../ipizza')
    ipizza.provider('swedbank', {foo: 123})
    ipizza.provider('swedbank', {bar: 456})
    ipizza.provider({provider: 'swedbank', baz: 789})
    var payment = ipizza.payment('swedbank')
    assert.equal(payment.get('foo'), 123)
    assert.equal(payment.get('bar'), 456)
    assert.equal(payment.get('baz'), 789)
  })
  it('supports passing provider options multiple times to alias', function() {
    var ipizza = require('../ipizza')
    ipizza.provider('swedbank', {foo: 123, alias: 'swedbank-2'})
    ipizza.provider('swedbank', {bar: 456})
    ipizza.provider({provider: 'swedbank', baz: 789})
    ipizza.provider({provider: 'swedbank', baz: 678, alias: 'swedbank-2'})
    var payment = ipizza.payment('swedbank')
    assert.equal(payment.get('foo'), undefined)
    assert.equal(payment.get('bar'), 456)
    assert.equal(payment.get('baz'), 789)
    var payment2 = ipizza.payment('swedbank-2')
    assert.equal(payment2.get('foo'), 123)
    assert.equal(payment2.get('bar'), undefined)
    assert.equal(payment2.get('baz'), 678)
  })
})
