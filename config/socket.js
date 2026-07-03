const cookie  = require('cookie')
const { verifyToken } = require('./jwt')
const prisma  = require('./database')

let io = null 

function setupSocket(ioInstance) {
  io = ioInstance

  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie || ''
      const parsed    = cookie.parse(rawCookie)
      const token      = parsed.token

      if (!token) return next(new Error('Tidak ada token'))

      const decoded = verifyToken(token)
      socket.userId   = decoded.id
      socket.userName = decoded.name

      next()
    } catch (err) {
      next(new Error('Token tidak valid atau sudah expired'))
    }
  })

  io.on('connection', async (socket) => {
    socket.join(`user_${socket.userId}`)
    socket.join('semua_user')

    try {
      const groups = await prisma.groupMember.findMany({
        where: { userId: socket.userId },
        select: { groupId: true }
      })
      groups.forEach(g => socket.join(`group_${g.groupId}`))
    } catch (err) {
      console.log('Gagal join room grup:', err.message)
    }

    socket.on('disconnect', () => {
    })
  })
}

function emitToUser(userId, event, data) {
  if (io) io.to(`user_${userId}`).emit(event, data)
}


function emitToGroup(groupId, event, data) {
  if (io) io.to(`group_${groupId}`).emit(event, data)
}


function emitToSemua(event, data) {
  if (io) io.to('semua_user').emit(event, data)
}

module.exports = { setupSocket, emitToUser, emitToGroup, emitToSemua }
