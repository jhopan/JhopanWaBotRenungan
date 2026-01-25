# 🤖 WhatsApp Bot Renungan Harian v5.2

Bot WhatsApp dengan sistem renungan harian menggunakan AI, dioptimasi untuk **GCP Free Tier** dengan **Cloudflare Worker Webhook** (hemat bandwidth 97.5%).

## 💻 Target Spesifikasi

```
GCP e2-micro Instance (FREE TIER):
├── CPU: 2 vCPU (Intel Xeon @ 2.20GHz)
├── RAM: 958MB (target usage: <500MB)
├── Disk: 10GB Standard Persistent Disk
├── Egress: 1GB/month (gratis)
├── Region: us-west1, us-central1, us-east1
└── Mode: Webhook via Cloudflare Worker (~25MB/month)
```

## 🌐 Perbandingan Mode Bot

```
┌─────────────────┬────────────┬───────────────┬───────────────┐
│ Aspek           │ POLLING    │ WEBHOOK+TUNNEL│ WEBHOOK+WORKER│
├─────────────────┼────────────┼───────────────┼───────────────┤
│ Egress/month    │ ~750MB ❌  │ ~25MB ⚠️      │ ~4MB ✅       │
│ Ingress/month   │ 0          │ 0             │ ~15MB (gratis)│
│ CPU Usage       │ 2-5%       │ 0.5-1%        │ 0.1-0.5%      │
│ RAM Usage       │ +15MB      │ +5MB          │ +5MB          │
│ Latency         │ 0-2s       │ Instant       │ Instant       │
│ Setup           │ Mudah      │ Perlu tunnel  │ Deploy Worker │
│ Downtime        │ 0%         │ ~1% (tunnel)  │ 0%            │
└─────────────────┴────────────┴───────────────┴───────────────┘

Bot AUTO-DETECT mode:
✅ Jika WEBHOOK_URL diset → Mode Webhook
❌ Jika tidak → Mode Polling (fallback)
```

## ✨ Fitur Utama

- 📖 **Renungan Harian** - Ayat alkitab + renungan AI otomatis (jadwal custom)
- 🌐 **Cloudflare Worker** - 100% gratis, 0 egress GCP, unlimited requests
- 🤖 **Gemini 2.5 Flash-Lite** - AI gratis (15 req/min, 1000 req/day)
- 📱 **Telegram Control Panel** - Kelola semua via Telegram (admin only)
- 💾 **Session Persistence** - Login WA sekali, tidak logout otomatis
- 🔄 **Auto Recovery** - 20x retry, cron restart jam 3 pagi
- 💡 **Memory Optimized** - Max 480MB, auto-restart jika over
- 📢 **Multi-Group** - Kirim ke banyak grup dengan delay anti-spam

---

## 🚀 Deployment ke GCP (Complete Guide)

### 📋 **Prasyarat**

1. **Akun Google Cloud** (Free Tier)
   - Daftar: https://console.cloud.google.com/
   - Credit $300 untuk 90 hari pertama
   - Free tier permanent: e2-micro (1 VM per billing account)

2. **Akun Cloudflare** (Free)
   - Daftar: https://dash.cloudflare.com/sign-up
   - Workers free: 100,000 requests/day

3. **Bot Telegram & API Gemini**
   - Telegram Bot Token: @BotFather
   - Gemini API Key: https://aistudio.google.com/app/apikey

---

### 🖥️ **Step 1: Buat VM di GCP Free Tier**

#### **A. Login ke Google Cloud Console**

```
https://console.cloud.google.com/compute/instances
```

#### **B. Create Instance (PENTING: Ikuti exact settings!)**

**1. Basic Configuration:**

```
Name: renungan-bot-vm (atau bebas)
Region: us-west1 (Oregon) ✅ FREE TIER
Zone: us-west1-a (any)
```

**2. Machine Configuration:**

```
Series: E2 ✅
Machine type: e2-micro ✅ (2 vCPU, 1 GB memory)
              ↑ WAJIB pilih ini untuk free tier!
```

**3. Boot Disk:**

