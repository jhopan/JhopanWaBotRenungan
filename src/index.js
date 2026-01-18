/**
 * WhatsApp-Telegram Bot
 * Main Entry Point
 *
 * Fokus: Renungan Harian & Pengingat Ulang Tahun
 */

require("dotenv").config();

const { startTelegramBot, bot } = require("./botTelegram");
const { initWhatsApp } = require("./botWhatsApp");
const { startRenunganScheduler } = require("./renunganHandler");
const { startBirthdayReminder } = require("./birthdayReminder");
const { initGoogleSheets } = require("./googleSheetService");
const { loadConfig } = require("./utils/configManager");

// Banner
console.log(`
╔═══════════════════════════════════════════════════════╗
║       WhatsApp-Telegram Bot v4.0 (Lightweight)        ║
║       Renungan Harian & Pengingat Ulang Tahun         ║
╚═══════════════════════════════════════════════════════╝
`);

(async () => {
  const startTime = Date.now();

  console.log("🚀 Memulai sistem...");
  console.log(
    `📅 ${new Date().toLocaleString("id-ID", {
      timeZone: process.env.TIMEZONE,
    })}`,
  );
  console.log(`⏰ Timezone: ${process.env.TIMEZONE || "Asia/Makassar"}`);
  console.log("─".repeat(50));

  // Validasi konfigurasi
  const requiredEnv = ["TELEGRAM_BOT_TOKEN", "GEMINI_API_KEY"];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    console.error("❌ Environment variables tidak lengkap:");
    missingEnv.forEach((key) => console.error(`   - ${key}`));
    console.error("\nSilakan lengkapi file .env");
    process.exit(1);
  }

  if (!process.env.ADMIN_TELEGRAM_IDS) {
    console.warn("⚠️  ADMIN_TELEGRAM_IDS belum diatur!");
    console.warn("   Bot tidak akan bisa digunakan tanpa admin.\n");
  }

  try {
    // 0. Load persistent config
    console.log("📂 Loading bot configuration...");
    const config = await loadConfig();
    if (config) {
      // Sync config dari file ke environment variables
      if (config.renunganGroupId)
        process.env.RENUNGAN_GROUP_ID = config.renunganGroupId;
      if (config.birthdayGroupId)
        process.env.BIRTHDAY_GROUP_ID = config.birthdayGroupId;
      if (config.renunganTime) process.env.RENUNGAN_TIME = config.renunganTime;
      if (config.birthdayTime) process.env.BIRTHDAY_TIME = config.birthdayTime;
      console.log("✅ Config loaded dari file");
      console.log(
        `   📖 Renungan: ${config.renunganTime} → Grup: ${
          config.renunganGroupId || "Belum diatur"
        }`,
      );
      console.log(
        `   🎂 Birthday: ${config.birthdayTime} → Grup: ${
          config.birthdayGroupId || "Belum diatur"
        }`,
      );
    }

    // 1. Inisialisasi Google Sheets
    console.log("📊 Menghubungkan ke Google Sheets...");
    await initGoogleSheets();

    // 2. Inisialisasi WhatsApp (dengan Telegram bot untuk QR)
    console.log("📱 Menginisialisasi WhatsApp (Mode Ringan)...");
    await initWhatsApp(bot);

    // 3. Start Telegram Bot
    console.log("🤖 Memulai Telegram Bot...");
    startTelegramBot();

    // 4. Start Schedulers
    console.log("⏰ Mengatur jadwal...");
    startRenunganScheduler();
    startBirthdayReminder();

    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("─".repeat(50));
    console.log(`✅ Sistem siap dalam ${loadTime}s`);
    console.log("");
    console.log(
      "📖 Renungan harian akan dikirim jam " +
        (process.env.RENUNGAN_TIME || "08:00"),
    );
    console.log(
      "🎂 Cek ulang tahun akan dilakukan jam " +
        (process.env.BIRTHDAY_TIME || "07:00"),
    );
    console.log("");
    console.log("💡 Gunakan Telegram Bot untuk mengontrol sistem");
    console.log("─".repeat(50));
  } catch (error) {
    console.error("❌ Error fatal:", error.message);
    console.error(error.stack);
    console.log("🔄 Bot akan tetap berjalan, silakan cek konfigurasi...");
  }

  // ============================================
  // GRACEFUL SHUTDOWN HANDLERS
  // ============================================

  process.on("SIGINT", () => {
    console.log("\n\n⏸️  Menghentikan bot...");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n\n⏸️  Bot dihentikan");
    process.exit(0);
  });

  // Prevent crash dari unhandled errors
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error.message);
    // Jangan exit, biarkan bot tetap jalan
  });
})();
