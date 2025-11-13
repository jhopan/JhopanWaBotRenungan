# 🎨 Visual Guide - WhatsApp Telegram Bot v2.1.0

## 📱 User Flow Diagram

### Flow 1: First Time Login

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN PERTAMA KALI                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Ketik /start │
                    └───────┬───────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │ Cek WhatsApp Status │
                  └─────────┬───────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ ❌ BELUM     │        │ ✅ SUDAH     │
        │    LOGIN     │        │    LOGIN     │
        └──────┬───────┘        └──────┬───────┘
               │                       │
               ▼                       ▼
    ┌──────────────────────┐   ┌──────────────────────┐
    │  📱 Tampil Pesan:    │   │  🔄 Sinkronisasi:    │
    │                      │   │                      │
    │  "WhatsApp belum     │   │  • Loading...        │
    │   terhubung"         │   │  • Kontak: 150       │
    │                      │   │  • Grup: 25          │
    │  Instruksi:          │   │  • ✅ Selesai!       │
    │  1. Buka WA          │   └──────────┬───────────┘
    │  2. Scan QR          │              │
    │  3. /start lagi      │              │
    └──────────────────────┘              │
               │                          │
               ▼                          │
    ┌──────────────────────┐              │
    │  Scan QR di Console  │              │
    └──────────┬───────────┘              │
               │                          │
               ▼                          │
    ┌──────────────────────┐              │
    │    Ketik /start      │              │
    └──────────┬───────────┘              │
               │                          │
               └──────────────────────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │   🏠 MENU UTAMA     │
                  │                     │
                  │  💬 Kirim Pesan     │
                  │  📖 Renungan        │
                  │  🎂 Ulang Tahun     │
                  │  🔄 Resync          │
                  │  🚪 Logout          │
                  └─────────────────────┘
```

---

### Flow 2: Kirim Pesan Berjadwal

```
┌─────────────────────────────────────────────────────────────┐
│                   KIRIM PESAN BERJADWAL                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Klik "💬 Kirim      │
                │   Pesan Berjadwal"    │
                └───────────┬───────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │      PILIH TIPE PENERIMA      │
            │                               │
            │  👤 Pesan Pribadi            │
            │  👥 Pesan Grup               │
            │  📢 Siaran/Broadcast         │
            └───────────┬───────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  👤 PRIBADI   │ │   👥 GRUP     │ │ 📢 SIARAN     │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  List Kontak  │ │   List Grup   │ │  Input Nomor  │
│               │ │               │ │               │
│ John (081..)  │ │ Family (15)   │ │ 6281xxx,      │
│ Jane (089..)  │ │ Work (50)     │ │ 6289xxx       │
│ ...           │ │ ...           │ │               │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Pilih: John  │ │ Pilih: Family │ │ Confirm: 2    │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │   📝 ATUR PESAN     │
                │                     │
                │  Format:            │
                │  YYYY-MM-DD HH:mm|  │
                │  tipe|isi pesan     │
                │                     │
                │  Contoh:            │
                │  2025-11-12 15:00|  │
                │  teks|Halo test     │
                └─────────┬───────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │  ✅ KONFIRMASI      │
                │                     │
                │  📅 15 Nov, 15:00   │
                │  📝 Teks            │
                │  💬 Halo test       │
                │                     │
                │  Jadwal tersimpan!  │
                └─────────────────────┘
```

---

### Flow 3: Menu Logout

```
┌─────────────────────────────────────────────────────────────┐
│                        LOGOUT FLOW                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Klik "🚪 Logout     │
                │      WhatsApp"        │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   ⚠️ KONFIRMASI      │
                │                       │
                │  "Apakah Anda yakin   │
                │   ingin logout?"      │
                │                       │
                │  ✅ Ya, Logout        │
                │  ❌ Batal             │
                └───────────┬───────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌───────────────┐       ┌───────────────┐
        │  ❌ BATAL     │       │  ✅ LOGOUT    │
        └───────┬───────┘       └───────┬───────┘
                │                       │
                ▼                       ▼
        ┌───────────────┐       ┌───────────────┐
        │  Kembali ke   │       │  1. Disconnect│
        │  Menu Utama   │       │  2. Hapus     │
        └───────────────┘       │     Session   │
                                │  3. Pesan:    │
                                │     "Logout   │
                                │      Berhasil"│
                                └───────┬───────┘
                                        │
                                        ▼
                                ┌───────────────┐
                                │  Ketik /start │
                                │  untuk login  │
                                │  ulang        │
                                └───────────────┘
