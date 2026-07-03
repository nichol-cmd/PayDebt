const prisma = require('../config/database')

class NotifController {
  static async showNotif(req, res) {
    try {
      const notif = await prisma.notifikasi.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
      })
      res.render('notif', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        notif
      })
    } catch (err) {
      res.render('notif', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        notif: []
      })
    }
  }

  static async jumlahBelumBaca(req, res) {
    try {
      const jumlah = await prisma.notifikasi.count({
        where: { userId: req.userId, sudahBaca: false }
      })
      res.json({ jumlah })
    } catch (err) {
      res.json({ jumlah: 0 })
    }
  }

  static async bacaSemua(req, res) {
    try {
      await prisma.notifikasi.updateMany({
        where: { userId: req.userId, sudahBaca: false },
        data: { sudahBaca: true }
      })
      res.json({ message: 'Semua ditandai dibaca' })
    } catch (err) {
      res.status(500).json({ message: 'Gagal' })
    }
  }

  static async bacaSatu(req, res) {
    try {
      const notif = await prisma.notifikasi.findUnique({
        where: { id: parseInt(req.params.id) }
      })

      if (!notif) return res.status(404).json({ message: 'Notifikasi tidak ditemukan' })
      if (notif.userId !== req.userId) {
        return res.status(403).json({ message: 'Kamu tidak berhak mengubah notifikasi ini' })
      }

      await prisma.notifikasi.update({
        where: { id: parseInt(req.params.id) },
        data: { sudahBaca: true }
      })
      res.json({ message: 'Ditandai dibaca' })
    } catch (err) {
      res.status(500).json({ message: 'Gagal' })
    }
  }
}

module.exports = NotifController
