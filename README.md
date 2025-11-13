# 🤖 WhatsApp-Telegram Bot v2.0.0

Bot terintegrasi antara WhatsApp dan Telegram dengan fitur lengkap:

- 🕒 Kirim pesan berjadwal (teks/foto/file)
- 📖 Renungan harian otomatis (Gemini AI)
- 🎂 Pengingat ulang tahun (Google Sheets)
- 🔐 Verifikasi admin (hanya admin yang bisa pakai)
- 🔄 Auto-reconnect (bot tetap jalan meski jaringan mati)
- 🛡️ Error handling lengkap (tidak crash)

**Status: Production Ready ✅ | RAM: ~300MB | 24/7 Uptime**

---

## 🆕 What's New in v2.0.0

### 🔐 Security Features

- ✅ **Admin Verification** - Hanya admin yang bisa menggunakan bot
- ✅ **Access Control** - Proteksi semua command & button
- ✅ **Security Logging** - Log aktivitas akses ditolak

### 🔄 Reliability Features

- ✅ **Auto-Reconnect** - WhatsApp reconnect otomatis saat terputus
- ✅ **Connection Check** - Scheduler tunggu sampai online
- ✅ **Error Handling** - Bot tidak crash untuk error apapun
- ✅ **Graceful Shutdown** - Stop dengan aman (Ctrl+C)

### 📖 Documentation

- ✅ 6 dokumentasi lengkap (Quick Start, Admin, Testing, Deploy, dll)
- ✅ Tool `getUserId.js` untuk setup admin
- ✅ Troubleshooting guide

---

## 📚 Dokumentasi Lengkap

- **[QUICKSTART.md](QUICKSTART.md)** - Setup cepat 5 menit ⚡
- **[SETUP_ADMIN.md](SETUP_ADMIN.md)** - Cara setup admin & User ID 🔐
- **[TESTING.md](TESTING.md)** - Testing guide lengkap 🧪
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy ke VPS production 🌐
- **[CHANGELOG.md](CHANGELOG.md)** - Update history v2.0.0 📝
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Overview lengkap proyek 📦

---

## 📋 Prasyarat

- Node.js v16 atau lebih baru
- Akun Telegram Bot (dari @BotFather)
- Google API Service Account
- Gemini API Key
- Telegram User ID untuk admin (lihat `SETUP_ADMIN.md`)

## 🚀 Instalasi

1. **Clone atau download project ini**

2. **Install dependencies:**

```bash
npm install
```

3. **Konfigurasi `.env`:**

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SERVICE_ACCOUNT=./credentials.json
SPREADSHEET_ID=your_google_sheet_id
TIMEZONE=Asia/Makassar
RENUNGAN_GROUP_ID=628123456789@c.us
RENUNGAN_TIME=08:00

