/**
 * Telegram Bot - Control Panel
 * Panel kontrol untuk mengatur WhatsApp Bot
 * Fokus: Renungan Harian & Ulang Tahun
 */

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const moment = require("moment-timezone");
const wa = require("./botWhatsApp");
const renungan = require("./renunganHandler");
const birthday = require("./birthdayReminder");
const sheets = require("./googleSheetService");
const { testAIConnection, getProvider } = require("./services/aiService");
const {
  loadConfig,
  saveConfig,
  setRenunganGroupId,
  setBirthdayGroupId,
  setRenunganTime,
  setBirthdayTime,
} = require("./utils/configManager");

moment.tz.setDefault(process.env.TIMEZONE || "Asia/Makassar");

// Inisialisasi bot dengan retry mechanism
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 1000,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
});

// Retry state untuk koneksi
let pollingRetries = 0;
const MAX_POLLING_RETRIES = 10;
const POLLING_RETRY_DELAY = 5000;

// Internet connection state
let isOnline = true;
let reconnectTimeout = null;

// Admin IDs
const ADMIN_IDS = process.env.ADMIN_TELEGRAM_IDS
  ? process.env.ADMIN_TELEGRAM_IDS.split(",").map((id) => parseInt(id.trim()))
  : [];

// Simpan preview message untuk setiap user
const previewMessages = new Map();

// State management
const userStates = new Map();

// ============================================
// HELPER FUNCTIONS
// ============================================

function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

function denyAccess(chatId) {
  bot.sendMessage(
    chatId,
    "❌ *Akses Ditolak*\n\nAnda tidak memiliki izin untuk menggunakan bot ini.",
    { parse_mode: "Markdown" }
  );
}

function getStatusEmoji(connected) {
  return connected ? "🟢" : "🔴";
}

/**
 * Escape markdown untuk Telegram (v1)
 * Menghandle underscore, asterisk, dll
 */
function escapeMarkdown(text) {
  if (!text) return "";
  // Untuk markdown v1, escape karakter khusus dalam context italic
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

/**
 * Safe send message dengan HTML fallback
 */
async function safeSendMessage(chatId, text, options = {}) {
  try {
    return await bot.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      ...options,
    });
  } catch (error) {
    if (error.message.includes("parse entities")) {
      // Fallback: kirim tanpa formatting
      const plainText = text
        .replace(/\*/g, "")
        .replace(/_/g, "")
        .replace(/`/g, "");
      return await bot.sendMessage(chatId, plainText, options);
    }
    throw error;
  }
}

/**
 * Safe edit message dengan error handling
 */
async function safeEditMessage(text, options) {
  try {
    return await bot.editMessageText(text, {
      parse_mode: "Markdown",
      ...options,
    });
  } catch (error) {
    if (error.message.includes("parse entities")) {
      const plainText = text
        .replace(/\*/g, "")
        .replace(/_/g, "")
        .replace(/`/g, "");
      return await bot.editMessageText(plainText, options);
    }
    throw error;
  }
}

// ============================================
// MAIN MENU
// ============================================

const mainMenuKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📖 Renungan Harian", callback_data: "menu_renungan" }],
      [{ text: "🎂 Ulang Tahun", callback_data: "menu_birthday" }],
      [{ text: "⚙️ Pengaturan", callback_data: "menu_settings" }],
      [{ text: "📊 Status Bot", callback_data: "menu_status" }],
    ],
  },
};

async function showMainMenu(chatId, userId) {
  const waConnected = await wa.isConnected();
  const status = getStatusEmoji(waConnected);

  const message = `🤖 *Panel Kontrol WhatsApp Bot*

${status} WhatsApp: ${waConnected ? "Terhubung" : "Tidak Terhubung"}
📅 Tanggal: ${moment().format("dddd, DD MMMM YYYY")}
⏰ Waktu: ${moment().format("HH:mm")} WITA

Pilih menu di bawah:`;

  return safeSendMessage(chatId, message, mainMenuKeyboard);
}

async function editToMainMenu(chatId, messageId) {
  const waConnected = await wa.isConnected();
  const status = getStatusEmoji(waConnected);

  const message = `🤖 *Panel Kontrol WhatsApp Bot*

${status} WhatsApp: ${waConnected ? "Terhubung" : "Tidak Terhubung"}
📅 Tanggal: ${moment().format("dddd, DD MMMM YYYY")}
⏰ Waktu: ${moment().format("HH:mm")} WITA

Pilih menu di bawah:`;

  return safeEditMessage(message, {
    chat_id: chatId,
    message_id: messageId,
    ...mainMenuKeyboard,
  });
}

// ============================================
// COMMAND HANDLERS
// ============================================

bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!isAdmin(userId)) {
    return denyAccess(chatId);
  }

  wa.setAdminChatId(userId, chatId);

  const waConnected = await wa.isConnected();

  if (!waConnected) {
    return safeSendMessage(
      chatId,
      `👋 *Selamat Datang!*\n\n⚠️ WhatsApp belum terhubung.\n\nKlik tombol di bawah untuk login.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📱 Login WhatsApp", callback_data: "wa_login" }],
          ],
        },
      }
    );
  }

  await showMainMenu(chatId, userId);
});

bot.onText(/\/status/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return denyAccess(chatId);
  await showStatus(chatId);
});

bot.onText(/\/renungan/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return denyAccess(chatId);
  await showRenunganMenu(chatId, null);
});

bot.onText(/\/birthday/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return denyAccess(chatId);
  await showBirthdayMenu(chatId, null);
});

bot.onText(/\/testai/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return denyAccess(chatId);

  await safeSendMessage(chatId, "⏳ Testing AI connection...");

  const result = await testAIConnection();

  if (result.success) {
    await safeSendMessage(
      chatId,
      `✅ *AI Connected!*\n\nModel: ${result.model}`
    );
  } else {
    await safeSendMessage(chatId, `❌ *AI Error*\n\n${result.error}`);
  }
});

// ============================================
// CALLBACK HANDLERS
// ============================================

bot.on("callback_query", async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  if (!isAdmin(userId)) {
    bot.answerCallbackQuery(query.id, {
      text: "❌ Akses ditolak!",
      show_alert: true,
    });
    return;
  }

  bot.answerCallbackQuery(query.id);

  try {
    if (data === "back_main") {
      return editToMainMenu(chatId, messageId);
    }

    if (data.startsWith("menu_")) {
      return handleMenuCallback(data, chatId, messageId, userId);
    }

    if (data.startsWith("renungan_")) {
      return handleRenunganCallback(data, chatId, messageId, userId);
    }

    if (data.startsWith("birthday_")) {
      return handleBirthdayCallback(data, chatId, messageId, userId);
    }

    if (data.startsWith("settings_")) {
      return handleSettingsCallback(data, chatId, messageId, userId);
    }

    if (data.startsWith("wa_")) {
      return handleWACallback(data, chatId, messageId, userId);
    }

    if (data.startsWith("verse_")) {
      return handleVerseCallback(data, chatId, messageId, userId);
    }

    if (data.startsWith("cat_")) {
      return handleCategoryCallback(data, chatId, messageId, userId);
    }

    if (data.startsWith("time_")) {
      return handleTimeCallback(data, chatId, messageId, userId);
    }
  } catch (error) {
    console.error("❌ Callback error:", error.message);
    safeSendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

async function handleMenuCallback(data, chatId, messageId) {
  switch (data) {
    case "menu_renungan":
      return showRenunganMenu(chatId, messageId);
    case "menu_birthday":
      return showBirthdayMenu(chatId, messageId);
    case "menu_settings":
      return showSettingsMenu(chatId, messageId);
    case "menu_status":
      return showStatus(chatId, messageId);
  }
}

// ============================================
// RENUNGAN MENU
// ============================================

async function showRenunganMenu(chatId, messageId) {
  const stats = await renungan.getVersesStats();
  const config = await loadConfig();

  const groupDisplay = config.renunganGroupId || "Belum diatur";

  const message = `📖 *Menu Renungan Harian*

⏰ Jadwal: ${config.renunganTime || "08:00"} WITA
👥 Group: ${groupDisplay.substring(0, 20)}...

📊 Statistik Ayat:
• Total: ${stats.total} ayat
• Sudah dipakai: ${stats.used}
• Belum dipakai: ${stats.unused}

Pilih aksi:`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📤 Kirim Sekarang", callback_data: "renungan_send_now" }],
        [{ text: "👀 Preview Renungan", callback_data: "renungan_preview" }],
        [
          {
            text: "📝 Lihat Daftar Ayat",
            callback_data: "renungan_list_verses",
          },
        ],
        [{ text: "➕ Tambah Ayat Baru", callback_data: "renungan_add_verse" }],
        [{ text: "🔄 Reset Status Ayat", callback_data: "renungan_reset" }],
        [{ text: "⏰ Atur Jadwal", callback_data: "settings_renungan_time" }],
        [{ text: "⬅️ Kembali", callback_data: "back_main" }],
      ],
    },
  };

  if (messageId) {
    return safeEditMessage(message, {
      chat_id: chatId,
      message_id: messageId,
      ...keyboard,
    });
  }

  return safeSendMessage(chatId, message, keyboard);
}

async function handleRenunganCallback(data, chatId, messageId, userId) {
  switch (data) {
    case "renungan_send_now":
      await safeEditMessage("⏳ *Mengirim renungan...*", {
        chat_id: chatId,
        message_id: messageId,
      });

      // Cek apakah ada preview message yang disimpan
      const savedPreview = previewMessages.get(userId);
      let sendResult;

      if (savedPreview && Date.now() - savedPreview.timestamp < 3600000) {
        // Gunakan preview yang sudah dibuat (valid 1 jam)
        sendResult = await renungan.sendRenunganWithMessage(
          savedPreview.message
        );
        // Tambahkan data verse dari preview
        sendResult.verse = savedPreview.verse;
        sendResult.specialDay = savedPreview.specialDay;
        // Hapus preview setelah dikirim
        previewMessages.delete(userId);
      } else {
        // Generate baru jika tidak ada preview atau sudah expired
        sendResult = await renungan.sendRenungan();
      }

      if (sendResult.success) {
        const specialText = sendResult.specialDay
          ? `\n🎉 Hari Spesial: ${sendResult.specialDay}`
          : "";
        await safeEditMessage(
          `✅ *Renungan Terkirim!*\n\n📖 Ayat: ${sendResult.verse}${specialText}`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅️ Kembali", callback_data: "menu_renungan" }],
              ],
            },
          }
        );
      } else {
        await safeEditMessage(
          `❌ *Gagal Kirim Renungan*\n\n${sendResult.error}`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅️ Kembali", callback_data: "menu_renungan" }],
              ],
            },
          }
        );
      }
      break;

    case "renungan_preview":
      await safeEditMessage(
        "⏳ *Generating preview...*\n\nAI sedang membuat renungan...",
        {
          chat_id: chatId,
          message_id: messageId,
        }
      );

      const preview = await renungan.previewRenungan();

      if (preview.success) {
        // Simpan preview message untuk user ini
        previewMessages.set(userId, {
          message: preview.message,
          verse: preview.verse,
          specialDay: preview.specialDay,
          timestamp: Date.now(),
        });

        // Kirim preview tanpa markdown karena sudah diformat untuk WhatsApp
        await bot.sendMessage(chatId, preview.message);

        const specialText = preview.specialDay
          ? `\n🎉 Hari Spesial: ${preview.specialDay}`
          : "";
        await safeEditMessage(
          `✅ *Preview Generated*\n\n📖 Ayat: ${preview.verse}${specialText}`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "📤 Kirim Ini", callback_data: "renungan_send_now" }],
                [{ text: "⬅️ Kembali", callback_data: "menu_renungan" }],
              ],
            },
          }
        );
      } else {
        await safeEditMessage(
          `❌ *Gagal Generate Preview*\n\n${preview.error}`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅️ Kembali", callback_data: "menu_renungan" }],
              ],
            },
          }
        );
      }
      break;

    case "renungan_list_verses":
      return showCategoryMenu(chatId, messageId);

    case "renungan_add_verse":
      userStates.set(userId, { action: "add_verse", step: "verse", data: {} });
      await safeEditMessage(
        `➕ *Tambah Ayat Baru*\n\nKirim alamat ayat (contoh: Yohanes 3:16)\n\nKetik "batal" untuk membatalkan.`,
        { chat_id: chatId, message_id: messageId }
      );
      break;

    case "renungan_reset":
      const resetResult = await renungan.resetVerses();
      
      if (resetResult.success) {
        await safeEditMessage(
          `✅ *Status ayat berhasil direset!*\n\n📖 Total ayat: ${resetResult.total}\n📅 Tahun: ${resetResult.year}\n\n✨ Semua ayat ditandai belum dipakai dan siap digunakan kembali dari awal.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅️ Kembali", callback_data: "menu_renungan" }],
              ],
            },
          }
        );
      } else {
        await safeEditMessage(
          `❌ *Gagal reset ayat*\n\n${resetResult.error}`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅️ Kembali", callback_data: "menu_renungan" }],
              ],
            },
          }
        );
      }
      break;
  }
}

