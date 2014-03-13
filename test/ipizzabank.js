var assert = require('assert')
  , http = require('http')
  , path = require('path')
  , iconv = require('iconv-lite')

describe('ipizzabank', function() {
  beforeEach(function() {
    var ipizza = require('../ipizza')
    ipizza.set('logLevel', 'error')
  })
  afterEach(function() {
    delete require.cache[require.resolve('../ipizza')]
  })

  // This tests that produced html and values are in ISO-8859-1 encoding.
  // It tests nothing for the mac generation.
  it('has iso encoding support', function() {
    var ipizza = require('../ipizza')

    var resp = new http.ServerResponse({method: 'GET'})

    var html = ipizza.payment({
      provider: 'swedbank'
    , clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/swedbank.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/swedbank.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'iso'
    }).pipe(resp)

    assert.ok(resp.getHeader('Content-Type').match(/iso/))

    assert.ok(resp.output[1].toString('utf8')
      .indexOf('name="VK_MSG" value="öäüõÖÄÜÕ">') === -1)

    var html = iconv.decode(Buffer(resp.output[1]), 'ISO-8859-1')

    assert.ok(html.indexOf('name="VK_MSG" value="öäüõÖÄÜÕ">') !== -1)

  })

})