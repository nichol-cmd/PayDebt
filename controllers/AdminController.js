const UserModel = require('../models/UserModel')
const prisma    = require('../config/database')
const { emitToSemua } = require('../config/socket')
const userModel = new UserModel()

class AdminController {
  static async showDashboard(req, res) {
    try {
      const [users, totalUtang, totalGrup, laporanBaru] = await Promise.all([
        userModel.getAllUsers(),
        prisma.utang.count(),
        prisma.group.count(),
        prisma.laporan.count({ where: { status: 'BARU' } })
      ])

      res.render('admin/panel', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        users,
        stats: {
          totalUser:  users.length,
          totalUtang,
          totalGrup,
          totalAdmin: users.filter(u => u.role === 'admin').length,
          laporanBaru
        }
      })
    } catch (err) {
      res.redirect('/dashboard')
    }
  }

  static async gantiRole(req, res) {
    try {
      const { role } = req.body
      if (parseInt(req.params.id) === req.userId) {
        return res.status(400).json({ message: 'Tidak bisa mengganti role diri sendiri' })
      }
      const updated = await userModel.gantiRole(req.params.id, role)
      res.json({ message: `Role ${updated.name} diganti ke ${role}`, data: updated })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  static async hapusUser(req, res) {
    try {
      if (parseInt(req.params.id) === req.userId) {
        return res.status(400).json({ message: 'Tidak bisa menghapus akun sendiri' })
      }
      await userModel.hapusUser(req.params.id)
      res.json({ message: 'User berhasil dihapus' })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  static async resetPassword(req, res) {
    try {
      if (parseInt(req.params.id) === req.userId) {
        return res.status(400).json({ message: 'Gunakan menu profil untuk ganti password sendiri' })
      }

      const { user, passwordBaru } = await userModel.resetPassword(req.params.id)

      await prisma.notifikasi.create({
        data: {
          userId: user.id,
          judul: 'Password Direset Admin',
          pesan: 'Password akun kamu telah direset oleh admin. Silahkan hubungi admin untuk mendapatkan password baru.'
        }
      })

      res.json({
        message: `Password ${user.name} berhasil direset`,
        passwordBaru 
      })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  static async kirimBroadcast(req, res) {
    try {
      const { judul, pesan } = req.body
      if (!judul || !pesan) {
        return res.status(400).json({ message: 'Judul dan pesan pengumuman harus diisi' })
      }

      const judulFinal = `📢 ${judul}`
      const semuaUser  = await prisma.user.findMany({ select: { id: true } })

      await prisma.notifikasi.createMany({
        data: semuaUser.map(u => ({ userId: u.id, judul: judulFinal, pesan }))
      })

      emitToSemua('notifikasi_baru', { judul: judulFinal, pesan })

      res.json({ message: `Pengumuman terkirim ke ${semuaUser.length} user` })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = AdminController
