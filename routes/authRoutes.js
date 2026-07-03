const express        = require('express')
const router          = express.Router()
const AuthController = require('../controllers/AuthController')
const apiAuth         = require('../middlewares/apiAuthMiddleware')
const { loginLimiter } = require('../middlewares/rateLimitMiddleware')

// Login langsung - email + password -> JWT
router.get('/login',    AuthController.showLogin)
router.post('/login',   loginLimiter, AuthController.login)

router.get('/register',  AuthController.showRegister)
router.post('/register', AuthController.register)
router.post('/logout',   AuthController.logout)

// Lupa password - cocokkan email + nama -> ganti password
router.get('/lupa-password',   AuthController.showLupaPassword)
router.post('/lupa-password',  loginLimiter, AuthController.lupaPassword)
router.post('/reset-password', AuthController.resetPasswordUser)

router.get('/api/auth/me', apiAuth, AuthController.me)

module.exports = router
