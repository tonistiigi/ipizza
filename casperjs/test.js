casper.options.pageSettings.webSecurityEnabled = false

var timeout = 1500

;['swedbank', 'seb', 'krediidipank', 'sampo', 'lhv', 'nordea-plnet', 'ec']
  .forEach(function(provider) {

casper.test.begin('Test provider: ' + provider, 6, function(test) {
  casper.start()
  casper.open('http://127.0.0.1:4000/')
  var dopay = true
    , orderId = ~~(Math.random() * 1000)
    , msg = 'Order nr.' + orderId + ' öäüõÖÄÜÕ'

  casper.then(function() {

    this.fill('form', {
      id: orderId
    , amount: 1.23
    , msg: msg
    , provider: provider
    }, true)
  })
  casper.then(function() {
    this.wait(timeout, function() {
      var state = this.evaluate(function() {
        return document.querySelector("[data-current-state]").dataset.currentState
      })
      this.test.assertEquals(state, 'preview', 'Current state == preview')
      this.click('[data-button=accept]')
    })
  })

  casper.then(function() {
    this.wait(timeout, function() {
      var state = this.evaluate(function() {
        return document.body.innerHTML
      })
      //console.log(state)
      var state = this.evaluate(function() {
        return document.querySelector("[data-current-state]").dataset.currentState
      })
      this.test.assertEquals(state, 'payed', 'Current state == paid')
      this.click('[data-button=return]')
    })
  })

  casper.then(function() {
    this.wait(timeout, function() {
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
        if (provider !== 'nordea-plnet') {
          this.test.assertEquals(json.amount, 1.23, 'Check amount in response')
          if (provider !== 'ec') {
            this.test.assertEquals(json.msg, msg, 'Check message in response')
          }
          else {
            this.test.assert(true)
          }
        }
        else {
          this.test.assert(true)
          this.test.assert(true)
        }
        casper.wait(timeout, function() {
          test.done()
        })
      }
    })
  })

  casper.run()
})

})
