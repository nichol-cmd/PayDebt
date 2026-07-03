const path        = require('path')
const fs          = require('fs')
const UtangModel  = require('../models/UtangModel')
const upload      = require('../middlewares/uploadMiddleware')
const utangModel  = new UtangModel()

class UtangController {
  static async showDashboard(req, res) {
    try {
      await utangModel.cekDeadlineMendekat(req.userId)

      const data = await utangModel.getDashboard(req.userId)
      res.render('dashboard', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        data
      })
    } catch (err) {
      res.render('dashboard', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        data: { totalHutang: 0, totalPiutang: 0, selisih: 0, hutang: [], hutangDibuat: [], piutang: [] }
      })
    }
  }

  static showBuatUtang(req, res) {
    res.render('buat-utang', {
      user: { id: req.userId, name: req.userName, role: req.userRole },
      error: null, success: null
    })
  }

  static async showRekap(req, res) {
    try {
      const data = await utangModel.getRekapSemua(req.userId)
      res.render('rekap', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        data
      })
    } catch (err) {
      res.render('rekap', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        data: { sebagaiPembuat: [], sebagaiPeserta: [] }
      })
    }
  }

  // POST /api/utang
  static async buatUtang(req, res) {
    const { judul, tipe, peserta } = req.body
    if (!judul || !tipe || !peserta || peserta.length === 0) {
      return res.status(400).json({ message: 'Judul, tipe, dan peserta harus diisi' })
    }

    for (const p of peserta) {
      const jumlah = Number(p.jumlah)
      if (p.jumlah === '' || p.jumlah === null || p.jumlah === undefined || isNaN(jumlah)) {
        return res.status(400).json({ message: 'Jumlah harus berupa angka' })
      }
      if (jumlah <= 0) {
        return res.status(400).json({ message: 'Jumlah tidak boleh nol atau negatif' })
      }
    }

    try {
      const data = await utangModel.buatUtang(req.userId, req.body)
      res.status(201).json({ message: 'Utang berhasil dibuat', data })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  static async requestLunas(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Bukti transfer wajib diupload sebelum klaim pembayaran' })
      }

      if (!upload.validasiMagicBytes(req.file.path)) {
        fs.unlinkSync(req.file.path)
        return res.status(400).json({ message: 'File yang diupload bukan gambar JPG/PNG yang valid' })
      }

      const buktiPath = `/uploads/bukti/${req.file.filename}`
      const hasil = await utangModel.requestTandaiLunas(req.params.id, req.userId, buktiPath)
      res.json(hasil)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  static async konfirmasiLunas(req, res) {
    try {
      const utang = await utangModel.findById(req.params.id)
      if (!utang) return res.status(404).json({ message: 'Utang tidak ditemukan' })

      const isAdmin = req.userRole === 'admin'
      if (!isAdmin && utang.pembuatId !== req.userId) {
        return res.status(403).json({ message: 'Hanya pembuat utang yang bisa konfirmasi' })
      }

      const userAksi = { id: req.userId, name: req.userName }
      const hasil    = await utangModel.konfirmasiLunas(req.params.id, req.params.pesertaId, userAksi)
      res.json({ message: `Status: ${hasil.statusBaru}` })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  static async hapusUtang(req, res) {
    try {
      const utang = await utangModel.findById(req.params.id)
      if (!utang) return res.status(404).json({ message: 'Tidak ditemukan' })

      if (utang.pembuatId !== req.userId) {
        return res.status(403).json({ message: 'Hanya pembuat yang bisa membatalkan utang ini' })
      }

      await utangModel.delete(req.params.id)
      res.json({ message: 'Berhasil dihapus' })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  static async lihatBukti(req, res) {
    try {
      const namaFile  = path.basename(req.params.filename)
      const buktiPath = `/uploads/bukti/${namaFile}`

      const peserta = await utangModel.cariPesertaByBukti(buktiPath)
      if (!peserta) {
        return res.status(404).render('error', {
          user: { id: req.userId, name: req.userName, role: req.userRole },
          kode: 404, pesan: 'File bukti transfer tidak ditemukan'
        })
      }

      const isPemilikFoto = peserta.userId === req.userId
      const isPembuatUtang = peserta.utang.pembuatId === req.userId

      if (!isPemilikFoto && !isPembuatUtang) {
        return res.status(403).render('error', {
          user: { id: req.userId, name: req.userName, role: req.userRole },
          kode: 403, pesan: 'Kamu tidak berhak melihat file ini'
        })
      }

      const filePath = path.join(__dirname, '../uploads/bukti', namaFile)
      res.sendFile(filePath, (err) => {
        if (err) {
          res.status(404).render('error', {
            user: { id: req.userId, name: req.userName, role: req.userRole },
            kode: 404, pesan: 'File tidak ditemukan di server'
          })
        }
      })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = UtangController