/**
 * Tampilkan menu kategori ayat
 */
async function showCategoryMenu(chatId, messageId) {
  const verses = await renungan.getAllVerses();

  // Hitung jumlah ayat per kategori
  const categoryCount = {};
  verses.forEach((v) => {
    const cat = v.category || "umum";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  // Nama kategori yang lebih ramah
  const categoryNames = {
    kasih: "❤️ Kasih",
    iman: "✝️ Iman",
    harapan: "✨ Harapan",
    kekuatan: "💪 Kekuatan",
    penghiburan: "🤗 Penghiburan",
    doa: "🙏 Doa",
    hikmat: "⚖️ Hikmat",
    damai: "🕊️ Damai Sejahtera",
    pertobatan: "🔥 Pertobatan",
    pertumbuhan_rohani: "🌱 Pertumbuhan Rohani",
    umum: "📖 Umum",
  };

  let message = "📚 *Pilih Kategori Ayat*\n\n";

  const keyboard = [];

  // Urutkan kategori berdasarkan jumlah ayat (terbanyak di atas)
  const sortedCategories = Object.entries(categoryCount).sort(
    (a, b) => b[1] - a[1]
  );

  // Buat tombol kategori (2 kolom)
  for (let i = 0; i < sortedCategories.length; i += 2) {
    const row = [];

    const cat1 = sortedCategories[i][0];
    const count1 = sortedCategories[i][1];
    row.push({
      text: `${categoryNames[cat1] || cat1} (${count1})`,
      callback_data: `verses_cat_${cat1}`,
    });

    if (i + 1 < sortedCategories.length) {
      const cat2 = sortedCategories[i + 1][0];
      const count2 = sortedCategories[i + 1][1];
      row.push({
        text: `${categoryNames[cat2] || cat2} (${count2})`,
        callback_data: `verses_cat_${cat2}`,
      });
    }

    keyboard.push(row);
  }

  // Tombol "Semua Ayat"
  keyboard.push([
    {
      text: `📜 Semua Ayat (${verses.length})`,
      callback_data: "verses_cat_all",
    },
  ]);

  keyboard.push([
    {
      text: "⬅️ Kembali",
      callback_data: "menu_renungan",
    },
  ]);

  return safeEditMessage(message, {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
}

async function showVersesList(chatId, messageId, page, category = null) {
  const allVerses = await renungan.getAllVerses();

  // Filter berdasarkan kategori jika ada
  const verses =
    category && category !== "all"
      ? allVerses.filter((v) => v.category === category)
      : allVerses;

  const perPage = 5;
  const totalPages = Math.ceil(verses.length / perPage);
  const start = page * perPage;
  const end = start + perPage;
  const pageVerses = verses.slice(start, end);

  // Nama kategori untuk header
  const categoryNames = {
    kasih: "❤️ Kasih",
    iman: "✝️ Iman",
    harapan: "✨ Harapan",
    kekuatan: "💪 Kekuatan",
    penghiburan: "🤗 Penghiburan",
    doa: "🙏 Doa",
    hikmat: "⚖️ Hikmat",
    damai: "🕊️ Damai Sejahtera",
    pertobatan: "🔥 Pertobatan",
    pertumbuhan_rohani: "🌱 Pertumbuhan Rohani",
    umum: "📖 Umum",
  };

  const categoryTitle =
    category && category !== "all"
      ? categoryNames[category] || category
      : "📜 Semua Kategori";

  // Format tanpa underscore yang menyebabkan error
  let message = `📝 *Daftar Ayat*\n${categoryTitle}\n\nHalaman ${
    page + 1
  }/${totalPages}\n\n`;

  pageVerses.forEach((v, i) => {
    const status = v.used ? "✅" : "⭕";
    message += `${status} ${start + i + 1}. ${v.verse}\n`;
    if (category === "all" || !category) {
      // Tampilkan kategori jika melihat semua ayat
      const cat = v.category || "umum";
      const safeCat = cat.replace(/_/g, " ");
      message += `   📁 ${safeCat}\n`;
    }
    message += `\n`;
  });

  const navButtons = [];
  if (page > 0) {
    navButtons.push({
      text: "⬅️ Prev",
      callback_data: category
        ? `verse_cat_${category}_page_${page - 1}`
        : `verse_page_${page - 1}`,
    });
  }
  if (page < totalPages - 1) {
    navButtons.push({
      text: "Next ➡️",
      callback_data: category
        ? `verse_cat_${category}_page_${page + 1}`
        : `verse_page_${page + 1}`,
    });
  }

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        navButtons.length > 0 ? navButtons : [],
        [
          {
            text: "🔙 Pilih Kategori Lain",
            callback_data: "renungan_list_verses",
          },
        ],
        [{ text: "➕ Tambah Ayat", callback_data: "renungan_add_verse" }],
        [{ text: "⬅️ Menu Utama", callback_data: "menu_renungan" }],
      ].filter((row) => row.length > 0),
    },
  };

  // Kirim tanpa parse_mode karena tidak ada formatting
  return bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    ...keyboard,
  });
}

