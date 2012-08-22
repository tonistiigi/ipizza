var express = require('express')
var app = express()

app.use(express.bodyParser())

var ipizza = require('ipizza')

ipizza.set('hostname', 'http://localhost:4000')
ipizza.set('appHandler', app)


ipizza.provider('swedbank',
  { clientId: 'klient8167'
  , privateKey: __dirname + '/keys/my_private_key.pem'
  , certificate: __dirname + '/keys/bank_certificate.pem'
  , url: 'https://pangalink.net/banklink/008/ipizza'
  })



app.get('/', function (req, res) {
  var data = { provider: 'swedbank'
             , amount: 0.05
             , id: 12345
             , ref: ''
             , msg: 'Torso Tiger'
             , account: 1234567890
             , accountName: 'PANGAKONTO OMANIK'
             }

  var params = ipizza.payment(data).json()
  res.set('Content-Type', 'text/html')
  res.write('<form action="https://pangalink.net/banklink/008/ipizza" method="post"><input type="submit">');
  for (var i in params) {
    res.write('<input type="text" name="'+i+'" value="'+params[i]+'">');
  }
  res.write('</form>');
  res.end();
})

app.listen(4000)