const express          = require('express')
const router            = express.Router()
const UtangController  = require('../controllers/UtangController')
const auth              = require('../middlewares/authMiddleware')
const apiAuth            = require('../middlewares/apiAuthMiddleware')
const upload             = require('../middlewares/uploadMiddleware')


router.get('/dashboard',  auth, UtangController.showDashboard)
router.get('/buat-utang', auth, UtangController.showBuatUtang)
router.get('/rekap',      auth, UtangController.showRekap)

router.get('/uploads/bukti/:filename', auth, UtangController.lihatBukti)

router.post('/api/utang',                            apiAuth, UtangController.buatUtang)
router.patch('/api/utang/:id/request-lunas',         apiAuth, upload.single('bukti'), UtangController.requestLunas)
router.patch('/api/utang/:id/konfirmasi/:pesertaId', apiAuth, UtangController.konfirmasiLunas)
router.delete('/api/utang/:id',                       apiAuth, UtangController.hapusUtang)

module.exports = router
