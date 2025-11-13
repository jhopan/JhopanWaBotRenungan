# 🧪 TESTING GUIDE v3.0.0

## Quick Testing Steps

### ✅ **Test 1: QR Code to Telegram**

**Steps:**

1. Buka Telegram bot Anda
2. Ketik: `/start`
3. **Expected:** Bot kirim foto QR Code
4. Scan QR dari HP WhatsApp
5. **Expected:** Notifikasi "✅ WhatsApp Terhubung!"
6. Ketik `/start` lagi
7. **Expected:** Menu utama muncul

**Status:**

- [ ] QR Code dikirim sebagai foto ✅/❌
- [ ] Scan berhasil ✅/❌
- [ ] Notifikasi muncul ✅/❌
- [ ] Menu muncul ✅/❌

---

### ✅ **Test 2: Input Nomor Manual**

**Steps:**

1. Di menu, klik "📝 Kirim Pesan Berjadwal"
2. Klik "👤 Pesan Pribadi"
3. **Expected:** Tombol "📝 Input Nomor Manual (08xxx)" muncul di atas
4. Klik tombol tersebut
5. Bot minta input nomor
6. Ketik: `08123456789` (ganti dengan nomor valid)
7. **Expected:** Bot convert ke `628123456789`
8. **Expected:** Bot cek nomor di WhatsApp
9. Jika valid: Tombol "📝 Atur Pesan" muncul
10. Jika tidak valid: Error message

**Test Cases:**

- [ ] Input `08123456789` → Convert ✅
- [ ] Input `628123456789` → Direct valid ✅
- [ ] Input `+628123456789` → Clean & valid ✅
- [ ] Input `081234` → Error (terlalu pendek) ✅
- [ ] Nomor tidak terdaftar WA → Error message ✅
- [ ] Nomor valid → Tersimpan di session ✅

---

### ✅ **Test 3: Join Grup Via Link**

**Steps:**

1. Di menu, klik "📝 Kirim Pesan Berjadwal"
2. Klik "👥 Pesan Grup"
3. **Expected:** Tombol "🔗 Join Grup Via Link" muncul di atas
4. Klik tombol tersebut
5. Bot minta input link
6. Copy link grup WhatsApp (buat test group atau minta dari teman)
7. Paste link: `https://chat.whatsapp.com/xxxxx`
8. **Expected:** Bot join grup
9. **Expected:** Nama grup & jumlah member muncul
10. **Expected:** Tombol "📝 Atur Pesan" muncul
11. Cek di WhatsApp → Bot sudah ada di grup

**Test Cases:**

- [ ] Link valid → Bot join ✅
- [ ] Link invalid → Error message ✅
- [ ] Bot sudah di grup → Error message ✅
- [ ] Grup info tersimpan ✅
- [ ] Restart bot → Grup masih ada di list ✅

---

### ✅ **Test 4: Sinkronisasi (No Error)**

**Steps:**

1. Di menu, klik "🔄 Sinkronisasi Ulang"
2. **Expected:** Proses sync tanpa error
3. **Expected:** Jumlah kontak & grup muncul
4. **Expected:** Tidak ada crash

**Check Console Log:**

```
🔄 Sinkronisasi data WhatsApp untuk admin 1491946180...
✅ Sinkronisasi selesai: XX kontak, YY grup
```

**NOT Expected:**

```
❌ Error sinkronisasi: Cannot read properties of undefined...
```

**Status:**

- [ ] Sync berjalan tanpa error ✅
- [ ] Kontak tanpa nama di-filter ✅
- [ ] Grup tanpa nama di-filter ✅
- [ ] Data tersimpan dengan benar ✅

---

### ✅ **Test 5: Persistent Session**

**Steps:**

1. Input nomor manual (contoh: 628123456789)
2. **Expected:** Nomor tersimpan
3. Join grup via link
4. **Expected:** Grup tersimpan
5. Check file: `src/data/admin_sessions.json`
6. **Expected:** Data ada di file
7. Restart bot (Ctrl+C, npm start)
8. Klik "📝 Kirim Pesan Berjadwal"
9. Klik "👤 Pesan Pribadi"
10. **Expected:** Nomor manual masih ada di list
11. Klik "👥 Pesan Grup"
12. **Expected:** Grup yang di-join masih ada di list

**Status:**

- [ ] Data tersimpan ke JSON ✅
- [ ] Restart bot → Data masih ada ✅
- [ ] No data loss ✅

---

