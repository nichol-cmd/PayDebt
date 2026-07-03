const express           = require('express')
const router             = express.Router()
const KontakController  = require('../controllers/KontakController')
const auth               = require('../middlewares/authMiddleware')
const apiAuth             = require('../middlewares/apiAuthMiddleware')

// Halaman
router.get('/kontak', auth, KontakController.showKontak)

// REST API
router.get('/api/kontak',        apiAuth, KontakController.getKontak)
router.post('/api/kontak/:id',   apiAuth, KontakController.tambahKontak)
router.put('/api/kontak/:id',    apiAuth, KontakController.updateAlias)
router.delete('/api/kontak/:id', apiAuth, KontakController.hapusKontak)

module.exports = router
