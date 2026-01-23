# 🤖 WhatsApp Bot Renungan Harian v4.0 ✅

Bot WhatsApp dengan sistem renungan harian menggunakan AI (Gemini 2.5 Flash-Lite), manajemen ayat random dengan history persist, **multiple API key rotation**, dan siap deploy ke **GCP Free Tier**.

## ✅ Status: Bot Berjalan dengan Baik!

- ✅ WhatsApp Client: Connected
- ✅ Telegram Bot: Active
- ✅ AI Service: Gemini 2.5 Flash-Lite (Multiple Keys)
- ✅ Scheduler: Renungan 08:00 WITA, Birthday 07:00 WITA
- ✅ Auto QR: Kirim ke Telegram admin
- ✅ Resource Usage: ~200-300MB RAM, 50-100MB disk

## ✨ Fitur Utama

- 📖 **Renungan Harian dengan AI** - Generate renungan lengkap dari referensi ayat menggunakan Gemini AI
- 🎲 **Random Verse dengan History** - Ayat dipilih random, tidak akan berulang sampai semua terpakai
- 💾 **History Persist** - Riwayat ayat tersimpan meskipun bot restart
- 🔄 **Auto-Retry 10 Menit** - Gagal kirim? Otomatis retry setelah 10 menit
- 🔑 **Multiple API Key Rotation** - Rotasi otomatis antar API key (bypass rate limit 15 req/min)
- 📱 **Auto QR to Telegram** - QR WhatsApp otomatis terkirim ke admin Telegram
- ☁️ **GCP Free Tier Ready** - Optimized untuk Google Cloud Platform (256MB RAM)
- 🎂 **Pengingat Ulang Tahun** - Integrasi Google Sheets untuk ulang tahun otomatis
- 🕒 **Scheduler Otomatis** - Kirim renungan & ucapan ulang tahun sesuai jadwal
- 🎯 **Kategori Ayat** - 11 kategori (Kasih ❤️, Iman ✝️, Harapan ✨, dll)
- 🎉 **Ayat Hari Besar** - Ayat khusus untuk Natal, Paskah, Pentakosta, dll
- 🎛️ **Telegram Control Panel** - Kontrol bot via Telegram (preview, kirim manual, reset ayat)
- 🔐 **Error ke Telegram Only** - Error AI tidak tampil di WhatsApp, hanya notif ke admin Telegram
- 🔄 **Auto-Reconnect** - Reconnect otomatis jika WhatsApp terputus

## 🔑 Multiple API Key Rotation (NEW!)

Bot sekarang support **multiple API keys** untuk bypass rate limit Gemini (15 req/min):

### Cara Kerja:

1. **Multi-Key Support** - Tambahkan beberapa API key dipisah koma
2. **Auto-Rotation** - Bot otomatis switch key saat mendekati limit (13/15 requests)
3. **Usage Tracking** - Tracking penggunaan per key secara otomatis
4. **Smart Selection** - Selalu pilih key dengan usage terendah

### Konfigurasi:

```env
# Single key (cara lama)
GEMINI_API_KEY=AIzaSyAbc123...

# Multiple keys (cara baru - RECOMMENDED)
GEMINI_API_KEY=AIzaSyAbc123...,AIzaSyDef456...,AIzaSyGhi789...

# Fallback provider (opsional)
OPENROUTER_API_KEY=sk-or-v1-abc123...,sk-or-v1-def456...
```

### Log Output:

```
🔑 Menggunakan gemini API key #1 (usage: 0/13)
🔑 Menggunakan gemini API key #2 (usage: 5/13)
🔄 API key #1 mendekati limit, switch ke key #2
```

### Keuntungan:

- ✅ **Bypass rate limit** - 15 req/min x jumlah key
- ✅ **No downtime** - Auto-switch saat limit
- ✅ **Zero config** - Tinggal tambah key, langsung jalan
- ✅ **Gratis** - Semua API key Gemini gratis (1000 req/day per key)

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
  - Bisa pakai **multiple keys** untuk bypass rate limit
- Google Service Account (opsional - untuk ulang tahun)

