# 🌐 Deployment Guide - Production Ready

Panduan deploy bot untuk berjalan 24/7 di production.

---

## 🎯 Pilihan Deployment

### 1. VPS (Virtual Private Server) ⭐ **RECOMMENDED**

- DigitalOcean, Linode, Vultr
- Minimal: 512MB RAM, 1 CPU
- Biaya: ~$5/bulan

### 2. Cloud Platform

- Google Cloud Platform (Free tier)
- AWS EC2 (Free tier)
- Azure VM

### 3. Laptop/PC Pribadi

- Gratis, tapi harus selalu nyala
- Cocok untuk testing

---

## 🚀 Deploy ke VPS (Ubuntu)

### Step 1: Beli VPS

**Recommended Provider:**

- **DigitalOcean** - Droplet $5/bulan
- **Vultr** - Cloud Compute $5/bulan
- **Contabo** - VPS S €3.99/bulan

**Specs Minimum:**

- RAM: 512MB (recommended 1GB)
- Storage: 10GB
- OS: Ubuntu 22.04 LTS

### Step 2: Connect ke VPS

```bash
# Windows (PowerShell/CMD)
ssh root@your_vps_ip

# Masukkan password yang dikirim via email
```

### Step 3: Setup Server

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Git
apt install -y git

# Install PM2 (Process Manager)
npm install -g pm2

# Install build tools untuk puppeteer
apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Verify installations
node -v
npm -v
pm2 -v
```

### Step 4: Clone & Setup Project

```bash
# Create working directory
mkdir -p /opt/bots
cd /opt/bots

# Upload project (pilih salah satu):

# Option A: Via Git
git clone https://github.com/yourusername/whatsapp-telegram-bot.git
cd whatsapp-telegram-bot

# Option B: Via SCP (dari komputer lokal)
# Di komputer lokal:
# scp -r whatsapp-telegram-bot root@your_vps_ip:/opt/bots/

# Install dependencies
npm install --production
```

### Step 5: Konfigurasi Environment

```bash
# Edit .env
nano .env
```

Isi dengan konfigurasi production:

```env
TELEGRAM_BOT_TOKEN=your_production_token
GEMINI_API_KEY=your_gemini_key
GOOGLE_SERVICE_ACCOUNT=./credentials.json
SPREADSHEET_ID=your_sheet_id
TIMEZONE=Asia/Makassar
RENUNGAN_GROUP_ID=628123456789@c.us
RENUNGAN_TIME=08:00
ADMIN_TELEGRAM_IDS=123456789,987654321
```

**Save:** Ctrl+O, Enter, Ctrl+X

### Step 6: Upload Google Credentials

```bash
# Di komputer lokal, upload credentials.json
scp credentials.json root@your_vps_ip:/opt/bots/whatsapp-telegram-bot/
```

### Step 7: First Run - Scan QR Code

```bash
# Run sekali untuk scan QR
cd /opt/bots/whatsapp-telegram-bot
npm start

# QR Code akan muncul
# Scan dengan WhatsApp
# Tunggu sampai muncul: ✅ WhatsApp siap!
# Tekan Ctrl+C untuk stop
```

### Step 8: Deploy dengan PM2

```bash
# Start bot dengan PM2
pm2 start src/index.js --name whatsapp-bot

# Setup auto-restart on server reboot
pm2 startup systemd
# Copy-paste command yang muncul, lalu jalankan

# Save current PM2 process list
pm2 save

# Check status
pm2 status

# View logs
pm2 logs whatsapp-bot

# Lihat log realtime
pm2 logs whatsapp-bot --lines 100
```

---

## 🎛️ PM2 Management Commands

### Basic Commands

```bash
# Start bot
pm2 start src/index.js --name whatsapp-bot

# Stop bot
pm2 stop whatsapp-bot

# Restart bot
pm2 restart whatsapp-bot

# Delete bot dari PM2
pm2 delete whatsapp-bot

# Status semua apps
pm2 status

# Info detail
pm2 info whatsapp-bot
```

### Monitoring

```bash
# Monitor CPU & Memory realtime
pm2 monit

# View logs
pm2 logs whatsapp-bot

# View only errors
pm2 logs whatsapp-bot --err

# Clear logs
pm2 flush
```

### Auto Restart Settings

```bash
# Restart jika memory usage > 500MB
pm2 start src/index.js --name whatsapp-bot --max-memory-restart 500M

# Restart jika crash
pm2 start src/index.js --name whatsapp-bot --restart-delay 5000
```

---

## 🔧 Optimasi Production

### 1. Increase File Watchers (Penting!)

```bash
# Edit sysctl
nano /etc/sysctl.conf

# Tambahkan di akhir file:
fs.inotify.max_user_watches=524288

# Apply changes
sysctl -p
```

### 2. Setup Swap (Jika RAM < 1GB)

```bash
# Create 2GB swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verify
free -h
```

### 3. Setup Firewall

```bash
# Install UFW
apt install -y ufw

# Allow SSH
ufw allow 22/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 4. Auto Update Bot

Buat script update otomatis:

```bash
# Create update script
nano /opt/bots/update-bot.sh
```

Isi dengan:

```bash
#!/bin/bash
cd /opt/bots/whatsapp-telegram-bot
git pull
npm install --production
pm2 restart whatsapp-bot
echo "Bot updated at $(date)" >> /var/log/bot-update.log
```

