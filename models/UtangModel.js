const BaseModel = require('./BaseModel')
const { emitToUser } = require('../config/socket')

class UtangModel extends BaseModel {
  constructor() {
    super('utang')
  }

  async buatUtang(pembuatId, data) {
    const { judul, keterangan, tipe, deadline, peserta } = data
    const total = peserta.reduce((sum, p) => sum + p.jumlah, 0)

    const utangBaru = await this.prisma.utang.create({
      data: {
        judul, keterangan: keterangan || null,
        totalAmount: total, tipe,
        deadline: deadline ? new Date(deadline) : null,
        pembuatId,
        peserta: {
          create: peserta.map(p => ({
            userId: parseInt(p.userId),
            jumlah: p.jumlah,
            catatan: p.catatan || null
          }))
        },
        histori: {
          create: {
            userId: pembuatId,
            aksi: `Membuat utang "${judul}" sebesar Rp ${total.toLocaleString('id-ID')}`
          }
        }
      },
      include: {
        peserta: { include: { user: { select: { id: true, name: true } } } },
        pembuat: { select: { id: true, name: true } }
      }
    })

    const notifData = peserta.map(p => ({
      userId: parseInt(p.userId),
      utangId: utangBaru.id,
      judul: 'Ada Utang Baru',
      pesan: `${utangBaru.pembuat.name} mencatat utang "${judul}" sebesar Rp ${p.jumlah.toLocaleString('id-ID')}`
    }))
    await this.prisma.notifikasi.createMany({ data: notifData })

    for (const p of peserta) {
      emitToUser(parseInt(p.userId), 'notifikasi_baru', {
        judul: 'Ada Utang Baru',
        pesan: `${utangBaru.pembuat.name} mencatat utang "${judul}" sebesar Rp ${p.jumlah.toLocaleString('id-ID')}`
      })
    }

    return utangBaru
  }

  async requestTandaiLunas(utangId, pesertaUserId, buktiPath = null) {
    utangId = parseInt(utangId)
    pesertaUserId = parseInt(pesertaUserId)

    const peserta = await this.prisma.utangPeserta.findUnique({
      where: { utangId_userId: { utangId, userId: pesertaUserId } },
      include: { user: true, utang: { include: { pembuat: true } } }
    })

    if (!peserta) throw new Error('Kamu bukan peserta utang ini')
    if (peserta.sudahBayar)   throw new Error('Sudah dikonfirmasi lunas')
    if (peserta.requestLunas) throw new Error('Sudah mengirim permintaan, tunggu konfirmasi')

    await this.prisma.utangPeserta.update({
      where: { utangId_userId: { utangId, userId: pesertaUserId } },
      data: {
        requestLunas: true,
        buktiTransfer: buktiPath 
      }
    })

    await this.prisma.notifikasi.create({
      data: {
        userId: peserta.utang.pembuatId,
        utangId,
        judul: 'Permintaan Konfirmasi Lunas',
        pesan: `${peserta.user.name} mengklaim sudah membayar Rp ${peserta.jumlah.toLocaleString('id-ID')} untuk "${peserta.utang.judul}"`
      }
    })

    await this.prisma.histori.create({
      data: {
        utangId, userId: pesertaUserId,
        aksi: `${peserta.user.name} mengklaim sudah membayar Rp ${peserta.jumlah.toLocaleString('id-ID')}${buktiPath ? ' (dengan bukti transfer)' : ''}`
      }
    })

    emitToUser(peserta.utang.pembuatId, 'notifikasi_baru', {
      judul: 'Permintaan Konfirmasi Lunas',
      pesan: `${peserta.user.name} mengklaim sudah membayar untuk "${peserta.utang.judul}"`
    })

    return { message: 'Permintaan lunas terkirim ke pembuat' }
  }

  async konfirmasiLunas(utangId, pesertaUserId, userAksi) {
    utangId = parseInt(utangId)
    pesertaUserId = parseInt(pesertaUserId)

    const peserta = await this.prisma.utangPeserta.findUnique({
      where: { utangId_userId: { utangId, userId: pesertaUserId } },
      include: { user: true }
    })

    if (!peserta) throw new Error('Peserta tidak ditemukan')
    if (peserta.sudahBayar) throw new Error('Sudah dikonfirmasi lunas')

    await this.prisma.utangPeserta.update({
      where: { utangId_userId: { utangId, userId: pesertaUserId } },
      data: { sudahBayar: true, requestLunas: true, bayarAt: new Date() }
    })

    const semuaPeserta = await this.prisma.utangPeserta.findMany({ where: { utangId } })
    const semuaBayar    = semuaPeserta.every(p => p.sudahBayar)
    const adaBayar       = semuaPeserta.some(p => p.sudahBayar)

    let statusBaru = semuaBayar ? 'LUNAS' : adaBayar ? 'SEBAGIAN' : 'BELUM_LUNAS'

    const utang = await this.prisma.utang.update({
      where: { id: utangId }, data: { status: statusBaru }
    })

    await this.prisma.histori.create({
      data: {
        utangId, userId: userAksi.id,
        aksi: `${userAksi.name} mengkonfirmasi ${peserta.user.name} lunas Rp ${peserta.jumlah.toLocaleString('id-ID')}`
      }
    })

    await this.prisma.notifikasi.create({
      data: {
        userId: pesertaUserId, utangId,
        judul: 'Pembayaran Dikonfirmasi',
        pesan: `${userAksi.name} mengkonfirmasi pembayaranmu sudah diterima`
      }
    })

    emitToUser(pesertaUserId, 'notifikasi_baru', {
      judul: 'Pembayaran Dikonfirmasi',
      pesan: `${userAksi.name} mengkonfirmasi pembayaranmu sudah diterima`
    })

    if (semuaBayar) {
      await this.prisma.notifikasi.create({
        data: {
          userId: utang.pembuatId, utangId,
          judul: '✅ Semua Utang Lunas!',
          pesan: `Semua peserta sudah membayar "${utang.judul}"`
        }
      })

      emitToUser(utang.pembuatId, 'notifikasi_baru', {
        judul: '✅ Semua Utang Lunas!',
        pesan: `Semua peserta sudah membayar "${utang.judul}"`
      })
    }

    return { statusBaru }
  }