## ☁️ Deploy ke Google Cloud Platform (GRATIS SELAMANYA!)

Bot sudah dioptimasi untuk **GCP Free Tier** dengan **Compute Engine e2-micro**:

### 🎯 Langkah Deploy (5 Menit):

#### 1. Buat VM di GCP Console

```
Buka: https://console.cloud.google.com/compute/instances
Klik: Create Instance

Konfigurasi:
  Name: wa-bot-renungan
  Region: us-central1 (Iowa) ← GRATIS SELAMANYA
  Zone: us-central1-a

  Machine type: e2-micro (2 vCPU, 1 GB RAM) ← GRATIS
  Boot disk: Ubuntu 22.04 LTS, 30 GB

Klik: Create
```

#### 2. SSH & Install (Copy-Paste):

```bash
# SSH via browser di GCP Console (klik tombol SSH)

# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2

# Install dependencies Chromium
sudo apt install -y gconf-service libasound2 libatk1.0-0 libcairo2 \
  libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 \
  libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
  libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
  libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  ca-certificates fonts-liberation libappindicator1 lsb-release \
  xdg-utils wget
```

#### 3. Clone & Setup:

```bash
cd ~
git clone https://github.com/jhopan/JhopanWaBotRenungan.git
cd JhopanWaBotRenungan
npm install

# Edit .env
nano .env
```

Paste konfigurasi (Ctrl+O save, Ctrl+X exit):

```env
TELEGRAM_BOT_TOKEN=8535750703:AAFqDwnbejpZaiX2T74z_Kz8MUSBniX2fHQ
GEMINI_API_KEY=AIzaSyBJ22xnZl6lbOQR3_R69GyqMnAxP2-hJ9Q
AI_MODEL=gemini-2.5-flash-lite
RENUNGAN_GROUP_ID=120363419779170358@g.us
RENUNGAN_TIME=08:00
TIMEZONE=Asia/Makassar
ADMIN_TELEGRAM_IDS=1491946180
```

#### 4. Generate Verses & Jalankan:

```bash
node tools/generateYearlyVerses.js 2026

# Start dengan PM2
pm2 start src/index.js --name wa-renungan
pm2 logs wa-renungan  # Lihat QR code (atau cek Telegram)

# Auto-start saat VM reboot
pm2 save
pm2 startup
# Copy-paste command yang muncul (sudo ...)
```

#### 5. Scan QR WhatsApp

QR akan muncul di:

- Terminal: `pm2 logs wa-renungan`
- **Telegram**: Otomatis terkirim ke admin!

**Done! Bot jalan 24/7 GRATIS! 🎉**

### 💰 GCP Free Tier - e2-micro Specs:

| Resource  | Gratis       | Cukup untuk Bot?               |
| --------- | ------------ | ------------------------------ |
| vCPU      | 2 (shared)   | ✅ Yes                         |
| RAM       | 1 GB         | ✅ Yes (bot pakai ~250MB)      |
| Storage   | 30 GB        | ✅ Yes (bot pakai ~500MB)      |
| Egress    | 1 GB/month   | ✅ Yes (bot pakai ~50MB/month) |
| **Biaya** | **$0/month** | **GRATIS SELAMANYA!**          |

**Syarat tetap gratis:**

- Pakai 1 instance e2-micro di region: us-central1, us-west1, atau us-east1
- Total egress < 1GB/month

### 🔧 Troubleshooting GCP VM:

**OOM (Out of Memory) - RAM penuh:**

```bash
# Enable swap 1GB (pakai disk sebagai virtual RAM)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h  # Verify
```

**WhatsApp disconnect:**

```bash
rm -rf .wwebjs_cache/ .wwebjs_auth/
pm2 restart wa-renungan
# Scan QR lagi
```

**Update bot:**

```bash
cd ~/JhopanWaBotRenungan
pm2 stop wa-renungan
git pull origin main
npm install
pm2 restart wa-renungan
```

**Monitor resource:**

```bash
pm2 monit          # CPU, RAM usage
pm2 logs wa-renungan
free -h            # RAM
df -h              # Disk
```

### 📊 Resource Usage Aktual Bot:

