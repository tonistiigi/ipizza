var assert = require('assert')
var ipizza = require('../ipizza')

describe('refnum', function() {
  it('generates valid reference number', function() {
    assert.equal(ipizza.makeRefNumber(123), 1232);
    assert.equal(ipizza.makeRefNumber(1234), 12344);
    assert.equal(ipizza.makeRefNumber(12345), 123453);
    assert.equal(ipizza.makeRefNumber(123456), 1234561);
    assert.equal(ipizza.makeRefNumber('123456'), 1234561);
  })
  it('throws on invalid arguments', function() {
    assert.throws(function(){ipizza.makeRefNumber()}, 'for undefined');
    assert.throws(function(){ipizza.makeRefNumber(0)}, 'for 0');
    assert.throws(function(){ipizza.makeRefNumber(Infinity), 'for Infinity'});
    assert.throws(function(){ipizza.makeRefNumber('foo')}, 'for alpha');
    assert.throws(function(){ipizza.makeRefNumber(12.3)}, 'for float');
    assert.throws(function(){ipizza.makeRefNumber(NaN)}, 'for NaN');
    assert.throws(function(){ipizza.makeRefNumber({})}, 'for object');
  })
})
