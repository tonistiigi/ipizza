var assert = require('assert')
  , path = require('path')

describe('lhv', function() {
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
      ipizza.provider('lhv')
    })
  })
  it('has gateway URLs for dev/production', function() {
    var ipizza = require('../ipizza')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('lhv')
    var gw = payment.get('gateway')
    assert.ok(gw.length > 0)
    ipizza.set('env', 'development')
    var payment2 = ipizza.payment('lhv')
    var gw2 = payment2.get('gateway')
    assert.ok(gw2.length > 0)
    assert.notEqual(gw, gw2)
  })

  it('package generation uses byte length', function() {
    var ipizza = require('../ipizza')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('lhv', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/swedbank.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/swedbank.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    })
    payment.json()

    var result = '0041002003008003abc0021000510.00003EUR000016öäüõÖÄÜÕ'
    assert.strictEqual(payment.lastPackage_ , result)
  })
  it('generates valid mac for utf8', function() {
    var ipizza = require('../ipizza')
    var json = ipizza.payment('lhv', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/lhv.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/lhv.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'utf8'
    }).json()

    var result = 'gBS+DOsWY2lPEfVM2aQStr7wKbxBFHF4kX2aoMlub5TTuhLsQV1E3AeVG6knvA7SmMl3pSyV0n5oUfkbpfs0pdNSCJAGqdRE7ERrWuXK+x5Lgs6LkKAG4ITV6Q/QPpIpK+9zvUdsqQJNAX6IBDrWnyWTIEGGqUYyHmQvFgPTQiPoR/8/akjangMVHzr/OWgxjUuXtjo2p/XOphomFY1IrG5QCk1MVy9OI6Dj/pSkR9ZMWsrYR/uT8rudmG9Jkzf2mDIM7fRRymj/gF+bPRE4oAqus8DNdQWwwk1oEkUVlAb7H39zdgFJqW4nU4HK+xO+omBaLcO899svkVBgGqkUzg=='

    assert.strictEqual(json.VK_MAC, result)
  })

  it('generates valid mac for iso', function() {
    var ipizza = require('../ipizza')
    var json = ipizza.payment('lhv', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/lhv.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/lhv.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'iso'
    }).json()

    var result = 'CVXvCz36fKYMHSHEOdQD25EPhHg9HWybxVllsSl0Tthu81YFs0yQfWA0/hTz9KyvM19L8Kkz2gTbp26mYXpydwfp57CB2VXxm3Jkm2T7DHbpkzkEx6el0NN546zjdXLpG4xKEcKAEdj9if0Bpxez7Q/vksDNC/FwK/ElHMyf79kkX4Po79RuZRFe1tKmvksXxwMcNdBHqpILDRDpQa8Tna2VuZ8ulSjmwJ63xrku5dw33sv180lyji/lGKBNgK1aJZdYwg0PVcXFOwzGAaAZ4yiS0cIPO9L/EpeXBhzk0EtngYEnzsIGqbVUUFZSI0ySkmTqenTl7vFTlAeEt0eY0Q=='

    assert.strictEqual(json.VK_MAC, result)
  })

  it('validates utf8 mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'LHV',
      VK_REC_ID: 'uid205300',
      VK_STAMP: '10',
      VK_T_NO: '15099',
      VK_AMOUNT: '10.00',
      VK_CURR: 'EUR',
      VK_REC_ACC: '',
      VK_REC_NAME: '',
      VK_REF: '',
      VK_MSG: 'öäüõÖÄÜÕ',
      VK_T_DATE: '16.09.2012',
      VK_LANG: 'ENG',
      VK_CHARSET: 'UTF-8',
      VK_AUTO: 'N',
      VK_SND_NAME: 'Tõõger Leõpäöld',
      VK_SND_ACC: '771234567897',
      VK_MAC:  'Ie5KRRgfU5AxV2k71x7kMUW8/3OcRDR5mW8b6GP4' +
               'qwG5fxhOoSYz9HaOxbx5C69WC2pCxMIUPCMr8lH8' +
               'PMpY8jBhdYc9fBoMeH3q+mhyqJcn6u+OSdoW/SYA' +
               'MmVAcXEGD0uUm3CCtoiKWLveYmVdRBWhc7XXxtMn' +
               'P22xJYChkoE52xMzGYWdbRdbVLZk+lgrqfQyr/xy' +
               'RV0EaRSHBvkBc8G+yHoZHOQpPVfogJCvfPFYwTt7' +
               'Ogw/OiyjD2EipM4VfJtZRj2i7eFAwjWssXscHqUT' +
               'KyFBnCcKoBvJCbt6MfzIU2ZLYip0fqryJJE5dI7B' +
               'f91zWsllc7Z5+ZQ3CSXQww=='
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('lhv', {
      certificate: path.join(__dirname, '../sample/keys/lhv.cert.pem')
    })
    assert.ok(payment.verify_(params))

    params.VK_AMOUNT = '11.00'
    assert.ok(!payment.verify_(params))
  })

  it('validates iso mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'LHV',
      VK_REC_ID: 'uid205300',
      VK_STAMP: '10',
      VK_T_NO: '15100',
      VK_AMOUNT: '10.00',
      VK_CURR: 'EUR',
      VK_REC_ACC: '',
      VK_REC_NAME: '',
      VK_REF: '',
      VK_MSG: 'öäüõÖÄÜÕ',
      VK_T_DATE: '16.09.2012',
      VK_LANG: 'ENG',
      VK_CHARSET: 'ISO-8859-1',
      VK_AUTO: 'N',
      VK_SND_NAME: 'Tõõger Leõpäöld',
      VK_SND_ACC: '771234567897',
      VK_MAC:  'JnkIuvDWRuca0trffGCnojZ5U7U7T45vtCVBgjp7' +
               'Nd3F9KZGT7G5fZ9W6bLlAkElTFNXPNR+8I2vyhuU' +
               '6UQbMJekI0XOJcKUkPBHX15eHy8ozxrECEgQMc0N' +
               '1fI6ilGyB9zDXHKtw0bsEOJu6l2zyhK48XviSWPm' +
               'yRE+kT8qJ5JFU2gsDu7/hmJEvujpSGHNw68lSi+B' +
               'FbHjg0Wg/NxmCX3uQfDZL/lwu353zGuy16RYowDP' +
               'yEEikdUuZWK9vLWsgyLmbS+N4BtkYpYhGfj8Sl/F' +
               'KyN36BIfq9LqdVrdDOjSalWklXv1SZtfb/8zuhT0' +
               'WnNCfHfzt6QlgDLf9LSCjg=='
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('lhv', {
      certificate: path.join(__dirname, '../sample/keys/lhv.cert.pem')
    })
    assert.ok(payment.verify_(params))

    params.VK_AMOUNT = '11.00'
    assert.ok(!payment.verify_(params))

  })

})