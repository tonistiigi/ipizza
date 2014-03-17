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

    var result = '0041002003008003abc0021000510.00003EUR000016öäüõÖÄÜÕ'
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

    var result = 'OlysZ+xDYgqMN3TagDlfchTB6TXNw5uXr2New/jgVKyE4yntRwj7kqEHQLCuA/48DMDBqMky3R9mfH9I7ZqjKCi7CCuZ+y+2BeFiJzMv0oKthA5B0XU6VdlcHjbEWYQVjDdq5mx6eUAStE4/diaOooNtujGQMAGtjdRues7GwhF68FpQXcoPm6mEbPXvs1uWOnzv3avFsivg0LI6Jd8Bp3f7fXzrD5LoRUcVCELR9oSyTm2p2d31JGDSxa1FfKESioslukRJqFOfDI4xF1KURxJmTKakn/vRilcgoUIsaXQwH5cvD0+a3R7L+7CSa97vhSHi+jOwWUt3ErSbaipI9g=='

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

    var result = 'OlysZ+xDYgqMN3TagDlfchTB6TXNw5uXr2New/jgVKyE4yntRwj7kqEHQLCuA/48DMDBqMky3R9mfH9I7ZqjKCi7CCuZ+y+2BeFiJzMv0oKthA5B0XU6VdlcHjbEWYQVjDdq5mx6eUAStE4/diaOooNtujGQMAGtjdRues7GwhF68FpQXcoPm6mEbPXvs1uWOnzv3avFsivg0LI6Jd8Bp3f7fXzrD5LoRUcVCELR9oSyTm2p2d31JGDSxa1FfKESioslukRJqFOfDI4xF1KURxJmTKakn/vRilcgoUIsaXQwH5cvD0+a3R7L+7CSa97vhSHi+jOwWUt3ErSbaipI9g=='

    assert.strictEqual(json.VK_MAC, result)
  })

  it('validates utf8 mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'KREP',
      VK_REC_ID: 'uid400040',
      VK_STAMP: '10',
      VK_T_NO: '40126',
      VK_AMOUNT: '10.00',
      VK_CURR: 'EUR',
      VK_REC_ACC: '',
      VK_REC_NAME: '',
      VK_REF: '',
      VK_MSG: 'öäüõÖÄÜÕ',
      VK_T_DATE: '17.03.2014',
      VK_LANG: 'ENG',
      VK_CHARSET: 'UTF-8',
      VK_AUTO: 'N',
      VK_SND_NAME: 'Tõõger Leõpäöld',
      VK_SND_ACC: 'EE684204212345678907',
      VK_MAC:  'R4Zg6Lys2VhPw8CBSZpo85QwmNMpWYpCep3+9xS9dVSjh5r4v88IwnYduBgx9iwAPn9ayWaMDFUIE/ZLZYjNUcEJ0I9BBRr4k5FWESHuHwyBSuxH4C5bvlRcgNqVGpKpE0gySYbvBbPxMBL31rj8R8Sz7aEN9baImKxEKSeDpD0='
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