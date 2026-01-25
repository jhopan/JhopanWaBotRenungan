# 🤖 WhatsApp Bot Renungan Harian v5.2

Bot WhatsApp dengan sistem renungan harian menggunakan AI, dioptimasi untuk **GCP Free Tier** dengan **Cloudflare Worker Webhook** (hemat bandwidth).

## 💻 Target Spesifikasi

```
GCP e2-micro Instance:
├── CPU: 2 vCPU (Intel Xeon @ 2.20GHz)
├── RAM: 958MB (target usage: <500MB)
├── Egress: 1GB/month
└── Mode: Webhook via Cloudflare Worker (0 egress!)
```

## 🌐 Polling vs Webhook + Worker

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
└─────────────────┴────────────┴───────────────┴───────────────┘

Bot ini AUTO-DETECT:
- Jika WEBHOOK_URL diset → Mode Webhook ✅
- Jika tidak → Mode Polling (fallback)
```

## ✨ Fitur Utama

- 📖 **Renungan Harian** - Ayat alkitab dengan renungan AI otomatis
- 🌐 **Cloudflare Worker** - 100% gratis, 0 egress GCP
- 🤖 **Gemini AI** - Model gemini-2.5-flash-lite (gratis)
- 📱 **Telegram Control Panel** - Kelola bot via Telegram
- 💾 **Session Persistence** - Login WA tidak logout otomatis
- 🔄 **Auto Reconnect** - 20x retry dengan exponential backoff
- 💡 **RAM Max 500MB** - Optimized untuk 958MB total RAM
- 📢 **Multi-Group Support** - Kirim ke banyak grup dengan delay

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/jhopan/JhopanWaBotRenungan.git
cd JhopanWaBotRenungan
npm install
```

### 2. Setup Cloudflare Worker (WAJIB untuk GCP Free Tier)

**A. Buat Worker:**
```bash
# 1. Login ke https://dash.cloudflare.com/workers
# 2. Klik "Create a Worker"
# 3. Copy paste isi file: cloudflare-worker.js
```

**B. Edit Worker:**
```javascript
// Ganti IP External GCP kamu
const GCP_VM_IP = "YOUR_GCP_EXTERNAL_IP"  // ← Cek: curl ifconfig.me
const GCP_PORT = 3000
```

**C. Deploy & Get URL:**
```
Deploy → Dapatkan URL: https://your-worker.workers.dev
```

### 3. Setup Environment

```bash
cp .env.example .env
nano .env
```

Isi .env:
```env
# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-xyz
ADMIN_TELEGRAM_IDS=123456789

# Webhook (URL dari Cloudflare Worker)
WEBHOOK_URL=https://webhook-wa-renungan.jhosuainfo.workers.dev
WEBHOOK_PORT=3000

# AI Provider
GEMINI_API_KEY=AIzaSyB...
AI_MODEL=gemini-2.5-flash-lite

# Chrome path
CHROME_PATH=/usr/bin/chromium-browser
```

### 4. Buka Port 3000 di GCP Firewall

```bash
gcloud compute firewall-rules create allow-webhook \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow webhook from Cloudflare Worker"
```

### 5. Jalankan Bot

```bash
# Development
npm start

# Production dengan PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📦 PM2 Deployment

### Start dengan PM2

```bash
# Menggunakan ecosystem config
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs renungan-bot

# Restart
pm2 restart renungan-bot
```

### PM2 + Cloudflare Tunnel

Untuk menjalankan tunnel secara persistent:

```bash
# Buat script start-all.sh
cat > start-all.sh << 'EOF'
#!/bin/bash
# Start cloudflared tunnel di background
cloudflared tunnel --url http://localhost:3000 &
TUNNEL_PID=$!
echo "Tunnel PID: $TUNNEL_PID"

# Tunggu 5 detik untuk tunnel siap
sleep 5

# Start bot dengan PM2
pm2 start ecosystem.config.js

# Simpan tunnel PID
echo $TUNNEL_PID > /tmp/cloudflared.pid
EOF

chmod +x start-all.sh
./start-all.sh
```

Atau setup cloudflared sebagai service:

```bash
# Setup cloudflared service
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## 📊 Bandwidth Usage

### Dengan Polling (JANGAN DIPAKAI!)

```
Telegram polling:    ~750MB/month
WhatsApp keep-alive: ~20MB/month  
AI API calls:        ~1.5MB/month
────────────────────────────────────
Total:               ~772MB/month ⚠️ (77% kuota!)
```

### Dengan Webhook + Cloudflare Tunnel

