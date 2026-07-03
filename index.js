
require('dotenv').config()

const express      = require('express')
const cookieParser = require('cookie-parser')
const path         = require('path')
const http         = require('http')
const { Server }   = require('socket.io')

const { setupSocket } = require('./config/socket')
const helmetConfig    = require('./config/security')

const app  = express()
const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(helmetConfig)                    
app.use(express.json())                
app.use(express.urlencoded({ extended: true })) 
app.use(cookieParser())                  
app.use(express.static(path.join(__dirname, 'public'))) 


// =============================================
app.use('/', require('./routes/authRoutes'))
app.use('/', require('./routes/utangRoutes'))
app.use('/', require('./routes/userRoutes'))
app.use('/', require('./routes/notifRoutes'))
app.use('/', require('./routes/chatRoutes'))
app.use('/', require('./routes/adminRoutes'))
app.use('/', require('./routes/kontakRoutes'))
app.use('/', require('./routes/laporanRoutes'))
app.use('/', require('./routes/docsRoutes'))


app.get('/', (req, res) => {
  if (req.cookies.token) return res.redirect('/dashboard')
  res.redirect('/login')
})


const server = http.createServer(app)
const io     = new Server(server)

setupSocket(io) 

server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`)
})
