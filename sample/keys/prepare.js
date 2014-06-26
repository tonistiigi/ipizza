var assert = require('assert')
var fs = require('fs')
var path = require('path')
var pangalink = require('pangalink.net-client')

module.exports = run

var defs = [
  {type: 'swedbank', name: 'ipizza_test_swedbank'},
  {type: 'seb', name: 'ipizza_test_seb'},
  {type: 'sampo', name: 'ipizza_test_sampo'},
  {type: 'krediidipank', name: 'ipizza_test_krediidipank'},
  {type: 'lhv', name: 'ipizza_test_lhv'},
  {type: 'nordea', name: 'ipizza_test_nordea', algo: 'sha1'},
  {type: 'ec', name: 'ipizza_test_ec', return_url: 'http://localhost:4000/ec_fake_return'}
]

function run() {
  var missing = []
  defs.forEach(function(d) {
    if (!fs.existsSync(path.join(__dirname, d.name + '.json'))) {
      missing.push(d)
    }
  })

  if (missing.length) {
    console.log('Development keys not present. Trying to recreate.')
    createKeys(missing)
    return false
  }
  else {
    return true
  }
}

function createKeys(arr) {
  if (!arr.length) {
    console.log('All done! Please restart the server.')
    process.exit(0)
  }

  try {
    var client = pangalink.createClient()
  }
  catch(e) {
    console.log('Error: Missing pangalink.net credentials.')
    console.log('Please set environment variables PANGALINK_API_KEY and ' +
      'PANGALINK_MASHAPE_KEY.')
    console.log('You can see your API key from: https://pangalink.net/api')
    throw(e)
    process.exit(1)
  }

  var def = arr[0]

  client.getProjects({filter: def.name}, function(err, projects) {
    assert.ifError(err)
    if (projects.length) {
      console.log('Downloading key for:', def.type)
      client.getProject(projects[0].id, function(err, project){
        assert.ifError(err)
        writeJSON(project)
      })
    }
    else {
      console.log('Creating key for:', def.type)
      client.addProject(def, function(err, project) {
        assert.ifError(err)
        writeJSON(project)
      })
    }
  })

  function writeJSON(data) {
    fs.writeFile(path.join(__dirname, def.name + '.json'),
      JSON.stringify(data, false, 2), function(err) {
        assert.ifError(err)
        arr.shift()
        console.log('Done.')
        createKeys(arr)
      })
  }
}

