[![Build Status](https://secure.travis-ci.org/tonistiigi/ipizza.png)](http://travis-ci.org/tonistiigi/ipizza)

### What?

Node.js module for payment processing with Estonian (and other iPizza based) banks. It currently supports Swedbank, SEB, Sampo, Krediidipank, LHV, Nordea and Estcard. Testing is provided by awesome [Pangalink.net](http://pangalink.net/) service.

###Install

```
npm install ipizza
```

**Run tests:**

```
npm test
node casperjs/runner.js       # requires CasperJS
```

**Sample:**

```
node sample/sample_express.js
node sample/sample_http.js
```

### Basic usage

```javascript
var ipizza = require('ipizza')
```

**Setup**

```javascript
// General options.
ipizza.set({
  hostname: 'http://my.domain.com:4000' // used in return URL.
, appHandler: app //if you use Express.
, logLevel: 'verbose'
, env: 'development'
})

// Common options for providers(banks).
ipizza.provider({
  provider: 'swedbank'
, clientId: 'uid202196'
, privateKey: 'keys/swedbank.key.pem'
, certificate: 'keys/swedbank.cert.pem'
}
```

**Making a payment.**

```javascript
var payment = ipizza.payment({
  provider: 'swedbank'
, id: 10
, msg: 'Stuff'
, amount: 8.99
})

// Pipe into response. Redirects to bank site.
payment.pipe(resp)

// or get raw values
var params = payment.json()
var gateway = payment.get('gateway')

// or just get the HTML form
var html = payment.html()
```

**Response handling**

*Note that after `success` event you also have to check that the amount matches the Order ID/Reference number based on your stored request data. If you don't do this payment response could potentially be faked.*

```javascript
ipizza.on('success', function (reply, req, resp) {
  /*
  reply:
    { transactionId: '1602',
      amount: 2.95,
      curr: 'EUR',
      receiver: '10002050618003',
      receiverName: 'ALLAS ALLAR',
      sender: '10010046155012',
      senderName: 'TÕÄGER Leõpäöld¸´¨¦',
      date: '16.09.2012',
      provider: 'seb',
      bankId: 'EYP',
      clientId: 'testvpos',
      id: '123',
      ref: '',
      msg: 'Goods üÜõÕöÖäÄ',
      lang: 'ENG',
      isAuto: false }
  */
})

ipizza.on('error', function (reply, req, resp) {
  /*
  reply:
    { type: 'not paid',
      provider: 'seb',
      bankId: 'EYP',
      clientId: 'testvpos',
      id: '123',
      ref: '',
      msg: 'Goods üÜõÕöÖäÄ',
      lang: 'ENG',
      isAuto: false }
    { type: 'not verified',
      provider: 'seb' }
  */
})
```

### ipizza.get(key), ipizza.set(key, value)

**Supported syntax:**

```javascript
// Support both camelCase and spaced keys.
ipizza.get('logLevel')
ipizza.get('log level')
ipizza.set('logLevel', 'info')
ipizza.set('log level', 'info')
// and objects.
ipizza.set({logLevel: 'info', env: 'production'})
```
**Options:**

- `appHandler` - Middleware for automatic response handling. If you use Express you can set it to your application instance. Otherwise it returns a function that you can use as a middleware.
- `env` - Environment mode. (Usually) development or production. This is used for getting the right gateway URL and you should use it for specifying different configurations. Default: *$NODE_ENV*.
- `hostname` - Base URL that is used when creating return URLs. Should point to your server from network.
- `logLevel` - Log level. Options: silly, verbose, info, warn, error. Default: *info*.
- `logStream` - Log stream. Default: *stdout*.
- `returnRoute` - Route that is used in automatic response handling. You can optionally specify provider position with :provider. Defaults to */api/payment/response/:provider*.
- `throwOnErrors` - Should ipizza throw on error cases? Default: *true*.

### ipizza.provider([provider], opt)

Used to set common properties(like keys) for a specific provider. These can be overwritten with `ipizza.payment()`.

**Supported syntax:**
```javascript
// With a provider name key.
ipizza.provider('swedbank', {
  clientId: 'uid202196'
, privateKey: __dirname + '/keys/swedbank.key.pem'
, certificate: __dirname + '/keys/swedbank.cert.pem'
}

// With option block only.
ipizza.provider({
  provider: 'swedbank'
, clientId: 'uid202196'
, privateKey: __dirname + '/keys/swedbank.key.pem'
, certificate: __dirname + '/keys/swedbank.cert.pem'
}

// Array of providers.
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
  ]);
```
**Options:**

- `alias` - Clone a provider with specified name. Useful when you need to use different configurations for same payment gateway.
- all options for `ipizza.payment()`.

#### ipizza.payment([provider], opt)

```javascript
// With a provider name key.
var p = ipizza.payment('swedbank', {
  id: 123
, amount: 3.99
})

// With option block only.
var p = ipizza.payment({
  provider: 'swedbank'
, id: 123
, amount: 3.99
})
```

**Options:**

- `provider` - Bank name.
- `clientId` - Merchant ID. Usually VK_SND_ID.
- `privateKey` - Merchant private key file. This can be path, buffer of string contents of the key.
- `certificate` - Bank public certificate file. This can be path, buffer of string contents of the key.
- `mac` - Password used for Nordea.
- `algorithm` - Algoritm used for Nordea. SHA1, SHA256 or MD5. Default: *SHA1*.

-
- `id` - Order ID.
- `amount` - Amount to pay.
- `ref` - Order refernce number. Optional.
- `msg` - Payment message.
- `curr` - Currency. Default: *EUR*.
- `lang` - Language for bank interface. Default: *ENG*.
- `encoding` - Encoding used. *UTF-8* or *ISO-8859-1*. Only used when supported by provider. Default: *UTF-8*.
- `account` - Receiver account number. Optional.
- `accountName` - Receiver name. Optional.

-
- `gateway` - URL for the provider gateway. Optional. Automatically based on environment.
- `return` - Return URL sent to the bank. Optional. Automatically generated based on `returnRoute`.


**Methods:**

- `pipe(response)` - Redirect payment directly to the response object. Client that made the request is automatically sent to the bank's website. Note that payment is not really a stream (you can't listen data events on it) and this is just a syntactic sugar.
- `json()` - Return object with raw parameters that should be sent to the bank. Including calculated MAC values.
- `html()` - Return HTML form with all payment info filled in that posts to bank website.
- `set(key, value), get(key)` - Getter/setters for overwriting options.


#### Automatic response handling

This module will automatically make return URLs and set up listeners for matching routes. You can change the format of that route by changing the `returnRoute` option.

To connect it to your server you need to include the middleware function that you get from `appHandler` option.

```javascript
var f = ipizza.get('appHandler')
// Returns: function(request, response, next) {...}

app.use(f)
```

If you use Express you can just set the application instance as `appHandler`.

```javascript
var app = express()
ipizza.set('appHandler', app)
```

#### Manual response handling

If you don't like automatic response handling you can do it all manually. When making a payment you need to set the `return` option that is then sent to bank as *RETURN_URL*.

It's up to you then to have something listening on that URL. When you have captured a request from bank you need to call `ipizza.response(provider, request, response)` to verify the request and dispatch `success` and `error` events.

#### Error handling

By default ipizza throws on errors. That is correct behaviour as the API is synchronous. If you don't like it in your production environment you can disable it by calling `ipizza.set('throwOnErrors', false)`. Still, if your not sure if your data can produce errors you should put the function calls inside a try/catch block or set up a domain. Chances are, your own code will throw if it doesn't get any reasonable data back because of an error.

#### Contributing

This repo uses [npm coding style](https://npmjs.org/doc/coding-style.html).