async function handleVerseCallback(data, chatId, messageId) {
  // Handle category selection
  if (data.startsWith("verses_cat_")) {
    const category = data.replace("verses_cat_", "");
    return showVersesList(chatId, messageId, 0, category);
  }

  // Handle pagination with category
  if (data.includes("_cat_") && data.includes("_page_")) {
    const parts = data.replace("verse_cat_", "").split("_page_");
    const category = parts[0];
    const page = parseInt(parts[1]);
    return showVersesList(chatId, messageId, page, category);
  }

  // Handle pagination without category
  if (data.startsWith("verse_page_")) {
    const page = parseInt(data.replace("verse_page_", ""));
    return showVersesList(chatId, messageId, page);
  }

  if (data.startsWith("verse_delete_")) {
    const id = parseInt(data.replace("verse_delete_", ""));
    await renungan.deleteVerse(id);
    return showVersesList(chatId, messageId, 0);
  }
}

async function handleCategoryCallback(data, chatId, messageId, userId) {
  const category = data.replace("cat_", "");
  const state = userStates.get(userId);

  if (!state || state.action !== "add_verse") return;

  const result = await renungan.addVerse(state.data.verse, category);

  userStates.delete(userId);

  if (result.success) {
    await safeSendMessage(
      chatId,
      `✅ *Ayat Berhasil Ditambahkan!*\n\n📖 ${state.data.verse}\n📁 Kategori: ${category}`
    );
  } else {
    await safeSendMessage(
      chatId,
      `❌ *Gagal Menambahkan Ayat*\n\n${result.error}`
    );
  }

  await showRenunganMenu(chatId, null);
}

// ============================================
// BIRTHDAY MENU
// ============================================

async function showBirthdayMenu(chatId, messageId) {
  const config = await loadConfig();
  const upcoming = await birthday.getUpcoming(7);
  const today = await sheets.getBirthdaysToday();

  let upcomingText = "Tidak ada";
  if (upcoming.length > 0) {
    upcomingText = upcoming
      .slice(0, 5)
      .map((b) => `• ${b.name} (${b.fullDate})`)
      .join("\n");
  }

  const groupDisplay = config.birthdayGroupId || "Personal";

  const message = `🎂 *Menu Ulang Tahun*

⏰ Jadwal Cek: ${config.birthdayTime || "07:00"} WITA
👥 Group: ${groupDisplay.substring(0, 20)}...

🎉 Hari Ini: ${today.length} orang
${today.length > 0 ? today.map((t) => `  • ${t.name}`).join("\n") : ""}

📅 7 Hari ke Depan:
${upcomingText}

Pilih aksi:`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📤 Kirim Ucapan Sekarang",
            callback_data: "birthday_send_now",
          },
        ],
        [{ text: "📋 Lihat Semua Data", callback_data: "birthday_view_all" }],
        [
          {
            text: "📊 Info Google Sheet",
            callback_data: "birthday_sheet_info",
          },
        ],
        [{ text: "⏰ Atur Jadwal", callback_data: "settings_birthday_time" }],
        [{ text: "⬅️ Kembali", callback_data: "back_main" }],
      ],
    },
  };

  if (messageId) {
    return safeEditMessage(message, {
      chat_id: chatId,
      message_id: messageId,
      ...keyboard,
    });
  }

  return safeSendMessage(chatId, message, keyboard);
}