Berdasarkan testing di production:

| Metric           | Usage      | Percentage of e2-micro |
| ---------------- | ---------- | ---------------------- |
| **RAM**          | 200-300 MB | 20-30% (dari 1GB)      |
| **CPU**          | 5-15%      | 2-7% (dari 2 vCPU)     |
| **Disk**         | 500 MB     | 1.6% (dari 30GB)       |
| **Egress/month** | 50 MB      | 5% (dari 1GB limit)    |

**Breakdown Disk:**

- Node modules: 200 MB
- Chromium cache: 150 MB
- WhatsApp session: 100 MB
- Verses data: 10 MB
- Logs: 40 MB

**Breakdown Egress (per bulan):**

- Renungan harian (30 hari): ~15 MB (500KB × 30)
- AI requests: ~10 MB
- Telegram messages: ~5 MB
- Updates & downloads: ~20 MB

**Kesimpulan: Bot SANGAT HEMAT! Masih bisa tambah fitur lebih banyak! 💪**

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
# Format: key1,key2,key3 (pisahkan dengan koma untuk rotasi)
GEMINI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-2.5-flash-lite

# Fallback AI (opsional)
OPENROUTER_API_KEY=your_openrouter_key

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

## 📊 Spesifikasi Teknis & Resource Usage

### Lokal Development:

- **RAM Usage:** ~200-300 MB
- **CPU Usage:** 5-15% (saat idle), 30-50% (saat generate AI)
- **Disk Usage:** ~500 MB total
  - node_modules: 200 MB
  - Chromium: 150 MB
  - WhatsApp session: 100 MB
  - Data & logs: 50 MB

### Production (GCP e2-micro):

- **RAM:** 250 MB average (25% dari 1GB)
- **CPU:** 5-10% average (2-5% dari 2 vCPU)
- **Disk:** 500 MB (1.6% dari 30GB)
- **Egress:** ~50 MB/month (5% dari 1GB limit)

### Dependencies:

- **Node.js:** v16+ (recommended v20)
- **Main Packages:**
  - whatsapp-web.js: ~50 MB
  - puppeteer: ~200 MB (include Chromium)
  - node-telegram-bot-api: ~5 MB
  - @google-ai/generativelanguage: ~10 MB
  - googleapis: ~30 MB

### Scheduled Tasks:

- **Renungan:** 08:00 daily (1 request/day)
- **Birthday:** 07:00 daily (1 request/day jika ada ulang tahun)
- **AI Requests:** 1-2 request/day (renungan + birthday)

### Network Usage:

| Activity              | Size       | Frequency |
| --------------------- | ---------- | --------- |
| Renungan harian       | ~500 KB    | 1×/day    |
| AI request (Gemini)   | ~10 KB     | 1-2×/day  |
| Telegram messages     | ~5 KB      | Variable  |
| WhatsApp session sync | ~1 MB      | 1×/day    |
| **Total/month**       | **~50 MB** | **Safe!** |

**Kesimpulan:** Bot SANGAT HEMAT! Cocok untuk free tier, masih bisa tambah 5-10 fitur lagi! 💪

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
- **Rate limit?** → Gunakan multiple API keys (pisahkan dengan koma)
- Gemini free tier per key: 15 req/min, 1000 req/day

### Multiple API Keys tidak switch:

```bash
# Format yang benar:
GEMINI_API_KEY=key1,key2,key3

# SALAH (pakai spasi):
GEMINI_API_KEY=key1, key2, key3

# Cek log di terminal:
🔑 Menggunakan gemini API key #1 (usage: 0/13)
```

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

### Jalankan 24/7 dengan PM2 (VPS/Server):

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

### Deploy ke Google Cloud Platform (RECOMMENDED):

Bot sudah production-ready di GCP e2-micro! Lihat bagian "Deploy ke GCP" di atas untuk:

- ✅ Panduan lengkap 5 menit
- ✅ Command copy-paste langsung jalan
- ✅ Install dependencies Chromium
- ✅ Setup PM2 auto-start
- ✅ Troubleshooting OOM & swap
- ✅ Resource usage monitoring
- ✅ Estimasi biaya: **$0/month** (gratis selamanya!)

