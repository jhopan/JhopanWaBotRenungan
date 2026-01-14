/**
 * Renungan Handler
 * Mengelola pengiriman renungan harian dengan AI
 * AI akan generate seluruh isi renungan berdasarkan referensi ayat
 */

const cron = require("node-cron");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const { generateRenungan, checkSpecialDay } = require("./services/aiService");
const wa = require("./botWhatsApp");

moment.tz.setDefault(process.env.TIMEZONE || "Asia/Makassar");

// Cron job instance
let renunganCronJob = null;

/**
 * Get verses file path berdasarkan tahun
 */
function getVersesFilePath(year = null) {
  const currentYear = year || new Date().getFullYear();
  return path.join(__dirname, 'data', `verses_${currentYear}.json`);
}

/**
 * Load verses data untuk tahun tertentu
 */
async function loadVerses(year = null) {
  try {
    const filePath = getVersesFilePath(year);
    
    // Cek apakah file ada
    if (!await fs.pathExists(filePath)) {
      console.log(`⚠️ File verses tahun ${year || new Date().getFullYear()} tidak ditemukan, gunakan generateYearlyVerses.js dulu`);
      return { verses: [], specialDayVerses: {}, metadata: {} };
    }
    
    return await fs.readJson(filePath);
  } catch (error) {
    console.error("❌ Error load verses:", error.message);
    return { verses: [], specialDayVerses: {}, metadata: {} };
  }
}

/**
 * Save verses data untuk tahun tertentu
 */
async function saveVerses(data, year = null) {
  try {
    const filePath = getVersesFilePath(year || data.year);
    data.metadata.lastUpdated = new Date().toISOString();
    data.metadata.totalVerses = data.verses.length;
    await fs.writeJson(filePath, data, { spaces: 2 });
  } catch (error) {
    console.error("❌ Error save verses:", error.message);
  }
}

/**
 * Get ayat untuk hari ini
 * Sistem tahunan: menggunakan dayOfYear (1-365) untuk pilih ayat
 * Prioritas: Hari spesial > Ayat sesuai hari ke-N dalam tahun
 */
async function getVerseForToday() {
  const currentYear = new Date().getFullYear();
  const versesData = await loadVerses(currentYear);
  
  if (!versesData.verses || versesData.verses.length === 0) {
    console.error(`❌ Tidak ada data verses untuk tahun ${currentYear}`);
    return { verseRef: "Mazmur 119:105", specialDay: null, isSpecial: false };
  }

  // 1. Cek apakah hari spesial
  const specialDay = await checkSpecialDay();

  if (specialDay) {
    // Cari ayat khusus untuk hari spesial
    const specialKey = specialDay
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/hari_/g, "");

    // Cek di specialDayVerses
    for (const [key, verseRef] of Object.entries(
      versesData.specialDayVerses || {}
    )) {
      if (specialKey.includes(key) || key.includes(specialKey)) {
        return { verseRef, specialDay, isSpecial: true };
      }
    }
  }

  // 2. Gunakan dayOfYear untuk pilih ayat
  const start = new Date(currentYear, 0, 0);
  const diff = new Date() - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  // Pastikan dayOfYear dalam range 1-365
  const index = ((dayOfYear - 1) % 365);
  const selectedVerse = versesData.verses[index];
  
  if (!selectedVerse) {
    console.error(`❌ Verse tidak ditemukan untuk day ${dayOfYear}`);
    return { verseRef: "Mazmur 119:105", specialDay, isSpecial: !!specialDay };
  }

  return { 
    verseRef: selectedVerse.verse, 
    specialDay, 
    isSpecial: !!specialDay,
    dayOfYear: dayOfYear
  };
}

/**
 * Generate dan kirim renungan
 * AI generate seluruh pesan berdasarkan referensi ayat saja
 */