async function handleBirthdayCallback(data, chatId, messageId) {
  switch (data) {
    case "birthday_send_now":
      await safeEditMessage("⏳ *Mengirim ucapan ulang tahun...*", {
        chat_id: chatId,
        message_id: messageId,
      });

      const result = await birthday.processBirthdays();

      if (result.success) {
        let resultMsg = `✅ *Proses Selesai*\n\n`;
        if (result.count === 0) {
          resultMsg += "Tidak ada yang berulang tahun hari ini.";
        } else {
          resultMsg += `🎂 Total: ${result.count} orang\n`;
          resultMsg += `✅ Terkirim: ${result.sent}\n`;
          resultMsg += `❌ Gagal: ${result.failed}`;
        }

        await safeEditMessage(resultMsg, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Kembali", callback_data: "menu_birthday" }],
            ],
          },
        });
      } else {
        await safeEditMessage(`❌ *Gagal*\n\n${result.error}`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Kembali", callback_data: "menu_birthday" }],
            ],
          },
        });
      }
      break;

    case "birthday_view_all":
      const all = await sheets.getAllBirthdays();
      let allMsg = `📋 Data Ulang Tahun (${all.length} orang)\n\n`;

      if (all.length === 0) {
        allMsg += "Belum ada data.";
      } else {
        const sorted = all.sort((a, b) => {
          const dateA = moment(a.date, ["DD-MM", "DD/MM"]);
          const dateB = moment(b.date, ["DD-MM", "DD/MM"]);
          return dateA.month() - dateB.month() || dateA.date() - dateB.date();
        });

        sorted.slice(0, 20).forEach((b, i) => {
          allMsg += `${i + 1}. ${b.name} - ${b.date}\n`;
        });

        if (all.length > 20) {
          allMsg += `\n... dan ${all.length - 20} lainnya`;
        }
      }

      await bot.editMessageText(allMsg, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ Kembali", callback_data: "menu_birthday" }],
          ],
        },
      });
      break;

    case "birthday_sheet_info":
      const info = await sheets.getSpreadsheetInfo();

      if (info) {
        await safeEditMessage(
          `📊 *Info Google Sheet*\n\n📄 Nama: ${
            info.title
          }\n📑 Sheets: ${info.sheets.join(", ")}`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅️ Kembali", callback_data: "menu_birthday" }],
              ],
            },
          }
        );
      } else {
        await safeEditMessage(
          "❌ *Gagal mengambil info sheet*\n\nPastikan credentials dan SPREADSHEET ID sudah benar.",
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅️ Kembali", callback_data: "menu_birthday" }],
              ],
            },
          }
        );
      }
      break;
  }
}

// ============================================
// SETTINGS MENU
// ============================================

async function showSettingsMenu(chatId, messageId) {
  const config = await loadConfig();
  const waConnected = await wa.isConnected();

  const message = `⚙️ *Pengaturan Bot*

📱 WhatsApp: ${waConnected ? "Terhubung" : "Tidak Terhubung"}

📖 Renungan:
• Waktu: ${config.renunganTime || "08:00"} WITA
• Group ID: ${config.renunganGroupId ? "Sudah diatur" : "Belum diatur"}

🎂 Ulang Tahun:
• Waktu: ${config.birthdayTime || "07:00"} WITA
• Group ID: ${config.birthdayGroupId ? "Sudah diatur" : "Personal"}

🤖 AI Provider: ${getProvider().toUpperCase()}
💡 Model: ${process.env.AI_MODEL}

Pilih pengaturan:`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📖 Atur Group Renungan",
            callback_data: "settings_renungan_group",
          },
        ],
        [
          {
            text: "🎂 Atur Group Birthday",
            callback_data: "settings_birthday_group",
          },
        ],
        [
          {
            text: "⏰ Atur Jadwal Renungan",
            callback_data: "settings_renungan_time",
          },
        ],
        [
          {
            text: "⏰ Atur Jadwal Birthday",
            callback_data: "settings_birthday_time",
          },
        ],
        [{ text: "🤖 Test AI Connection", callback_data: "settings_test_ai" }],
        [{ text: "📱 WhatsApp Login/Logout", callback_data: "settings_wa" }],
        [{ text: "⬅️ Kembali", callback_data: "back_main" }],
      ],
    },
  };

  if (messageId) {
    return safeEditMessage(message, {
      chat_id: chatId,
      message_id: messageId,
      ...keyboard,
    });
  }

  return safeSendMessage(chatId, message, keyboard);
}

