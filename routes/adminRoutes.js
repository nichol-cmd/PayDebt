const express          = require('express')
const router            = express.Router()
const AdminController  = require('../controllers/AdminController')
const auth              = require('../middlewares/authMiddleware')
const apiAuth            = require('../middlewares/apiAuthMiddleware')
const admin              = require('../middlewares/adminMiddleware')

router.get('/admin', auth, admin, AdminController.showDashboard)

router.patch('/api/admin/user/:id/role',           apiAuth, admin, AdminController.gantiRole)
router.delete('/api/admin/user/:id',                apiAuth, admin, AdminController.hapusUser)
router.patch('/api/admin/user/:id/reset-password', apiAuth, admin, AdminController.resetPassword)
router.post('/api/admin/broadcast',                 apiAuth, admin, AdminController.kirimBroadcast)

module.exports = router
