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
})
