var assert = require('assert')
  , Buffer = require('buffer').Buffer
  , fs = require('fs')
  , path = require('path')

function validOpt() {
  return {
    provider: 'swedbank'
  , clientId: 'abc'
  , privateKey: path.join(__dirname, '../sample/keys/swedbank.key.pem')
  , certificate: path.join(__dirname, '../sample/keys/swedbank.cert.pem')
  , id: 10
  , msg: 'blah'
  , amount: 10
  }
}

describe('payment', function() {
  beforeEach(function() {
    var ipizza = require('../ipizza')
    ipizza.set('logLevel', 'error')
  })
  afterEach(function() {
    delete require.cache[require.resolve('../ipizza')]
  })

  it('supports passing in provider as string or property', function() {
    var ipizza = require('../ipizza')

    var payment = ipizza.payment('swedbank')
    assert.strictEqual(payment.get('provider'), 'swedbank')
    payment = ipizza.payment({provider: 'seb'})
    assert.strictEqual(payment.get('provider'), 'seb')
    assert.throws(function() {
      ipizza.payment({})
    }, /no such provider/i)

  })
  it('doesn\'t throw on valid options', function() {
    var ipizza = require('../ipizza')
    assert.doesNotThrow(function() {
      ipizza.payment(validOpt()).json()
    })
  })
  it('throws on no clientId', function() {
    var ipizza = require('../ipizza')
    var opt = validOpt()
    delete opt.clientId
    assert.throws(function() {
      ipizza.payment(opt).json()
    }, /clientId/i)
  })

  it('throws on no private key', function() {
    var ipizza = require('../ipizza')
    var opt = validOpt()
    delete opt.privateKey
    assert.throws(function() {
      ipizza.payment(opt).json()
    }, /privateKey/)
  })
  it('throws on no certificate set', function() {
    var ipizza = require('../ipizza')
    var opt = validOpt()
    delete opt.certificate
    assert.throws(function() {
      ipizza.payment(opt).json()
    }, /certificate/)
  })
  it('allows setting privateKey as string, buffer or path', function() {
    var ipizza = require('../ipizza')
    var file = path.join(__dirname, '../sample/keys/swedbank.key.pem')
    var payment = ipizza.payment('swedbank', {
      privateKey: file
    })
    assert.ok(payment.get('privateKey').length > 400)
    payment = ipizza.payment('swedbank', {
      privateKey: fs.readFileSync(file)
    })
    assert.ok(payment.get('privateKey').length > 400)
    assert.throws(function() {
      ipizza.payment('swedbank', {
        privateKey: undefined
      })
    }, /file/)
  })
  it('allows setting certificate as string, buffer or path', function() {
    var ipizza = require('../ipizza')
    var file = path.join(__dirname, '../sample/keys/swedbank.cert.pem')
    var payment = ipizza.payment('swedbank', {
      certificate: file
    })
    assert.ok(payment.get('certificate').length > 400)
    payment = ipizza.payment('swedbank', {
      certificate: fs.readFileSync(file)
    })
    assert.ok(payment.get('certificate').length > 400)
    assert.throws(function() {
      ipizza.payment('swedbank', {
        certificate: undefined
      })
    }, /file/)
  })
  it('throws on invalid provider', function() {
    var ipizza = require('../ipizza')
    assert.throws(function() {
      ipizza.payment('unknown')
    }, /provider/)
  })
  it('throws on no order id', function() {
    var ipizza = require('../ipizza')
    var opt = validOpt()
    delete opt.id
    assert.throws(function() {
      ipizza.payment(opt).json()
    }, /id/)
  })
  it('throws on no amount', function() {
    var ipizza = require('../ipizza')
    var opt = validOpt()
    delete opt.amount
    assert.throws(function() {
      ipizza.payment(opt).json()
    }, /amount/)
  })
  it('throws on invalid amount', function() {
    var ipizza = require('../ipizza')
    assert.throws(function () {
      ipizza.payment({provider: 'swedbank', amount: 0})
    })
    assert.throws(function () {
      ipizza.payment({provider: 'swedbank', amount: -5})
    })
    assert.throws(function () {
      ipizza.payment({provider: 'swedbank', amount: 'abc'})
    })
  })
  it('has default currency', function() {
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('swedbank')
    assert.strictEqual(payment.get('curr'), 'EUR')
  })
  it('throws on invalid currency', function() {
    var ipizza = require('../ipizza')
    assert.throws(function() {
      ipizza.payment({provider: 'swedbank', curr: 'asd'})
    }, /currency/)
  })
  it('throws on invalid reference number', function() {
    var ipizza = require('../ipizza')
    assert.throws(function() {
      ipizza.payment({provider: 'swedbank', ref: 1234})
    }, /reference/)
    assert.throws(function() {
      ipizza.payment({provider: 'swedbank', ref: 'ads'})
    }, /reference/i)
    assert.doesNotThrow(function() {
      ipizza.payment({provider: 'swedbank', ref: 1234561})
    })
  })
  it('has default payment message', function() {
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('swedbank')
    assert.ok(payment.get('msg') && payment.get('msg').length)
  })
  it('has default language', function() {
    var ipizza = require('../ipizza')
    var payment = ipizza.payment('swedbank')
    assert.strictEqual(payment.get('lang'), 'ENG')
  })
  it('throws on invalid lang', function() {
    var ipizza = require('../ipizza')
    assert.throws(function() {
      ipizza.payment({provider: 'swedbank', lang: 'bla'})
    }, /language/i)
    assert.throws(function() {
      ipizza.payment({provider: 'swedbank', lang: null})
    }, /language/i)
    assert.doesNotThrow(function() {
      ipizza.payment({provider: 'swedbank', lang: 'eng'})
    })
    assert.doesNotThrow(function() {
      ipizza.payment({provider: 'swedbank', lang: 'EST'})
    })
  })
  it('throws on invalid encoding', function() {
    var ipizza = require('../ipizza')
    assert.throws(function() {
      ipizza.payment({provider: 'swedbank', encoding: 'bla'})
    }, /encoding/i)
    assert.throws(function() {
      ipizza.payment({provider: 'swedbank', encoding: null})
    }, /encoding/i)
    assert.doesNotThrow(function() {
      ipizza.payment({provider: 'swedbank', encoding: 'utf'})
    })
    assert.doesNotThrow(function() {
      ipizza.payment({provider: 'swedbank', encoding: 'utf-8'})
    })
    assert.doesNotThrow(function() {
      ipizza.payment({provider: 'swedbank', encoding: 'UTF8'})
    })
    assert.doesNotThrow(function() {
      ipizza.payment({provider: 'swedbank', encoding: 'iso'})
    })
    assert.doesNotThrow(function() {
      ipizza.payment({provider: 'swedbank', encoding: 'ISO-8859-1'})
    })
  })
})