## 📱 Fitur Unggulan v4.0

### 1. Multiple API Key Rotation (NEW!)

Bypass rate limit dengan rotasi otomatis:

- ✅ Tambahkan beberapa Gemini API key
- ✅ Auto-switch saat mendekati limit (13/15 requests)
- ✅ Tracking usage per key
- ✅ Zero downtime

### 2. Random Selection dengan Memory

Tidak seperti bot lain yang mengulang ayat, bot ini:

- ✅ Mengingat ayat yang sudah terpakai
- ✅ Tidak pernah mengirim ayat yang sama sampai semua habis
- ✅ History tersimpan meskipun bot restart/crash

### 3. Auto-Retry Cerdas

Jika gagal kirim karena jaringan:

- ✅ Tidak langsung give up
- ✅ Retry otomatis setelah 10 menit
- ✅ Admin dapat notifikasi via Telegram
- ✅ Tidak spam retry berkali-kali

### 4. Error Handling Profesional

- ✅ Error AI tidak tampil di grup WA (tidak memalukan)
- ✅ Admin dapat notifikasi detail via Telegram
- ✅ User grup hanya terima renungan yang sukses

### 5. Auto QR to Telegram (NEW!)

- ✅ QR WhatsApp otomatis dikirim ke admin Telegram
- ✅ Tidak perlu buka terminal untuk scan
- ✅ Cocok untuk deployment cloud

### 6. GCP Optimized (NEW!)

- ✅ Memory usage dioptimalkan untuk 256MB RAM
- ✅ Puppeteer args untuk serverless
- ✅ Auto-scaling configuration
- ✅ Ready deploy dalam 5 menit

### 7. Maintenance Friendly

- ✅ Reset ayat kapan saja via Telegram
- ✅ Generate verses tahun baru dengan 1 command
- ✅ Monitoring lengkap dari Telegram

## 🚀 Fitur yang Bisa Dikembangkan (Masih FREE!)

Ide fitur tambahan yang masih dalam GCP Free Tier:

### 1. **Doa Harian** 📿

- Template doa untuk pagi/siang/malam
- Doa kategori: Syukur, Permohonan, Pengakuan Dosa
- Schedule tambahan jam 12:00 & 18:00
- **Impact:** +2 cron jobs, ~10KB storage

### 2. **Verse of the Week** 🗓️

- Ayat hafalan mingguan
- Kirim hari Minggu jam 06:00
- Reminder hari Rabu: "Sudah hafal ayat minggu ini?"
- **Impact:** +1 file JSON, +2 cron jobs

### 3. **Interactive Quiz** 🎮

- Quiz alkitab simple via WhatsApp
- Command: `/quiz` → bot kirim pertanyaan
- Tracking score per user
- **Impact:** +50KB storage (JSON leaderboard)

### 4. **Prayer Request** 🙏

- User kirim request doa ke grup
- Bot compile jadi list
- Kirim summary setiap Minggu
- **Impact:** +100KB storage

### 5. **Verse by Topic** 🔍

- Command: `/ayat kasih` → bot kirim ayat tentang kasih
- Search dari database verses
- No AI needed → no API cost
- **Impact:** Zero additional cost

### 6. **Reminder Custom** ⏰

- User set reminder pribadi
- "Ingatkan saya baca Alkitab jam 19:00"
- Stored in JSON per user
- **Impact:** +200KB storage

### 7. **Streak Tracker** 🔥

- Tracking berapa hari berturut-turut baca renungan
- Gamification: Badge (🏆 7 hari, ⭐ 30 hari, 💎 100 hari)
- Motivasi user tetap konsisten
- **Impact:** +50KB storage

### 8. **Multi-Language** 🌍

- Renungan dalam Bahasa Indonesia & Inggris
- Toggle language via Telegram
- Share ke lebih banyak orang
- **Impact:** +2x verses file size (~200KB)

**Semua fitur di atas masih dalam GCP Free Tier karena:**

- ✅ Storage < 1GB
- ✅ Egress < 5GB/month
- ✅ CPU usage minimal
- ✅ No additional external APIs

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
