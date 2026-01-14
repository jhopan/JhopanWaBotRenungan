/**
 * WhatsApp Bot - Super Lightweight Version
 * Fokus: Stabilitas dan hemat resource
 * Kontrol sepenuhnya via Telegram Bot
 */

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const fs = require("fs");
const EventEmitter = require("events");

// State management
let waClient = null;
let telegramBot = null;
let adminChatIds = new Map();
let connectionState = "DISCONNECTED";
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 5000;

// Event emitter untuk notifikasi
const waEvents = new EventEmitter();

/**
 * Inisialisasi WhatsApp Client dengan konfigurasi minimal dan ringan
 */
async function initWhatsApp(bot) {
  telegramBot = bot;

  // Konfigurasi client yang super ringan
  waClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: "./.wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--single-process",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--disable-translate",
        "--disable-default-apps",
        "--mute-audio",
      ],
    },
    qrMaxRetries: 5,
    takeoverOnConflict: true,
    takeoverTimeoutMs: 10000,
  });

  setupEventHandlers();

  try {
    console.log("🚀 Memulai WhatsApp Client (Mode Ringan)...");
    await waClient.initialize();
    return waClient;
  } catch (error) {
    console.error("❌ Error inisialisasi WhatsApp:", error.message);
    scheduleReconnect();
    return waClient;
  }
}

/**
 * Setup semua event handlers
 */
function setupEventHandlers() {
  // QR Code event
  waClient.on("qr", async (qr) => {
    console.log("📱 Scan QR Code:");
    qrcodeTerminal.generate(qr, { small: true });
    connectionState = "WAITING_QR";
    await sendQRToAdmins(qr);
  });

  // Ready event
  waClient.on("ready", async () => {
    console.log("✅ WhatsApp siap dan terhubung!");
    connectionState = "CONNECTED";
    reconnectAttempts = 0;

    await notifyAdmins(
      "✅ *WhatsApp Terhubung!*\n\n" +
        "Bot WhatsApp sudah siap digunakan.\n" +
        "Ketik /start untuk membuka panel kontrol."
    );

    waEvents.emit("ready");
  });

  // Authenticated event
  waClient.on("authenticated", () => {
    console.log("🔐 WhatsApp terautentikasi!");
    connectionState = "AUTHENTICATED";
  });

  // Auth failure event
  waClient.on("auth_failure", async (msg) => {
    console.error("❌ Autentikasi gagal:", msg);
    connectionState = "AUTH_FAILURE";

    await notifyAdmins(
      "❌ *Autentikasi WhatsApp Gagal!*\n\n" +
        "Silakan hapus folder .wwebjs_auth dan scan ulang QR code."
    );
  });

  // Disconnected event
  waClient.on("disconnected", async (reason) => {
    console.log("⚠️ WhatsApp terputus:", reason);
    connectionState = "DISCONNECTED";

    await notifyAdmins(
      `⚠️ *WhatsApp Terputus!*\n\nAlasan: ${reason}\n\n🔄 Reconnect otomatis...`
    );

    scheduleReconnect();
  });

  // State change event
  waClient.on("change_state", (state) => {
    console.log("🔄 Status WhatsApp:", state);
    connectionState = state;
  });

  // Loading progress
  waClient.on("loading_screen", (percent, message) => {
    if (percent % 25 === 0) {
      console.log(`⏳ Loading: ${percent}% - ${message}`);
    }
  });
}

/**
 * Kirim QR Code ke semua admin
 */
async function sendQRToAdmins(qr) {
  if (!telegramBot || adminChatIds.size === 0) return;

  try {
    const qrImagePath = "./qr-code.png";
    await qrcode.toFile(qrImagePath, qr, { width: 300, margin: 2 });

    const caption =
      `📱 *Scan QR Code WhatsApp*\n\n` +
      `1️⃣ Buka WhatsApp di HP\n` +
      `2️⃣ Tap Menu (⋮) → Perangkat Tertaut\n` +
      `3️⃣ Tap "Tautkan Perangkat"\n` +
      `4️⃣ Scan QR Code ini\n\n` +
      `⏳ QR berlaku 60 detik...`;

    for (const [userId, chatId] of adminChatIds.entries()) {
      try {
        await telegramBot.sendPhoto(chatId, qrImagePath, {
          caption,
          parse_mode: "Markdown",
        });
        console.log(`📤 QR dikirim ke admin ${userId}`);
      } catch (err) {
        console.error(`❌ Gagal kirim QR ke ${userId}:`, err.message);
      }
    }

    setTimeout(() => {
      if (fs.existsSync(qrImagePath)) fs.unlinkSync(qrImagePath);
    }, 3000);
  } catch (error) {
    console.error("❌ Error generate QR:", error.message);
  }
}

/**
 * Notifikasi ke semua admin
 */
async function notifyAdmins(message) {
  if (!telegramBot || adminChatIds.size === 0) return;

  for (const [userId, chatId] of adminChatIds.entries()) {
    try {
      await telegramBot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
      });
    } catch (err) {
      console.error(`❌ Gagal notifikasi ke ${userId}:`, err.message);
    }
  }
}

/**
 * Schedule reconnect dengan exponential backoff
 */