# Admin Telegram User IDs (PENTING!)
ADMIN_TELEGRAM_IDS=123456789,987654321
```

**📖 Cara mendapatkan User ID:** Lihat file `SETUP_ADMIN.md`

4. **Siapkan Google Service Account:**

   - Buat service account di Google Cloud Console
   - Download file JSON credentials
   - Simpan sebagai `credentials.json` di root folder

5. **Format Google Sheets untuk ulang tahun:**
   | Nama | Tanggal (DD-MM) | Chat ID |
   |------|----------------|---------|
   | John | 15-03 | 6281234567890@c.us |
   | Mary | 20-06 | 6289876543210@c.us |

## 🎯 Cara Menjalankan

```bash
npm start
```

**Langkah pertama kali:**

1. Scan QR Code WhatsApp yang muncul di terminal
2. Buka Telegram, chat dengan bot Anda
3. Ketik `/start` untuk melihat menu utama

## 📱 Fitur Telegram Bot

### Menu Utama (Inline Buttons)

- 🕒 **Kirim Pesan Berjadwal**
  - Tambah jadwal baru
  - Lihat jadwal yang tersimpan
- 📖 **Renungan Harian**
  - Otomatis jam 08:00 pagi
  - Menggunakan Gemini AI untuk refleksi
- 🎂 **Ulang Tahun**
  - Otomatis jam 07:00 pagi
  - Data dari Google Sheets

### Format Jadwal Pesan

```
nomor@c.us|YYYY-MM-DD HH:mm|teks/foto/pdf|isi pesan
```

**Contoh:**

```
6281234567890@c.us|2025-11-15 10:30|teks|Selamat pagi! Jangan lupa meeting hari ini.
```

## 📂 Struktur Folder

```
whatsapp-telegram-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── botTelegram.js        # Telegram bot handler
│   ├── botWhatsApp.js        # WhatsApp client
│   ├── scheduler.js          # Scheduler pesan
│   ├── renunganHandler.js    # Renungan harian
│   ├── birthdayReminder.js   # Pengingat ulang tahun
│   ├── googleSheetService.js # Google Sheets API
│   ├── utils/
│   │   ├── logger.js
│   │   ├── dateHelper.js
│   │   └── fileHelper.js
│   ├── data/
│   │   ├── schedule.json
│   │   ├── verses.json
│   │   └── birthdays.json
│   └── templates/
│       ├── renunganTemplate.txt
│       └── ulangTahunTemplate.txt
├── package.json
├── .env
└── README.md
```

## ⚙️ Spesifikasi Teknis

- **RAM Usage:** ~300MB (aktif penuh)
- **Node Version:** v16+
- **Architecture:** CommonJS (tanpa transpiler)
- **Cron Jobs:**
  - Scheduler: setiap menit (`* * * * *`)
  - Renungan: jam 08:00 (`0 8 * * *`)
  - Ulang tahun: jam 07:00 (`0 7 * * *`)

## 🔧 Troubleshooting

### WhatsApp tidak connect:

```bash
# Hapus session lama
rm -rf .wwebjs_auth/
rm -rf .wwebjs_cache/
# Restart bot
npm start
```

### Telegram polling error:

- Pastikan hanya 1 instance bot yang running
- Check TELEGRAM_BOT_TOKEN di `.env`

### Google Sheets error:

- Pastikan service account punya akses ke spreadsheet
- Share spreadsheet ke email service account

## � Fitur Keamanan

### ✅ Verifikasi Admin

- **Hanya admin yang bisa menggunakan bot**
- User lain akan otomatis ditolak
- Support multiple admin
- Log aktivitas akses ditolak

### 🔄 Auto-Reconnect

- **Bot tetap jalan meskipun jaringan mati**
- Reconnect otomatis dengan exponential backoff
- Scheduler menunggu sampai koneksi tersedia
- Tidak ada data yang hilang

### 🛡️ Error Handling

- Unhandled rejection handler
- Uncaught exception handler
- Graceful shutdown (Ctrl+C)

## �📝 Lisensi

MIT License - Bebas digunakan dan dimodifikasi

## 💡 Tips

- Jalankan di VPS untuk 24/7 uptime
- Gunakan PM2 untuk auto-restart:
  ```bash
  npm install -g pm2
  pm2 start src/index.js --name whatsapp-bot
  pm2 save
  pm2 startup
  ```

## 🤝 Kontribusi

Silakan buka issue atau pull request untuk perbaikan dan fitur baru!

---

## 📚 Dokumentasi Lengkap

- **[QUICKSTART.md](QUICKSTART.md)** - Setup cepat 5 menit
- **[SETUP_ADMIN.md](SETUP_ADMIN.md)** - Cara setup admin & User ID
- **[TESTING.md](TESTING.md)** - Testing guide lengkap
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy ke VPS production
- **[CHANGELOG.md](CHANGELOG.md)** - Update history v2.0.0
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Overview lengkap proyek

## 🆕 What's New in v2.0.0

### 🔐 Security Features

- ✅ **Admin Verification** - Hanya admin yang bisa menggunakan bot
- ✅ **Access Control** - Proteksi semua command & button
- ✅ **Security Logging** - Log aktivitas akses ditolak

### 🔄 Reliability Features

- ✅ **Auto-Reconnect** - WhatsApp reconnect otomatis saat terputus
- ✅ **Connection Check** - Scheduler tunggu sampai online
- ✅ **Error Handling** - Bot tidak crash untuk error apapun
- ✅ **Graceful Shutdown** - Stop dengan aman (Ctrl+C)

### 📖 Documentation

- ✅ 6 dokumentasi lengkap (Quick Start, Admin, Testing, Deploy, dll)
- ✅ Tool `getUserId.js` untuk setup admin
- ✅ Troubleshooting guide

---

**Dibuat dengan ❤️ untuk melayani lebih baik**