async function sendRenungan() {
  const groupId = process.env.RENUNGAN_GROUP_ID;

  if (!groupId) {
    console.log("⚠️ RENUNGAN_GROUP_ID belum diatur di .env");
    return { success: false, error: "Group ID belum diatur" };
  }

  try {
    // Cek koneksi WhatsApp
    if (!(await wa.isConnected())) {
      console.log("⏳ Renungan menunggu WhatsApp reconnect...");
      return { success: false, error: "WhatsApp tidak terhubung" };
    }

    console.log("📖 Generating renungan harian...");

    // Get referensi ayat hari ini
    const { verseRef, specialDay, isSpecial } = await getVerseForToday();

    if (isSpecial) {
      console.log(`🎉 Hari spesial: ${specialDay}`);
    }

    console.log(`📖 Ayat: ${verseRef}`);

    // AI generate seluruh isi renungan (termasuk cari isi ayat)
    const message = await generateRenungan(verseRef, specialDay);

    // Kirim ke WhatsApp
    await wa.sendMessage(groupId, message);

    console.log(`✅ Renungan terkirim ke ${groupId}`);

    return {
      success: true,
      verse: verseRef,
      specialDay,
      groupId,
    };
  } catch (error) {
    console.error("❌ Gagal kirim renungan:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Preview renungan tanpa kirim
 */
async function previewRenungan() {
  try {
    const { verseRef, specialDay, isSpecial } = await getVerseForToday();

    console.log(`📖 Preview ayat: ${verseRef}`);

    // AI generate seluruh isi renungan
    const message = await generateRenungan(verseRef, specialDay);

    return {
      success: true,
      message,
      verse: verseRef,
      specialDay,
      isSpecial,
    };
  } catch (error) {
    console.error("❌ Error preview:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Kirim renungan dengan message yang sudah dibuat (dari preview)
 */
async function sendRenunganWithMessage(message) {
  const groupId = process.env.RENUNGAN_GROUP_ID;

  if (!groupId) {
    console.log("⚠️ RENUNGAN_GROUP_ID belum diatur di .env");
    return { success: false, error: "Group ID belum diatur" };
  }

  try {
    // Cek koneksi WhatsApp
    if (!(await wa.isConnected())) {
      console.log("⏳ Renungan menunggu WhatsApp reconnect...");
      return { success: false, error: "WhatsApp tidak terhubung" };
    }

    console.log("📤 Mengirim renungan yang sudah di-preview...");

    // Kirim ke WhatsApp
    await wa.sendMessage(groupId, message);

    console.log(`✅ Renungan terkirim ke ${groupId}`);

    return {
      success: true,
      groupId,
    };
  } catch (error) {
    console.error("❌ Gagal kirim renungan:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Tambah ayat baru ke database (hanya referensi)
 */
async function addVerse(verseRef, category = "umum") {
  try {
    const versesData = await loadVerses();

    // Check duplicate
    const exists = versesData.verses.some(
      (v) => v.verse.toLowerCase() === verseRef.toLowerCase()
    );

    if (exists) {
      return { success: false, error: "Ayat sudah ada di database" };
    }

    // Generate new ID
    const maxId = Math.max(...versesData.verses.map((v) => v.id), 0);

    versesData.verses.push({
      id: maxId + 1,
      verse: verseRef,
      category,
      used: false,
    });

    await saveVerses(versesData);

    console.log(`✅ Ayat baru ditambahkan: ${verseRef}`);
    return { success: true, id: maxId + 1 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get semua ayat
 */
async function getAllVerses() {
  const versesData = await loadVerses();
  return versesData.verses;
}

/**
 * Get statistik ayat
 */
async function getVersesStats() {
  const versesData = await loadVerses();
  const total = versesData.verses.length;
  const used = versesData.verses.filter((v) => v.used).length;
  const unused = total - used;

  return {
    total,
    used,
    unused,
    lastUpdated: versesData.metadata.lastUpdated,
  };
}

/**
 * Hapus ayat dari database
 */
async function deleteVerse(id) {
  try {
    const versesData = await loadVerses();
    const idx = versesData.verses.findIndex((v) => v.id === id);

    if (idx === -1) {
      return { success: false, error: "Ayat tidak ditemukan" };
    }

    const deleted = versesData.verses.splice(idx, 1)[0];
    await saveVerses(versesData);

    return { success: true, deleted };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Reset semua status used
 */
async function resetVersesStatus() {
  try {
    const versesData = await loadVerses();
    versesData.verses.forEach((v) => {
      v.used = false;
    });
    await saveVerses(versesData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Start scheduler untuk renungan harian
 */
function startRenunganScheduler() {
  const renunganTime = process.env.RENUNGAN_TIME || "08:00";
  const [hour, minute] = renunganTime.split(":");

  // Schedule: menit jam * * * (setiap hari)
  const cronExpression = `${minute} ${hour} * * *`;

  // Stop existing job jika ada
  if (renunganCronJob) {
    renunganCronJob.stop();
    console.log("🔄 Menghentikan scheduler renungan lama...");
  }

  renunganCronJob = cron.schedule(
    cronExpression,
    async () => {
      console.log(`\n⏰ Waktu renungan: ${moment().format("HH:mm")}`);
      await sendRenungan();
    },
    { timezone: process.env.TIMEZONE || "Asia/Makassar" }
  );

  console.log(
    `📖 Renungan harian dijadwalkan jam ${renunganTime} ${
      process.env.TIMEZONE || "WITA"
    }`
  );
}

/**
 * Restart scheduler dengan waktu baru
 * @param {string} newTime - Waktu baru (format HH:mm)
 */
function restartRenunganScheduler(newTime) {
  if (!newTime || !/^\d{2}:\d{2}$/.test(newTime)) {
    throw new Error("Format waktu tidak valid. Gunakan HH:mm (contoh: 08:00)");
  }

  // Update env variable
  process.env.RENUNGAN_TIME = newTime;

  // Restart scheduler
  startRenunganScheduler();

  console.log(`✅ Jadwal renungan diubah ke ${newTime}`);
}

/**
 * Get jadwal renungan saat ini
 */
function getRenunganSchedule() {
  return process.env.RENUNGAN_TIME || "08:00";
}

module.exports = {
  sendRenungan,
  sendRenunganWithMessage,
  previewRenungan,
  addVerse,
  getAllVerses,
  getVersesStats,
  deleteVerse,
  resetVersesStatus,
  startRenunganScheduler,
  restartRenunganScheduler,
  getRenunganSchedule,
  getVerseForToday,
};
