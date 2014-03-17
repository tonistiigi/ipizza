var domain = require('domain')
var http = require('http')
var path = require('path')
var fs = require('fs')
var querystring = require('querystring')

if (!require('./keys/prepare.js')()) return

var ipizza = require('../')

ipizza.set({
  hostname: 'http://localhost:4000'
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

http.createServer(function (req, res) {

  var d = domain.create()
  d.add(req)
  d.add(res)
  d.on('error', function(er) {
    try {
      res.writeHead(500);
      res.end(er.message + '\n\n' + er.stack);
      res.on('close', function() {
        d.dispose();
      });
    } catch (er) {
      d.dispose()
    }
  })

  if (req.url === '/styles.css'){
    fs.createReadStream(path.join(__dirname, 'styles.css')).pipe(res)
  }
  else if (req.url === '/'){
    fs.createReadStream(path.join(__dirname, 'pay.html')).pipe(res)
  }
  else if (req.url === '/pay' && req.method === 'POST'){
    // Never do this in production. Don't send payment data directly from request.
    var data = '';
    req.on('data', function(dt) {
      data += dt.toString('utf8')
    })
    req.on('end', function() {
      ipizza.payment(querystring.parse(data)).pipe(res)
    })
  }
  else {
    ipizza.get('appHandler')(req, res, function() {
      res.writeHead(404)
      res.end('Not Found')
    })
  }
}).listen(4000, '127.0.0.1');


console.log('Application started at http://localhost:4000/')