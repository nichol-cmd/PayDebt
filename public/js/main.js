function tampilPesan(elId, tipe, teks) {
  const el = document.getElementById(elId)
  if (!el) return
  el.className = `alert alert-${tipe}`
  el.textContent = teks
  el.classList.remove('d-none')
}

function formatRupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID')
}

async function cekNotifBelumBaca() {
  try {
    const res  = await fetch('/api/notif/jumlah-belum-baca')
    const data = await res.json()
    const dot  = document.getElementById('notifDot')
    if (dot) dot.style.display = data.jumlah > 0 ? 'inline-block' : 'none'
  } catch (e) {}
}

async function cekChatBaru() {
  try {
    const res  = await fetch('/api/chat')
    const data = await res.json()
    const dot  = document.getElementById('chatDot')
    if (dot) {
      const adaBaru = data.data.some(g => g.adaPesanBaru)
      dot.style.display = adaBaru ? 'inline-block' : 'none'
    }
  } catch (e) {}
}

let socket = null

function mulaiSocket() {
  if (typeof io === 'undefined') return

  socket = io()

  socket.on('notifikasi_baru', (data) => {
    cekNotifBelumBaca()
    tampilToast(data.judul, data.pesan)
  })

  socket.on('chat_baru', (data) => {
    cekChatBaru()
    if (typeof window.onPesanBaruRealtime === 'function') {
      window.onPesanBaruRealtime(data)
    }
  })
}

function tampilToast(judul, pesan, tipe = 'info') {
  let wrap = document.getElementById('toastWrap')
  if (!wrap) {
    wrap = document.createElement('div')
    wrap.id = 'toastWrap'
    wrap.className = 'toast-wrap'
    document.body.appendChild(wrap)
  }

  const el = document.createElement('div')
  el.className = `toast-notif toast-${tipe}`
  el.innerHTML = `<strong>${judul}</strong><div class="small">${pesan}</div>`
  wrap.appendChild(el)

  setTimeout(() => el.classList.add('show'), 10)
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 300)
  }, 4500)
}

function tampilNotifApi(ok, pesan, judulSukses = 'Berhasil', judulGagal = 'Gagal') {
  tampilToast(ok ? judulSukses : judulGagal, pesan, ok ? 'success' : 'danger')
}

function mulaiPolling() {
  cekNotifBelumBaca()
  cekChatBaru()
  mulaiSocket()
  setInterval(() => {
    cekNotifBelumBaca()
    cekChatBaru()
  }, 45000)
}

function toggleTheme() {
  const html    = document.documentElement
  const current = html.getAttribute('data-theme') || 'light'
  const next    = current === 'dark' ? 'light' : 'dark'

  html.setAttribute('data-theme', next)
  localStorage.setItem('theme', next)
  updateThemeIcon(next)
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon')
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙'
}

document.addEventListener('DOMContentLoaded', () => {
  const tema = document.documentElement.getAttribute('data-theme') || 'light'
  updateThemeIcon(tema)
})
