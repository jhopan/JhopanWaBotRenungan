/**
 * Birthday Reminder Handler
 * Mengelola pengingat dan ucapan ulang tahun
 */

const cron = require("node-cron");
const fs = require("fs-extra");
const moment = require("moment-timezone");
const {
  getBirthdaysToday,
  getUpcomingBirthdays,
} = require("./googleSheetService");
const { generateBirthdayWish } = require("./services/aiService");
const wa = require("./botWhatsApp");

moment.tz.setDefault(process.env.TIMEZONE || "Asia/Makassar");

const TEMPLATE_FILE = "./src/templates/ulangTahunTemplate.txt";

// Cron job instance
let birthdayCronJob = null;

/**
 * Load template ucapan ulang tahun
 */
async function loadBirthdayTemplate() {
  try {
    return await fs.readFile(TEMPLATE_FILE, "utf8");
  } catch {
    return `🎉🎂 *SELAMAT ULANG TAHUN!* 🎂🎉

Kepada Yth.
*{name}*

Selamat ulang tahun! 🎈
Kiranya Tuhan Yesus senantiasa memberkati hidupmu dengan:
✨ Kesehatan yang sempurna
✨ Kebahagiaan yang melimpah
✨ Berkat yang berlimpah ruah
✨ Pertumbuhan rohani yang kuat

_"Sebab Aku ini mengetahui rancangan-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan."_
📖 Yeremia 29:11

Tuhan memberkati! 🙏`;
  }
}

/**
 * Format ucapan ulang tahun dari template
 */
async function formatBirthdayWish(name) {
  // Coba generate dengan AI dulu
  const aiWish = await generateBirthdayWish(name);

  if (aiWish) {
    return aiWish;
  }

  // Fallback ke template
  const template = await loadBirthdayTemplate();
  return template.replace(/{name}/g, name);
}

/**
 * Kirim ucapan ulang tahun ke satu orang
 */
async function sendBirthdayWish(birthday) {
  try {
    const wish = await formatBirthdayWish(birthday.name);

    // Tentukan tujuan pengiriman
    let targetId = birthday.chatId;

    // Jika tidak ada chatId personal, kirim ke grup (jika ada)
    if (!targetId && process.env.BIRTHDAY_GROUP_ID) {
      targetId = process.env.BIRTHDAY_GROUP_ID;
    }

    if (!targetId) {
      console.log(`⚠️ Tidak ada tujuan untuk ${birthday.name}`);
      return { success: false, error: "No target ID" };
    }

    await wa.sendMessage(targetId, wish);
    console.log(`✅ Ucapan ultah terkirim ke ${birthday.name} (${targetId})`);

    return { success: true, name: birthday.name, target: targetId };
  } catch (error) {
    console.error(`❌ Gagal kirim ke ${birthday.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Proses semua ulang tahun hari ini
 */
async function processBirthdays() {
  try {
    // Cek koneksi WhatsApp
    if (!(await wa.isConnected())) {
      console.log("⏳ Birthday reminder menunggu WhatsApp reconnect...");
      return { success: false, error: "WhatsApp tidak terhubung" };
    }

    const birthdays = await getBirthdaysToday();

    if (birthdays.length === 0) {
      console.log("ℹ️ Tidak ada ulang tahun hari ini");
      return { success: true, count: 0 };
    }

    console.log(`🎂 ${birthdays.length} orang berulang tahun hari ini!`);

    const results = [];
    for (const birthday of birthdays) {
      const result = await sendBirthdayWish(birthday);
      results.push({ ...birthday, ...result });

      // Delay antar pengiriman untuk menghindari spam
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`🎂 Selesai: ${sent} terkirim, ${failed} gagal`);

    return {
      success: true,
      count: birthdays.length,
      sent,
      failed,
      results,
    };
  } catch (error) {
    console.error("❌ Error birthday reminder:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get ulang tahun yang akan datang (untuk preview di Telegram)
 */
async function getUpcoming(days = 7) {
  try {
    return await getUpcomingBirthdays(days);
  } catch (error) {
    console.error("❌ Error get upcoming:", error.message);
    return [];
  }
}

/**
 * Kirim manual ke satu orang
 */
async function sendManualWish(name, targetId) {
  try {
    if (!(await wa.isConnected())) {
      return { success: false, error: "WhatsApp tidak terhubung" };
    }

    const wish = await formatBirthdayWish(name);
    await wa.sendMessage(targetId, wish);

    return { success: true, name, target: targetId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Start scheduler untuk birthday reminder
 */
function startBirthdayReminder() {
  const birthdayTime = process.env.BIRTHDAY_TIME || "07:00";
  const [hour, minute] = birthdayTime.split(":");

  const cronExpression = `${minute} ${hour} * * *`;

  // Stop existing job jika ada
  if (birthdayCronJob) {
    birthdayCronJob.stop();
    console.log("🔄 Menghentikan scheduler birthday lama...");
  }

  birthdayCronJob = cron.schedule(
    cronExpression,
    async () => {
      console.log(`\n⏰ Waktu cek ulang tahun: ${moment().format("HH:mm")}`);
      await processBirthdays();
    },
    { timezone: process.env.TIMEZONE || "Asia/Makassar" }
  );

  console.log(
    `🎂 Birthday reminder dijadwalkan jam ${birthdayTime} ${
      process.env.TIMEZONE || "WITA"
    }`
  );
}

/**
 * Restart scheduler dengan waktu baru
 * @param {string} newTime - Waktu baru (format HH:mm)
 */
function restartBirthdayScheduler(newTime) {
  if (!newTime || !/^\d{2}:\d{2}$/.test(newTime)) {
    throw new Error("Format waktu tidak valid. Gunakan HH:mm (contoh: 07:00)");
  }

  // Update env variable
  process.env.BIRTHDAY_TIME = newTime;

  // Restart scheduler
  startBirthdayReminder();

  console.log(`✅ Jadwal birthday diubah ke ${newTime}`);
}

/**
 * Get jadwal birthday saat ini
 */
function getBirthdaySchedule() {
  return process.env.BIRTHDAY_TIME || "07:00";
}

module.exports = {
  startBirthdayReminder,
  restartBirthdayScheduler,
  getBirthdaySchedule,
  processBirthdays,
  getUpcoming,
  sendManualWish,
  formatBirthdayWish,
};
