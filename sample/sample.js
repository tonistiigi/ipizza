var express = require('express')
var app = express()


var ipizza = require('ipizza')

ipizza.set('hostname', 'http://localhost:4000')
ipizza.set('appHandler', app)


ipizza.provider('swedbank',
  { clientId: 'uid202196'
  , privateKey: __dirname + '/keys/swedbank.key.pem'
  , certificate: __dirname + '/keys/swedbank.cert.pem'
  , url: 'https://pangalink.net/banklink/008/swedbank'
  })



app.get('/', function (req, res) {
  var data = { provider: 'swedbank'
             , amount: 19
             , id: 1234
             , ref: 121312952
             , msg: 'goods'
             }

  var params = ipizza.payment(data).json()
  res.set('Content-Type', 'text/html')
  res.write('<form action="https://pangalink.net/banklink/008/swedbank" method="post"><input type="submit">');
  for (var i in params) {
    res.write('<input type="text" name="'+i+'" value="'+params[i]+'">');
  }
  res.write('</form>');
  res.end();
})

app.listen(4000)