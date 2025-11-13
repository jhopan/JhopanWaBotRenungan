require("dotenv").config();
const { startTelegramBot } = require("./botTelegram");
const { initWhatsApp } = require("./botWhatsApp");
const { setupScheduler } = require("./scheduler");
const { startRenunganScheduler } = require("./renunganHandler");
const { startBirthdayReminder } = require("./birthdayReminder");

(async () => {
  console.log("🚀 Memulai Sistem WhatsApp–Telegram Bot...");
  console.log(
    "📅 Tanggal:",
    new Date().toLocaleString("id-ID", { timeZone: process.env.TIMEZONE })
  );
  console.log("⏰ Timezone:", process.env.TIMEZONE);
  console.log("═══════════════════════════════════════\n");

  // Validasi admin IDs
  if (!process.env.ADMIN_TELEGRAM_IDS) {
    console.warn("⚠️ PERINGATAN: ADMIN_TELEGRAM_IDS belum diatur di .env!");
    console.warn(
      "⚠️ Bot tidak akan bisa digunakan sampai admin ditambahkan.\n"
    );
  }

  try {
    // Get telegram bot instance first (tanpa start)
    const { bot } = require("./botTelegram");

    // Inisialisasi WhatsApp dengan bot telegram reference
    const waClient = await initWhatsApp(bot);

    // Start semua service
    startTelegramBot(waClient);
    setupScheduler(waClient);
    startRenunganScheduler(waClient);
    startBirthdayReminder(waClient);

    console.log("\n═══════════════════════════════════════");
    console.log("✅ Semua sistem aktif!");
    console.log("✅ Bot siap menerima perintah dari admin");
    console.log("✅ Auto-reconnect: AKTIF");
    console.log("═══════════════════════════════════════\n");
  } catch (error) {
    console.error("❌ Error fatal:", error.message);
    console.log("🔄 Bot akan terus mencoba reconnect...");
    // Tidak exit, biarkan auto-reconnect bekerja
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n⏸️  Bot dihentikan oleh user");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n\n⏸️  Bot dihentikan");
    process.exit(0);
  });

  // Prevent crash dari unhandled promise rejection
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection:", reason);
    console.log("🔄 Bot tetap berjalan...");
  });

  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error.message);
    console.log("🔄 Bot tetap berjalan...");
  });
})();
