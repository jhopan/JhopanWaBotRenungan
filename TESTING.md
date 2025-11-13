# 🧪 Testing Guide - WhatsApp Telegram Bot

## 📋 Daftar Test yang Harus Dilakukan

### ✅ 1. Test Setup Awal

#### 1.1 Instalasi Dependencies

```bash
cd whatsapp-telegram-bot
npm install
```

**Expected:**

- Semua package terinstall tanpa error
- Folder `node_modules` terbuat

#### 1.2 Konfigurasi .env

```bash
# Check file .env ada
dir .env
```

**Expected:**

- File .env exists
- Semua variable diisi

---

### 🔐 2. Test Verifikasi Admin

#### 2.1 Setup Admin ID

**Langkah:**

1. Cari bot **@userinfobot** di Telegram
2. Klik Start
3. Copy User ID Anda (contoh: 123456789)
4. Edit `.env`:
   ```env
   ADMIN_TELEGRAM_IDS=123456789
   ```

#### 2.2 Test Admin Access

**Test Case 1: Admin berhasil masuk**

```
Action: Ketik /start di bot
Expected:
✅ Selamat datang Admin @username!
Panel kontrol Bot WhatsApp siap digunakan.
[Muncul 3 tombol menu]
```

**Test Case 2: Non-admin ditolak**

```
Action: Minta teman ketik /start (non-admin)
Expected:
❌ Akses Ditolak
Maaf @teman, hanya admin yang dapat menggunakan bot ini.
🔒 Hubungi administrator untuk mendapatkan akses.
```

**Test Case 3: Multiple admin**

```
Setup: ADMIN_TELEGRAM_IDS=123456789,987654321
Action: Kedua user ketik /start
Expected: Keduanya bisa masuk
```

#### 2.3 Test Button Access Control

**Test Case 4: Admin klik button**

```
Action: Klik "🕒 Kirim Pesan Berjadwal"
Expected: Muncul submenu (Tambah/Lihat/Kembali)
```

**Test Case 5: Non-admin klik button**

```
Action: Non-admin coba klik button
Expected:
- Alert popup: "❌ Akses ditolak! Hanya admin."
- Pesan akses ditolak muncul
```

**Console Output Expected:**

```
⛔ Akses ditolak untuk user: namauser (ID: 111222333)
⛔ Callback ditolak untuk user: namauser (ID: 111222333)
```

---

### 🔄 3. Test Auto-Reconnect WhatsApp

#### 3.1 Normal Connection

**Test Case 6: First Connect**

```
Action: npm start
Expected:
📱 Scan QR Code berikut:
[QR Code muncul]

(Setelah scan)
🔐 WhatsApp terautentikasi!
✅ WhatsApp siap!
```

#### 3.2 Reconnect After Disconnect

**Test Case 7: WiFi dimatikan**

```
Action:
1. Bot running
2. Matikan WiFi
3. Tunggu

Expected Console:
⚠️ WhatsApp terputus. Alasan: [reason]
🔄 Reconnect attempt #1 dalam 5 detik...
⏳ Menunggu jaringan tersedia...
```

**Test Case 8: WiFi dinyalakan**

```
Action: Nyalakan WiFi kembali
Expected:
✅ Reconnect berhasil!
✅ WhatsApp siap!
```

#### 3.3 Multiple Reconnect Attempts

**Test Case 9: Exponential backoff**

```
Action: Matikan WiFi 5 menit
Expected Console:
🔄 Reconnect attempt #1 dalam 5 detik...
🔄 Reconnect attempt #2 dalam 10 detik...
🔄 Reconnect attempt #3 dalam 20 detik...
🔄 Reconnect attempt #4 dalam 40 detik...
🔄 Reconnect attempt #5 dalam 60 detik...
🔄 Reconnect attempt #6 dalam 60 detik... (max)
```

**Test Case 10: Session rusak**

```
Action:
1. Hapus folder .wwebjs_auth
2. npm start

Expected:
📱 Scan QR Code berikut:
(Minta scan ulang)
```

---

### 📅 4. Test Scheduler Pesan Berjadwal

#### 4.1 Tambah Jadwal

**Test Case 11: Tambah jadwal teks**

```
Action:
1. Klik "🕒 Kirim Pesan Berjadwal"
2. Klik "➕ Tambah Jadwal"
3. Input: 6281234567890@c.us|2025-11-11 15:30|teks|Halo test

Expected:
✅ Jadwal berhasil ditambahkan!

File schedule.json:
[
  {
    "to": "6281234567890@c.us",
    "time": "2025-11-11 15:30",
    "type": "teks",
    "content": "Halo test",
    "sent": false
  }
]
```

#### 4.2 Lihat Jadwal

**Test Case 12: List jadwal**

```
Action: Klik "📋 Lihat Jadwal"
Expected:
📋 Jadwal Tersimpan:
1. 6281234567890@c.us | 2025-11-11 15:30 | teks
```

#### 4.3 Scheduler Running

**Test Case 13: Pesan terkirim tepat waktu (online)**

```
Setup: Jadwal jam 15:30
Action: Tunggu sampai 15:30
Expected Console:
✅ Pesan terjadwal terkirim ke 6281234567890@c.us

File schedule.json (sent jadi true):
"sent": true
```

**Test Case 14: Scheduler saat offline**

```
Setup:
- Jadwal jam 15:30
- Matikan WiFi sebelum jam 15:30
Action: Tunggu sampai 15:30
Expected Console:
⏳ Scheduler menunggu WhatsApp reconnect...
⏳ Scheduler menunggu WhatsApp reconnect...
(terus loop sampai online)
```

