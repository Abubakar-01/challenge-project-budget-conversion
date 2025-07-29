require('dotenv').config()

module.exports = {
  server: {
    port: process.env.PORT || 1337
  },
  mysql: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'budget'
  },
  currency: {
    apiKey: process.env.CURRENCY_API_KEY,
    baseUrl: 'https://v6.exchangerate-api.com/v6'
  }
}
