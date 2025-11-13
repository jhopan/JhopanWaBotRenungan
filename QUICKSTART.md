# 🚀 Quick Start Guide

Panduan cepat untuk menjalankan bot dalam 5 menit!

## ⚡ Langkah Cepat (5 Menit)

### 1️⃣ Install Dependencies (1 menit)

```bash
cd whatsapp-telegram-bot
npm install
```

### 2️⃣ Setup Telegram Bot Token (1 menit)

1. Buka Telegram, cari **@BotFather**
2. Ketik `/newbot`
3. Beri nama bot: `My WA Bot`
4. Beri username: `my_wa_bot` (harus unik)
5. Copy token yang diberikan: `123456:ABCdef...`

### 3️⃣ Dapatkan User ID Anda (1 menit)

**Cara Tercepat:**

```bash
npm run getid
```

Lalu:

1. Chat dengan bot Anda di Telegram
2. Ketik `/myid`
3. Copy User ID (contoh: `123456789`)

### 4️⃣ Konfigurasi .env (1 menit)

Edit file `.env`:

```env
# WAJIB diisi untuk testing awal
TELEGRAM_BOT_TOKEN=123456:ABCdefGHIjkl...
ADMIN_TELEGRAM_IDS=123456789

# Bisa diisi nanti
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SERVICE_ACCOUNT=./credentials.json
SPREADSHEET_ID=your_google_sheet_id

# Default settings
TIMEZONE=Asia/Makassar
RENUNGAN_GROUP_ID=628123456789@c.us
RENUNGAN_TIME=08:00
```

### 5️⃣ Jalankan Bot! (1 menit)

```bash
npm start
```

**Output yang diharapkan:**

```
🚀 Memulai Sistem WhatsApp–Telegram Bot...
📅 Tanggal: ...
⏰ Timezone: Asia/Makassar

📱 Scan QR Code berikut:
[QR Code muncul di terminal]
```

Scan QR Code dengan WhatsApp → **BOT SIAP!** ✅

---

## 🎯 Test Cepat

### Test 1: Telegram Bot

1. Buka Telegram
2. Chat dengan bot Anda
3. Ketik `/start`
4. ✅ Muncul menu dengan 3 tombol

### Test 2: WhatsApp

1. Kirim pesan ke nomor WhatsApp yang login
2. ✅ WhatsApp dapat menerima & membalas

---

## 📚 Setup Lengkap (Opsional)

Jika ingin fitur lengkap (renungan & birthday):

### A. Setup Gemini API (Untuk Renungan)

1. Buka: https://makersuite.google.com/app/apikey
2. Login dengan Google
3. Klik **Create API Key**
4. Copy API Key
5. Paste ke `.env`:
   ```env
   GEMINI_API_KEY=AIzaSyABC123...
   ```

### B. Setup Google Sheets (Untuk Birthday)

1. Buka Google Cloud Console
2. Create Service Account
3. Download JSON credentials
4. Simpan sebagai `credentials.json` di folder root
5. Buat Google Sheet dengan format:
   ```
   | Nama  | Tanggal | Chat ID              |
   |-------|---------|----------------------|
   | John  | 15-03   | 6281234567890@c.us  |
   ```
6. Share sheet ke email service account
7. Copy Spreadsheet ID dari URL
8. Paste ke `.env`:
   ```env
   SPREADSHEET_ID=1ABC123xyz...
   ```

---

## ⚙️ Konfigurasi Lanjutan

### Ubah Timezone

Edit `.env`:

```env
TIMEZONE=Asia/Jakarta     # WIB
TIMEZONE=Asia/Makassar    # WITA
TIMEZONE=Asia/Jayapura    # WIT
```

### Ubah Jadwal Renungan

Edit `.env`:

```env
RENUNGAN_TIME=06:00  # Jam 6 pagi
RENUNGAN_TIME=20:00  # Jam 8 malam
```

### Tambah Admin

Edit `.env`:

```env
# Multiple admin (pisahkan dengan koma, tanpa spasi)
ADMIN_TELEGRAM_IDS=123456789,987654321,111222333
```

---

## 🐛 Troubleshooting Cepat

### ❌ Bot tidak merespons di Telegram

**Solusi:**

- Cek TELEGRAM_BOT_TOKEN sudah benar?
- Cek bot sudah di-start dengan `/start`?
- Restart bot: Ctrl+C lalu `npm start`

### ❌ QR Code tidak muncul

**Solusi:**

- Pastikan dependencies sudah install: `npm install`
- Cek terminal support QR code (gunakan CMD/PowerShell)

### ❌ "Akses Ditolak" di Telegram

**Solusi:**

- Cek ADMIN_TELEGRAM_IDS di `.env`
- Pastikan User ID benar (tanpa spasi)
- Restart bot

### ❌ WhatsApp terputus terus

**Solusi:**

- Normal jika jaringan tidak stabil
- Bot akan auto-reconnect
- Cek log: `🔄 Reconnect attempt #N`

### ❌ Renungan tidak terkirim

**Solusi:**

- Cek GEMINI_API_KEY sudah diisi?
- Cek RENUNGAN_GROUP_ID benar?
- Cek format: `628123456789@c.us` (untuk grup: `628123456789@g.us`)

---

## 📖 Next Steps

Setelah bot jalan:

1. **Baca dokumentasi lengkap:**

   - `README.md` - Overview lengkap
   - `SETUP_ADMIN.md` - Setup admin
   - `TESTING.md` - Testing guide
   - `CHANGELOG.md` - Update history

2. **Test fitur-fitur:**

   - Kirim pesan berjadwal
   - Lihat renungan harian
   - Test birthday reminder

3. **Deploy 24/7:**
   - Gunakan VPS
   - Install PM2: `npm install -g pm2`
   - Run: `pm2 start src/index.js --name whatsapp-bot`
   - Auto-start: `pm2 startup && pm2 save`

---

## 🎉 Selamat!

Bot Anda sudah siap digunakan!

**Support:**

- 📖 Baca dokumentasi lengkap
- 🧪 Jalankan test di `TESTING.md`
- 🐛 Laporkan bug jika ada

---

**Happy Botting! 🤖💬**

Generated: 2025-11-11  
Version: 2.0.0
