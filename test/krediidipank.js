var assert = require('assert')
  , path = require('path')

describe('krediidipank', function() {
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
      ipizza.provider('krediidipank')
    })
  })
  it('has gateway URLs for dev/production', function() {
    var ipizza = require('../ipizza')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('krediidipank')
    var gw = payment.get('gateway')
    assert.ok(gw.length > 0)
    ipizza.set('env', 'development')
    var payment2 = ipizza.payment('krediidipank')
    var gw2 = payment2.get('gateway')
    assert.ok(gw2.length > 0)
    assert.notEqual(gw, gw2)
  })

  it('package generation uses string length', function() {
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('krediidipank', {
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
    var ipizza = require('../ipizza')
    var json = ipizza.payment('krediidipank', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/krediidipank.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/krediidipank.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'utf8'
    }).json()

    var result = 'Hsfzp8sk92cDOmUcbGsXIrqeetRj1ysXUfvt82FUiVnlMq/iwqpfEcnNar+QmoxzJPoEfnJBgCY9joo0cUOMwkbVQqTctQ2SRO7dsDDnpV4jNlGH0IVQ3dN6cpQnkedHi6CKHiNLtcOLyZqIL4m934z2ukt5wsupnpV+6XlcjdT5pYQKurCElMleXj//LmT47WrK/QouYKgdyD6toG2vtTNIDPmX5QYHhqOuDUjzwIG89jjbGDxYgavHEpDu06R0IuLUhe33sirieHG9webrqPvvgm5ffGKcXoLh6oPEq8jL3Yp+TiEgqjeyZEPx2JwD4vBGgGclspRNpClgxVWDIg=='

    assert.strictEqual(json.VK_MAC, result)
  })

  it('generates valid mac for iso', function() {
    var ipizza = require('../ipizza')
    var json = ipizza.payment('krediidipank', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/krediidipank.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/krediidipank.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'iso'
    }).json()

    var result = 'Hsfzp8sk92cDOmUcbGsXIrqeetRj1ysXUfvt82FUiVnlMq/iwqpfEcnNar+QmoxzJPoEfnJBgCY9joo0cUOMwkbVQqTctQ2SRO7dsDDnpV4jNlGH0IVQ3dN6cpQnkedHi6CKHiNLtcOLyZqIL4m934z2ukt5wsupnpV+6XlcjdT5pYQKurCElMleXj//LmT47WrK/QouYKgdyD6toG2vtTNIDPmX5QYHhqOuDUjzwIG89jjbGDxYgavHEpDu06R0IuLUhe33sirieHG9webrqPvvgm5ffGKcXoLh6oPEq8jL3Yp+TiEgqjeyZEPx2JwD4vBGgGclspRNpClgxVWDIg=='

    assert.strictEqual(json.VK_MAC, result)
  })

  it('validates utf8 mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'KREP',
      VK_REC_ID: 'uid205258',
      VK_STAMP: '10',
      VK_T_NO: '15097',
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
      VK_SND_ACC: '4212345678907',
      VK_MAC:  'EkSHj2DVKGy+c5d5a1QS25s4z2FvsOSloesSKnnc' +
               'YanDuZKU8XcIwEz8GIKXE6r4CVIwpR9BlqmNDSnG' +
               'Ue9FuYTZSSZ64OHxydYGa3rNCA5ksqc0HlwJfeNi' +
               'YybQ6AhzjrgcBHLUMORM9KiK9G8SU6dmOyhhMTqB' +
               'wp/VWKthx+uEa7ku80X364a4n/oY4GEh0b5XBNJT' +
               'GM4tGtYMU73K9gFqlwNkPXvbB5kL5LWEK63u0/Bm' +
               'XhmZSMC1IDyC0CmabATy9PQZlEr/FdRkAvCmwW+G' +
               'eta/SFV1kkSWD9FQDrETB42GwGat/SMTJ7B0IP6S' +
               'g/tTXlTtWA9A/OBnCtb22g=='
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('krediidipank', {
      certificate: path.join(__dirname, '../sample/keys/krediidipank.cert.pem')
    })
    assert.ok(payment.verify_(params))

    params.VK_AMOUNT = '11.00'
    assert.ok(!payment.verify_(params))
  })


})