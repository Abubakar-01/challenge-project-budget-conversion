const express = require('express')
const { executeQuery } = require('./db')
const {
  validateProjectData,
  validateCurrencyRequest,
  convertCurrency,
  formatResponse,
  handleError
} = require('./helper')

const endpoints = express.Router()

module.exports = endpoints

endpoints.get('/ok', (req, res) => {
  res.status(200).json({ ok: true })
})

endpoints.post('/project/budget/currency', handleCurrencyConversion)
async function handleCurrencyConversion (req, res) {
  try {
    const validation = validateCurrencyRequest(req.body)
    if (!validation.valid) {
      return res.status(400).json(formatResponse(false, null, validation.error))
    }

    const { year, projectName, currency } = req.body
    const projects = await findProjectsByNameAndYear(projectName, year)

    if (projects.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Project not found'))
    }

    const convertedProjects = await convertProjectsToCurrency(projects, currency)
    res.json(formatResponse(true, convertedProjects))
  } catch (error) {
    const { status, message } = handleError(error)
    res.status(status).json(formatResponse(false, null, message))
  }
}
async function findProjectsByNameAndYear (projectName, year) {
  const sql = 'SELECT * FROM project WHERE projectName = ? AND year = ?'
  return await executeQuery(sql, [projectName, year])
}
async function convertProjectsToCurrency (projects, currency) {
  const convertedProjects = []

  for (const project of projects) {
    const convertedProject = { ...project }

    if (currency !== 'USD') {
      const convertedAmount = await convertCurrency(
        project.finalBudgetUsd,
        'USD',
        currency
      )

      const currencyField = `finalBudget${currency.toLowerCase()}`
      convertedProject[currencyField] = parseFloat(convertedAmount.toFixed(2))
    }

    convertedProjects.push(convertedProject)
  }

  return convertedProjects
}
