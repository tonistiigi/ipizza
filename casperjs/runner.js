var assert = require('assert')
var path = require('path')
var spawn = require('child_process').spawn

var casper, sample;

sample = spawn('node', [
  path.join(__dirname, '../sample/sample_express.js')
])
sample.on('exit', function(code) {
  if (casper && code) {
    assert.ok(false, 'Sample closed with error code ' + code)
  }
  sample = null
  if (casper) {
    casper.kill()
  }
})
console.log('Started sample.');

setTimeout(function() {

  casper = spawn('casperjs', [
    'test', path.join(__dirname, 'test.js')
  ])
  casper.stdout.pipe(process.stdout)
  casper.on('exit', function(code) {
    if (code === 127) {
      assert.ok(false, 'Casperjs not found on path.')
    }
    else if (code) {
      assert.ok(false, 'Casperjs closed with error code.')
    }
    else {
      console.log('All done')
    }
    casper = null
    if (sample) {
      sample.kill()
    }
  })

  console.log('Started Casper.')

}, 1000)