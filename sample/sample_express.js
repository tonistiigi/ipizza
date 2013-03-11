var path = require('path')
var express = require('express')
var app = express()

app.use(express.bodyParser())

var ipizza = require('../ipizza')

ipizza.set({
  hostname: 'http://localhost:4000'
, appHandler: app
, logLevel: 'verbose'
})

ipizza.provider(require('./conf'))

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