```bash
# Make executable
chmod +x /opt/bots/update-bot.sh

# Setup cron untuk auto update tiap hari jam 3 pagi
crontab -e

# Tambahkan:
0 3 * * * /opt/bots/update-bot.sh
```

---

## 🔐 Security Best Practices

### 1. Ganti Password Root

```bash
passwd root
# Masukkan password baru yang kuat
```

### 2. Buat User Non-Root

```bash
# Create new user
adduser botuser

# Add to sudo group
usermod -aG sudo botuser

# Switch to new user
su - botuser
```

### 3. Disable Root SSH Login

```bash
nano /etc/ssh/sshd_config

# Ubah:
PermitRootLogin no

# Restart SSH
systemctl restart ssh
```

### 4. Setup SSH Key Authentication

Di komputer lokal:

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096

# Copy ke server
ssh-copy-id botuser@your_vps_ip

# Test login (tidak perlu password)
ssh botuser@your_vps_ip
```

### 5. Install Fail2Ban

```bash
apt install -y fail2ban

# Start & enable
systemctl start fail2ban
systemctl enable fail2ban
```

---

## 📊 Monitoring & Logging

### 1. PM2 Plus (Cloud Monitoring)

```bash
# Daftar di: https://pm2.io
# Link PM2 ke cloud
pm2 link your_secret_key your_public_key

# Monitor di dashboard: https://app.pm2.io
```

### 2. Setup Log Rotation

```bash
# PM2 log rotation
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 3. Custom Logging

Edit `src/index.js`:

```javascript
// Tambahkan di awal file
const fs = require("fs");
const logStream = fs.createWriteStream("/var/log/whatsapp-bot.log", {
  flags: "a",
});

// Override console.log
const originalLog = console.log;
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args.join(" ");
  logStream.write(`[${timestamp}] ${message}\n`);
  originalLog(...args);
};
```

---

## 🔄 Backup & Restore

### 1. Backup Data

```bash
# Create backup script
nano /opt/bots/backup-bot.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/bot"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup data folder
tar -czf $BACKUP_DIR/data_$DATE.tar.gz \
  /opt/bots/whatsapp-telegram-bot/src/data/

# Backup .env
cp /opt/bots/whatsapp-telegram-bot/.env \
  $BACKUP_DIR/env_$DATE.bak

# Backup WhatsApp session
tar -czf $BACKUP_DIR/session_$DATE.tar.gz \
  /opt/bots/whatsapp-telegram-bot/.wwebjs_auth/

# Keep only last 7 backups
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed at $(date)" >> /var/log/bot-backup.log
```

```bash
chmod +x /opt/bots/backup-bot.sh

# Auto backup tiap hari jam 2 pagi
crontab -e
# Tambahkan:
0 2 * * * /opt/bots/backup-bot.sh
```

### 2. Restore from Backup

```bash
# Stop bot
pm2 stop whatsapp-bot

# Restore data
cd /opt/bots/whatsapp-telegram-bot
tar -xzf /opt/backups/bot/data_20251111_020000.tar.gz

# Restore session
tar -xzf /opt/backups/bot/session_20251111_020000.tar.gz

# Start bot
pm2 start whatsapp-bot
```

---

## 🆘 Troubleshooting Production

### Bot tidak start setelah reboot

```bash
# Check PM2 status
pm2 status

# Check PM2 startup
pm2 startup

# Re-save PM2 list
pm2 save
```

### Memory leak

```bash
# Monitor memory
pm2 monit

# Restart jika perlu
pm2 restart whatsapp-bot

# Setup auto-restart on high memory
pm2 delete whatsapp-bot
pm2 start src/index.js --name whatsapp-bot --max-memory-restart 400M
```

### WhatsApp session hilang

```bash
# Restore from backup
cd /opt/bots/whatsapp-telegram-bot
rm -rf .wwebjs_auth
tar -xzf /opt/backups/bot/session_latest.tar.gz
pm2 restart whatsapp-bot
```

### Update bot tanpa downtime

```bash
# Pull update
cd /opt/bots/whatsapp-telegram-bot
git pull

# Install dependencies
npm install --production

# Graceful reload (zero downtime)
pm2 reload whatsapp-bot
```

---

## 📈 Performance Tuning

### Puppeteer Optimization

Edit `src/botWhatsApp.js`:

```javascript
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});
```

### Node.js Memory Limit

```bash
# Start dengan memory limit 512MB
pm2 start src/index.js --name whatsapp-bot \
  --node-args="--max-old-space-size=512"
```

---

## ✅ Production Checklist

Sebelum go-live:

- [ ] VPS setup complete
- [ ] Bot running dengan PM2
- [ ] PM2 auto-start on reboot enabled
- [ ] Firewall configured
- [ ] Security hardened (SSH key, no root)
- [ ] Backup script setup
- [ ] Log rotation enabled
- [ ] Monitoring configured
- [ ] .env production ready
- [ ] WhatsApp session authenticated
- [ ] Telegram bot tested
- [ ] All features tested
- [ ] Emergency contact ready

---

## 🎉 Congratulations!

Bot Anda sekarang production-ready dan berjalan 24/7!

**Support:**

- Monitor via: `pm2 monit`
- Logs via: `pm2 logs whatsapp-bot`
- Restart via: `pm2 restart whatsapp-bot`

---

**Stay Online! 🚀**

Version: 2.0.0  
Last Updated: 2025-11-11
