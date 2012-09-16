var assert = require('assert')
  , path = require('path')

describe('swedbank', function() {
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
      ipizza.provider('swedbank')
    })
  })
  it('has gateway URLs for dev/production', function() {
    var ipizza = require('../ipizza')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('swedbank')
    var gw = payment.get('gateway')
    assert.ok(gw.length > 0)
    ipizza.set('env', 'development')
    var payment2 = ipizza.payment('swedbank')
    var gw2 = payment2.get('gateway')
    assert.ok(gw2.length > 0)
    assert.notEqual(gw, gw2)
  })
  it('package generation uses string length', function() {
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('swedbank', {
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
    var json = ipizza.payment('swedbank', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/swedbank.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/swedbank.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'utf8'
    }).json()

    var result = 'aLuP1GhI4cJTlQ17ryGXrgglKp2cytmGSlZu7cQJNvEgt66Rk1JcZD5IPashnutzzY37sJ+G8lgX/X3wvB+3Zl+ELdpceqmiWN8VeHd1mcxkJvcNfJS9pBSlZ78Ag/6f0UhpfaGXeqTSFV3NgTVf3BXCt+9hKsWjwp9QALL70tg0DM4GPY52D7k6ZJmjjakbybQGj8lNSPoZNLcMYbcfMMolTz5eIk+jPDxSojba8AEa1baiSr6+d1eEZlvZNK/Cy2ei515Xsr5UovOv3SDIERcwYuIcQxxnlTIDAzlveevszrFpsMFUgevmFCRfVsGdk+ue6mJdG4Ehg1V9BBT4lQ=='

    assert.strictEqual(json.VK_MAC, result)
  })

  it('generates valid mac for iso', function() {
    var ipizza = require('../ipizza')
    var json = ipizza.payment('swedbank', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/swedbank.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/swedbank.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'iso'
    }).json()

    var result = '0QYa9oqyQV95VZdCQWg88YCZFJQLtyNz2yW/Cl9D/+Pcg0vCOC1fBBUzUK+n896/rym8HlXCZUACFcZmDe3OnC0ebX6e7i8e2xDS1pKs8ikfDLMESHu2Ummc5JCPhhXCIydVMCeytksUvnG16FpuJA01UbAZXQzJPLAcmfwgmla3TqZGBun0dNgeum5FWRVIGlRTTF0BnGws+GDQnJBOnFio9Sj9qhBRexYOda0c0kfvM3Qxr8/ePWVUpHvwjJHVkJFyev9TQsuYy1k0d/6etMz/N+tZ2abXxadzfi07StGaBFi0WB7vKBptteOYecm66ksbuSesoGx6gswSZFl4/Q=='

    assert.strictEqual(json.VK_MAC, result)
  })

  it('validates utf8 mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'HP',
      VK_REC_ID: 'uid202196',
      VK_STAMP: '10',
      VK_T_NO: '15085',
      VK_AMOUNT: '10.00',
      VK_CURR: 'EUR',
      VK_REC_ACC: '',
      VK_REC_NAME: '',
      VK_REF: '',
      VK_MSG: 'öäüõÖÄÜÕ',
      VK_T_DATE: '16.09.2012',
      VK_LANG: 'ENG',
      VK_ENCODING: 'UTF-8',
      VK_AUTO: 'N',
      VK_SND_NAME: 'Tõõger Leõpäöld',
      VK_SND_ACC: '221234567897',
      VK_MAC:  'K6A5hVTs1MHKYl+NgttA+FpwqHOyD8n9iGowGOzE'+
               '8jsgjsqOnGGeMSJ5M+pqbUwR8KLMlJvitZaOymBV'+
               'fIlOBxh/JDF8iw+Dlalp6RSiAJcYrQndlwov6UHB'+
               '60uALZnULCtXPz8mPrvqaOJoJm4gHQBOXQnDfMZS'+
               'MQ4PwquP/S0H/E9/bV3QcSSLZuS1OX8RpYRIAHRA'+
               '++Pt7mByJjwet53TbmmZYBRR9UMw7CMBIPfwA8C1'+
               'zymj3AI96I/4uw9uoOzSneKqP1tGLsNEBbwlPhrX'+
               '6REhBF7b+iQmMXIS6HDIlMfT5ZpGzXJyVC5P7iBY'+
               'sZS20NQfL67wnk4PyFzwvg=='
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('swedbank', {
      certificate: path.join(__dirname, '../sample/keys/swedbank.cert.pem')
    })
    assert.ok(payment.verify_(params))

    params.VK_AMOUNT = '11.00'
    assert.ok(!payment.verify_(params))
  })

  it('validates iso mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'HP',
      VK_REC_ID: 'uid202196',
      VK_STAMP: '10',
      VK_T_NO: '15090',
      VK_AMOUNT: '10.00',
      VK_CURR: 'EUR',
      VK_REC_ACC: '',
      VK_REC_NAME: '',
      VK_REF: '',
      VK_MSG: 'öäüõÖÄÜÕ',
      VK_T_DATE: '16.09.2012',
      VK_LANG: 'ENG',
      VK_ENCODING: 'ISO-8859-1',
      VK_AUTO: 'N',
      VK_SND_NAME: 'Tõõger Leõpäöld',
      VK_SND_ACC: '221234567897',
      VK_MAC:  'p2jQeOHQp0zI6qcw/N3X6NubvcQcSntzmgTrHhym' +
               'Ofpsmo1ycH1DCRDiDYy06Ew9kHa+LJKrYCXMQjGj' +
               '4s1NwCHKn3Uo8tlmEN3xsJ/9oDgZjghBs/1EF1IO' +
               'TomliyaWvXMv24+Ac2pGo3Uf5oB1b1lJ37gogCV3' +
               'js0BcvwPSXI9KuM8fw+ZDfFjM/6s4/tf/SBeDSi7' +
               'ssWIJy8J44UJlArRyNAMyK+7es2SdXa+hZPXjuRZ' +
               'FsMxaeWco2q/RGMdjP3tRfQtElQ8RZ3Y+mMWSPfg' +
               '6wVZXkdYVaWmV9UeyBMmd3/WIJRjGwyX8m8y8qGr' +
               'zmC87Db4bgLFw9OclXDZMg=='
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('swedbank', {
      certificate: path.join(__dirname, '../sample/keys/swedbank.cert.pem')
    })
    assert.ok(payment.verify_(params))

    params.VK_AMOUNT = '11.00'
    assert.ok(!payment.verify_(params))

  })

})