# Debt Tracker — MVC + EJS + JWT

Aplikasi utang piutang dengan autentikasi JWT Token.
Tugas Pemrograman Web — Semester 4

## Tech Stack
- Node.js + Express
- Prisma ORM + MySQL (XAMPP)
- EJS (Template Engine)
- JWT (jsonwebtoken) untuk Authentication
- bcryptjs untuk hash password
- cookie-parser untuk membaca token dari cookie

## Struktur MVC

```
debt-tracker/
├── index.js                  Entry point
├── config/
│   ├── database.js           Koneksi Prisma
│   └── jwt.js                generateToken & verifyToken
├── middlewares/
│   ├── authMiddleware.js      Authentication - untuk halaman (redirect)
│   ├── apiAuthMiddleware.js   Authentication - untuk API (401 JSON)
│   └── adminMiddleware.js     Authorization - cek role admin
├── models/                    (M) Model — akses database
│   ├── BaseModel.js           Parent class
│   ├── UserModel.js
│   ├── UtangModel.js
│   └── ChatModel.js
├── controllers/               (C) Controller — logika & render
│   ├── AuthController.js
│   ├── UtangController.js
│   ├── UserController.js
│   ├── NotifController.js
│   ├── ChatController.js
│   └── AdminController.js
├── routes/                    Penghubung URL -> Controller
├── views/                      (V) View — template EJS
│   ├── partials/navbar.ejs
│   ├── admin/dashboard.ejs
│   └── *.ejs
└── public/
    ├── css/style.css
    └── js/main.js
```

## Cara Kerja Autentikasi JWT

1. **Login** — password dicocokkan, kalau benar dibuat token JWT berisi `{ id, name, role }`
2. Token disimpan di **cookie httpOnly** (tidak bisa diakses lewat `document.cookie` di browser, lebih aman dari localStorage)
3. Setiap request ke halaman/API, browser otomatis mengirim cookie ini
4. **Middleware** membaca & verifikasi token, lalu menitipkan `req.userId`, `req.userName`, `req.userRole`
5. **Logout** menghapus cookie token

## Authorization

- Role disimpan di dalam payload token (`user` atau `admin`)
- `adminMiddleware` mengecek `req.userRole === 'admin'`
- Beberapa aksi (hapus utang, konfirmasi lunas) hanya bisa dilakukan pembuat atau admin

## Cara Menjalankan

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Buka `http://localhost:3000`

## Membuat Akun Admin

Daftar seperti biasa, lalu ubah kolom `role` di tabel `users` lewat phpMyAdmin dari `user` menjadi `admin`. Login ulang supaya token baru terbit dengan role admin.
