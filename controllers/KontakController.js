const KontakModel = require('../models/KontakModel')
const kontakModel = new KontakModel()

class KontakController {
  // GET /kontak - render halaman manajemen kontak
  static async showKontak(req, res) {
    try {
      const kontak = await kontakModel.getKontakSaya(req.userId)
      res.render('kontak', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        kontak
      })
    } catch (err) {
      res.render('kontak', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        kontak: []
      })
    }
  }

  // GET /api/kontak - ambil daftar kontak (dipakai untuk isi dropdown di buat-utang)
  static async getKontak(req, res) {
    try {
      const kontak = await kontakModel.getKontakSaya(req.userId)
      res.json({ data: kontak })
    } catch (err) {
      res.status(500).json({ message: 'Gagal mengambil daftar kontak' })
    }
  }

  // POST /api/kontak/:id - tambah user lain jadi kontak
  static async tambahKontak(req, res) {
    try {
      const { alias } = req.body
      const hasil = await kontakModel.tambahKontak(req.userId, req.params.id, alias)
      res.status(201).json({ message: 'Kontak berhasil ditambahkan', data: hasil })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // DELETE /api/kontak/:id - hapus kontak
  static async hapusKontak(req, res) {
    try {
      const hasil = await kontakModel.hapusKontak(req.userId, req.params.id)
      res.json(hasil)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // PUT /api/kontak/:id - ubah alias / nama panggilan kontak
  static async updateAlias(req, res) {
    try {
      const { alias } = req.body
      const hasil = await kontakModel.updateAlias(req.userId, req.params.id, alias)
      res.json({ message: 'Alias kontak diperbarui', data: hasil })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

module.exports = KontakController