### ✅ **Test 6: Full Schedule Flow (Manual Number)**

**Complete Flow:**

1. Input nomor manual: `08123456789`
2. Nomor valid ✅
3. Klik "📝 Atur Pesan"
4. Bot minta tipe pesan (teks/foto/pdf/file)
5. Ketik: `teks`
6. Bot minta isi pesan
7. Ketik: `Test pesan otomatis`
8. Bot minta jadwal (YYYY-MM-DD HH:mm)
9. Ketik: `2025-11-12 15:00`
10. **Expected:** Konfirmasi jadwal tersimpan
11. Tunggu jadwal tiba (atau edit schedule.json untuk testing cepat)
12. **Expected:** Pesan terkirim ke nomor tersebut

**Status:**

- [ ] Setup complete ✅
- [ ] Jadwal tersimpan ✅
- [ ] Pesan terkirim ✅

---

### ✅ **Test 7: Full Schedule Flow (Join Group)**

**Complete Flow:**

1. Join grup via link
2. Grup berhasil join ✅
3. Klik "📝 Atur Pesan"
4. Bot minta tipe pesan
5. Ketik: `teks`
6. Bot minta isi pesan
7. Ketik: `Halo grup! Ini pesan otomatis dari bot`
8. Bot minta jadwal
9. Ketik: `2025-11-12 15:05`
10. **Expected:** Konfirmasi jadwal tersimpan
11. Tunggu jadwal tiba
12. **Expected:** Pesan terkirim ke grup
13. Cek di WhatsApp grup → Pesan muncul

**Status:**

- [ ] Setup complete ✅
- [ ] Jadwal tersimpan ✅
- [ ] Pesan terkirim ke grup ✅

---

## 🐛 Common Issues & Solutions

### Issue 1: QR Code tidak dikirim

**Cause:** Bot reference tidak tersimpan  
**Solution:**

1. Check `src/index.js` - pastikan bot di-import
2. Check `src/botWhatsApp.js` - pastikan `initWhatsApp(bot)` terima parameter
3. Restart bot

### Issue 2: Error "Cannot read properties of undefined"

**Cause:** Kontak/grup tanpa nama  
**Solution:** ✅ Sudah fixed di v3.0! Filter otomatis.

### Issue 3: Nomor tidak terdaftar padahal aktif

**Cause:** Nomor baru atau format salah  
**Solution:**

1. Pastikan format 628xxx bukan 08xxx
2. Tunggu 5-10 menit (WhatsApp API delay)
3. Coba lagi

### Issue 4: Bot tidak bisa join grup

**Cause:** Link expired atau invalid  
**Solution:**

1. Generate link baru dari grup
2. Pastikan link lengkap: `https://chat.whatsapp.com/xxxxx`
3. Bot belum boleh ada di grup tersebut

### Issue 5: Session tidak persist

**Cause:** File `admin_sessions.json` tidak writable  
**Solution:**

1. Check permissions folder `src/data/`
2. Manual create file jika perlu: `[]`
3. Restart bot

---

## 📊 Expected Results Summary

| Feature           | Expected Behavior            | Status |
| ----------------- | ---------------------------- | ------ |
| QR to Telegram    | Foto QR dikirim otomatis     | ⬜     |
| Manual Input      | Convert 08xxx → 628xxx       | ⬜     |
| Number Validation | Check di WhatsApp API        | ⬜     |
| Join Group        | Bot join & save info         | ⬜     |
| Sync No Error     | No crash, filter empty names | ⬜     |
| Session Persist   | Data tetap after restart     | ⬜     |
| Schedule Works    | Pesan terkirim tepat waktu   | ⬜     |

---

## 🎯 Success Criteria

✅ **ALL tests pass**  
✅ **No console errors**  
✅ **No crashes**  
✅ **Data persistent**  
✅ **Messages delivered**

---

## 📝 Test Report Template

```
=== TEST REPORT v3.0.0 ===
Date: __________
Tester: __________

Test 1 (QR to Telegram): ✅ / ❌
Test 2 (Manual Input): ✅ / ❌
Test 3 (Join Group): ✅ / ❌
Test 4 (Sync No Error): ✅ / ❌
Test 5 (Persistent Session): ✅ / ❌
Test 6 (Schedule Manual): ✅ / ❌
Test 7 (Schedule Group): ✅ / ❌

Issues Found:
1. __________
2. __________

Overall Rating: ____ / 10
Ready for Production: YES / NO

Notes:
__________
```

---

**Happy Testing! 🚀**
