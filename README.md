# 🤖 WhatsApp Bot Renungan Harian v3.1

Bot WhatsApp dengan sistem renungan harian menggunakan AI (Gemini 2.5 Flash-Lite), manajemen ayat random dengan history persist, dan retry mechanism otomatis.

## ✨ Fitur Utama

- 📖 **Renungan Harian dengan AI** - Generate renungan lengkap dari referensi ayat menggunakan Gemini AI
- 🎲 **Random Verse dengan History** - Ayat dipilih random, tidak akan berulang sampai semua terpakai
- 💾 **History Persist** - Riwayat ayat tersimpan meskipun bot restart
- 🔄 **Auto-Retry 10 Menit** - Gagal kirim? Otomatis retry setelah 10 menit
- 🎂 **Pengingat Ulang Tahun** - Integrasi Google Sheets untuk ulang tahun otomatis
- 🕒 **Scheduler Otomatis** - Kirim renungan & ucapan ulang tahun sesuai jadwal
- 🎯 **Kategori Ayat** - 11 kategori (Kasih ❤️, Iman ✝️, Harapan ✨, dll)
- 🎉 **Ayat Hari Besar** - Ayat khusus untuk Natal, Paskah, Pentakosta, dll
- 🎛️ **Telegram Control Panel** - Kontrol bot via Telegram (preview, kirim manual, reset ayat)
- 🔐 **Error ke Telegram Only** - Error AI tidak tampil di WhatsApp, hanya notif ke admin Telegram
- 🔄 **Auto-Reconnect** - Reconnect otomatis jika WhatsApp terputus

## 🎲 Sistem Random Verse dengan History

Bot menggunakan sistem **random selection** dengan **history tracking**:

### Cara Kerja:

1. **Random Selection** - Setiap hari, bot pilih ayat secara random dari pool yang belum terpakai
2. **Mark as Used** - Ayat yang sudah dipilih ditandai `used: true` dan disimpan ke file
3. **Persist History** - Meskipun bot restart, ayat yang sudah terpakai tidak akan dipilih lagi
4. **Auto Reset** - Jika semua ayat sudah terpakai (365 ayat habis), otomatis reset ke awal
5. **Manual Reset** - Bisa reset manual via Telegram: "🔄 Reset Status Ayat"

### Struktur File:

```json
{
  "verses": [
    {
      "id": 1,
      "verse": "Yohanes 3:16",
      "category": "kasih",
      "used": false // ← Jadi true saat terpakai
    }
  ]
}
```

### Keuntungan:

- ✅ Tidak ada pengulangan ayat sampai semua terpakai
- ✅ History tersimpan meskipun bot restart/crash
- ✅ Random setiap hari (tidak predictable)
- ✅ Bisa reset manual kapan saja
- ✅ 365+ ayat dalam database per tahun

## 🔄 Auto-Retry Mechanism

Jika gagal kirim renungan (jaringan mati, WA disconnect):

- ⏱️ **Retry otomatis** setelah **10 menit**
- 🔁 **Hanya retry 1 kali** (tidak loop forever)
- 📲 **Notifikasi ke admin** via Telegram
- ✅ **Sukses = selesai** untuk hari itu

**Contoh:**

```
08:00 - Gagal kirim (jaringan mati) ❌
      → Dijadwalkan retry jam 08:10
08:10 - Retry berhasil ✅
      → Selesai untuk hari ini
```

## 🔐 Error Handling

- ❌ **AI Error** → Hanya tampil di Telegram admin (tidak di WhatsApp grup)
- 📱 **Format notifikasi:**

```
🚨 Error Alert

❌ AI Error saat generate renungan
Ayat: Yohanes 3:16
Hari: Normal

⏰ 14/01/2026 10:47:31
```

## 📊 Generate Verses Tahunan

```bash
# Generate untuk satu tahun
node tools/generateYearlyVerses.js 2026

# Generate untuk beberapa tahun sekaligus
node tools/generateYearlyVerses.js 2026 2027 2028 2029 2030
```

File akan dibuat di `src/data/verses_YYYY.json`

## 📋 Prasyarat

