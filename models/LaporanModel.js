const BaseModel = require('./BaseModel')
const { emitToUser } = require('../config/socket')

class LaporanModel extends BaseModel {
  constructor() {
    super('laporan')
  }

  async buatLaporan(userId, judul, deskripsi) {
    return await this.prisma.laporan.create({
      data: { userId, judul, deskripsi }
    })
  }

  async getLaporanSaya(userId) {
    return await this.prisma.laporan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getSemuaLaporan() {
    return await this.prisma.laporan.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async updateStatus(laporanId, status, balasanAdmin) {
    laporanId = parseInt(laporanId)

    const laporan = await this.prisma.laporan.update({
      where: { id: laporanId },
      data: { status, balasanAdmin: balasanAdmin || null }
    })

    await this.prisma.notifikasi.create({
      data: {
        userId: laporan.userId,
        judul: 'Laporan Kamu Diperbarui',
        pesan: `Status laporan "${laporan.judul}" sekarang: ${status}${balasanAdmin ? '. Balasan admin: ' + balasanAdmin : ''}`
      }
    })

    emitToUser(laporan.userId, 'notifikasi_baru', {
      judul: 'Laporan Kamu Diperbarui',
      pesan: `Status laporan "${laporan.judul}" sekarang: ${status}`
    })

    return laporan
  }
}

module.exports = LaporanModel
