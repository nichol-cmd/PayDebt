const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 5,                   
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}_${req.body.email || ''}`,
  handler: (req, res) => {
    const halaman = req.path === '/lupa-password' ? 'lupa-password' : 'login'
    const data    = halaman === 'login'
      ? { error: 'Terlalu banyak percobaan. Coba lagi dalam 5 menit.', success: null }
      : { error: 'Terlalu banyak percobaan. Coba lagi dalam 5 menit.' }

    res.status(429).render(halaman, data)
  }
})

module.exports = { loginLimiter }
