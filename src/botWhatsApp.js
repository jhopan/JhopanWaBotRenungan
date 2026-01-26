/**
 * WhatsApp Bot - Ultra Lightweight Version for GCP Free Tier
 * Fokus: Stabilitas, Session Persistence, dan hemat resource
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
const MAX_RECONNECT_ATTEMPTS = 20; // Lebih banyak retry untuk stabilitas
const BASE_RECONNECT_DELAY = 10000; // 10 detik

// Session keep-alive interval - CRITICAL untuk prevent logout
let keepAliveInterval = null;
let sessionCheckInterval = null;
let lastActivityTime = Date.now();
let lastKeepAliveCheck = Date.now();

// Memory cleanup interval (optional untuk 1GB RAM)
let memoryCleanupInterval = null;

// Event emitter untuk notifikasi
const waEvents = new EventEmitter();

/**
 * Inisialisasi WhatsApp Client dengan konfigurasi ultra ringan untuk GCP Free Tier
 * Optimasi untuk RAM 256MB dan session persistence
 */
async function initWhatsApp(bot) {
  telegramBot = bot;

  // Konfigurasi client untuk 958MB RAM - Max app usage 500MB
  // CPU: 2 cores, jangan sampai 100%
  const chromePath =
    process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || null;

  const puppeteerConfig = {
    headless: "new", // Chrome 144+ requires "new" headless mode
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      // REMOVED: --single-process (causes crashes in Chrome 144+)
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-translate",
      "--disable-default-apps",
      "--mute-audio",
      "--hide-scrollbars",
      "--disable-plugins",
      "--disable-infobars",
      "--window-size=800,600", // Kecil untuk hemat memory
      "--disable-features=TranslateUI,BlinkGenPropertyTrees",
      "--disable-ipc-flooding-protection",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-component-update",
      "--js-flags=--max-old-space-size=280", // 280MB heap untuk Chrome (stable)
      "--disable-software-rasterizer",
      "--disable-web-security",
      "--disable-canvas-aa", // Hemat CPU
      "--disable-2d-canvas-clip-aa", // Hemat CPU
      "--aggressive-cache-discard", // Hemat memory
      "--disable-cache", // Hemat memory & disk I/O
      "--disk-cache-size=0", // No disk cache
    ],
    timeout: 120000, // 2 menit timeout
  };

  // Tambah executablePath jika ada
  if (chromePath) {
    puppeteerConfig.executablePath = chromePath;
    console.log(`🌐 Menggunakan Chrome: ${chromePath}`);
  }

  waClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: "./.wwebjs_auth",
      clientId: "renungan-bot",
    }),
    puppeteer: puppeteerConfig,
    qrMaxRetries: 3,
    takeoverOnConflict: true,
    takeoverTimeoutMs: 15000,
    restartOnAuthFail: true,
  });

  setupEventHandlers();

  try {
    console.log("🚀 Memulai WhatsApp Client (Mode Ultra Ringan)...");
    await waClient.initialize();

    // Start keep-alive mechanism
    startKeepAlive();

    return waClient;
  } catch (error) {
    console.error("❌ Error inisialisasi WhatsApp:", error.message);
    scheduleReconnect();
    return waClient;
  }
}

/**
 * Keep-alive mechanism untuk menjaga session tetap aktif
 * CRITICAL: Mencegah session logout otomatis
 */
function startKeepAlive() {
  // Clear existing intervals
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  if (sessionCheckInterval) clearInterval(sessionCheckInterval);
  if (memoryCleanupInterval) clearInterval(memoryCleanupInterval);

  // Keep-alive ping setiap 2 menit (SANGAT PENTING untuk prevent logout)
  keepAliveInterval = setInterval(
    async () => {
      try {
        if (waClient && connectionState === "CONNECTED") {
          // Ping untuk keep session alive
          const state = await waClient.getState();
          lastActivityTime = Date.now();
          lastKeepAliveCheck = Date.now();

          if (state !== "CONNECTED") {
            console.log("⚠️ Session state berubah:", state);
            connectionState = state;

            // Auto-recovery jika state berubah
            if (state === "CONFLICT" || state === "UNPAIRED") {
              console.log("🔄 Attempting auto-recovery...");
              scheduleReconnect();
            }
          } else {
            // Session OK, log setiap 10 menit
            const uptimeMin = Math.floor(
              (Date.now() - lastActivityTime) / 60000,
            );
            if (uptimeMin % 10 === 0) {
              console.log(`✅ Session aktif (uptime: ${uptimeMin} min)`);
            }
          }
        }
      } catch (error) {
        console.log("⚠️ Keep-alive check error:", error.message);
        // Jika error, mungkin perlu reconnect
        if (connectionState === "CONNECTED") {
          connectionState = "DISCONNECTED";
          scheduleReconnect();
        }
      }
    },
    2 * 60 * 1000,
  ); // 2 menit (lebih agresif)

  // Session health check setiap 5 menit (lebih detail)
  sessionCheckInterval = setInterval(
    async () => {
      try {
        if (waClient) {
          const info = await waClient.info;
          if (info) {
            console.log(
              `📱 WA Phone: ${info.wid.user} | Platform: ${info.platform}`,
            );
          }
        }
      } catch (error) {
        console.log("⚠️ Session check failed:", error.message);
      }
    },
    5 * 60 * 1000,
  ); // 5 menit

  // Memory cleanup opsional (untuk 1GB RAM tidak terlalu critical)
  memoryCleanupInterval = setInterval(
    () => {
      if (global.gc) {
        global.gc();
      }
    },
    20 * 60 * 1000,
  ); // 20 menit (jarang saja)

  console.log(
    "✅ Session keep-alive aktif (2 min interval) - PREVENT LOGOUT MODE",
  );
}

