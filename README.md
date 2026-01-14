# 🤖 WhatsApp Bot Renungan Harian v3.0

Bot WhatsApp dengan sistem renungan harian menggunakan AI dan manajemen ayat per tahun.

## ✨ Fitur Utama

- 📖 **Renungan Harian dengan AI** - Generate renungan lengkap dari referensi ayat menggunakan Gemini/OpenRouter AI
- 📅 **Sistem Verse Tahunan** - 365 ayat unik per tahun, tidak ada pengulangan dalam setahun
- 🎂 **Pengingat Ulang Tahun** - Integrasi Google Sheets untuk ulang tahun otomatis
- 🕒 **Scheduler Otomatis** - Kirim renungan & ucapan ulang tahun sesuai jadwal
- 🎯 **Kategori Ayat** - 11 kategori (Kasih ❤️, Iman ✝️, Harapan ✨, dll)
- 🎉 **Ayat Hari Besar** - Ayat khusus untuk Natal, Paskah, Pentakosta, dll
- 🎛️ **Telegram Control Panel** - Kontrol bot via Telegram (preview, kirim manual, statistik)
- 🔄 **Auto-Reconnect** - Reconnect otomatis jika WhatsApp terputus

## 📊 Sistem Verse Tahunan

Bot menggunakan sistem file verse per tahun (`verses_YYYY.json`) yang berisi 365 ayat unik:

```
src/data/
  ├── verses_2026.json  (365 ayat untuk 2026)
  ├── verses_2027.json  (365 ayat untuk 2027)
  ├── verses_2028.json  (365 ayat untuk 2028)
  └── ...
```

**Keuntungan:**
- ✅ Setiap hari dalam satu tahun mendapat ayat yang berbeda
- ✅ Tidak ada ayat yang berulang sepanjang tahun
- ✅ Setiap tahun memiliki urutan ayat yang berbeda (seeded random)
- ✅ Total 400+ ayat dalam database, dipilih 365 per tahun

### Generate Verses Untuk Tahun Baru

```bash
# Generate untuk satu tahun
node tools/generateYearlyVerses.js 2026

# Generate untuk beberapa tahun sekaligus
node tools/generateYearlyVerses.js 2026 2027 2028 2029 2030
```

## 📋 Prasyarat

- Node.js v16 atau lebih baru
- Akun Telegram Bot (dari @BotFather)
- Google API Service Account (untuk ulang tahun)
- Gemini/OpenRouter API Key (untuk AI renungan)

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

3. **Setup environment (`.env`):**

```env
# Telegram Bot Token (dari @BotFather)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# AI Configuration (pilih salah satu)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
# atau
AI_PROVIDER=openrouter  
OPENROUTER_API_KEY=your_openrouter_key

# Google Sheets (untuk ulang tahun)
GOOGLE_SERVICE_ACCOUNT=./credentials.json
SPREADSHEET_ID=your_google_sheet_id

# Timezone & Jadwal
TIMEZONE=Asia/Makassar
RENUNGAN_GROUP_ID=628123456789@c.us
RENUNGAN_TIME=08:00
BIRTHDAY_TIME=07:00
```

4. **Generate verses untuk tahun ini:**

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

- 📖 **Renungan** - Preview, kirim manual, lihat statistik
- 🎂 **Ulang Tahun** - Kirim ucapan, lihat data
- 📊 **Status** - Cek koneksi WhatsApp & sistem

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

## 🔧 Maintenance

### Generate Verses untuk Tahun Baru

Setiap awal tahun, generate verses baru:

```bash
node tools/generateYearlyVerses.js 2027
```

### Update Database Ayat

Edit file `tools/generateYearlyVerses.js` di bagian `allVerses` object untuk menambah ayat baru ke database.

### Backup Data

File penting untuk di-backup:
- `.env` - Konfigurasi
- `credentials.json` - Google credentials
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

### AI error / API limit:

- Cek API key di `.env`
- Ganti provider jika perlu (Gemini ↔ OpenRouter)
- Periksa quota API

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
```

**Auto-restart on error:**

```bash
pm2 restart wa-renungan
```

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
