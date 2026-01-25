#!/bin/bash

# Setup Script untuk GCP e2-micro (958MB RAM, 2 vCPU)
# Bot WhatsApp Renungan Harian v5.2 - Cloudflare Worker Webhook
# Optimized untuk 1GB egress/month

echo "========================================="
echo "  Setup Bot Renungan v5.2"
echo "  GCP Free Tier + Cloudflare Worker"
echo "========================================="
echo ""

# 1. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 (LTS)
echo "📦 Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Chromium
echo "📦 Installing Chromium..."
sudo apt install -y chromium-browser

# 4. Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# 5. Setup Swap (1GB) - PENTING untuk stability
echo "💾 Setting up 1GB Swap..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap 1GB created"
else
    echo "⚠️ Swap already exists"
fi

# 6. Optimize swappiness
echo "⚙️ Optimizing swappiness..."
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# 7. Install dependencies (asumsi sudah di dalam folder repo)
echo "📦 Installing Node.js dependencies..."
npm install --production

# 8. Setup Firewall untuk Webhook (port 3000)
echo "🔥 Setting up Firewall..."
gcloud compute firewall-rules create allow-webhook \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow webhook from Cloudflare Worker" 2>/dev/null || echo "⚠️ Firewall rule already exists"

# 9. Setup environment variables
echo "⚙️ Setting up environment variables..."
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Environment Variables Configuration
# Bot Renungan Harian - WhatsApp + Telegram

# ============================================
# TIMEZONE
# ============================================
TIMEZONE=Asia/Makassar

# ============================================
# TELEGRAM BOT
# ============================================
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_from_botfather
ADMIN_TELEGRAM_IDS=123456789

# ============================================
# WEBHOOK MODE (RECOMMENDED untuk GCP Free Tier)
# ============================================
# Webhook mode hemat bandwidth: ~4 MB/month vs Polling: ~750 MB/month
# URL Cloudflare Worker (deploy dulu di step selanjutnya):
WEBHOOK_URL=https://your-worker-name.workers.dev
WEBHOOK_PORT=3000

# ============================================
# AI PROVIDER - Gemini 2.5 Flash-Lite
# ============================================
# Limit: 15 req/min, 1000 req/day, 250k token/min
# Format: key1,key2,key3 (pisahkan dengan koma untuk rotasi otomatis)
GEMINI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-2.5-flash-lite

# ============================================
# RENUNGAN SETTINGS (opsional, bisa set via Telegram)
# ============================================
RENUNGAN_GROUP_ID=
RENUNGAN_TIME=08:00

# ============================================
# CHROME PATH (untuk Linux/GCP)
# ============================================
CHROME_PATH=/usr/bin/chromium-browser
EOF
    echo "⚠️ Please edit .env file with your credentials!"
    echo "   Run: nano .env"
else
    echo "✅ .env already exists"
fi

# 10. Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# 11. Get External IP
echo ""
echo "📡 Getting External IP..."
EXTERNAL_IP=$(curl -s ifconfig.me)
echo "   External IP: $EXTERNAL_IP"

echo ""
echo "========================================="
echo "✅ Setup completed!"
echo "========================================="
echo ""
echo "📊 Current memory status:"
free -h
echo ""
echo "🌐 PENTING: Setup Cloudflare Worker"
echo "========================================="
echo ""
echo "Step 1: Buka https://dash.cloudflare.com/workers"
echo "   - Klik 'Create a Worker'"
echo "   - Copy paste script dari: cloudflare-worker.js"
echo ""
echo "Step 2: Edit Worker, ganti IP:"
echo "   const GCP_VM_IP = \"$EXTERNAL_IP\""
echo ""
echo "Step 3: Deploy Worker, dapat URL:"
echo "   https://your-worker.workers.dev"
echo ""
echo "Step 4: Edit .env dengan credentials"
echo "   nano .env"
echo "   - TELEGRAM_BOT_TOKEN=xxx"
echo "   - ADMIN_TELEGRAM_IDS=xxx"
echo "   - GEMINI_API_KEY=xxx"
echo "   - WEBHOOK_URL=https://your-worker.workers.dev (jika beda)"
echo ""
echo "Step 5: Start bot dengan PM2"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "📈 Bandwidth estimate:"
echo "   - Webhook + Worker: ~25MB/month ✅ (2.5% quota)"
echo "   - Polling:          ~750MB/month ❌ (75% quota)"
echo ""
echo "📝 Next:"
echo "   1. Edit .env: nano .env"
echo "   2. Deploy Cloudflare Worker"
echo "   3. Start: pm2 start ecosystem.config.js"
echo ""
