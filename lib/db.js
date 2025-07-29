const config = require('../config')
const mysql = require('mysql')
const sqlite3 = require('sqlite3').verbose()

const engines = {
  undefined: 'sqlite3',
  test: 'sqlite3',
  development: 'mysql',
  production: 'mysql'
}

const engine = {
  sqlite3: new sqlite3.Database(':memory:'),
  mysql: mysql.createConnection(config.mysql)
}[engines[process.env.NODE_ENV]]

const db = engine

if (engines[process.env.NODE_ENV] === 'mysql') {
  db.connect(function (err) {
    if (err) throw err
    console.log('connected to the database')
  })
}

db.healthCheck = function (cb) {
  const now = Date.now().toString()
  const createQuery = 'CREATE TABLE IF NOT EXISTS healthCheck (value TEXT)'
  const insertQuery = 'INSERT INTO healthCheck VALUES (?)'

  return executeQuery(createQuery, [], function (err) {
    if (err) return cb(err)
    return executeQuery(insertQuery, [now], function (err) {
      if (err) return cb(err)
      cb(null, now)
    })
  })
}

function executeQuery (query, values = []) {
  return new Promise((resolve, reject) => {
    if (engines[process.env.NODE_ENV] === 'mysql') {
      db.query(query, values, (err, results) => {
        if (err) return reject(err)
        resolve(results)
      })
    } else {
      db.serialize(() => {
        db.all(query, values, (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        })
      })
    }
  })
}

module.exports = {
  db,
  executeQuery
}