- Node.js v16 atau lebih baru
- Akun Telegram Bot (dari @BotFather)
- **Gemini API Key** (gratis dari https://aistudio.google.com/apikey)
- Google Service Account (opsional - untuk ulang tahun)

## 🚀 Quick Start

1. **Clone repository:**

```bash
git clone https://github.com/jhopan/JhopanWaBotRenungan.git
cd JhopanWaBotRenungan
```

2. **Install dependencies:**

```bash
npm install
```

3. **Setup environment:**

Copy `.env.example` ke `.env` dan isi:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Telegram Bot (wajib)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# AI Configuration - Gemini 2.5 Flash-Lite
# Limit: 15 req/min, 1000 req/day, 250k token/min
AI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-2.5-flash-lite

# WhatsApp Configuration
RENUNGAN_GROUP_ID=120363123456789@g.us
RENUNGAN_TIME=08:00

# Timezone
TIMEZONE=Asia/Makassar

# Google Sheets (opsional - untuk ulang tahun)
GOOGLE_SERVICE_ACCOUNT=./credentials.json
BIRTHDAY_SPREADSHEET_ID=your_spreadsheet_id
BIRTHDAY_SHEET_NAME=Sheet1
BIRTHDAY_RANGE=A:C
BIRTHDAY_GROUP_ID=120363123456789@g.us
BIRTHDAY_TIME=07:00

# Admin Configuration
ADMIN_TELEGRAM_IDS=your_telegram_user_id
```

**Cara dapat Gemini API Key:**

1. Buka https://aistudio.google.com/apikey
2. Login dengan Google
3. Klik "Create API Key"
4. Copy dan paste ke `.env`

5. **Generate verses untuk tahun ini:**

```bash
node tools/generateYearlyVerses.js 2026
```

5. **Jalankan bot:**

```bash
npm start
```

6. **Scan QR Code WhatsApp** yang muncul di terminal

## 🎯 Penggunaan via Telegram

Bot dikontrol sepenuhnya via Telegram. Kirim `/start` untuk melihat menu:

### Menu Utama:

- 📖 **Renungan**
  - 👁️ Preview renungan hari ini
  - 📤 Kirim renungan manual (tidak tunggu jadwal)
  - 📊 Statistik ayat (berapa ayat tersisa)
  - 🔄 **Reset status ayat** (mulai dari awal lagi)
  - ⏰ Ubah jadwal renungan
- 🎂 **Ulang Tahun**

  - Kirim ucapan manual
  - Lihat data dari Google Sheets
  - Ubah jadwal cek ulang tahun

- 📊 **Status Sistem**
  - Cek koneksi WhatsApp
  - Cek koneksi AI
  - Lihat konfigurasi bot

### Fitur Reset Ayat:

Gunakan menu **"🔄 Reset Status Ayat"** untuk:

- Reset semua ayat ke `used: false`
- Mulai seleksi random dari awal
- Berguna jika ingin mengulang dari awal sebelum 365 ayat habis

### Kategori Ayat

Bot memiliki 11 kategori ayat untuk variasi renungan:

- ❤️ **Kasih** - Ayat tentang kasih Allah dan sesama
- ✝️ **Iman** - Ayat tentang iman dan percaya
- ✨ **Harapan** - Ayat tentang pengharapan
- 💪 **Kekuatan** - Ayat tentang kekuatan dalam Tuhan
- 🤗 **Penghiburan** - Ayat penghiburan
- 🙏 **Doa** - Ayat tentang doa
- ⚖️ **Hikmat** - Ayat tentang kebijaksanaan
- 🕊️ **Damai** - Ayat tentang damai sejahtera
- 🔥 **Pertobatan** - Ayat tentang pertobatan
- 🌱 **Pertumbuhan Rohani** - Ayat tentang kedewasaan iman
- 📖 **Umum** - Ayat-ayat umum

## 📂 Struktur Project

```
whatsapp-telegram-bot/
├── src/
│   ├── index.js              # Entry point utama
│   ├── botTelegram.js        # Telegram control panel
│   ├── botWhatsApp.js        # WhatsApp client
│   ├── renunganHandler.js    # Handler renungan harian
│   ├── birthdayReminder.js   # Handler ulang tahun
│   ├── googleSheetService.js # Google Sheets integration
│   ├── services/
│   │   └── aiService.js      # AI provider (Gemini/OpenRouter)
│   ├── utils/
│   │   ├── logger.js         # Logging utility
│   │   └── fileHelper.js     # File operations
│   ├── data/
│   │   ├── verses_2026.json  # Verses untuk 2026
│   │   ├── verses_2027.json  # Verses untuk 2027
│   │   └── birthdays.json    # Cache data ulang tahun
│   └── templates/
│       └── renunganTemplate.txt
├── tools/
│   ├── generateYearlyVerses.js  # Generate verses tahunan
│   └── getUserId.js             # Tool get Telegram user ID
├── .env
├── credentials.json
├── package.json
└── README.md
```

## 🔧 Maintenance & Tips

### Generate Verses untuk Tahun Baru

Setiap awal tahun, generate verses baru:

```bash
node tools/generateYearlyVerses.js 2027
```

### Reset Status Ayat (Manual)

Via Telegram Bot:

```
Menu → Renungan → Reset Status Ayat
```

Atau langsung edit file `src/data/verses_2026.json`:

```json
{
  "verses": [
    {
      "used": true // ← Ubah semua jadi false
    }
  ]
}
```

### Update Database Ayat

Edit file `tools/generateYearlyVerses.js` di bagian `allVerses` object untuk menambah ayat baru:

```javascript
const allVerses = {
  kasih: [
    "Yohanes 3:16",
    "1 Korintus 13:4-7",
    // ... tambahkan ayat baru di sini
  ],
  // ... kategori lainnya
};
```

Lalu generate ulang:

```bash
node tools/generateYearlyVerses.js 2026
```

### Monitoring via Telegram

Semua error dan notifikasi penting dikirim ke admin via Telegram:

- ❌ Error AI saat generate renungan
- 🔄 Status retry (gagal kirim, akan retry)
- ⚠️ Warning koneksi terputus

**Tidak ada error yang tampil di grup WhatsApp!**

### Backup Data

File penting untuk di-backup:

- `.env` - Konfigurasi dan API keys
- `credentials.json` - Google service account
- `src/data/verses_2026.json` - History ayat terpakai
- `src/data/birthdays.json` - Data ulang tahun

## 🔐 Security

- File `.env` dan `credentials.json` **TIDAK** di-commit ke Git
- Gunakan `.gitignore` untuk exclude file sensitif
- WhatsApp session otomatis di-cache di `.wwebjs_auth/`

## 📊 Spesifikasi Teknis

- **RAM Usage:** ~200-300MB
- **Node Version:** v16+
- **Dependencies:** whatsapp-web.js, node-telegram-bot-api, @google-ai/generativelanguage
- **Cron Jobs:**
  - Renungan: 08:00 setiap hari
  - Ulang tahun: 07:00 setiap hari

## 🔧 Troubleshooting

### WhatsApp tidak connect:

```bash
# Hapus session lama
rm -rf .wwebjs_auth/
rm -rf .wwebjs_cache/
# Restart bot
npm start
```

### File verses tidak ditemukan:

```bash
# Generate verses untuk tahun ini
node tools/generateYearlyVerses.js 2026
```

### Renungan tidak terkirim otomatis:

**Kemungkinan penyebab:**

1. **Jaringan mati** → Bot akan retry 10 menit kemudian
2. **WhatsApp disconnect** → Cek koneksi via Telegram menu Status
3. **Group ID salah** → Cek `RENUNGAN_GROUP_ID` di `.env`
4. **Timezone salah** → Pastikan `TIMEZONE=Asia/Makassar` sesuai

**Solusi:**

- Kirim manual via Telegram jika urgent
- Cek log di terminal untuk detail error
- Notifikasi error akan dikirim ke admin Telegram

### AI error / API limit:

- **Cek API key** di `.env` (pastikan valid)
- **Cek quota** Gemini di https://aistudio.google.com
- **Error tidak tampil di WA** → hanya notif di Telegram admin
- Gemini free tier: 15 request/menit (lebih dari cukup)

### Ayat terus berulang:

**Penyebab:** File verses tidak menyimpan status `used`

**Solusi:**

```bash
# Cek file permission
ls -la src/data/verses_2026.json

# Pastikan bot bisa write ke file
chmod 644 src/data/verses_2026.json
```

### Google Sheets error:

- Share spreadsheet ke email service account
- Format kolom: Nama | Tanggal (DD-MM) | Chat ID

## 💡 Tips Production

**Jalankan 24/7 dengan PM2:**

```bash
npm install -g pm2
pm2 start src/index.js --name wa-renungan
pm2 save
pm2 startup
```

**Monitor logs:**

```bash
pm2 logs wa-renungan
pm2 monit
```

**Auto-restart on error:**

```bash
pm2 restart wa-renungan
```

## 📱 Fitur Unggulan v3.1

### 1. Random Selection dengan Memory

Tidak seperti bot lain yang mengulang ayat, bot ini:

- ✅ Mengingat ayat yang sudah terpakai
- ✅ Tidak pernah mengirim ayat yang sama sampai semua habis
- ✅ History tersimpan meskipun bot restart/crash

### 2. Auto-Retry Cerdas

Jika gagal kirim karena jaringan:

- ✅ Tidak langsung give up
- ✅ Retry otomatis setelah 10 menit
- ✅ Admin dapat notifikasi via Telegram
- ✅ Tidak spam retry berkali-kali

### 3. Error Handling Profesional

- ✅ Error AI tidak tampil di grup WA (tidak memalukan)
- ✅ Admin dapat notifikasi detail via Telegram
- ✅ User grup hanya terima renungan yang sukses

### 4. Maintenance Friendly

- ✅ Reset ayat kapan saja via Telegram
- ✅ Generate verses tahun baru dengan 1 command
- ✅ Monitoring lengkap dari Telegram

## 🎁 Bonus Features

- 🎂 **Birthday Reminder** - Ucapan otomatis dari Google Sheets
- 🎉 **Special Days** - Ayat khusus untuk hari besar (Natal, Paskah, dll)
- 📊 **Statistics** - Tracking berapa ayat tersisa
- ⚙️ **Dynamic Config** - Ubah jadwal tanpa restart bot
- 🔐 **Secure** - API keys tidak di-commit ke Git

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit changes (`git commit -am 'Tambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## 📝 Lisensi

MIT License - Bebas digunakan dan dimodifikasi untuk keperluan pribadi maupun komersial.

---

**Dibuat dengan ❤️ untuk pelayanan renungan harian**
