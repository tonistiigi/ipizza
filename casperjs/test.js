var casper = require('casper').create()

casper.start('http://127.0.0.1:4000/')

var providers = ['swedbank', 'seb', 'sampo', 'krediidipank', 'lhv', 'nordea-plnet']

function test(provider) {

  var dopay = true
    , orderId = ~~(Math.random() * 1000)
    , msg = 'Order nr.' + orderId + ' öäüõÖÄÜÕ'

  casper.open('http://127.0.0.1:4000/')

  casper.then(function() {
    this.test.comment('Test provider: ' + provider)

    this.fill('form', {
      'id': orderId
    , 'msg': msg
    , 'provider': provider
    }, true)
  })

  casper.then(function() {
    var html = this.evaluate(function(dopay) {
      if (dopay) {
        pay()
      }
      else {
        cancel()
      }
    }, {dopay: dopay})

  })

  if (provider === 'nordea-plnet') {
    casper.then(function() {
      this.click('input[name=nupp]')
    })
  }
  else {
    casper.then(function() {
      this.fill('form', {}, true)
    })
  }

  casper.then(function() {
    var output = this.evaluate(function() {
      return document.body.innerText
    })
    this.test.comment('Got output: ' + output)
    var split = output.indexOf('!')
    if (split === -1) {
      this.test.fail('Wrong output received.')
      this.exit(1)
    }
    else {
      var status = output.substr(0, split)
      var json = JSON.parse(output.substr(split + 1))

      this.test.assertEquals(status, 'Payment OK', 'Check payment status')
      this.test.assertEquals(json.id, orderId.toString(), 'Check orderId in response')
      if (provider !== 'nordea-plnet')
      this.test.assertEquals(json.msg, msg, 'Check message in response')
      providers.shift()
      if(providers.length) {
        test(providers[0])
      }
    }

  })
}

test(providers[0])

casper.run(function() {
  this.test.renderResults(true, 0);
})