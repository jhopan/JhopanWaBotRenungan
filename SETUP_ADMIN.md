# 🔐 Cara Setup Admin Bot

## Langkah 1: Dapatkan Telegram User ID Anda

Ada 3 cara untuk mendapatkan Telegram User ID:

### Cara 1: Menggunakan Bot @userinfobot

1. Buka Telegram
2. Cari bot **@userinfobot**
3. Klik Start
4. Bot akan mengirim ID Anda, contoh: `Your ID: 123456789`

### Cara 2: Menggunakan Bot @RawDataBot

1. Buka Telegram
2. Cari bot **@RawDataBot**
3. Klik Start
4. Lihat bagian `"id": 123456789`

### Cara 3: Langsung dari Bot Anda (Recommended)

1. Tambahkan kode berikut sementara di `botTelegram.js`:

```javascript
bot.onText(/\/myid/i, (msg) => {
  bot.sendMessage(msg.chat.id, `Your User ID: ${msg.from.id}`);
});
```

2. Jalankan bot, lalu ketik `/myid` di chat
3. Bot akan membalas dengan User ID Anda

## Langkah 2: Tambahkan ke File .env

Edit file `.env` dan tambahkan User ID admin:

```env
# Satu admin
ADMIN_TELEGRAM_IDS=123456789

# Multiple admin (pisahkan dengan koma)
ADMIN_TELEGRAM_IDS=123456789,987654321,456789123
```

## Langkah 3: Restart Bot

```bash
# Stop bot (Ctrl+C)
# Start ulang
npm start
```

## Langkah 4: Test

1. Buka Telegram
2. Chat dengan bot Anda
3. Ketik `/start`
4. Jika berhasil, Anda akan melihat: ✅ **Selamat datang Admin @username!**

## ⚠️ Troubleshooting

### Bot tidak merespons

- Pastikan TELEGRAM_BOT_TOKEN sudah benar di `.env`
- Cek console, apakah ada error?

### Akses Ditolak padahal sudah setup

- Pastikan User ID di `.env` **TIDAK ada spasi berlebih**
- Format benar: `123456789,987654321` ✅
- Format salah: `123456789 , 987654321` ❌

### Cara menambah admin baru

1. Minta User ID orang tersebut
2. Tambahkan ke `.env` dengan koma
3. Restart bot

### Cara menghapus admin

1. Hapus User ID dari `.env`
2. Restart bot

## 🔒 Tips Keamanan

1. **Jangan share file .env ke publik**
2. **Backup User ID admin** di tempat aman
3. **Batasi jumlah admin** hanya yang dipercaya
4. **Monitor log** untuk aktivitas mencurigakan

## 📝 Format Lengkap .env

```env
TELEGRAM_BOT_TOKEN=123456:ABCdefGHIjklMNOpqrSTUvwxYZ
GEMINI_API_KEY=AIzaSyABC123xyz
GOOGLE_SERVICE_ACCOUNT=./credentials.json
SPREADSHEET_ID=1ABC123xyz
TIMEZONE=Asia/Makassar
RENUNGAN_GROUP_ID=628123456789@c.us
RENUNGAN_TIME=08:00

# Admin Telegram User IDs
ADMIN_TELEGRAM_IDS=123456789,987654321
```

---

**Selamat! Bot Anda sekarang dilindungi dengan sistem admin.** 🎉
