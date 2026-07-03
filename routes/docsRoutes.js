const express = require('express')
const router  = express.Router()

router.get('/docs', (req, res) => {
  res.render('docs', { title: 'Dokumentasi API - PayDebt' })
})

module.exports = router
