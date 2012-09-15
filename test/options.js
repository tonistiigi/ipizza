var assert = require('assert'),
Stream = require('stream')

describe('options', function(){
  afterEach(function() {
    delete require.cache[require.resolve('../ipizza')]
  })

  it('have default values', function() {
    var ipizza = require('../ipizza')

    assert.strictEqual(typeof ipizza.get('appHandler'), 'function')

    function nonEmptyString(key) {
      var val = ipizza.get(key)
      assert.strictEqual(typeof val, 'string', key + ' isn\'t a string')
      assert(val.length > 0, key + ' is empty')
    }

    nonEmptyString('returnRoute');
    nonEmptyString('logLevel');
    nonEmptyString('env');

  })
  it('store values with key and value', function() {
    var ipizza = require('../ipizza')

    ipizza.set('returnRoute', '/banklink')
    assert.strictEqual(ipizza.get('returnRoute'), '/banklink/:provider')

    ipizza.set('returnRoute', '/ecom/response')
    assert.strictEqual(ipizza.get('returnRoute'), '/ecom/response/:provider')

  })
  it('store values with object hash', function() {
    var ipizza = require('../ipizza')

    ipizza.set({
      returnRoute: '/api/payment',
      logLevel: 'silly'
    })
    assert.strictEqual(ipizza.get('returnRoute'), '/api/payment/:provider')
    assert.strictEqual(ipizza.get('logLevel'), 'silly')
  })
  it('support both camelcase and spaced keys', function() {
    var ipizza = require('../ipizza')

    ipizza.set('log level', 'warn')
    assert.strictEqual(ipizza.get('logLevel'), 'warn')

    ipizza.set('logLevel', 'info')
    assert.strictEqual(ipizza.get('log level'), 'info')

  })
  it('allows storing unknown keys', function() {
    var ipizza = require('../ipizza')
    ipizza.set('myKey', 'abc')
    assert.strictEqual(ipizza.get('myKey'), 'abc')
  })
  it('returns undefined on getting unknown key', function() {
    var ipizza = require('../ipizza')
    ipizza.set('logStream', require('fs').createWriteStream('/dev/null'))
    assert.strictEqual(ipizza.get('myKey'), undefined)
  })
  it('throws for invalid values for appHandler', function() {
    var ipizza = require('../ipizza')
    assert.doesNotThrow(function() {
      ipizza.set('appHandler', undefined)
      ipizza.set('appHandler', require('express')())
      //var router = require('director').http.Router
      //ipizza.set('appHandler', new router({}))
    })
    assert.throws(function() {
      ipizza.set('appHandler', function() {})
    })
    assert.throws(function() {
      ipizza.set('appHandler', null)
    })
    assert.throws(function() {
      ipizza.set('appHandler', {})
    })
    assert.throws(function() {
      ipizza.set('appHandler', myapp)
    })
  })
  it('throws for invalid values for returnRoute', function() {
    var ipizza = require('../ipizza')
    assert.throws(function() {
      ipizza.set('returnRoute', {});
    })
    assert.throws(function() {
      ipizza.set('returnRoute', null);
    })
    assert.doesNotThrow(function() {
      ipizza.set('returnRoute', '/payment/{provider}')
    })
  })
  it('throws for invalid values for env', function() {
    var ipizza = require('../ipizza')
    assert.throws(function() {
      ipizza.set('env', 222)
    })
    assert.throws(function() {
      ipizza.set('env', null)
    })
    assert.doesNotThrow(function() {
      ipizza.set('env', 'development')
    })
    assert.doesNotThrow(function() {
      ipizza.set('env', 'production')
    })
  })
  it('sets up default routes', function() {
    var ipizza = require('../ipizza')
    var f = ipizza.get('appHandler');
    assert.equal(typeof f, 'function', 'default appHandler is a function')
    assert.throws(function() {
      f()
    })
    var matched = f({url: '/api/payment/response/swedbank'}, {}, function() {})
    assert.ok(matched, 'default routes should match ' +
              '/api/payment/response/swedbank')
    matched = f({url: '/not/matched'}, {}, function() {})
    assert.ok(!matched, 'default routes should no match /not/matched')
  })
  it('changes the routes when appHandler or returnURL is changed', function() {
    var ipizza = require('../ipizza')
    var f = ipizza.get('appHandler')
    ipizza.set('returnRoute', '/banklink')
    var matched = f({url: '/api/payment/response/swedbank'}, {}, function() {})
    assert.ok(!matched)
    matched = f({url: '/banklink'}, {}, function() {})
    assert.ok(!matched)
    matched = f({url: '/banklink/swedbank'}, {}, function() {})
    assert.ok(matched)

    // reset appHandler
    ipizza.set('appHandler')
    var f2 = ipizza.get('appHandler')
    matched = f({url: '/banklink/swedbank'}, {}, function() {})
    assert.ok(!matched)
    matched = f2({url: '/banklink/swedbank'}, {}, function() {})
    assert.ok(matched)
  })
  it('routes support optional provider position', function() {
    var ipizza = require('../ipizza')
    var f = ipizza.get('appHandler');
    ipizza.set('returnRoute', '/banklink/:provider/confirmed')

    var matched = f({url: '/banklink/seb/confirmed'}, {}, function() {})
    assert.ok(matched)
    matched = f({url: '/banklink/confirmed'}, {}, function() {})
    assert.ok(!matched)
  })

})