async function handleSettingsCallback(data, chatId, messageId, userId) {
  switch (data) {
    case "settings_renungan_group":
      userStates.set(userId, { action: "set_renungan_group" });
      await safeEditMessage(
        `⚙️ *Atur Group ID Renungan*

Kirim salah satu dari:

1️⃣ *Link Invite WhatsApp*
   https://chat.whatsapp.com/xxxxx
   _Bot akan otomatis join dan ambil Group ID_

2️⃣ *Group ID Langsung*
   Format: 6281234567890-1234567890@g.us

Ketik "batal" untuk membatalkan.`,
        { chat_id: chatId, message_id: messageId }
      );
      break;

    case "settings_birthday_group":
      userStates.set(userId, { action: "set_birthday_group" });
      await safeEditMessage(
        `⚙️ *Atur Group ID Birthday*

Kirim salah satu dari:

1️⃣ *Link Invite WhatsApp*
   https://chat.whatsapp.com/xxxxx
   _Bot akan otomatis join dan ambil Group ID_

2️⃣ *Group ID Langsung*
   Format: 6281234567890-1234567890@g.us

3️⃣ Ketik "personal" untuk kirim ke masing-masing

Ketik "batal" untuk membatalkan.`,
        { chat_id: chatId, message_id: messageId }
      );
      break;

    case "settings_renungan_time":
      await safeEditMessage(
        "⏰ *Pilih Waktu Renungan*\n\nPilih jam pengiriman renungan harian:",
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "06:00", callback_data: "time_renungan_06:00" },
                { text: "07:00", callback_data: "time_renungan_07:00" },
                { text: "08:00", callback_data: "time_renungan_08:00" },
              ],
              [
                { text: "09:00", callback_data: "time_renungan_09:00" },
                { text: "10:00", callback_data: "time_renungan_10:00" },
              ],
              [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
            ],
          },
        }
      );
      break;

    case "settings_birthday_time":
      await safeEditMessage(
        "⏰ *Pilih Waktu Birthday*\n\nPilih jam pengiriman ucapan ulang tahun:",
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "06:00", callback_data: "time_birthday_06:00" },
                { text: "07:00", callback_data: "time_birthday_07:00" },
                { text: "08:00", callback_data: "time_birthday_08:00" },
              ],
              [
                { text: "09:00", callback_data: "time_birthday_09:00" },
                { text: "10:00", callback_data: "time_birthday_10:00" },
              ],
              [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
            ],
          },
        }
      );
      break;

    case "settings_test_ai":
      await safeEditMessage("⏳ Testing AI connection...", {
        chat_id: chatId,
        message_id: messageId,
      });

      const aiResult = await testAIConnection();

      if (aiResult.success) {
        await safeEditMessage(
          `✅ *AI Connected!*\n\nModel: ${aiResult.model}`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
              ],
            },
          }
        );
      } else {
        await safeEditMessage(`❌ *AI Error*\n\n${aiResult.error}`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
            ],
          },
        });
      }
      break;

    case "settings_wa":
      const waConnected = await wa.isConnected();

      if (waConnected) {
        await safeEditMessage(
          `📱 *WhatsApp Terhubung*\n\nApakah Anda ingin logout?`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "🚪 Logout", callback_data: "wa_logout" }],
                [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
              ],
            },
          }
        );
      } else {
        await safeEditMessage(
          `📱 *WhatsApp Tidak Terhubung*\n\nKlik untuk login:`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "📱 Login WhatsApp", callback_data: "wa_login" }],
                [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
              ],
            },
          }
        );
      }
      break;
  }
}

async function handleTimeCallback(data, chatId, messageId) {
  // Format: time_renungan_08:00 atau time_birthday_07:00
  const parts = data.replace("time_", "").split("_");
  const type = parts[0]; // renungan atau birthday
  const time = parts[1]; // 08:00

  const config = await loadConfig();

  try {
    if (type === "renungan") {
      config.renunganTime = time;
      await saveConfig(config);

      // Restart scheduler langsung tanpa restart bot
      renungan.restartRenunganScheduler(time);

      await safeEditMessage(
        `✅ *Jadwal Renungan Diperbarui!*\n\nWaktu: ${time} WITA\n\n✨ Scheduler sudah aktif, tidak perlu restart bot!`,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
            ],
          },
        }
      );
    } else if (type === "birthday") {
      config.birthdayTime = time;
      await saveConfig(config);

      // Restart scheduler langsung tanpa restart bot
      birthday.restartBirthdayScheduler(time);

      await safeEditMessage(
        `✅ *Jadwal Birthday Diperbarui!*\n\nWaktu: ${time} WITA\n\n✨ Scheduler sudah aktif, tidak perlu restart bot!`,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
            ],
          },
        }
      );
    }
  } catch (error) {
    await safeEditMessage(`❌ *Gagal Update Jadwal*\n\n${error.message}`, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
        ],
      },
    });
  }
}

