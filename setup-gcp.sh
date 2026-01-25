#!/bin/bash

# Setup Script untuk GCP e2-micro (958MB RAM, 2 vCPU)
# Bot WhatsApp Renungan Harian v5.3 - Cloudflare Tunnel
# Optimized untuk 1GB egress/month

echo "========================================="
echo "  Setup Bot Renungan v5.3"
echo "  GCP Free Tier + Cloudflare Tunnel"
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

# 5. Install Cloudflared (Cloudflare Tunnel)
echo "📦 Installing Cloudflared..."
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
echo "✅ Cloudflared installed: $(cloudflared --version)"

# 6. Setup Swap (1GB) - PENTING untuk stability
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

# 7. Optimize swappiness
echo "⚙️ Optimizing swappiness..."
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf 2>/dev/null

# 8. Install dependencies (asumsi sudah di dalam folder repo)
echo "📦 Installing Node.js dependencies..."
npm install --production

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
# WEBHOOK MODE (via Cloudflare Tunnel)
# ============================================
# Webhook mode hemat bandwidth: ~10 MB/month vs Polling: ~215 MB/month
# URL dari Cloudflare Tunnel (setup dengan: cloudflared tunnel login)
WEBHOOK_URL=https://your-tunnel-subdomain.yourdomain.com
WEBHOOK_PORT=3000

# ============================================
# AI PROVIDER - Gemini 2.5 Flash-Lite
# ============================================
# Limit: 15 req/min, 1000 req/day, 250k token/min
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

echo ""
echo "========================================="
echo "✅ Setup completed!"
echo "========================================="
echo ""
echo "📊 Current memory status:"
free -h
echo ""
echo "🌐 NEXT: Setup Cloudflare Tunnel"
echo "========================================="
echo ""
echo "Step 1: Login ke Cloudflare"
echo "   cloudflared tunnel login"
echo "   (Copy URL yang muncul, buka di browser, authorize)"
echo ""
echo "Step 2: Buat Tunnel"
echo "   cloudflared tunnel create wa-renungan"
echo "   (Catat Tunnel ID yang muncul!)"
echo ""
echo "Step 3: Buat config file"
echo "   nano ~/.cloudflared/config.yml"
echo ""
echo "   Isi dengan:"
echo "   tunnel: YOUR_TUNNEL_ID"
echo "   credentials-file: /home/$(whoami)/.cloudflared/YOUR_TUNNEL_ID.json"
echo ""
echo "   ingress:"
echo "     - hostname: wa-renungan.yourdomain.com"
echo "       service: http://localhost:3000"
echo "     - service: http_status:404"
echo ""
echo "Step 4: Route DNS"
echo "   cloudflared tunnel route dns wa-renungan wa-renungan"
echo ""
echo "Step 5: Install sebagai service"
echo "   sudo cloudflared service install"
echo "   sudo systemctl start cloudflared"
echo "   sudo systemctl enable cloudflared"
echo ""
echo "Step 6: Edit .env"
echo "   nano .env"
echo "   - TELEGRAM_BOT_TOKEN=xxx"
echo "   - ADMIN_TELEGRAM_IDS=xxx"
echo "   - GEMINI_API_KEY=xxx"
echo "   - WEBHOOK_URL=https://wa-renungan.yourdomain.com"
echo ""
echo "Step 7: Start bot"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup (copy & jalankan perintah yang muncul)"
echo ""
echo "📈 Bandwidth estimate (Webhook + Tunnel):"
echo "   ~10MB/month ✅ (1% dari 1GB free tier)"
echo ""