  async cekDeadlineMendekat(userId) {
    const sekarang     = new Date()
    const tigaHariLagi = new Date()
    tigaHariLagi.setDate(sekarang.getDate() + 3)

    const akanJatuhTempo = await this.prisma.utangPeserta.findMany({
      where: {
        userId,
        sudahBayar: false,
        reminderSent: false,
        utang: {
          status: { not: 'LUNAS' },
          deadline: { gte: sekarang, lte: tigaHariLagi }
        }
      },
      include: { utang: true }
    })

    for (const p of akanJatuhTempo) {
      const sisaMs   = p.utang.deadline.getTime() - sekarang.getTime()
      const sisaHari = Math.max(1, Math.ceil(sisaMs / (1000 * 60 * 60 * 24)))

      const judulNotif = '⏰ Pengingat Deadline'
      const pesanNotif = `Utang "${p.utang.judul}" akan jatuh tempo ${sisaHari} hari lagi!`

      await this.prisma.notifikasi.create({
        data: { userId, utangId: p.utangId, judul: judulNotif, pesan: pesanNotif }
      })

      await this.prisma.utangPeserta.update({
        where: { utangId_userId: { utangId: p.utangId, userId } },
        data: { reminderSent: true }
      })

      emitToUser(userId, 'notifikasi_baru', { judul: judulNotif, pesan: pesanNotif })
    }
  }

  async getDashboard(userId) {
    const hutangSebagaiPeserta = await this.prisma.utangPeserta.findMany({
      where: { userId, sudahBayar: false },
      include: { utang: { include: { pembuat: { select: { id: true, name: true } } } } }
    })

    const hutangSebagaiPembuat = await this.prisma.utang.findMany({
      where: { pembuatId: userId, tipe: 'HUTANG', status: { not: 'LUNAS' } },
      include: { peserta: { include: { user: { select: { id: true, name: true } } } } }
    })

    const piutangSaya = await this.prisma.utang.findMany({
      where: { pembuatId: userId, tipe: 'PIUTANG', status: { not: 'LUNAS' } },
      include: { peserta: { include: { user: { select: { id: true, name: true } } } } }
    })

    const totalHutang  = hutangSebagaiPeserta.reduce((sum, p) => sum + p.jumlah, 0)
    const totalPiutang = piutangSaya.reduce((sum, u) => sum + u.totalAmount, 0)

    return {
      totalHutang, totalPiutang,
      selisih: totalPiutang - totalHutang,
      hutang: hutangSebagaiPeserta,
      hutangDibuat: hutangSebagaiPembuat,
      piutang: piutangSaya
    }
  }

  async getRekapSemua(userId) {
    const sebagaiPembuat = await this.prisma.utang.findMany({
      where: { pembuatId: userId },
      include: {
        peserta: { include: { user: { select: { id: true, name: true } } } },
        histori: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const sebagaiPeserta = await this.prisma.utangPeserta.findMany({
      where: { userId, utang: { pembuatId: { not: userId } } },
      include: {
        utang: {
          include: {
            pembuat: { select: { id: true, name: true } },
            histori: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }
          }
        }
      }
    })

    return { sebagaiPembuat, sebagaiPeserta }
  }

  async getDetail(utangId) {
    const utang = await this.prisma.utang.findUnique({
      where: { id: parseInt(utangId) },
      include: {
        pembuat: { select: { id: true, name: true } },
        peserta: { include: { user: { select: { id: true, name: true } } } },
        histori: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }
      }
    })
    if (!utang) throw new Error('Utang tidak ditemukan')
    return utang
  }

  async cariPesertaByBukti(buktiPath) {
    return await this.prisma.utangPeserta.findFirst({
      where: { buktiTransfer: buktiPath },
      include: { utang: true }
    })
  }
}

module.exports = UtangModel
