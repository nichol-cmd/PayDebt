const express         = require('express')
const router           = express.Router()
const UserController  = require('../controllers/UserController')
const auth             = require('../middlewares/authMiddleware')
const apiAuth           = require('../middlewares/apiAuthMiddleware')

router.get('/profil', auth, UserController.showProfil)

router.get('/api/user/search',          apiAuth, UserController.cariUser)
router.put('/api/user/profil',          apiAuth, UserController.updateProfil)
router.post('/api/user/follow/:id',     apiAuth, UserController.follow)
router.delete('/api/user/unfollow/:id', apiAuth, UserController.unfollow)
router.get('/api/user/followers/:id',   apiAuth, UserController.getFollowers)
router.get('/api/user/following/:id',   apiAuth, UserController.getFollowing)

module.exports = router