```
Operating System: Ubuntu ✅
Version: Ubuntu 22.04 LTS (x86/64) ✅ RECOMMENDED
Boot disk type: Standard persistent disk ✅
Size: 10 GB ✅ (default, cukup)
```

**❌ JANGAN pilih:**

- Debian (kurang compatible)
- CentOS (EOL)
- Windows (tidak gratis)

**4. Firewall:**

```
✅ Allow HTTP traffic
✅ Allow HTTPS traffic
```

**5. Klik "CREATE"**

**⏱️ Tunggu ~2 menit VM booting**

---

### 🔐 **Step 2: SSH ke VM**

#### **Option A: Browser SSH (Recommended)**

```
1. Di halaman Instances, klik tombol "SSH" di row VM kamu
2. Terminal akan terbuka di browser
```

#### **Option B: gcloud CLI**

```bash
gcloud compute ssh renungan-bot-vm --zone=us-west1-a
```

---

### ⚙️ **Step 3: Setup VM (Automatic Script)**

#### **A. Download & Run Setup Script**

```bash
# Clone repository
git clone https://github.com/jhopan/JhopanWaBotRenungan.git
cd JhopanWaBotRenungan

# Run setup script (install semua dependency otomatis)
chmod +x setup-gcp.sh
./setup-gcp.sh
```

**Setup script akan install:**

- ✅ Node.js 18
- ✅ Chromium browser
- ✅ PM2 process manager
- ✅ Swap 1GB
- ✅ Dependencies npm
- ✅ Firewall port 3000
- ✅ Auto-detect External IP

**⏱️ Proses ~5-10 menit**

---

### 🌐 **Step 4: Deploy Cloudflare Worker**

#### **A. Login Cloudflare Dashboard**

```
https://dash.cloudflare.com/workers
```

#### **B. Create Worker**

```
1. Klik "Create a Worker"
2. Worker name: webhook-wa-renungan (atau bebas)
```

#### **C. Edit Worker Script**

```
1. Hapus semua kode default
2. Buka file: cloudflare-worker.js di repo local
3. Copy paste semua isi file ke Worker editor
```

#### **D. Edit IP External GCP**

Di akhir setup-gcp.sh, External IP sudah ditampilkan:

```
External IP: 35.XXX.XXX.XXX  ← Copy IP ini
```

Edit di Worker:

```javascript
// GANTI INI dengan IP External GCP kamu yang muncul tadi
const GCP_VM_IP = "YOUR_GCP_EXTERNAL_IP"; // ← Paste IP kamu di sini
const GCP_PORT = 3000;
```

#### **E. Deploy Worker**

```
1. Klik "Save and Deploy"
2. Copy URL Worker: https://webhook-wa-renungan.xxx.workers.dev
                     ↑ Save URL ini untuk .env
```

---

### 🔧 **Step 5: Konfigurasi .env**

#### **Di VM SSH Terminal:**

```bash
cd ~/JhopanWaBotRenungan
nano .env
```

#### **Isi Credentials:**

```env
# TELEGRAM BOT
TELEGRAM_BOT_TOKEN=123456789:ABC-DEFghIJKlmNOPqrsTUVwxyz  ← Dari @BotFather
ADMIN_TELEGRAM_IDS=123456789  ← Your Telegram User ID

# WEBHOOK (URL dari Cloudflare Worker)
WEBHOOK_URL=https://webhook-wa-renungan.xxx.workers.dev  ← Dari step 4E
WEBHOOK_PORT=3000

# AI GEMINI
GEMINI_API_KEY=AIzaSyB...  ← Dari https://aistudio.google.com/app/apikey
AI_MODEL=gemini-2.5-flash-lite

# RENUNGAN (optional, bisa set via Telegram)
RENUNGAN_TIME=08:00

# CHROME (sudah otomatis terinstall)
CHROME_PATH=/usr/bin/chromium-browser
```

**Save:** `Ctrl+O` → Enter → `Ctrl+X`

---

### 🚀 **Step 6: Start Bot**

#### **A. Test Manual (Optional)**

```bash
npm start
```

**Output sukses:**