**Test Case 15: Scheduler online setelah offline**

```
Setup: Lanjutan test 14
Action: Nyalakan WiFi
Expected:
✅ Reconnect berhasil!
✅ Pesan terjadwal terkirim ke 6281234567890@c.us
```

---

### 📖 5. Test Renungan Harian

#### 5.1 Setup Renungan

**Test Case 16: Konfigurasi**

```
.env:
RENUNGAN_GROUP_ID=628123456789@c.us
RENUNGAN_TIME=08:00
GEMINI_API_KEY=your_key

Expected Console saat startup:
📖 Renungan harian dijadwalkan jam 08:00
```

#### 5.2 Renungan Terkirim (Manual Test)

**Test Case 17: Ubah jam untuk test cepat**

```
Action:
1. Edit renunganHandler.js
2. Ubah cron: '0 8 * * *' → '*/5 * * * *' (tiap 5 menit)
3. Restart bot
4. Tunggu 5 menit

Expected:
📖 *Renungan Harian (11 November 2025)*

[Isi renungan dari Gemini AI]

Yohanes 3:16

✅ Renungan harian terkirim ke 628123456789@c.us
```

#### 5.3 Renungan Saat Offline

**Test Case 18: Offline handling**

```
Setup: Bot offline saat jam renungan
Expected Console:
⏳ Renungan menunggu WhatsApp reconnect...

(Setelah online)
✅ Renungan harian terkirim ke 628123456789@c.us
```

---

### 🎂 6. Test Birthday Reminder

#### 6.1 Setup Google Sheets

**Test Case 19: Google Sheets format**

```
Sheets format:
| Nama  | Tanggal | Chat ID              |
|-------|---------|----------------------|
| John  | 11-11   | 6281234567890@c.us  |
| Mary  | 12-11   | 6289876543210@c.us  |

.env:
SPREADSHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT=./credentials.json
```

#### 6.2 Birthday Terkirim

**Test Case 20: Birthday hari ini**

```
Setup: Tanggal hari ini = 11-11
Expected Console (jam 07:00):
✅ Ucapan ultah terkirim ke John
🎂 Selesai mengirim 1 ucapan ulang tahun.

WhatsApp:
🎉 *Selamat ulang tahun, John!* 🎂
Semoga selalu diberkati dan bertumbuh dalam kasih Tuhan.
```

**Test Case 21: Tidak ada birthday**

```
Setup: Tanggal hari ini = 10-11 (tidak ada yang ultah)
Expected Console:
ℹ️ Tidak ada ulang tahun hari ini.
```

---

### 🚨 7. Test Error Handling

#### 7.1 Unhandled Rejection

**Test Case 22: Promise rejection**

```
Action: Force error di code (contoh: akses undefined variable)
Expected:
❌ Unhandled Rejection: [error detail]
🔄 Bot tetap berjalan...

Bot TIDAK crash!
```

#### 7.2 Uncaught Exception

**Test Case 23: Runtime exception**

```
Expected:
❌ Uncaught Exception: [error detail]
🔄 Bot tetap berjalan...

Bot TIDAK crash!
```

#### 7.3 Graceful Shutdown

**Test Case 24: Ctrl+C**

```
Action: Tekan Ctrl+C
Expected:
⏸️  Bot dihentikan oleh user
(Exit cleanly)
```

---

### 📊 8. Test Production Readiness

#### 8.1 24/7 Running

**Test Case 25: Long running**

```
Action: Biarkan bot running 24 jam
Check:
- Memory usage stabil (~300MB)
- Tidak ada memory leak
- Semua fitur masih jalan
```

#### 8.2 Multiple Schedules

**Test Case 26: Load test**

```
Action: Tambah 50 jadwal berbeda
Expected:
- Semua tersimpan di schedule.json
- Semua terkirim tepat waktu
- Tidak ada yang terlewat
```

---

## 🎯 Summary Checklist

Print checklist ini dan centang setiap test:

### Admin Verification

- [ ] Admin bisa masuk
- [ ] Non-admin ditolak
- [ ] Multiple admin works
- [ ] Button access control

### Auto-Reconnect

- [ ] First connect berhasil
- [ ] Reconnect after disconnect
- [ ] Exponential backoff works
- [ ] Retry unlimited

### Scheduler

- [ ] Tambah jadwal berhasil
- [ ] Lihat jadwal works
- [ ] Pesan terkirim on time
- [ ] Wait saat offline
- [ ] Kirim setelah online

### Renungan

- [ ] Setup works
- [ ] Terkirim tepat waktu
- [ ] Handle offline

### Birthday

- [ ] Google Sheets works
- [ ] Kirim ultah works
- [ ] Handle no birthday

### Error Handling

- [ ] Unhandled rejection handled
- [ ] Uncaught exception handled
- [ ] Graceful shutdown works

### Production

- [ ] 24/7 stable
- [ ] Memory usage OK
- [ ] Load test passed

---

## 🐛 Bug Report Template

Jika menemukan bug, gunakan format ini:

```
**Bug Description:**
[Jelaskan bug]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
[Apa yang seharusnya terjadi]

**Actual Behavior:**
[Apa yang terjadi]

**Environment:**
- Node version:
- OS:
- Bot version:

**Console Output:**
```

[Paste console output]

```

**Screenshots:**
[Jika ada]
```

---

**Happy Testing! 🎉**

Version: 2.0.0  
Last Updated: 2025-11-11