async function handleWACallback(data, chatId, messageId, userId) {
  switch (data) {
    case "wa_login":
      wa.setAdminChatId(userId, chatId);
      await safeEditMessage(
        `📱 *Login WhatsApp*\n\n⏳ Menunggu QR Code...\n\nQR akan dikirim dalam beberapa saat.`,
        {
          chat_id: chatId,
          message_id: messageId,
        }
      );
      break;

    case "wa_logout":
      try {
        await wa.logout();
        await safeEditMessage(
          `✅ *Logout Berhasil*\n\nWhatsApp telah terputus.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
              ],
            },
          }
        );
      } catch (error) {
        await safeEditMessage(`❌ *Gagal Logout*\n\n${error.message}`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Kembali", callback_data: "menu_settings" }],
            ],
          },
        });
      }
      break;
  }
}

// ============================================
// STATUS
// ============================================

async function showStatus(chatId, messageId = null) {
  const waConnected = await wa.isConnected();
  const waState = wa.getConnectionState();
  const stats = await renungan.getVersesStats();
  const todayBirthdays = await sheets.getBirthdaysToday();
  const config = await loadConfig();

  const message = `📊 *Status Bot*

📱 WhatsApp:
• Status: ${getStatusEmoji(waConnected)} ${
    waConnected ? "Terhubung" : "Tidak Terhubung"
  }
• State: ${waState}

📖 Renungan:
• Ayat tersedia: ${stats.unused}/${stats.total}
• Jadwal: ${config.renunganTime || "08:00"} WITA

🎂 Ulang Tahun:
• Hari ini: ${todayBirthdays.length} orang
• Jadwal: ${config.birthdayTime || "07:00"} WITA

🤖 AI: ${getProvider()} (${process.env.AI_MODEL})

⏰ Server:
• Waktu: ${moment().format("HH:mm:ss")}
• Tanggal: ${moment().format("DD/MM/YYYY")}
• Timezone: ${process.env.TIMEZONE || "Asia/Makassar"}`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [[{ text: "⬅️ Kembali", callback_data: "back_main" }]],
    },
  };

  if (messageId) {
    return safeEditMessage(message, {
      chat_id: chatId,
      message_id: messageId,
      ...keyboard,
    });
  }

  return safeSendMessage(chatId, message, keyboard);
}

// ============================================
// MESSAGE HANDLERS
// ============================================

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (!isAdmin(userId)) return;

  const state = userStates.get(userId);
  if (!state) return;

  // Handle cancel
  if (text.toLowerCase() === "batal") {
    userStates.delete(userId);
    return showMainMenu(chatId, userId);
  }

  try {
    switch (state.action) {
      case "add_verse":
        await handleAddVerseInput(userId, chatId, text, state);
        break;

      case "set_renungan_group":
        let groupId = text;

        // Cek apakah ini link invite WhatsApp
        if (text.includes("chat.whatsapp.com/")) {
          await safeSendMessage(
            chatId,
            "⏳ *Memproses link invite...*\n\nMencoba join grup..."
          );

          const joinResult = await wa.joinGroupByInviteLink(text);

          if (joinResult.success) {
            const config1 = await loadConfig();
            config1.renunganGroupId = joinResult.groupId;
            await saveConfig(config1);
            process.env.RENUNGAN_GROUP_ID = joinResult.groupId;

            userStates.delete(userId);
            await safeSendMessage(
              chatId,
              `✅ *Berhasil Join Grup!*\n\nGroup ID: ${joinResult.groupId}\n\n📖 Renungan akan dikirim ke grup ini.`
            );
            await showSettingsMenu(chatId, null);
          } else {
            await safeSendMessage(
              chatId,
              `❌ *Gagal Join Grup*\n\n${joinResult.error}\n\nSilakan coba lagi atau masukkan Group ID manual.`
            );
          }
          return;
        }

        // Handle Group ID manual
        const config1 = await loadConfig();
        config1.renunganGroupId = groupId;
        await saveConfig(config1);
        process.env.RENUNGAN_GROUP_ID = groupId;

        userStates.delete(userId);
        await safeSendMessage(
          chatId,
          `✅ *Group ID Renungan Diatur*\n\n${groupId.substring(0, 40)}...`
        );
        await showSettingsMenu(chatId, null);
        break;

      case "set_birthday_group":
        // Handle "personal"
        if (text.toLowerCase() === "personal") {
          const config2 = await loadConfig();
          config2.birthdayGroupId = "";
          await saveConfig(config2);
          process.env.BIRTHDAY_GROUP_ID = "";

          userStates.delete(userId);
          await safeSendMessage(
            chatId,
            "✅ Ucapan ulang tahun akan dikirim ke masing-masing."
          );
          await showSettingsMenu(chatId, null);
          return;
        }

        // Handle link invite
        if (text.includes("chat.whatsapp.com/")) {
          await safeSendMessage(
            chatId,
            "⏳ *Memproses link invite...*\n\nMencoba join grup..."
          );

          const joinResult = await wa.joinGroupByInviteLink(text);

          if (joinResult.success) {
            const config2 = await loadConfig();
            config2.birthdayGroupId = joinResult.groupId;
            await saveConfig(config2);
            process.env.BIRTHDAY_GROUP_ID = joinResult.groupId;

            userStates.delete(userId);
            await safeSendMessage(
              chatId,
              `✅ *Berhasil Join Grup!*\n\nGroup ID: ${joinResult.groupId}\n\n🎂 Ucapan ulang tahun akan dikirim ke grup ini.`
            );
            await showSettingsMenu(chatId, null);
          } else {
            await safeSendMessage(
              chatId,
              `❌ *Gagal Join Grup*\n\n${joinResult.error}\n\nSilakan coba lagi atau masukkan Group ID manual.`
            );
          }
          return;
        }

        // Handle Group ID manual
        const config2 = await loadConfig();
        config2.birthdayGroupId = text;
        await saveConfig(config2);
        process.env.BIRTHDAY_GROUP_ID = text;

        userStates.delete(userId);
        await safeSendMessage(
          chatId,
          `✅ *Group ID Birthday Diatur*\n\n${text.substring(0, 40)}...`
        );
        await showSettingsMenu(chatId, null);
        break;
    }
  } catch (error) {
    console.error("❌ Message handler error:", error.message);
    await safeSendMessage(chatId, `❌ Error: ${error.message}`);
    userStates.delete(userId);
  }
});

async function handleAddVerseInput(userId, chatId, text, state) {
  switch (state.step) {
    case "verse":
      state.data.verse = text;
      state.step = "category";
      userStates.set(userId, state);

      await safeSendMessage(chatId, `📖 Ayat: ${text}\n\nPilih kategori:`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "❤️ Kasih", callback_data: "cat_kasih" },
              { text: "✝️ Iman", callback_data: "cat_iman" },
            ],
            [
              { text: "🌟 Harapan", callback_data: "cat_harapan" },
              { text: "💪 Kekuatan", callback_data: "cat_kekuatan" },
            ],
            [
              { text: "🤗 Penghiburan", callback_data: "cat_penghiburan" },
              { text: "📖 Umum", callback_data: "cat_umum" },
            ],
          ],
        },
      });
      break;
  }
}

// ============================================
// START FUNCTION
// ============================================

/**
 * Restart Telegram polling dengan backoff
 */
async function restartTelegramPolling() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  const delay = Math.min(
    POLLING_RETRY_DELAY * Math.pow(2, pollingRetries),
    60000
  );

  console.log(`⏳ Mencoba reconnect Telegram dalam ${delay / 1000}s...`);

  reconnectTimeout = setTimeout(async () => {
    try {
      await bot.stopPolling();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await bot.startPolling();

      pollingRetries = 0;
      isOnline = true;
      console.log("✅ Telegram polling berhasil direstart");
    } catch (error) {
      pollingRetries++;
      if (pollingRetries < MAX_POLLING_RETRIES) {
        console.log(`🔄 Retry ${pollingRetries}/${MAX_POLLING_RETRIES}...`);
        restartTelegramPolling();
      } else {
        console.error(
          "❌ Max retries tercapai. Bot akan menunggu koneksi kembali."
        );
        isOnline = false;
      }
    }
  }, delay);
}

function startTelegramBot() {
  console.log("🤖 Telegram Bot aktif!");
  console.log(
    `👮 Admin IDs: ${
      ADMIN_IDS.length > 0 ? ADMIN_IDS.join(", ") : "Belum diatur!"
    }`
  );

  // Handle polling errors dengan retry
  bot.on("polling_error", (error) => {
    const errorCode = error.code || "UNKNOWN";
    const errorMsg = error.message || "";

    // Ignore error duplikat polling (409)
    if (errorCode === "ETELEGRAM" && errorMsg.includes("409")) {
      return;
    }

    // Handle EFATAL (koneksi terputus)
    if (errorCode === "EFATAL" || errorMsg.includes("EFATAL")) {
      console.log("⚠️ Koneksi internet terputus. Menunggu reconnect...");
      isOnline = false;

      // Auto-restart polling
      if (pollingRetries < MAX_POLLING_RETRIES) {
        restartTelegramPolling();
      }
      return;
    }

    // Handle error lainnya
    if (
      errorCode === "ECONNRESET" ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "ENOTFOUND"
    ) {
      console.log(`⚠️ Network error (${errorCode}). Retry otomatis...`);
      if (pollingRetries < MAX_POLLING_RETRIES) {
        restartTelegramPolling();
      }
      return;
    }

    // Log error lainnya
    console.error(
      `❌ Telegram error [${errorCode}]:`,
      errorMsg.substring(0, 100)
    );
  });

  // Monitor koneksi kembali
  setInterval(() => {
    if (!isOnline && pollingRetries >= MAX_POLLING_RETRIES) {
      console.log("🔄 Mencoba reconnect Telegram...");
      pollingRetries = 0;
      restartTelegramPolling();
    }
  }, 30000); // Cek setiap 30 detik
}

/**
 * Kirim notifikasi error ke admin via Telegram
 */
async function notifyAdminError(errorMessage) {
  if (ADMIN_IDS.length === 0) {
    console.log("⚠️ Tidak ada admin untuk notifikasi error");
    return;
  }

  const message = `🚨 *Error Alert*\n\n${errorMessage}\n\n⏰ ${moment().format('DD/MM/YYYY HH:mm:ss')}`;

  for (const adminId of ADMIN_IDS) {
    try {
      await bot.sendMessage(adminId, message, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(`❌ Gagal kirim notif ke admin ${adminId}:`, err.message);
    }
  }
}

module.exports = { startTelegramBot, bot, notifyAdminError };