```
✅ Sistem siap dalam 13.05s
🌐 Telegram Mode: WEBHOOK
📊 Est. Bandwidth: ~25MB/month
✅ Webhook berhasil diset
```

**Ctrl+C untuk stop**

#### **B. Start dengan PM2 (Production)**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Copy paste command yang muncul, lalu jalankan
```

**Cek status:**

```bash
pm2 list
pm2 monit  # Real-time monitoring
pm2 logs renungan-bot  # Lihat logs
```

---

### 📱 **Step 7: Scan QR WhatsApp**

#### **A. Lihat QR Code di Logs**

```bash
pm2 logs renungan-bot
```

**Output:**

```
Scan QR code ini di WhatsApp:
█████████████████████████████
█████████████████████████████
█████████████████████████████
```

#### **B. Scan dengan WhatsApp**

```
1. Buka WhatsApp di HP
2. Menu → Linked Devices
3. Link a Device
4. Scan QR code dari terminal
```

**✅ Sukses:**

```
✅ WhatsApp Connected!
   Number: +62812XXXXXXXX
   Device: Chrome (Linux)
```

#### **C. Session Tersimpan**

```
Session disimpan di: .wap-session/
QR code hanya perlu scan SEKALI
Restart bot = auto-login (tidak perlu scan lagi)
```

---

### ✅ **Step 8: Test Bot**

#### **A. Test Telegram Bot**

```
1. Buka Telegram
2. Cari bot kamu (@YourBotUsername)
3. Kirim: /start

Output:
🤖 Bot Renungan Panel
/status - Cek status
/setgroup - Set grup renungan
/ai - Chat dengan AI
```

#### **B. Add Bot ke Grup WhatsApp**

```
1. Buka grup WA yang mau dapat renungan
2. Add contact: +62812XXXXXXXX (nomor WA bot)
3. Atau invite link
```

#### **C. Set Grup via Telegram**

```
/setgroup
→ Bot minta: Kirim link invite grup WA
→ Paste link grup
→ ✅ Bot join grup otomatis
```

---

## 📊 Monitoring & Maintenance

### **Cek Status Bot**

```bash
pm2 list                    # List semua process
pm2 show renungan-bot       # Detail bot
pm2 monit                   # Real-time monitor (CPU, RAM)
```

### **Cek Logs**

```bash
pm2 logs renungan-bot       # Real-time logs
pm2 logs --lines 100        # 100 baris terakhir
tail -f logs/out.log        # Manual logs
```

### **Cek Memory**

```bash
free -h                     # Total RAM
pm2 describe renungan-bot   # Memory bot
htop                        # Interactive monitor
```

### **Restart Bot**

```bash
pm2 restart renungan-bot    # Restart manual
pm2 reload renungan-bot     # Reload tanpa downtime
```

### **Update Code**

```bash
cd ~/JhopanWaBotRenungan
git pull
npm install --production
pm2 restart renungan-bot
```

---

## 🔥 Firewall Setup (Jika Belum Jalan)

### **Buka Port 3000 untuk Webhook**

```bash
gcloud compute firewall-rules create allow-webhook \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow webhook from Cloudflare Worker" \
  --target-tags=http-server
```

### **Cek Firewall**

```bash
gcloud compute firewall-rules list | grep webhook
```

### **Test Port Terbuka**

```bash
# Dari VM
sudo netstat -tlnp | grep 3000

# Dari local (ganti IP)
curl http://YOUR_GCP_EXTERNAL_IP:3000/health
# Output: OK
```

---

## 📊 Bandwidth Usage Detail

### **Polling Mode** (❌ TIDAK RECOMMENDED)

```
Telegram long-polling:  ~750 MB/month  (egress)
WhatsApp keep-alive:    ~20 MB/month   (egress)
AI API calls:           ~1.5 MB/month  (egress)
──────────────────────────────────────────────
Total Egress:           ~772 MB/month  (77% quota!) ❌
Risk: Bisa over limit jika ada lonjakan traffic
```

### **Webhook + Cloudflare Worker** (✅ RECOMMENDED)

```
Telegram webhook reply: ~4 MB/month    (egress)
WhatsApp keep-alive:    ~20 MB/month   (egress)
AI API calls:           ~1.5 MB/month  (egress)
Webhook updates:        ~15 MB/month   (ingress - GRATIS!)
──────────────────────────────────────────────
Total Egress:           ~25 MB/month   (2.5% quota) ✅
Total Bandwidth:        ~40 MB/month
```

**Kenapa Worker Hemat?**

- ✅ Ingress GCP = **GRATIS** (traffic masuk unlimited)
- ✅ Worker → GCP = HTTP ingress (tidak kena quota)
- ✅ GCP → Telegram = HTTPS egress (minimal, hanya response)
- ✅ Worker free tier = 100,000 requests/day

---

## 🏗️ Arsitektur Webhook

```
┌──────────────┐
│  User kirim  │
│  /start      │
└──────┬───────┘
       │ HTTPS POST
       ▼
