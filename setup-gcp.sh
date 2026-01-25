#!/bin/bash

# Setup Script untuk GCP e2-micro (958MB RAM, 2 vCPU)
# Bot WhatsApp Renungan Harian v5.2 - Webhook Mode
# Optimized untuk 1GB egress/month

echo "=================================="
echo "  Setup Bot Renungan v5.2"
echo "  GCP Free Tier + Webhook Mode"
echo "=================================="
echo ""

# 1. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Chromium
echo "📦 Installing Chromium..."
sudo apt install -y chromium-browser

# 4. Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# 5. Install Cloudflared (untuk Webhook tunnel GRATIS)
echo "📦 Installing Cloudflared..."
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb

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
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# 8. Clone repository (atau bisa manual upload)
echo "📥 Cloning repository..."
if [ ! -d "whatsapp-telegram-bot" ]; then
    git clone https://github.com/jhopan/JhopanWaBotRenungan.git whatsapp-telegram-bot
    cd whatsapp-telegram-bot
else
    cd whatsapp-telegram-bot
    git pull
fi

# 9. Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install --production

# 10. Setup environment variables
echo "⚙️ Setting up environment variables..."
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Timezone
TIMEZONE=Asia/Makassar

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_TELEGRAM_IDS=your_telegram_user_id

# WEBHOOK MODE (WAJIB untuk hemat bandwidth!)
# Jalankan: cloudflared tunnel --url http://localhost:3000
# Copy URL yang muncul ke sini
WEBHOOK_URL=
WEBHOOK_PORT=3000

# AI Provider (pilih salah satu)
# OpenRouter (recommended)
OPENROUTER_API_KEY=your_openrouter_key
AI_MODEL=moonshotai/kimi-k2:free

# Atau Gemini
# GEMINI_API_KEY=your_gemini_key

# Renungan (optional, bisa set via Telegram)
RENUNGAN_GROUP_ID=
RENUNGAN_TIME=08:00

# Chrome Path
CHROME_PATH=/usr/bin/chromium-browser
EOF
    echo "⚠️ Please edit .env file with your credentials!"
    echo "   Run: nano .env"
else
    echo "✅ .env already exists"
fi

# 11. Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

echo ""
echo "=================================="
echo "✅ Setup completed!"
echo "=================================="
echo ""
echo "📊 Current memory status:"
free -h
echo ""
echo "🌐 PENTING: Setup Webhook untuk hemat bandwidth!"
echo ""
echo "Step 1: Jalankan Cloudflare Tunnel"
echo "   cloudflared tunnel --url http://localhost:3000"
echo ""
echo "Step 2: Copy URL yang muncul (contoh: https://xxx.trycloudflare.com)"
echo ""
echo "Step 3: Tambahkan ke .env"
echo "   nano .env"
echo "   WEBHOOK_URL=https://xxx.trycloudflare.com"
echo ""
echo "Step 4: Start bot dengan PM2"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "📈 Bandwidth estimate:"
echo "   - Dengan Webhook: ~25MB/month ✅"
echo "   - Tanpa Webhook:  ~750MB/month ❌"
echo ""