function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log("❌ Max reconnect tercapai.");
    notifyAdmins(
      "❌ *Gagal Reconnect WhatsApp!*\n\n" +
        `${MAX_RECONNECT_ATTEMPTS}x percobaan gagal.\n` +
        "Silakan restart bot."
    );
    return;
  }

  reconnectAttempts++;
  const delay = Math.min(
    BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1),
    60000
  );

  console.log(`🔄 Reconnect #${reconnectAttempts} dalam ${delay / 1000}s...`);

  setTimeout(async () => {
    try {
      await waClient.initialize();
    } catch (error) {
      console.error("❌ Reconnect gagal:", error.message);
      scheduleReconnect();
    }
  }, delay);
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

function setAdminChatId(userId, chatId) {
  adminChatIds.set(userId, chatId);
}

function removeAdminChatId(userId) {
  adminChatIds.delete(userId);
}

async function isConnected() {
  try {
    if (!waClient) return false;
    const state = await waClient.getState();
    return state === "CONNECTED";
  } catch {
    return false;
  }
}

function getConnectionState() {
  return connectionState;
}

async function sendMessage(to, message) {
  if (!(await isConnected())) {
    throw new Error("WhatsApp tidak terhubung");
  }
  return waClient.sendMessage(to, message);
}

async function sendMedia(to, media, options = {}) {
  if (!(await isConnected())) {
    throw new Error("WhatsApp tidak terhubung");
  }
  return waClient.sendMessage(to, media, options);
}

async function getChats() {
  if (!(await isConnected())) return [];
  try {
    return await waClient.getChats();
  } catch {
    return [];
  }
}

async function getContacts() {
  if (!(await isConnected())) return [];
  try {
    return await waClient.getContacts();
  } catch {
    return [];
  }
}

async function isRegisteredUser(number) {
  if (!(await isConnected())) return false;
  try {
    return await waClient.isRegisteredUser(number);
  } catch {
    return false;
  }
}

async function logout() {
  try {
    if (waClient) {
      await waClient.logout();
      connectionState = "DISCONNECTED";
      console.log("🚪 WhatsApp logout berhasil");
    }
  } catch (error) {
    console.error("❌ Error logout:", error.message);
    throw error;
  }
}

async function destroy() {
  try {
    if (waClient) {
      await waClient.destroy();
      waClient = null;
      connectionState = "DISCONNECTED";
    }
  } catch (error) {
    console.error("❌ Error destroy:", error.message);
  }
}

function getClient() {
  return waClient;
}

/**
 * Join grup WhatsApp menggunakan invite link
 * @param {string} inviteLink - Link invite grup (https://chat.whatsapp.com/xxxxx)
 * @returns {Promise<{success: boolean, groupId?: string, error?: string}>}
 */
async function joinGroupByInviteLink(inviteLink) {
  if (!(await isConnected())) {
    return { success: false, error: "WhatsApp tidak terhubung" };
  }

  try {
    // Extract invite code dari link
    const inviteCode = extractInviteCode(inviteLink);

    if (!inviteCode) {
      return { success: false, error: "Link invite tidak valid" };
    }

    console.log(`🔗 Mencoba join grup dengan code: ${inviteCode}`);

    // Accept invite
    const groupId = await waClient.acceptInvite(inviteCode);

    console.log(`✅ Berhasil join grup: ${groupId}`);

    // Format group ID yang benar
    const formattedGroupId = groupId.includes("@g.us")
      ? groupId
      : `${groupId}@g.us`;

    return {
      success: true,
      groupId: formattedGroupId,
    };
  } catch (error) {
    console.error("❌ Error join grup:", error.message);
    return {
      success: false,
      error: error.message || "Gagal join grup",
    };
  }
}

/**
 * Extract invite code dari link WhatsApp
 * @param {string} link - Link invite
 * @returns {string|null} - Invite code atau null
 */
function extractInviteCode(link) {
  try {
    // Format: https://chat.whatsapp.com/xxxxx
    const match = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Dapatkan Group ID dari link invite (tanpa join)
 * Ini hanya extract dari link jika bot sudah ada di grup
 * @param {string} inviteLink - Link invite
 * @returns {Promise<{success: boolean, groupId?: string, groupName?: string, error?: string}>}
 */
async function getGroupInfoFromInviteLink(inviteLink) {
  if (!(await isConnected())) {
    return { success: false, error: "WhatsApp tidak terhubung" };
  }

  try {
    const inviteCode = extractInviteCode(inviteLink);

    if (!inviteCode) {
      return { success: false, error: "Link invite tidak valid" };
    }

    // Get invite info
    const inviteInfo = await waClient.getInviteInfo(inviteCode);

    return {
      success: true,
      groupId: inviteInfo.id._serialized,
      groupName: inviteInfo.subject,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Gagal mendapatkan info grup",
    };
  }
}

module.exports = {
  initWhatsApp,
  setAdminChatId,
  removeAdminChatId,
  isConnected,
  getConnectionState,
  sendMessage,
  sendMedia,
  getChats,
  getContacts,
  isRegisteredUser,
  logout,
  destroy,
  getClient,
  waEvents,
  joinGroupByInviteLink,
  getGroupInfoFromInviteLink,
  extractInviteCode,
};
