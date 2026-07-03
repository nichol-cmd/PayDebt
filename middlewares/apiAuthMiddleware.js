const { verifyToken } = require('../config/jwt')

function apiAuthMiddleware(req, res, next) {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan, silahkan login' })
  }

  try {
    const decoded = verifyToken(token)

    req.userId   = decoded.id
    req.userName = decoded.name
    req.userRole = decoded.role

    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah expired' })
  }
}

module.exports = apiAuthMiddleware
