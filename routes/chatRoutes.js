const express         = require('express')
const router           = express.Router()
const ChatController  = require('../controllers/ChatController')
const auth             = require('../middlewares/authMiddleware')
const apiAuth           = require('../middlewares/apiAuthMiddleware')

router.get('/chat', auth, ChatController.showChat)

router.get('/api/chat',               apiAuth, ChatController.getGrup)
router.post('/api/chat',              apiAuth, ChatController.buatGrup)
router.get('/api/chat/:id/pesan',     apiAuth, ChatController.getPesan)
router.post('/api/chat/:id/pesan',    apiAuth, ChatController.kirimPesan)
router.delete('/api/chat/:id/keluar', apiAuth, ChatController.keluarGrup)

module.exports = router
