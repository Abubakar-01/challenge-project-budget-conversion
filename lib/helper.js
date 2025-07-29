const axios = require('axios')
const config = require('../config')

module.exports = {
  validateProjectData,
  validateCurrencyRequest,
  convertCurrency,
  getExchangeRate,
  formatResponse,
  handleError
}

function validateProjectData (data) {
  const required = [
    'projectId', 'projectName', 'year', 'currency',
    'initialBudgetLocal', 'budgetUsd', 'initialScheduleEstimateMonths',
    'adjustedScheduleEstimateMonths', 'contingencyRate',
    'escalationRate', 'finalBudgetUsd'
  ]

  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }

  if (!Number.isInteger(data.year) || data.year < 2000) {
    return { valid: false, error: 'Invalid year' }
  }

  if (typeof data.currency !== 'string' || data.currency.length !== 3) {
    return { valid: false, error: 'Invalid currency code' }
  }

  return { valid: true }
}

function validateCurrencyRequest (data) {
  if (!data.year || !data.projectName || !data.currency) {
    return {
      valid: false,
      error: 'Missing required fields: year, projectName, currency'
    }
  }
  if (!Number.isInteger(data.year)) {
    return { valid: false, error: 'Year must be a number' }
  }
  if (typeof data.currency !== 'string' || data.currency.length !== 3) {
    return { valid: false, error: 'Currency must be 3-letter code' }
  }
  return { valid: true }
}

async function convertCurrency (amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount
  try {
    const rate = await getExchangeRate(fromCurrency, toCurrency)
    return amount * rate
  } catch (error) {
    throw new Error(`Currency conversion failed: ${error.message}`)
  }
}

async function getExchangeRate (fromCurrency, toCurrency) {
  const { baseUrl, apiKey } = config.currency
  const url = `${baseUrl}/${apiKey}/latest/${fromCurrency}`
  try {
    const response = await axios.get(url)
    if (response.data.result !== 'success') {
      throw new Error('Failed to fetch exchange rate')
    }
    const rate = response.data.conversion_rates[toCurrency]
    if (!rate) {
      throw new Error(`Rate not found for ${toCurrency}`)
    }
    return rate
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('Currency not supported')
    }
    throw error
  }
}

function formatResponse (success, data, error = null) {
  const response = { success }
  if (success) {
    response.data = data
  } else {
    response.error = error
  }
  return response
}

function handleError (error) {
  console.error('Error:', error)

  if (error.message.includes('Currency')) {
    return { status: 400, message: error.message }
  }

  if (error.message.includes('not found')) {
    return { status: 404, message: error.message }
  }

  return { status: 500, message: 'Internal server error' }
}