┌──────────────────────────────┐
│  Telegram Server             │
│  api.telegram.org            │
└──────────────┬───────────────┘
               │ HTTPS POST (webhook)
               ▼
┌──────────────────────────────┐
│  Cloudflare Worker           │
│  webhook-xxx.workers.dev     │
│  (Free, Global CDN)          │
└──────────────┬───────────────┘
               │ HTTP POST (ingress GRATIS!)
               ▼
┌──────────────────────────────┐
│  GCP VM:3000                 │
│  Express Server              │
│  - Process message           │
│  - Generate response         │
└──────────────┬───────────────┘
               │ HTTPS POST (egress ~0.5KB)
               ▼
┌──────────────────────────────┐
│  Telegram API                │
│  sendMessage                 │
└──────────────────────────────┘
```

---

## 📊 Resource Usage

```
┌─────────────────────┬──────────┬──────────┐
│ Component           │ RAM      │ CPU Avg  │
├─────────────────────┼──────────┼──────────┤
│ OS (Ubuntu 22.04)   │ ~180 MB  │   2-3%   │
│ Node.js Runtime     │  50-80MB │   3-5%   │
│ Chromium Browser    │ 120-200MB│   5-12%  │
│ Express Webhook     │   5-10MB │   0.1%   │
│ Telegram Bot        │  10-20MB │   0.5%   │
│ AI Context Cache    │  20-40MB │   0.2%   │
├─────────────────────┼──────────┼──────────┤
│ TOTAL (Normal)      │ 250-400MB│  10-20%  │
│ PEAK (Send Media)   │ 350-450MB│  25-40%  │
│ PM2 Auto-Restart    │   >480MB │    -     │
│ Cron Restart        │  03:00   │  Daily   │
└─────────────────────┴──────────┴──────────┘

Proteksi Memory:
✅ PM2 max_memory_restart: 480MB
✅ Cron restart: 03:00 WIB (daily)
✅ Swap: 1GB (emergency buffer)
```

---

## 📱 Telegram Commands (Admin Panel)

**🔘 BOT PAKAI TOMBOL (BUTTON) - KLIK AJA!**

Kirim `/start` ke bot untuk buka **menu interaktif dengan tombol**. Semua fitur pakai button, tidak perlu ketik command ribet!

### **Main Menu (Button Interface):**

```
/start        - Buka menu utama (dengan tombol interaktif)
/status       - Status bot & memory usage
/info         - Info sistem & bandwidth
/help         - Bantuan lengkap
```

### **Renungan Management (via Button):**

Setelah `/start`, klik tombol:

- **📝 Renungan** → Kelola pengaturan renungan
  - Set Grup WA (kirim link invite)
  - Set Jadwal (pilih jam)
  - Kirim Manual (sekarang)
  - Hide Tag ON/OFF (toggle)

### **AI Chat (Direct Command):**

```
/ai <pertanyaan>  - Chat dengan Gemini AI
Contoh: /ai Jelaskan Yohanes 3:16
```

### **Advanced Settings (via Button):**

- **⚙️ Pengaturan** → Konfigurasi lanjutan
  - Multi-group mode
  - Delay antar grup
  - Hide tag toggle

**⚡ Semua pengaturan bisa diubah lewat button, tidak perlu hafal command!**

---

## 🔧 Troubleshooting

### ❌ **Webhook tidak terdeteksi**

**Cek webhook URL di .env:**

```bash
grep WEBHOOK_URL .env
```

**Cek port 3000 listening:**

```bash
sudo netstat -tlnp | grep 3000
# Output: tcp  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  12345/node
```

**Test webhook endpoint:**

```bash
curl http://localhost:3000/health
# Output: OK
```

**Cek dari Cloudflare Worker logs:**

```
Dashboard → Workers → Your Worker → Logs
Filter: Recent errors
```

---

### ❌ **Bot tidak terima pesan dari Telegram**

**Verifikasi webhook Telegram:**

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

**Output sukses:**

```json
{
  "ok": true,
  "result": {
    "url": "https://webhook-xxx.workers.dev/bot<TOKEN>",
    "pending_update_count": 0,
    "last_error_date": 0
  }
}
```

**Jika pending_update_count > 0 atau ada error:**

```bash
# Delete webhook
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Restart bot (akan auto-set webhook lagi)
pm2 restart renungan-bot

