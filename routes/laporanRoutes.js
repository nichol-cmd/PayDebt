const express            = require('express')
const router              = express.Router()
const LaporanController  = require('../controllers/LaporanController')
const auth                = require('../middlewares/authMiddleware')
const apiAuth              = require('../middlewares/apiAuthMiddleware')
const admin                = require('../middlewares/adminMiddleware')

// Halaman - bisa diakses semua user yang login
router.get('/lapor', auth, LaporanController.showLapor)
router.post('/api/lapor', apiAuth, LaporanController.buatLaporan)

// Halaman & API - khusus admin
router.get('/admin/laporan', auth, admin, LaporanController.showLaporanAdmin)
router.patch('/api/admin/laporan/:id', apiAuth, admin, LaporanController.updateLaporan)

module.exports = router
