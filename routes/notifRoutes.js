const express          = require('express')
const router            = express.Router()
const NotifController  = require('../controllers/NotifController')
const auth              = require('../middlewares/authMiddleware')
const apiAuth            = require('../middlewares/apiAuthMiddleware')

router.get('/notif', auth, NotifController.showNotif)

router.get('/api/notif/jumlah-belum-baca', apiAuth, NotifController.jumlahBelumBaca)
router.patch('/api/notif/baca-semua',      apiAuth, NotifController.bacaSemua)
router.patch('/api/notif/:id/baca',        apiAuth, NotifController.bacaSatu)

module.exports = router
