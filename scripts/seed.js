const fs = require('fs')
const { db, executeQuery } = require('../lib/db')

const stream = fs.createReadStream('./data/projects.csv')

const createTableSql = `
  CREATE TABLE IF NOT EXISTS project (
    projectId INT PRIMARY KEY,
    projectName VARCHAR(255),
    year INT,
    currency VARCHAR(3),
    initialBudgetLocal DECIMAL(10, 2),
    budgetUsd DECIMAL(10, 2),
    initialScheduleEstimateMonths INT,
    adjustedScheduleEstimateMonths INT,
    contingencyRate DECIMAL(5, 2),
    escalationRate DECIMAL(5, 2),
    finalBudgetUsd DECIMAL(10, 2)
  )
`
let data = ''

executeQuery(createTableSql, err => {
  if (err) return console.error('Error creating table:', err)
  stream.on('data', chunk => {
    data += chunk.toString()

    const lines = data.split('\n')
    data = lines.pop()

    lines.forEach((line, index) => {
      if (index === 0) return

      const values = line.split(',')
      const parsedValues = values.map(value => {
        if (value === 'NULL') return null
        if (!isNaN(value)) return parseFloat(value)
        return `"${value}"`
      })

      const insertSql = `INSERT INTO project values (${parsedValues.join(',')})`

      executeQuery(insertSql, err => {
        if (err) {
          console.error('Error inserting Project ID:', values[0], err)
          process.exit(1)
        }
        console.log('Inserted Project ID:', values[0])
      })
    })
  })

  stream.on('end', () => {
    db.end(err => {
      if (err) return console.error('Error closing database connection:', err)
      console.log('Database connection closed')
    })
  })
})
