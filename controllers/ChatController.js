const ChatModel = require('../models/ChatModel')
const chatModel = new ChatModel()

class ChatController {
  static async showChat(req, res) {
    try {
      const groups = await chatModel.getGrupSaya(req.userId)
      res.render('chat', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        groups
      })
    } catch (err) {
      res.render('chat', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        groups: []
      })
    }
  }

  static async getGrup(req, res) {
    try {
      const data = await chatModel.getGrupSaya(req.userId)
      res.json({ data })
    } catch (err) {
      res.status(500).json({ message: 'Gagal' })
    }
  }

  static async buatGrup(req, res) {
    const { nama, deskripsi, anggotaIds } = req.body
    if (!nama) return res.status(400).json({ message: 'Nama grup harus diisi' })
    try {
      const grup = await chatModel.buatGrup(req.userId, nama, deskripsi, anggotaIds || [])
      res.status(201).json({ message: 'Grup dibuat', data: grup })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  static async getPesan(req, res) {
    try {
      const pesan = await chatModel.getPesan(req.params.id, req.userId)
      res.json({ data: pesan })
    } catch (err) {
      res.status(403).json({ message: err.message })
    }
  }

  static async kirimPesan(req, res) {
    const { isi } = req.body
    if (!isi || isi.trim() === '') {
      return res.status(400).json({ message: 'Pesan tidak boleh kosong' })
    }
    try {
      const pesan = await chatModel.kirimPesan(req.params.id, req.userId, isi)
      res.status(201).json({ data: pesan })
    } catch (err) {
      res.status(403).json({ message: err.message })
    }
  }

  static async keluarGrup(req, res) {
    try {
      const hasil = await chatModel.keluarGrup(req.params.id, req.userId)
      res.json(hasil)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = ChatController
