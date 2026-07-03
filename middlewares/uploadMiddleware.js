const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/bukti'))
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname)
    const nama = `bukti_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, nama)
  }
})

function filterGambar(req, file, cb) {
  const tipeDiizinkan = ['image/jpeg', 'image/jpg', 'image/png']
  const extDiizinkan  = ['.jpg', '.jpeg', '.png']
  const ext = path.extname(file.originalname).toLowerCase()

  if (tipeDiizinkan.includes(file.mimetype) && extDiizinkan.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Hanya file JPG atau PNG yang diperbolehkan'))
  }
}

const upload = multer({
  storage,
  fileFilter: filterGambar,
  limits: { fileSize: 3 * 1024 * 1024 } 
})

function validasiMagicBytes(filePath) {
  const buffer = Buffer.alloc(8)
  const fd = fs.openSync(filePath, 'r')
  fs.readSync(fd, buffer, 0, 8, 0)
  fs.closeSync(fd)

  const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
              && buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A

  return isJpg || isPng
}

module.exports = upload
module.exports.validasiMagicBytes = validasiMagicBytes
