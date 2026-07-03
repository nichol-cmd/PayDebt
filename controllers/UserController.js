const UserModel = require('../models/UserModel')
const userModel = new UserModel()

class UserController {
  static async showProfil(req, res) {
    try {
      const [profil, followers, following] = await Promise.all([
        userModel.getProfil(req.userId),
        userModel.getFollowers(req.userId),
        userModel.getFollowing(req.userId)
      ])
      const followingIds = following.map(f => f.following.id)

      res.render('profil', {
        user: { id: req.userId, name: req.userName, role: req.userRole },
        profil, followers, following, followingIds
      })
    } catch (err) {
      res.redirect('/dashboard')
    }
  }

  static async cariUser(req, res) {
    try {
      const hasil = await userModel.cariUser(req.query.nama || '', req.userId)
      res.json({ data: hasil })
    } catch (err) {
      res.status(500).json({ message: 'Gagal mencari user' })
    }
  }

  static async updateProfil(req, res) {
    try {
      const updated = await userModel.update(req.userId, { name: req.body.name, bio: req.body.bio })
      res.json({ message: 'Profil diperbarui', data: updated })
    } catch (err) {
      res.status(500).json({ message: 'Gagal update' })
    }
  }

  static async follow(req, res) {
    try {
      const hasil = await userModel.follow(req.userId, req.params.id)
      res.json(hasil)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  static async unfollow(req, res) {
    try {
      const hasil = await userModel.unfollow(req.userId, req.params.id)
      res.json(hasil)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  static async getFollowers(req, res) {
    try {
      const data = await userModel.getFollowers(req.params.id)
      res.json({ data })
    } catch (err) {
      res.status(500).json({ message: 'Gagal ambil followers' })
    }
  }

  static async getFollowing(req, res) {
    try {
      const data = await userModel.getFollowing(req.params.id)
      res.json({ data })
    } catch (err) {
      res.status(500).json({ message: 'Gagal ambil following' })
    }
  }
}

module.exports = UserController
