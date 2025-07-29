process.env.NODE_ENV = 'test'

const http = require('http')
const test = require('tape')
const servertest = require('servertest')
const app = require('../lib/app')
const { executeQuery } = require('../lib/db')

const server = http.createServer(app)

test('GET /health should return 200', function (t) {
  servertest(server, '/health', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.end()
  })
})

test('GET /api/ok should return 200', function (t) {
  servertest(server, '/api/ok', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(res.body.ok, 'Should return a body')
    t.end()
  })
})

test('GET /nonexistent should return 404', function (t) {
  servertest(server, '/nonexistent', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 404, 'Should return 404')
    t.end()
  })
})
test('POST /api/project/budget/currency should convert currency', function (t) {
  const currencyRequest = {
    year: 2024,
    projectName: 'Updated Project',
    currency: 'EUR'
  }

  const options = {
    method: 'POST',
    encoding: 'json',
    headers: { 'Content-Type': 'application/json' }
  }

  servertest(server, '/api/project/budget/currency', options, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(res.body.success, 'Should return success')
    t.end()
  }).end(JSON.stringify(currencyRequest))
})