# Cek lagi
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

### ❌ **WhatsApp tidak connect / logout**

**Cek logs:**

```bash
pm2 logs renungan-bot | grep -i whatsapp
```

**Scan QR lagi:**

```bash
# Stop bot
pm2 stop renungan-bot

# Hapus session lama
rm -rf .wap-session/

# Start lagi (QR akan muncul)
pm2 start renungan-bot
pm2 logs  # Lihat QR code
```

**Session corrupt:**

```bash
# Backup session lama
mv .wap-session .wap-session.backup

# Start bot (scan QR baru)
pm2 restart renungan-bot
```

---

### ⚠️ **Memory tinggi (>450MB)**

**Cek memory real-time:**

```bash
pm2 monit
# Atau
htop
```

**Force restart:**

```bash
pm2 restart renungan-bot --update-env
```

**Cek logs error:**

```bash
pm2 logs renungan-bot --lines 100 --err
```

**Jika sering over 480MB:**

```bash
# Cek apakah cron restart aktif
pm2 show renungan-bot | grep cron

# Jika belum aktif, update ecosystem.config.js
nano ecosystem.config.js
# Uncomment: cron_restart: "0 3 * * *"

pm2 delete renungan-bot
pm2 start ecosystem.config.js
pm2 save
```

---

### ⚠️ **Bot sering restart / crash**

**Cek crash logs:**

```bash
pm2 logs renungan-bot --err --lines 50
```

**Cek restart count:**

```bash
pm2 show renungan-bot | grep restart
```

**Jika restart > 10x/hari:**

```bash
# Cek apakah ada memory leak
pm2 monit

# Cek Node.js errors
pm2 logs --lines 200 | grep -i error

# Increase restart limit (temporary)
pm2 delete renungan-bot
# Edit ecosystem.config.js → max_restarts: 20
pm2 start ecosystem.config.js
```

---

### 🔥 **Firewall Issue**

**Cek firewall rules:**

```bash
gcloud compute firewall-rules list | grep webhook
```

**Buat ulang rule:**

```bash
# Delete old rule (if exists)
gcloud compute firewall-rules delete allow-webhook

# Create new
gcloud compute firewall-rules create allow-webhook \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow webhook from Cloudflare Worker"
```

**Test dari luar:**

```bash
# Ganti IP dengan External IP GCP kamu
curl http://34.56.112.197:3000/health
# Output: OK
```

---

## 📝 Changelog

### v5.2.0 (Cloudflare Worker Edition) - 25 Jan 2026

- 🌐 **Cloudflare Worker Webhook** - Hemat 97.5% bandwidth GCP
- 📦 **Express Server** - Built-in webhook endpoint port 3000
- ⚡ **Auto-detect Mode** - Webhook if WEBHOOK_URL set, else polling
- 🔄 **Cron Restart** - Daily 03:00 WIB (prevent memory leak)
- 📊 **Health Endpoint** - `/health` untuk monitoring
- 🛡️ **Graceful Shutdown** - Cleanup webhook on exit (10s timeout)
- 🎯 **Gemini 2.5 Flash-Lite** - Free AI model (15 req/min)
- 💾 **Memory Limit** - PM2 auto-restart at 480MB
- 🗑️ **Cleanup** - Remove birthday, recruitment, Google Sheets
- 📖 **Complete README** - Step-by-step GCP deployment guide

