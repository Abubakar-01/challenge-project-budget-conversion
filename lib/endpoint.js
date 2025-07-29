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
endpoints.get('/project/budget/:id', handleGetProject)
endpoints.post('/project/budget', handleCreateProject)
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

async function handleGetProject (req, res) {
  try {
    const project = await findProjectById(req.params.id)

    if (!project) {
      return res.status(404).json(formatResponse(false, null, 'Project not found'))
    }

    res.json(project)
  } catch (error) {
    const { status, message } = handleError(error)
    res.status(status).json(formatResponse(false, null, message))
  }
}

async function handleCreateProject (req, res) {
  try {
    const validation = validateProjectData(req.body)
    if (!validation.valid) {
      return res.status(400).json(formatResponse(false, null, validation.error))
    }

    await insertProject(req.body)
    res.status(201).json(formatResponse(true, { message: 'Project created successfully' }))
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json(formatResponse(false, null, 'Project ID already exists'))
    }

    const { status, message } = handleError(error)
    res.status(status).json(formatResponse(false, null, message))
  }
}
async function findProjectsByNameAndYear (projectName, year) {
  const sql = 'SELECT * FROM project WHERE projectName = ? AND year = ?'
  return await executeQuery(sql, [projectName, year])
}

async function findProjectById (id) {
  const sql = 'SELECT * FROM project WHERE projectId = ?'
  const projects = await executeQuery(sql, [id])
  return projects[0] || null
}

async function insertProject (projectData) {
  const sql = `
    INSERT INTO project 
    (projectId, projectName, year, currency, initialBudgetLocal, 
     budgetUsd, initialScheduleEstimateMonths, adjustedScheduleEstimateMonths,
     contingencyRate, escalationRate, finalBudgetUsd) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  const params = [
    projectData.projectId, projectData.projectName, projectData.year,
    projectData.currency, projectData.initialBudgetLocal, projectData.budgetUsd,
    projectData.initialScheduleEstimateMonths, projectData.adjustedScheduleEstimateMonths,
    projectData.contingencyRate, projectData.escalationRate, projectData.finalBudgetUsd
  ]

  const result = await executeQuery(sql, params)

  if (!result || result.affectedRows === 0) {
    throw new Error('Failed to create project')
  }

  return result
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
