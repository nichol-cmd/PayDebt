const UserModel  = require('../models/UserModel')
const { generateToken }  = require('../config/jwt')
const { getCookieOptions } = require('../config/cookieOptions')

const userModel = new UserModel()

class AuthController {

  // GET /login
  static showLogin(req, res) {
    if (req.cookies.token) return res.redirect('/dashboard')
    res.render('login', { error: null, success: null })
  }

  static async login(req, res) {
    const { email, password } = req.body
    try {
      const user  = await userModel.login(email, password)
      const token = generateToken({ id: user.id, name: user.name, role: user.role })

      res.cookie('token', token, getCookieOptions())
      res.redirect('/dashboard')
    } catch (err) {
      res.render('login', { error: err.message, success: null })
    }
  }

  // GET /register
  static showRegister(req, res) {
    res.render('register', { error: null, success: null })
  }

  // POST /register
  static async register(req, res) {
    const { name, email, password } = req.body
    try {
      await userModel.register(name, email, password)
      res.render('register', { error: null, success: 'Register berhasil! Silahkan login.' })
    } catch (err) {
      res.render('register', { error: err.message, success: null })
    }
  }

  // POST /logout
  static logout(req, res) {
    res.clearCookie('token', getCookieOptions())
    res.redirect('/login')
  }

  // GET /api/auth/me
  static async me(req, res) {
    try {
      const user = await userModel.getProfil(req.userId)
      res.json({ data: user })
    } catch (err) {
      res.status(404).json({ message: err.message })
    }
  }

  // GET /lupa-password
  static showLupaPassword(req, res) {
    res.render('lupa-password', { error: null })
  }

  // POST /lupa-password - cocokkan email + nama di database
  static async lupaPassword(req, res) {
    const { email, name } = req.body

    if (!email || !name) {
      return res.render('lupa-password', { error: 'Email dan nama harus diisi' })
    }

    try {
      const user = await userModel.cariByEmailDanNama(email, name)

      if (!user) {
        return res.render('lupa-password', { error: 'Email atau nama tidak sesuai' })
      }

      res.render('reset-password', { email: user.email, name: user.name, error: null })
    } catch (err) {
      res.render('lupa-password', { error: 'Terjadi kesalahan, coba lagi' })
    }
  }

  // POST /reset-password - verifikasi ulang email+nama, lalu update password
  static async resetPasswordUser(req, res) {
    const { email, name, passwordBaru, konfirmasiPassword } = req.body

    try {
      if (!passwordBaru || passwordBaru.length < 6) {
        throw new Error('Password baru minimal 6 karakter')
      }
      if (passwordBaru !== konfirmasiPassword) {
        throw new Error('Konfirmasi password tidak sama')
      }

      const user = await userModel.cariByEmailDanNama(email, name)
      if (!user) throw new Error('Verifikasi gagal, silahkan ulangi dari awal')

      await userModel.updatePasswordByEmail(email, passwordBaru)

      res.render('login', {
        error: null,
        success: 'Password berhasil diganti, silahkan login dengan password baru'
      })
    } catch (err) {
      res.render('reset-password', { email, name, error: err.message })
    }
  }
}

module.exports = AuthController
