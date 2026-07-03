const BaseModel = require('./BaseModel')
const { emitToGroup } = require('../config/socket')

class ChatModel extends BaseModel {
  constructor() {
    super('group')
  }

  async buatGrup(creatorId, nama, deskripsi, anggotaIds = []) {
    const semuaAnggota = [...new Set([creatorId, ...anggotaIds.map(Number)])]
    return await this.prisma.group.create({
      data: {
        nama, deskripsi: deskripsi || null, creatorId,
        anggota: {
          create: semuaAnggota.map(uid => ({
            userId: uid,
            role: uid === creatorId ? 'admin' : 'member'
          }))
        }
      },
      include: { anggota: { include: { user: { select: { id: true, name: true } } } } }
    })
  }

  async getGrupSaya(userId) {
    const groups = await this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { anggota: true } },
            pesan: {
              orderBy: { createdAt: 'desc' }, take: 1,
              include: { sender: { select: { id: true, name: true } } }
            }
          }
        }
      }
    })

    return groups.map(g => {
      const pesanTerakhir = g.group.pesan[0]
      const adaPesanBaru = pesanTerakhir
        && pesanTerakhir.sender.id !== userId
        && new Date(pesanTerakhir.createdAt) > new Date(g.lastReadAt)
      return { ...g, adaPesanBaru }
    })
  }

  async kirimPesan(groupId, senderId, isi) {
    groupId = parseInt(groupId)
    const cek = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: senderId } }
    })
    if (!cek) throw new Error('Kamu bukan anggota grup ini')

    const pesanBaru = await this.prisma.pesan.create({
      data: { groupId, senderId, isi },
      include: { sender: { select: { id: true, name: true } } }
    })

    
    emitToGroup(groupId, 'chat_baru', { groupId, pesan: pesanBaru })

    return pesanBaru
  }

  async getPesan(groupId, userId) {
    groupId = parseInt(groupId)
    const cek = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    })
    if (!cek) throw new Error('Kamu bukan anggota grup ini')

    await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { lastReadAt: new Date() }
    })

    return await this.prisma.pesan.findMany({
      where: { groupId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' }
    })
  }

  async tambahAnggota(groupId, adminId, userId) {
    groupId = parseInt(groupId)
    const cek = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: adminId } }
    })
    if (!cek || cek.role !== 'admin') throw new Error('Hanya admin grup yang bisa tambah anggota')

    return await this.prisma.groupMember.create({
      data: { groupId, userId: parseInt(userId) }
    })
  }

  async keluarGrup(groupId, userId) {
    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId: parseInt(groupId), userId } }
    })
    return { message: 'Berhasil keluar dari grup' }
  }
}

module.exports = ChatModel
