const BaseModel = require('./BaseModel')

class KontakModel extends BaseModel {
  constructor() {
    super('kontak')
  }

  async tambahKontak(userId, kontakId, alias) {
    kontakId = parseInt(kontakId)

    if (userId === kontakId) {
      throw new Error('Tidak bisa menambahkan diri sendiri sebagai kontak')
    }

    const target = await this.prisma.user.findUnique({ where: { id: kontakId } })
    if (!target) throw new Error('User tidak ditemukan')

    const sudahAda = await this.prisma.kontak.findUnique({
      where: { userId_kontakId: { userId, kontakId } }
    })
    if (sudahAda) throw new Error('User ini sudah ada di kontak kamu')

    return await this.prisma.kontak.create({
      data: { userId, kontakId, alias: alias || null },
      include: { kontak: { select: { id: true, name: true, email: true } } }
    })
  }

  async hapusKontak(userId, kontakId) {
    kontakId = parseInt(kontakId)

    const ada = await this.prisma.kontak.findUnique({
      where: { userId_kontakId: { userId, kontakId } }
    })
    if (!ada) throw new Error('Kontak tidak ditemukan')

    await this.prisma.kontak.delete({
      where: { userId_kontakId: { userId, kontakId } }
    })
    return { message: 'Kontak berhasil dihapus' }
  }

  async updateAlias(userId, kontakId, alias) {
    kontakId = parseInt(kontakId)
    return await this.prisma.kontak.update({
      where: { userId_kontakId: { userId, kontakId } },
      data: { alias: alias || null }
    })
  }

  async getKontakSaya(userId) {
    return await this.prisma.kontak.findMany({
      where: { userId },
      include: { kontak: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }
}

module.exports = KontakModel
