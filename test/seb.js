var assert = require('assert')
  , path = require('path')

describe('seb', function() {
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
      ipizza.provider('seb')
    })
  })
  it('has gateway URLs for dev/production', function() {
    var ipizza = require('../ipizza')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('seb')
    var gw = payment.get('gateway')
    assert.ok(gw.length > 0)
    ipizza.set('env', 'development')
    var payment2 = ipizza.payment('seb')
    var gw2 = payment2.get('gateway')
    assert.ok(gw2.length > 0)
    assert.notEqual(gw, gw2)
  })

  it('package generation uses byte length', function() {
    var ipizza = require('../ipizza')
    ipizza.set('env', 'production')
    var payment = ipizza.payment('seb', {
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
    var json = ipizza.payment('seb', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/seb.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/seb.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'utf8'
    }).json()

    var result = 'bBCW5xMegumsCwQpk6FxPoUXij3/lhm2pIK3IlT+ZzvrGsxQKIGmSTQe+lUvlBZhCzrnD0GQq5cSM0VAmuscbAMS6y+t96fZQdv7TL7sJnlmfC4bz/SxpktUizyQeX/aH04qpdfG2HRXo87rRXPwTt/bVvrcgQ/2yjqJnzQquxTPGnNd1YHLUuBjs5xYxGfLepjNElC/tJq/LkdR3d32QuGLLSC4D/zkDHjurGNZt1KniPefWH1OfMdGyR4FXFMa4JtmjXqY/OX5ScqT5ynhv88sJTp83WtblYEZc6pgLnKfDPh803mM8MelacvQf9SHPh/x7L4+S9uMkPRshnnCQw=='

    assert.strictEqual(json.VK_MAC, result)
  })

  it('generates valid mac for iso', function() {
    var ipizza = require('../ipizza')
    var json = ipizza.payment('seb', {
      clientId: 'abc'
    , privateKey: path.join(__dirname, '../sample/keys/seb.key.pem')
    , certificate: path.join(__dirname, '../sample/keys/seb.cert.pem')
    , id: 10
    , msg: 'öäüõÖÄÜÕ'
    , amount: 10
    , encoding: 'iso'
    }).json()

    var result = 'SojTjevEiOV2/gcAUtsU3dlyWjaeg1JFk7PjihMAUQaH+19FODpGdIkY1tumVtccAx5TIuZxRHdyXccBEXsbGJJHqCJIj93paKkgMEaK9uM7k+lBM9rq0Feh60kjVeBS4YmAsm/U8AgzZI1M7Irhn1iGGLmsAjQ3RiynWRgIB6MfgK/FZfFOcSONWWKlIfGloTOfUE1DOrei7ROmZL0bcWa6RKJ3GuFDZaAKogg6gGJ6QeiOY0DDA1r8CvNIJRhIaOeR209BK7ERhAYkqElOhRPZq+NuEXLhrwGak9Jya3Gz2crLoQbjvxKJIi772fs5PVx+yelLVec5OJX2cEz5IQ=='

    assert.strictEqual(json.VK_MAC, result)
  })

  it('validates utf8 mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'EYP',
      VK_REC_ID: 'uid203519',
      VK_STAMP: '10',
      VK_T_NO: '15092',
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
      VK_SND_ACC: '10123456789017',
      VK_MAC:  'tTiMJC1XKzo9trJffEArVMXk7yVcejJA+Dn28wIQ' +
               'FqDxmTIX4ETzAGY71c7MP3SZ2YGKbT8VENhU6jBl' +
               'J1n3NCVxKpgwWW1fyVOVZZVBNEt2puVjdX5w48vh' +
               'pZXS3bg5KOqeT6/eRuy6kQ9JBy843MBcaKZps7/6' +
               'tCHw3qNjebBMrDdZibSdwz+/WA8Ott/jVi89nrkK' +
               'u1bQqgyV72Q8RhqDq6KICkvEDotKedCzgIEovRbe' +
               'fc+MMmN03ZZoRxvY0Vu7jcEd0Y84kqYG/0frz+oq' +
               'ErJoIuDxtEEBZUbfRof8KfqqXogw8f9p/Qzzd8cJ' +
               'ikP40N0SAfAlTK2T3tyTTw=='
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('seb', {
      certificate: path.join(__dirname, '../sample/keys/seb.cert.pem')
    })
    assert.ok(payment.verify_(params))

    params.VK_AMOUNT = '11.00'
    assert.ok(!payment.verify_(params))
  })

  it('validates iso mac', function() {
    var params = {
      VK_SERVICE: '1101',
      VK_VERSION: '008',
      VK_SND_ID: 'EYP',
      VK_REC_ID: 'uid203519',
      VK_STAMP: '10',
      VK_T_NO: '15094',
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
      VK_SND_ACC: '10123456789017',
      VK_MAC:  'N2ZodiFLVkGF5+mNZ4LbnGJ2BYDdQckNsHyT42Sf' +
               'K1xhu7jHhCUaijd/hXsgPz3ZkLDuWTRgl7b2/g/v' +
               'x2tmet5tZgeFgA+0UkvHUgxlFH357HStT25Fy8KH' +
               'Xinvf1avy91sD3GtBbxCD9eIsCCSVMyQuB9vjpkN' +
               'AmQIFrRiXJ4nsRnA7xVK4SJ9FCWJuKoe/yizM9mT' +
               'JeU/63JLxTuLIT1KGyUDoKoIq8epoMTN9SA5CB7T' +
               '7c9hxzo7q7vbyI267dbjCnsRVJNUvKpzGrWyhPBU' +
               'NdOFs7XoMORBfIaxyOPSppoPVvf7S/sY/gSj/exH' +
               'tTJeSKN51RXCags1j6oguQ=='
    }
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('seb', {
      certificate: path.join(__dirname, '../sample/keys/seb.cert.pem')
    })
    assert.ok(payment.verify_(params))

    params.VK_AMOUNT = '11.00'
    assert.ok(!payment.verify_(params))

  })

})