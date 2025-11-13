const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const fs = require("fs");

let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60000; // 60 detik max delay
let telegramBot = null; // Store telegram bot reference

async function initWhatsApp(bot) {
  telegramBot = bot; // Simpan reference bot telegram

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    console.log("📱 Scan QR Code berikut:");
    qrcodeTerminal.generate(qr, { small: true });

    // Generate QR sebagai image dan kirim ke Telegram
    try {
      const qrImagePath = "./qr-code.png";
      await qrcode.toFile(qrImagePath, qr);

      // Kirim ke semua admin yang tersimpan
      if (client.adminChatIds && client.adminChatIds.size > 0) {
        for (const [userId, chatId] of client.adminChatIds.entries()) {
          await telegramBot.sendPhoto(chatId, qrImagePath, {
            caption:
              `📱 *Scan QR Code ini di WhatsApp*\n\n` +
              `1. Buka WhatsApp di HP Anda\n` +
              `2. Tap Menu (⋮) > Perangkat Tertaut\n` +
              `3. Tap "Tautkan Perangkat"\n` +
              `4. Scan QR Code di atas\n\n` +
              `⏳ Menunggu scan...`,
            parse_mode: "Markdown",
          });
          console.log(`📤 QR Code dikirim ke admin ${userId}`);
        }
      }

      // Hapus file QR setelah dikirim
      setTimeout(() => {
        if (fs.existsSync(qrImagePath)) {
          fs.unlinkSync(qrImagePath);
        }
      }, 5000);
    } catch (error) {
      console.error("❌ Error mengirim QR ke Telegram:", error.message);
    }
  });

  client.on("ready", async () => {
    console.log("✅ WhatsApp siap!");
    reconnectAttempts = 0; // Reset counter saat berhasil connect

    // Notifikasi ke admin yang sedang menunggu login
    if (client.adminChatIds && client.adminChatIds.size > 0) {
      for (const [userId, chatId] of client.adminChatIds.entries()) {
        try {
          await telegramBot.sendMessage(
            chatId,
            `✅ *WhatsApp Terhubung!*\n\n🔄 Ketik /start untuk melanjutkan.`,
            { parse_mode: "Markdown" }
          );
        } catch (error) {
          console.error(
            `❌ Error notifikasi ke admin ${userId}:`,
            error.message
          );
        }
      }
      // Clear admin chat IDs setelah notifikasi
      client.adminChatIds.clear();
    }
  });

  client.on("authenticated", () => {
    console.log("🔐 WhatsApp terautentikasi!");
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ Autentikasi gagal:", msg);
    console.log("🔄 Silakan hapus folder .wwebjs_auth dan scan ulang QR code");
  });

  client.on("disconnected", (reason) => {
    console.log("⚠️ WhatsApp terputus. Alasan:", reason);
    handleReconnect(client);
  });

  // Handle error jaringan
  client.on("change_state", (state) => {
    console.log("🔄 Status WhatsApp:", state);
  });

  try {
    await client.initialize();
    return client;
  } catch (error) {
    console.error("❌ Error inisialisasi WhatsApp:", error.message);
    console.log("🔄 Mencoba reconnect...");
    return handleReconnect(client);
  }
}

// Fungsi reconnect otomatis dengan exponential backoff
async function handleReconnect(client) {
  reconnectAttempts++;

  // Exponential backoff: 5s, 10s, 20s, 40s, max 60s
  const delay = Math.min(
    5000 * Math.pow(2, reconnectAttempts - 1),
    MAX_RECONNECT_DELAY
  );

  console.log(
    `🔄 Reconnect attempt #${reconnectAttempts} dalam ${delay / 1000} detik...`
  );
  console.log("⏳ Menunggu jaringan tersedia...");

  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    await client.initialize();
    console.log("✅ Reconnect berhasil!");
    return client;
  } catch (error) {
    console.error("❌ Reconnect gagal:", error.message);
    console.log("🔄 Akan mencoba lagi...");
    return handleReconnect(client); // Recursive retry
  }
}

// Tambahkan store untuk admin chat IDs
function setAdminChatId(client, userId, chatId) {
  if (!client.adminChatIds) {
    client.adminChatIds = new Map();
  }
  client.adminChatIds.set(userId, chatId);
}

module.exports = { initWhatsApp, setAdminChatId };
