var assert = require('assert')
  , path = require('path')

describe('sampo', function() {
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
      ipizza.provider('sampo')
    })
  })
  it('has gateway URLs for dev/production', function() {
    var ipizza = require('../ipizza')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('sampo')
    var gw = payment.get('gateway')
    assert.ok(gw.length > 0)
    ipizza.set('env', 'development')
    var payment2 = ipizza.payment('sampo')
    var gw2 = payment2.get('gateway')
    assert.ok(gw2.length > 0)
    assert.notEqual(gw, gw2)
  })

  it('package generation uses string length', function() {
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('sampo', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/sampo.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/sampo.cert.pem')
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
    var json = ipizza.payment('sampo', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/sampo.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/sampo.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'utf8'
    }).json()

    var result = 'drW2jgsMX+xlBdJEm8dgkoAg/J8WJ7b3wEJ+E+NhyfHJmB03i24eUXEvNrWMYL/gorAshTgsI3JfZbVhkRclt3hHRBN5EN5im7sSzyRwIRy+rJmfqYuz0aZZsxAnvUHPybaFza4Ym/ROgI1QIQi3kuEc7092qGNC84uGTDIifijGwHuQOjz9mGuD8ojtGeLQ+av2/xvUXXQOKH9DgvvqXIwAaowfe1n9tw9ab7Sb6Uoby1FgERcnBRVhRCpNeWbWrDitbUU1Kbfe4YJiUpAKf+B3VeGgUPsIjjVUa25YvF6Ni5CVsuuk5SRrJUICK/gHnFAMFEXM7SiYQpPVOpHwSA=='
    assert.strictEqual(json.VK_MAC, result)
  })

  it('generates valid mac for iso', function() {
    var ipizza = require('../ipizza')
    var json = ipizza.payment('sampo', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/sampo.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/sampo.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'iso'
    }).json()

    var result = 'drW2jgsMX+xlBdJEm8dgkoAg/J8WJ7b3wEJ+E+NhyfHJmB03i24eUXEvNrWMYL/gorAshTgsI3JfZbVhkRclt3hHRBN5EN5im7sSzyRwIRy+rJmfqYuz0aZZsxAnvUHPybaFza4Ym/ROgI1QIQi3kuEc7092qGNC84uGTDIifijGwHuQOjz9mGuD8ojtGeLQ+av2/xvUXXQOKH9DgvvqXIwAaowfe1n9tw9ab7Sb6Uoby1FgERcnBRVhRCpNeWbWrDitbUU1Kbfe4YJiUpAKf+B3VeGgUPsIjjVUa25YvF6Ni5CVsuuk5SRrJUICK/gHnFAMFEXM7SiYQpPVOpHwSA=='
    assert.strictEqual(json.VK_MAC, result)
  })

  it('validates utf8 mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'SAMPOPANK',
      VK_REC_ID: 'uid203713',
      VK_STAMP: '10',
      VK_T_NO: '15095',
      VK_AMOUNT: '10.00',
      VK_CURR: 'EUR',
      VK_REC_ACC: '',
      VK_REC_NAME: '',
      VK_REF: '',
      VK_MSG: 'öäüõÖÄÜÕ',
      VK_T_DATE: '16.09.2012',
      VK_LANG: 'ENG',
      VK_AUTO: 'N',
      VK_SND_NAME: 'Tõõger Leõpäöld',
      VK_SND_ACC: '331234567897',
      VK_MAC: 'bwNcpRgCT5iuM50BltcDr4aAmjquEf3jDcOyz++4' +
               'RVL4RnMP5Kj7WuURsxFhWxhm5Q4e830h5zUe2ecM' +
               '+t352i74Tc5UiiPmI2rPw03hjxp/CTKJmzERMLCM' +
               'T5boYWMl2CKB0nI1jK37ZeWrrWyfy9OnXvdmBuV5' +
               'fg3rm8KSvtjMUasrrGz99fJABReLerOnZhuIIY8A' +
               'gZX7XZIdcraUIKsWIZVGzWgebY97x3DLyFld0hrP' +
               'ZgReMZ3fn5ThVkEhHygzG8bhqII1+6/JWh9BZlAn' +
               'ZdhTUqKlyPztq1Dnh+0pHwOT9y/OcNY3SMv2Fnzy' +
               'on1GsL4XOX/+08yffLCqvw=='
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('sampo', {
      certificate: path.join(__dirname, '../sample/keys/sampo.cert.pem')
    })
    assert.ok(payment.verify_(params))

    params.VK_AMOUNT = '11.00'
    assert.ok(!payment.verify_(params))
  })

  it('validates iso mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'SAMPOPANK',
      VK_REC_ID: 'uid203713',
      VK_STAMP: '10',
      VK_T_NO: '15096',
      VK_AMOUNT: '10.00',
      VK_CURR: 'EUR',
      VK_REC_ACC: '',
      VK_REC_NAME: '',
      VK_REF: '',
      VK_MSG: 'öäüõÖÄÜÕ',
      VK_T_DATE: '16.09.2012',
      VK_LANG: 'ENG',
      VK_AUTO: 'N',
      VK_SND_NAME: 'Tõõger Leõpäöld',
      VK_SND_ACC: '331234567897',
      VK_MAC:  'M0ihJnQD545wmk+nihXq7bDsmcxlmEvYkVoA55t3' +
               'vKHqOoXQmgcqumVNoylMaf6Z8Yodr4kYxK0EUMr6' +
               'UI6UEYk+2V1sCAroOJeBiHkPjaafF/nyBFZrp+T/' +
               'OINttJkr8TzeFDhavs2l1n6jzMDMjX/gDnue+wjx' +
               '7mMGcw80dkrpcMRtDtxnTax9mxnPeq+55Z92+Hqg' +
               'W920t//zZ6A+mn+Yqo5dzAd+yJmjlRtLk7/L9Ssy' +
               '8GZSljNtOxseZh4zoFhw78pyq6HszhgA/Aiff9c7' +
               'hZukG9Lcw4fZInib7unoho8UduZ9/Pa2zfSPJF5e' +
               'a3DlT+QiG7M/WqTe9DTUog=='
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('sampo', {
      certificate: path.join(__dirname, '../sample/keys/sampo.cert.pem')
    })
    assert.ok(payment.verify_(params))

    params.VK_AMOUNT = '11.00'
    assert.ok(!payment.verify_(params))

  })

})