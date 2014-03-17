var domain = require('domain')
var http = require('http')
var path = require('path')
var fs = require('fs')
var querystring = require('querystring')

var ipizza = require('../ipizza')

ipizza.set({
  hostname: 'http://localhost:4000'
, logLevel: 'verbose'
})

ipizza.provider(
  [ { provider: 'swedbank'
    , clientId: 'uid355551'
    , privateKey: __dirname + '/keys/swedbank.key.pem'
    , certificate: __dirname + '/keys/swedbank.cert.pem'
    }
  , { provider: 'seb'
    , clientId: 'uid355577'
    , privateKey: __dirname + '/keys/seb.key.pem'
    , certificate: __dirname + '/keys/seb.cert.pem'
    }
  , { provider: 'seb'
    , gateway: 'https://www.seb.ee/cgi-bin/dv.sh/ipank.r'
    , clientId: 'testvpos'
    , privateKey: __dirname + '/keys/seb2.key.pem'
    , certificate: __dirname + '/keys/seb2.cert.pem'
    , alias: 'seb2'
    }
  , { provider: 'sampo'
    , clientId: 'uid355580'
    , privateKey: __dirname + '/keys/sampo.key.pem'
    , certificate: __dirname + '/keys/sampo.cert.pem'
    }
  , { provider: 'krediidipank'
    , clientId: 'uid355603'
    , privateKey: __dirname + '/keys/krediidipank.key.pem'
    , certificate: __dirname + '/keys/krediidipank.cert.pem'
    }
  , { provider: 'lhv'
    , clientId: 'uid355616'
    , privateKey: __dirname + '/keys/lhv.key.pem'
    , certificate: __dirname + '/keys/lhv.cert.pem'
    }
  // Customer number: 111111    Password: 9999
  , { provider: 'nordea'
    , gateway: 'https://netbank.nordea.com/pnbepaytest/epayn.jsp'
    , clientId: '12345678'
    , algorithm: 'md5'
    , mac: 'LEHTI'
    }
  , { provider: 'nordea'
    , clientId: '10355742'
    , algorithm: 'SHA256'
    , mac: 'SMqkXi5T0SM0fNfn9F5GTggPPTT3I5xq'
    , alias: 'nordea-plnet'
    }
  ])

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