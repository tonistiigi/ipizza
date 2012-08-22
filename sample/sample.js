var express = require('express')
var app = express()

app.use(express.bodyParser())

var ipizza = require('ipizza')

ipizza.set('hostname', 'http://localhost:4000')
ipizza.set('appHandler', app)
ipizza.set('log level', 'verbose')


ipizza.provider('swedbank',
  { clientId: 'uid202196'
  , privateKey: __dirname + '/keys/swedbank.key.pem'
  , certificate: __dirname + '/keys/swedbank.cert.pem'
  , gateway: 'https://pangalink.net/banklink/008/swedbank'
  })

ipizza.provider('seb',
  { clientId: 'uid203519'
  , privateKey: __dirname + '/keys/seb.key.pem'
  , certificate: __dirname + '/keys/seb.cert.pem'
  })

ipizza.provider(
  { provider: 'sampo'
  , clientId: 'uid203713'
  , privateKey: __dirname + '/keys/sampo.key.pem'
  , certificate: __dirname + '/keys/sampo.cert.pem'
  })



app.get('/', function (req, res) {
  var data = { provider: 'sampo'
             , amount: 19
             , id: 1234
             , ref: 121312952
             , msg: 'goods'
             }

  var params = ipizza.payment(data).json()
  res.set('Content-Type', 'text/html')
  res.write('<form action="https://pangalink.net/banklink/008/sampo" method="post"><input type="submit">');
  for (var i in params) {
    res.write('<input type="text" name="'+i+'" value="'+params[i]+'">');
  }
  res.write('</form>');
  res.end();
})

app.listen(4000)