/**
 * Setup semua event handlers dengan optimasi session persistence
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
    lastActivityTime = Date.now();

    await notifyAdmins(
      "✅ *WhatsApp Terhubung!*\n\n" +
        "Bot WhatsApp sudah siap digunakan.\n" +
        "Ketik /start untuk membuka panel kontrol.",
    );

    waEvents.emit("ready");
  });

  // Authenticated event - Session berhasil di-restore
  waClient.on("authenticated", () => {
    console.log("🔐 WhatsApp terautentikasi! (Session restored)");
    connectionState = "AUTHENTICATED";
    lastActivityTime = Date.now();
  });

  // Auth failure event - Perlu scan QR ulang
  waClient.on("auth_failure", async (msg) => {
    console.error("❌ Autentikasi gagal:", msg);
    connectionState = "AUTH_FAILURE";

    await notifyAdmins(
      "❌ *Autentikasi WhatsApp Gagal!*\n\n" +
        "Session expired atau tidak valid.\n" +
        "Silakan hapus folder .wwebjs_auth dan scan ulang QR code.",
    );
  });

  // Disconnected event - Auto reconnect
  waClient.on("disconnected", async (reason) => {
    console.log("⚠️ WhatsApp terputus:", reason);
    connectionState = "DISCONNECTED";

    // Jangan kirim notifikasi untuk disconnect sementara
    if (reason !== "NAVIGATION" && reason !== "CONFLICT") {
      await notifyAdmins(
        `⚠️ *WhatsApp Terputus!*\n\nAlasan: ${reason}\n\n🔄 Reconnect otomatis dalam beberapa detik...`,
      );
    }

    scheduleReconnect();
  });

  // State change event
  waClient.on("change_state", (state) => {
    console.log("🔄 Status WhatsApp:", state);
    connectionState = state;
    lastActivityTime = Date.now();
  });

  // Loading progress - Minimal logging
  waClient.on("loading_screen", (percent, message) => {
    if (percent === 0 || percent === 100 || percent % 50 === 0) {
      console.log(`⏳ Loading: ${percent}% - ${message}`);
    }
  });

  // Remote session saved - untuk debugging
  waClient.on("remote_session_saved", () => {
    console.log("💾 Session tersimpan ke local storage");
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
/**
 * Schedule reconnect dengan exponential backoff
 * Optimasi untuk stabilitas jangka panjang
 */
function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log(
      "❌ Max reconnect tercapai. Menunggu 10 menit sebelum reset counter...",
    );
    notifyAdmins(
      "❌ *Gagal Reconnect WhatsApp!*\n\n" +
        `${MAX_RECONNECT_ATTEMPTS}x percobaan gagal.\n` +
        "Bot akan mencoba lagi dalam 10 menit.\n" +
        "Atau silakan restart bot manual.",
    );

    // Reset counter setelah 10 menit dan coba lagi
    setTimeout(
      () => {
        console.log("🔄 Reset reconnect counter, mencoba lagi...");
        reconnectAttempts = 0;
        scheduleReconnect();
      },
      10 * 60 * 1000,
    );
    return;
  }

  reconnectAttempts++;
  // Exponential backoff dengan max 2 menit
  const delay = Math.min(
    BASE_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1),
    120000,
  );

  console.log(
    `🔄 Reconnect #${reconnectAttempts} dalam ${Math.round(delay / 1000)}s...`,
  );

  setTimeout(async () => {
    try {
      // Destroy existing client jika ada
      if (waClient) {
        try {
          await waClient.destroy();
        } catch (e) {
          console.log("⚠️ Error destroy client:", e.message);
        }
      }

      // Re-initialize
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
  return waClient.sendMessage(to, message, { sendSeen: false });
}

/**
 * Kirim pesan dengan hide tag (mention semua member tanpa terlihat)
 * @param {string} to - Group ID
 * @param {string} message - Pesan yang akan dikirim
 * @returns {Promise<Object>} - Result dari pengiriman
 */
async function sendMessageWithHideTag(to, message) {
  if (!(await isConnected())) {
    throw new Error("WhatsApp tidak terhubung");
  }

  try {
    // Dapatkan chat dan participants
    const chat = await waClient.getChatById(to);

    if (!chat.isGroup) {
      // Jika bukan grup, kirim biasa
      return waClient.sendMessage(to, message, { sendSeen: false });
    }

    // Dapatkan semua participant
    const participants = chat.participants || [];

    // Buat array mentions dari ID participant (cara baru - tidak deprecated)
    const mentions = participants.map((p) => p.id._serialized);

    console.log(`📢 Hide tag: ${mentions.length} members akan di-mention`);

    // Kirim pesan dengan mentions (hide tag - tidak ada @nama di text)
    return waClient.sendMessage(to, message, {
      sendSeen: false,
      mentions: mentions,
    });
  } catch (error) {
    console.error("❌ Error sendMessageWithHideTag:", error.message);
    // Fallback ke kirim biasa jika error
    return waClient.sendMessage(to, message, { sendSeen: false });
  }
}

async function sendMedia(to, media, options = {}) {
  if (!(await isConnected())) {
    throw new Error("WhatsApp tidak terhubung");
  }
  return waClient.sendMessage(to, media, { ...options, sendSeen: false });
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
  sendMessageWithHideTag,
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
