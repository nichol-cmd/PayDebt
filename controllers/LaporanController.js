const LaporanModel = require('../models/LaporanModel')
const laporanModel = new LaporanModel()

class LaporanController {
  // GET /lapor - halaman lapor masalah (semua user)
  static async showLapor(req, res) {
    try {
      const laporan = await laporanModel.getLaporanSaya(req.userId)
      res.render('lapor', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        laporan
      })
    } catch (err) {
      res.render('lapor', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        laporan: []
      })
    }
  }

  // POST /api/lapor - kirim laporan baru
  static async buatLaporan(req, res) {
    const { judul, deskripsi } = req.body
    if (!judul || !deskripsi) {
      return res.status(400).json({ message: 'Judul dan deskripsi harus diisi' })
    }
    try {
      const data = await laporanModel.buatLaporan(req.userId, judul, deskripsi)
      res.status(201).json({ message: 'Laporan berhasil dikirim ke admin', data })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  // GET /admin/laporan - halaman semua laporan (khusus admin)
  static async showLaporanAdmin(req, res) {
    try {
      const laporan = await laporanModel.getSemuaLaporan()
      res.render('admin/laporan', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        laporan
      })
    } catch (err) {
      res.render('admin/laporan', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        laporan: []
      })
    }
  }

  // PATCH /api/admin/laporan/:id - admin update status & balasan
  static async updateLaporan(req, res) {
    try {
      const { status, balasanAdmin } = req.body
      if (!status) return res.status(400).json({ message: 'Status harus diisi' })

      const data = await laporanModel.updateStatus(req.params.id, status, balasanAdmin)
      res.json({ message: 'Laporan berhasil diperbarui', data })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

module.exports = LaporanController
