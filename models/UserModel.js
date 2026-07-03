const BaseModel = require('./BaseModel')
const bcrypt    = require('bcryptjs')
const { emitToUser } = require('../config/socket')

class UserModel extends BaseModel {
  constructor() {
    super('user')
  }

  async register(name, email, password) {
    const sudahAda = await this.prisma.user.findUnique({ where: { email } })
    if (sudahAda) throw new Error('Email sudah terdaftar')

    const hash = await bcrypt.hash(password, 10)
    const user = await this.prisma.user.create({
      data: { name, email, password: hash }
    })
    return { id: user.id, name: user.name, email: user.email, role: user.role }
  }

  async login(email, password) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error('Email tidak ditemukan')

    const cocok = await bcrypt.compare(password, user.password)
    if (!cocok) throw new Error('Password salah')

    return { id: user.id, name: user.name, email: user.email, role: user.role }
  }

  async getProfil(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true, name: true, email: true, bio: true,
        role: true, createdAt: true,
        _count: { select: { followers: true, following: true } }
      }
    })
    if (!user) throw new Error('User tidak ditemukan')
    return user
  }

  async cariUser(keyword, myId) {
    return await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: myId } },
          { name: { contains: keyword } }
        ]
      },
      select: { id: true, name: true, email: true }
    })
  }

  async getAllUsers() {
    return await this.prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { utang: true, followers: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async gantiRole(userId, role) {
    if (!['user', 'admin'].includes(role)) throw new Error('Role tidak valid')
    return await this.prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    })
  }

  async hapusUser(userId) {
    return await this.prisma.user.delete({ where: { id: parseInt(userId) } })
  }

  async resetPassword(userId) {
    const passwordBaru = Math.random().toString(36).slice(-8) 
    const hash = await bcrypt.hash(passwordBaru, 10)

    const user = await this.prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hash },
      select: { id: true, name: true, email: true }
    })

    return { user, passwordBaru }
  }

  async cariByEmail(email) {
    return await this.prisma.user.findUnique({ where: { email } })
  }

  async cariByEmailDanNama(email, name) {
    return await this.prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        name:  name.trim()
      }
    })
  }

  async updatePasswordByEmail(email, passwordBaru) {
    const hash = await bcrypt.hash(passwordBaru, 10)
    return await this.prisma.user.update({
      where: { email },
      data: { password: hash },
      select: { id: true, name: true, email: true }
    })
  }

  async follow(followerId, followingId) {
    followingId = parseInt(followingId)
    if (followerId === followingId) throw new Error('Tidak bisa follow diri sendiri')

    const sudah = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    })
    if (sudah) throw new Error('Sudah follow user ini')

    await this.prisma.follow.create({ data: { followerId, followingId } })

    const follower = await this.prisma.user.findUnique({
      where: { id: followerId }, select: { name: true }
    })
    await this.prisma.notifikasi.create({
      data: {
        userId: followingId,
        judul: 'Follower Baru',
        pesan: `${follower.name} mulai mengikuti kamu`
      }
    })

    emitToUser(followingId, 'notifikasi_baru', {
      judul: 'Follower Baru',
      pesan: `${follower.name} mulai mengikuti kamu`
    })

    return { message: 'Berhasil follow' }
  }

  async unfollow(followerId, followingId) {
    followingId = parseInt(followingId)
    await this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } }
    })
    return { message: 'Berhasil unfollow' }
  }

  async getFollowers(userId) {
    return await this.prisma.follow.findMany({
      where: { followingId: parseInt(userId) },
      include: { follower: { select: { id: true, name: true, email: true } } }
    })
  }

  async getFollowing(userId) {
    return await this.prisma.follow.findMany({
      where: { followerId: parseInt(userId) },
      include: { following: { select: { id: true, name: true, email: true } } }
    })
  }
}

module.exports = UserModel
