const { verifyToken } = require('../config/jwt')
const { getCookieOptions } = require('../config/cookieOptions')

function authMiddleware(req, res, next) {
  const token = req.cookies.token

  if (!token) {
    return res.redirect('/login')
  }

  try {
    const decoded = verifyToken(token)

    req.userId   = decoded.id
    req.userName = decoded.name
    req.userRole = decoded.role

    next()
  } catch (err) {
    res.clearCookie('token', getCookieOptions())
    return res.redirect('/login')
  }
}

module.exports = authMiddleware
