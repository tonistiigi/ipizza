var path = require('path')
var express = require('express')

if (!require('./keys/prepare.js')()) return

var app = express()

app.use(express.urlencoded())

var ipizza = require('../')

ipizza.set({
  hostname: 'http://localhost:4000'
, appHandler: app
, logLevel: 'verbose'
})

var swedbank = require('./keys/ipizza_test_swedbank')
ipizza.provider(
  { provider: 'swedbank'
  , clientId: swedbank.client_id
  , privateKey: swedbank.private_key
  , certificate: swedbank.bank_certificate
  })

var seb = require('./keys/ipizza_test_seb')
ipizza.provider(
  { provider: 'seb'
  , clientId: seb.client_id
  , privateKey: seb.private_key
  , certificate: seb.bank_certificate
  })

ipizza.provider(
  { provider: 'seb'
  , gateway: 'https://www.seb.ee/cgi-bin/dv.sh/ipank.r'
  , clientId: 'testvpos'
  , privateKey: __dirname + '/keys/seb2.key.pem'
  , certificate: __dirname + '/keys/seb2.cert.pem'
  , alias: 'seb2'
  })

var sampo = require('./keys/ipizza_test_sampo')
ipizza.provider(
  { provider: 'sampo'
  , clientId: sampo.client_id
  , privateKey: sampo.private_key
  , certificate: sampo.bank_certificate
  })

var krediidipank = require('./keys/ipizza_test_krediidipank')
ipizza.provider(
  { provider: 'krediidipank'
  , clientId: krediidipank.client_id
  , privateKey: krediidipank.private_key
  , certificate: krediidipank.bank_certificate
  })

var lhv = require('./keys/ipizza_test_lhv')
ipizza.provider(
  { provider: 'lhv'
  , clientId: lhv.client_id
  , privateKey: lhv.private_key
  , certificate: lhv.bank_certificate
  })

var ec = require('./keys/ipizza_test_ec')
ipizza.provider(
  { provider: 'ec'
  , clientId: ec.client_id
  , privateKey: ec.private_key
  , certificate: ec.bank_certificate
  })

ipizza.provider(
  { provider: 'ec'
  , alias: 'ec-ipay'
  , gateway: 'https://pos.estcard.ee/test-pos/servlet/iPAYServlet'
  , privateKey: __dirname + '/keys/ec.ipay.test.privatekey.pem'
  , certificate: __dirname + '/keys/ec.ipay.test.publickey.pem'
  , clientId: '' // <- enter yours here
  })

// Customer number: 111111    Password: 9999
ipizza.provider(
  { provider: 'nordea'
  , gateway: 'https://netbank.nordea.com/pnbepaytest/epayn.jsp'
  , clientId: '12345678'
  , algorithm: 'md5'
  , mac: 'LEHTI'
  })

var nordea = require('./keys/ipizza_test_nordea')
ipizza.provider(
  { provider: 'nordea'
  , clientId: nordea.client_id
  , algorithm: nordea.algo
  , mac: nordea.mac_key
  , alias: 'nordea-plnet'
  , forceISO: true
  })

ipizza.on('success', function (reply, req, resp) {
  resp.setHeader('Content-Type', 'text/html; charset=utf-8')
  resp.write('Payment OK!')
  resp.end(JSON.stringify(reply, 4))
})

ipizza.on('error', function (reply, req, resp) {
  resp.setHeader('Content-Type', 'text/html; charset=utf-8')
  resp.write('Payment Error!');
  resp.end(JSON.stringify(reply, 4))
})

app.get('/', function (req, res) {
  res.sendfile(path.join(__dirname, 'pay.html'))
})
app.get('/styles.css', function (req, res) {
  res.sendfile(path.join(__dirname, 'styles.css'))
})

app.post('/pay', function (req, res) {
  // Never do this in production. Don't send payment data directly from request.
  ipizza.payment(req.body).pipe(res)
})

app.listen(4000)
console.log('Application started at http://localhost:4000/')