var express = require('express')
var app = express()

app.use(express.bodyParser())

var ipizza = require('../ipizza')

ipizza.set({ hostname: 'http://localhost:4000'
           , appHandler: app
           , logLevel: 'verbose'
           })

ipizza.provider(
  [ { provider: 'swedbank'
    , clientId: 'uid202196'
    , privateKey: __dirname + '/keys/swedbank.key.pem'
    , certificate: __dirname + '/keys/swedbank.cert.pem'
    }
  , { provider: 'seb'
    , clientId: 'uid203519'
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
    , clientId: 'uid203713'
    , privateKey: __dirname + '/keys/sampo.key.pem'
    , certificate: __dirname + '/keys/sampo.cert.pem'
    }
  , { provider: 'krediidipank'
    , clientId: 'uid205258'
    , privateKey: __dirname + '/keys/krediidipank.key.pem'
    , certificate: __dirname + '/keys/krediidipank.cert.pem'
    }
  , { provider: 'lhv'
    , clientId: 'uid205300'
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
    , clientId: '10205504'
    , algorithm: 'SHA256'
    , mac: 'dmzqcD99hgkgPFJ1tNh0BFLElpAxBRXT'
    , alias: 'nordea-plnet'
    }
  ])

ipizza.on('success', function (reply, req, resp) {
  resp.write('Payment OK!')
  resp.end(require('util').inspect(reply, false, 3))
})

ipizza.on('error', function (reply, req, resp) {
  resp.write('Payment Error!');
  resp.end(require('util').inspect(reply, false, 3));
})



app.get('/', function (req, res) {
  res.sendfile(__dirname + '/pay.html')
})

app.post('/pay', function (req, res) {
  // Never do this in production. Don't send payment data directly from request.
  ipizza.payment(req.body).pipe(res)
})

app.listen(4000)