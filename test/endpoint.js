process.env.NODE_ENV = 'test'

const http = require('http')
const test = require('tape')
const servertest = require('servertest')
const app = require('../lib/app')
const { executeQuery } = require('../lib/db')

const server = http.createServer(app)

const testProject = {
  projectId: 99999,
  projectName: 'Test Project',
  year: 2024,
  currency: 'USD',
  initialBudgetLocal: 100000,
  budgetUsd: 100000,
  initialScheduleEstimateMonths: 12,
  adjustedScheduleEstimateMonths: 10,
  contingencyRate: 2.5,
  escalationRate: 3.0,
  finalBudgetUsd: 105000
}

// Setup database tables before running tests
test('Database setup', async function (t) {
  const createProjectTable = `
    CREATE TABLE IF NOT EXISTS project (
      projectId INTEGER PRIMARY KEY,
      projectName TEXT NOT NULL,
      year INTEGER NOT NULL,
      currency TEXT NOT NULL,
      initialBudgetLocal REAL NOT NULL,
      budgetUsd REAL NOT NULL,
      initialScheduleEstimateMonths INTEGER NOT NULL,
      adjustedScheduleEstimateMonths INTEGER NOT NULL,
      contingencyRate REAL NOT NULL,
      escalationRate REAL NOT NULL,
      finalBudgetUsd REAL NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  try {
    await executeQuery(createProjectTable, [])
    t.pass('Database tables created successfully')
  } catch (err) {
    t.fail('Database setup failed: ' + err.message)
  }
  t.end()
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

// API Endpoint Tests

test('POST /api/project/budget should create project', function (t) {
  const options = {
    method: 'POST',
    encoding: 'json',
    headers: { 'Content-Type': 'application/json' }
  }

  servertest(server, '/api/project/budget', options, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 201, 'Should return 201')
    t.ok(res.body.success, 'Should return success')
    t.end()
  }).end(JSON.stringify(testProject))
})

test('GET /api/project/budget/:id should return project', function (t) {
  servertest(server, '/api/project/budget/99999', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.equal(res.body.projectId, 99999, 'Should return correct project')
    t.end()
  })
})

test('PUT /api/project/budget/:id should update project', function (t) {
  const updatedProject = { ...testProject, projectName: 'Updated Project' }
  delete updatedProject.projectId

  const options = {
    method: 'PUT',
    encoding: 'json',
    headers: { 'Content-Type': 'application/json' }
  }

  servertest(server, '/api/project/budget/99999', options, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(res.body.success, 'Should return success')
    t.end()
  }).end(JSON.stringify(updatedProject))
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

test('POST /api-conversion should convert to TTD', function (t) {
  // First create TTD project
  const ttdProject = {
    projectId: 88888,
    projectName: 'Peking roasted duck Chanel',
    year: 2024,
    currency: 'EUR',
    initialBudgetLocal: 300000,
    budgetUsd: 270000,
    initialScheduleEstimateMonths: 12,
    adjustedScheduleEstimateMonths: 11,
    contingencyRate: 2.8,
    escalationRate: 3.6,
    finalBudgetUsd: 285000
  }

  const createOptions = {
    method: 'POST',
    encoding: 'json',
    headers: { 'Content-Type': 'application/json' }
  }

  servertest(server, '/api/project/budget', createOptions, function (err, res) {
    t.error(err, 'No error creating TTD project')

    // Now test TTD conversion
    const ttdRequest = {
      projectName: 'Peking roasted duck Chanel',
      year: 2024
    }

    const ttdOptions = {
      method: 'POST',
      encoding: 'json',
      headers: { 'Content-Type': 'application/json' }
    }

    servertest(server, '/api/api-conversion', ttdOptions, function (err, res) {
      t.error(err, 'No error')
      t.equal(res.statusCode, 200, 'Should return 200')
      t.ok(res.body.success, 'Should return success')
      t.end()
    }).end(JSON.stringify(ttdRequest))
  }).end(JSON.stringify(ttdProject))
})

test('DELETE /api/project/budget/:id should delete project', function (t) {
  const options = {
    method: 'DELETE',
    encoding: 'json'
  }

  servertest(server, '/api/project/budget/99999', options, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(res.body.success, 'Should return success')
    t.end()
  })
})