```

---

## 🎯 Menu Structure

```
🏠 MENU UTAMA
│
├─ 💬 Kirim Pesan Berjadwal
│  ├─ 👤 Pesan Pribadi
│  │  └─ [List Kontak] → Pilih → Atur Pesan
│  ├─ 👥 Pesan Grup
│  │  └─ [List Grup] → Pilih → Atur Pesan
│  ├─ 📢 Siaran/Broadcast
│  │  └─ Input Nomor → Konfirm → Atur Pesan
│  └─ 📋 Lihat Jadwal
│     └─ [List Jadwal Tersimpan]
│
├─ 📖 Renungan Harian
│  └─ Info otomatis jam 08:00
│
├─ 🎂 Ulang Tahun
│  └─ Info otomatis jam 07:00
│
├─ 🔄 Sinkronisasi Ulang
│  └─ Refresh kontak & grup
│
└─ 🚪 Logout WhatsApp
   └─ Konfirmasi → Logout
```

---

## 💾 Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                    WHATSAPP CLIENT                       │
└────────────────┬─────────────────────────────────────────┘
                 │
                 │ Sync
                 ▼
┌──────────────────────────────────────────────────────────┐
│              ADMIN SESSION (Memory Map)                  │
│                                                          │
│  adminSessions.set(userId, {                            │
│    waLoggedIn: true,                                    │
│    contacts: [...],                                     │
│    groups: [...],                                       │
│    lastSync: Date                                       │
│  })                                                     │
└────────────────┬─────────────────────────────────────────┘
                 │
                 │ Save
                 ▼
┌──────────────────────────────────────────────────────────┐
│           admin_sessions.json (Persistence)              │
│                                                          │
│  [                                                       │
│    [userId, { waLoggedIn, contacts, groups, ... }]      │
│  ]                                                       │
└────────────────┬─────────────────────────────────────────┘
                 │
                 │ Load on Restart
                 ▼
┌──────────────────────────────────────────────────────────┐
│              TELEGRAM BOT HANDLERS                       │
│                                                          │
│  • /start → Check session → Show menu                   │
│  • Select contact → Setup message                       │
│  • Select group → Setup message                         │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 State Management

```
SESSION STATE LIFECYCLE:

1️⃣ INITIAL STATE (No Session)
   adminSessions.size = 0
   ↓

2️⃣ FIRST LOGIN
   /start → WA Check → Not Connected
   → Show login instructions
   ↓

3️⃣ AFTER QR SCAN
   /start → WA Check → Connected
   → Sync Data (contacts + groups)
   → Create Session
   adminSessions.set(userId, {...})
   → Save to file
   ↓

4️⃣ ACTIVE STATE
   Session exists in memory
   Menu fully functional
   Can schedule messages
   ↓

5️⃣ RESYNC
   Manual trigger: "🔄 Sinkronisasi Ulang"
   → Refresh contacts & groups
   → Update session
   ↓