```
Telegram webhook:    ~25MB/month (egress)
WhatsApp keep-alive: ~20MB/month
AI API calls:        ~1.5MB/month
────────────────────────────────────
Total:               ~47MB/month ⚠️ (4.7% kuota)
```

### Dengan Webhook + Cloudflare Worker (RECOMMENDED!)

```
Telegram webhook:    ~4MB/month (egress)
WhatsApp keep-alive: ~20MB/month
AI API calls:        ~1.5MB/month
Webhook updates:     ~15MB/month (ingress - GRATIS!)
────────────────────────────────────
Total Egress:        ~25MB/month ✅ (2.5% kuota)
Total Bandwidth:     ~40MB/month
```

**Kenapa Worker Hemat?**
- Ingress GCP = **GRATIS** (traffic masuk tidak kena quota)
- Worker → GCP = HTTP ingress (gratis)
- GCP → Telegram API = HTTPS egress (kena quota, tapi minimal)

## 🏗️ Arsitektur Cloudflare Worker

```
User kirim /start
    ↓
Telegram Server
    ↓ (HTTPS POST)
Cloudflare Worker (webhook endpoint)
    ↓ (HTTP POST - ingress GRATIS!)
GCP VM:3000 (Express server)
    ↓ (process message)
Bot response → Telegram API (via HTTPS)
    ↑ (~0.5KB egress per pesan)
```

## 📊 Resource Usage

```
┌─────────────────────┬──────────┬──────────┐
│ Component           │ RAM      │ CPU Avg  │
├─────────────────────┼──────────┼──────────┤
│ Node.js             │  50-80MB │   3-5%   │
│ Puppeteer/Chrome    │ 120-200MB│   5-12%  │
│ Express (webhook)   │   5-10MB │   0.1%   │
│ Telegram bot        │  10-20MB │   0.5%   │
│ Overhead            │  20-40MB │   1-2%   │
├─────────────────────┼──────────┼──────────┤
│ TOTAL (Normal)      │ 200-350MB│  10-20%  │
│ PEAK (Kirim pesan)  │ 300-400MB│  25-40%  │
│ TARGET MAX          │  <500MB  │  <50%    │
└─────────────────────┴──────────┴──────────┘
```

## 📱 Telegram Commands

Kirim `/start` ke bot Telegram Anda untuk membuka panel kontrol:

- **📖 Renungan** - Kelola pengaturan renungan
- **⚙️ Pengaturan** - Pengaturan umum bot
- **📊 Status** - Cek status bot & memory

## 🔧 Troubleshooting

### Webhook tidak terdeteksi

```bash
# Cek apakah WEBHOOK_URL sudah diset
grep WEBHOOK_URL .env

# Cek apakah port 3000 listening
netstat -tlnp | grep 3000

# Test endpoint health
curl http://localhost:3000/health
```

### Bot tidak dapat message dari Telegram

```bash
# Cek webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Hapus dan set ulang webhook
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
# Restart bot
```

### Memory tinggi

```bash
# Cek memory usage
pm2 monit

# Force restart
pm2 restart renungan-bot --update-env

# Check logs
pm2 logs renungan-bot --lines 100
```

### Cloudflare Tunnel mati

```bash
# Cek status tunnel
ps aux | grep cloudflared

# Restart tunnel
cloudflared tunnel --url http://localhost:3000 &
```

## 📝 Changelog

### v5.2.0 (Cloudflare Worker Edition)

- 🌐 **Cloudflare Worker** - 0 egress GCP, 100% ingress gratis
- 📦 **Express server** - Built-in untuk webhook endpoint
- ⚡ **Auto-detect mode** - Webhook jika WEBHOOK_URL diset
- 🔄 **Graceful shutdown** - Cleanup webhook saat stop
- 📊 **Health endpoint** - /health untuk monitoring
- 🛡️ **Fallback polling** - Jika webhook gagal
- 🎯 **Gemini 2.5 Flash-Lite** - AI model utama
- 💾 **Bandwidth: ~25MB/month** - 97.5% hemat vs polling

### v5.1.0

- 🎯 Target: 2 vCPU, 958MB RAM
- 📦 Memory limit: 480MB
- 💡 Chrome heap: 256MB
- 🔄 Session keep-alive 2 menit

### v5.0.0

- 🗑️ Removed birthday reminder
- 🗑️ Removed recruitment feature
- 🗑️ Removed Google Sheets integration
- ✨ Session persistence
- ⚡ Low-memory optimization

## 📄 License

MIT License - lihat [LICENSE](LICENSE) untuk detail.

---

Made with ❤️ for daily devotions | GCP Free Tier Optimized | **Cloudflare Worker Powered** 🚀
