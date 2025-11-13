# 🛠️ Tools untuk WhatsApp Telegram Bot

Folder ini berisi utility tools untuk membantu setup dan maintenance bot.

## 📋 Daftar Tools

### 1. getUserId.js

**Fungsi:**
Tool untuk mendapatkan Telegram User ID dengan mudah.

**Cara Pakai:**

```bash
# Jalankan tool
node tools/getUserId.js

# Di Telegram, chat dengan bot Anda
# Ketik: /myid

# Bot akan reply dengan User ID lengkap
```

**Output:**

```
🆔 Informasi Akun Anda

👤 Username: @johndoe
🔢 User ID: 123456789
💬 Chat ID: 123456789

📋 Cara Setup sebagai Admin:
1. Copy User ID di atas
2. Buka file .env
3. Tambahkan ke ADMIN_TELEGRAM_IDS
```

**Kapan Digunakan:**

- Setup admin baru
- Lupa User ID
- Troubleshooting access control

---

## 🔧 Tool Lainnya (Coming Soon)

### 2. testScheduler.js (Planned)

Test scheduler tanpa perlu tunggu jadwal sebenarnya.

### 3. checkConnections.js (Planned)

Monitor status koneksi WhatsApp dan Telegram.

### 4. backupData.js (Planned)

Backup semua data (schedule, verses, birthdays).

### 5. validateEnv.js (Planned)

Validasi file .env sebelum menjalankan bot.

---

## 💡 Cara Menambah Tool Baru

1. Buat file `.js` di folder `tools/`
2. Tambahkan dokumentasi di README ini
3. Test tool tersebut
4. Commit ke repository

---

**Happy Tooling! 🎉**