6️⃣ LOGOUT
   User clicks "🚪 Logout"
   → Confirm
   → waClient.logout()
   → adminSessions.delete(userId)
   → Remove from file
   → Back to INITIAL STATE
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────┐
│                   INCOMING MESSAGE                       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │  Check User   │
                │     ID        │
                └───────┬───────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌───────────────┐       ┌───────────────┐
    │  ❌ NOT       │       │  ✅ ADMIN     │
    │    ADMIN      │       │               │
    └───────┬───────┘       └───────┬───────┘
            │                       │
            ▼                       ▼
    ┌───────────────┐       ┌───────────────┐
    │  Deny Access  │       │  Check WA     │
    │  Send Alert   │       │  Login Status │
    │  Log Event    │       └───────┬───────┘
    └───────────────┘               │
                            ┌───────┴────────┐
                            │                │
                            ▼                ▼
                    ┌───────────┐    ┌───────────┐
                    │ Not Login │    │  Logged   │
                    └─────┬─────┘    └─────┬─────┘
                          │                │
                          ▼                ▼
                    ┌───────────┐    ┌───────────┐
                    │  Show     │    │   Show    │
                    │  Login    │    │   Menu    │
                    │  Guide    │    │           │
                    └───────────┘    └───────────┘
```

---

## 📱 Screen Mockups

### Screen 1: Not Logged In

```
┌─────────────────────────────────────┐
│  👋 Selamat datang Admin @john!     │
│                                     │
│  ⚠️ WhatsApp belum terhubung       │
│                                     │
│  📱 Cara Login:                     │
│  1. Buka WhatsApp di HP             │
│  2. Tap Menu > Perangkat Tertaut    │
│  3. Scan QR Code di console         │
│                                     │
│  🔄 Setelah scan, ketik /start      │
└─────────────────────────────────────┘
```

### Screen 2: Syncing

```
┌─────────────────────────────────────┐
│  🔄 Menyinkronkan Data WhatsApp...  │
│                                     │
│  Mohon tunggu, sedang memuat:       │
│  • 📇 Kontak                        │
│  • 👥 Grup                          │
│  • 📢 Channel                       │
│                                     │
│         [Loading Animation]         │
└─────────────────────────────────────┘
```

### Screen 3: Sync Complete

```
┌─────────────────────────────────────┐
│  ✅ Sinkronisasi Selesai!          │
│                                     │
│  📇 Kontak: 150                     │
│  👥 Grup: 25                        │
│                                     │
│  Panel kontrol siap digunakan! 🚀  │
└─────────────────────────────────────┘
```

### Screen 4: Main Menu

```
┌─────────────────────────────────────┐
│  🤖 Panel Kontrol WhatsApp Bot      │
│                                     │
│  👋 Selamat datang Admin @john!     │
│                                     │
│  ✅ Status: WhatsApp Terhubung      │
│  📊 Data tersinkronisasi            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💬 Kirim Pesan Berjadwal    │   │
│  ├─────────────────────────────┤   │
│  │ 📖 Renungan Harian          │   │
│  ├─────────────────────────────┤   │
│  │ 🎂 Ulang Tahun              │   │
│  ├─────────────────────────────┤   │
│  │ 🔄 Sinkronisasi Ulang       │   │
│  ├─────────────────────────────┤   │
│  │ 🚪 Logout WhatsApp          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Screen 5: Schedule Menu

```
┌─────────────────────────────────────┐
│  💬 Kirim Pesan Berjadwal           │
│                                     │
│  Pilih tipe penerima:               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Pesan Pribadi            │   │
│  ├─────────────────────────────┤   │
│  │ 👥 Pesan Grup               │   │
│  ├─────────────────────────────┤   │
│  │ 📢 Siaran/Channel           │   │
│  ├─────────────────────────────┤   │
│  │ 📋 Lihat Jadwal             │   │
│  ├─────────────────────────────┤   │
│  │ ⬅️ Kembali                  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Screen 6: Contact List

```
┌─────────────────────────────────────┐
│  👤 Pilih Kontak Pribadi            │
│                                     │
│  Total: 150 kontak                  │
│  (Menampilkan 50 pertama)           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ John Doe (081234567890)     │   │
│  ├─────────────────────────────┤   │
│  │ Jane Smith (089876543210)   │   │
│  ├─────────────────────────────┤   │
│  │ Bob Wilson (087123456789)   │   │
│  ├─────────────────────────────┤   │
│  │ ...                         │   │
│  ├─────────────────────────────┤   │
│  │ ⬅️ Kembali                  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

**Visual Guide v2.1.0**  
Created: November 12, 2025  
For: WhatsApp Telegram Bot
