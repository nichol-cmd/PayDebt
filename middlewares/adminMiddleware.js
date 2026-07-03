function adminMiddleware(req, res, next) {
  if (req.userRole !== 'admin') {
    const isApi = req.path.startsWith('/api/')

    if (isApi) {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang boleh mengakses ini.' })
    }

    return res.render('error', {
      user: { id: req.userId, name: req.userName, role: req.userRole },
      kode: 403,
      pesan: 'Akses ditolak. Halaman ini khusus admin.'
    })
  }

  next()
}

module.exports = adminMiddleware