### v5.1.0

- 🎯 GCP Free Tier optimization (2 vCPU, 958MB RAM)
- 📦 Memory limit: 480MB (PM2)
- 💡 Chrome heap: 256MB
- 🔄 Session keep-alive: 2 minutes
- ⚙️ Swap: 1GB (stability)

### v5.0.0

- 🗑️ Removed birthday reminder
- 🗑️ Removed recruitment feature
- 🗑️ Removed Google Sheets integration
- ✨ Session persistence (LocalAuth)
- ⚡ Low-memory optimization

---

## 💡 Tips & Best Practices

### **1. Backup Session WhatsApp**

```bash
# Crontab: backup session setiap hari jam 2 pagi
0 2 * * * tar -czf ~/backup/wap-session-$(date +\%Y\%m\%d).tar.gz ~/JhopanWaBotRenungan/.wap-session/

# Cleanup backup lama (keep 7 hari)
0 4 * * * find ~/backup -name "wap-session-*.tar.gz" -mtime +7 -delete
```

### **2. Monitoring RAM Alert**

```bash
# Script monitor RAM
cat > ~/monitor-ram.sh << 'EOF'
#!/bin/bash
RAM=$(free | awk '/^Mem:/ {printf "%.0f", $3/$2*100}')
BOT_TOKEN="YOUR_BOT_TOKEN"
ADMIN_ID="YOUR_ADMIN_ID"

if [ $RAM -gt 85 ]; then
  curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${ADMIN_ID}" \
    -d "text=⚠️ RAM Usage: ${RAM}% (High!)"
fi
EOF

chmod +x ~/monitor-ram.sh

# Crontab: cek setiap 10 menit
*/10 * * * * bash ~/monitor-ram.sh
```

### **3. Auto-Update Bot**

```bash
# Script update otomatis
cat > ~/update-bot.sh << 'EOF'
#!/bin/bash
cd ~/JhopanWaBotRenungan
git pull
npm install --production
pm2 restart renungan-bot
EOF

chmod +x ~/update-bot.sh

# Crontab: update setiap Minggu jam 2 pagi
0 2 * * 0 bash ~/update-bot.sh
```

### **4. Log Rotation**

```bash
# PM2 sudah auto log rotate, tapi bisa custom
pm2 install pm2-logrotate

# Config
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 🎯 FAQ

**Q: Berapa lama bisa gratis di GCP?**
A: Permanent free tier e2-micro (1 VM per billing account) di region US. Credit $300 untuk 90 hari pertama.

**Q: Apakah WhatsApp logout saat restart?**
A: Tidak. Session tersimpan di `.wap-session/`. Scan QR hanya sekali.

**Q: Berapa banyak grup WA yang bisa?**
A: Unlimited. Bot support multi-group dengan delay anti-spam.

**Q: Apakah bisa pakai OpenRouter AI?**
A: Bisa, tapi kode fokus ke Gemini. Perlu edit `src/services/aiService.js`.

**Q: Bot crash terus, kenapa?**
A: Cek `pm2 logs`. Biasanya memory over atau session corrupt. Solusi: aktifkan cron restart.

**Q: Cloudflare Worker berbayar?**
A: Free tier: 100,000 requests/day. Cukup untuk bot kecil-menengah.

**Q: Bisa deploy di VPS lain (AWS, Azure)?**
A: Bisa, tapi perlu adjust setup script. GCP paling cocok untuk free tier.

---

## 📄 License

MIT License - Free to use, modify, distribute.

---

## 🙏 Credits

Made with ❤️ for daily devotions by **Jhopan**

- GCP Free Tier Optimized
- Cloudflare Worker Powered
- Gemini AI Integration
- Open Source & Free Forever

**Repository:** https://github.com/jhopan/JhopanWaBotRenungan  
**Developer:** Jhopan ([GitHub](https://github.com/jhopan))

🚀 Happy Deploying!
