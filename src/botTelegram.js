const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const moment = require("moment-timezone");
moment.tz.setDefault(process.env.TIMEZONE);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Daftar Admin IDs dari .env
const ADMIN_IDS = process.env.ADMIN_TELEGRAM_IDS
  ? process.env.ADMIN_TELEGRAM_IDS.split(",").map((id) => parseInt(id.trim()))
  : [];

// State management untuk admin yang sudah login
const adminSessions = new Map(); // userId -> { waLoggedIn: boolean, contacts: [], groups: [] }

// Middleware: Cek apakah user adalah admin
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

// Kirim pesan akses ditolak
function denyAccess(chatId, username) {
  bot.sendMessage(
    chatId,
    `❌ *Akses Ditolak*\n\nMaaf @${
      username || "user"
    }, hanya admin yang dapat menggunakan bot ini.\n\n🔒 Hubungi administrator untuk mendapatkan akses.`,
    { parse_mode: "Markdown" }
  );
}

// Cek apakah admin sudah login WhatsApp
async function checkWhatsAppLogin(waClient) {
  try {
    const state = await waClient.getState();
    return state === "CONNECTED";
  } catch (error) {
    return false;
  }
}

// Sinkronisasi kontak dan grup WhatsApp
async function syncWhatsAppData(waClient, userId) {
  try {
    console.log(`🔄 Sinkronisasi data WhatsApp untuk admin ${userId}...`);

    // Get contacts
    const contacts = await waClient.getContacts();
    const filteredContacts = contacts
      .filter((c) => c.isUser && c.id && c.id.user)
      .map((c) => ({
        id: c.id._serialized,
        name: c.name || c.pushname || c.verifiedName || c.id.user || "Unknown",
        number: c.id.user,
      }))
      .filter((c) => c.name && c.name !== "Unknown") // Filter out unknown names
      .sort((a, b) => {
        const nameA = String(a.name || "");
        const nameB = String(b.name || "");
        return nameA.localeCompare(nameB);
      });

    // Get chats (grup dan channel)
    const chats = await waClient.getChats();
    const groups = chats
      .filter((c) => c.isGroup)
      .map((c) => ({
        id: c.id._serialized,
        name: c.name || "Unnamed Group",
        participants: c.participants ? c.participants.length : 0,
      }))
      .filter((g) => g.name && g.name !== "Unnamed Group")
      .sort((a, b) => {
        const nameA = String(a.name || "");
        const nameB = String(b.name || "");
        return nameA.localeCompare(nameB);
      });

    // Simpan ke session
    adminSessions.set(userId, {
      waLoggedIn: true,
      contacts: filteredContacts,
      groups: groups,
      lastSync: new Date(),
    });

    // Simpan ke file untuk persistence
    await fs.writeJson(
      "./src/data/admin_sessions.json",
      Array.from(adminSessions.entries()),
      { spaces: 2 }
    );

    console.log(
      `✅ Sinkronisasi selesai: ${filteredContacts.length} kontak, ${groups.length} grup`
    );

    return {
      contacts: filteredContacts,
      groups: groups,
    };
  } catch (error) {
    console.error("❌ Error sinkronisasi:", error.message);
    return { contacts: [], groups: [] };
  }
}

function startTelegramBot(waClient) {
  console.log("🤖 Telegram Bot aktif!");
  console.log(
    "👮 Admin IDs:",
    ADMIN_IDS.length > 0 ? ADMIN_IDS.join(", ") : "Belum diatur!"
  );

  // Load admin sessions dari file
  fs.readJson("./src/data/admin_sessions.json")
    .then((data) => {
      adminSessions.clear();
      data.forEach(([userId, session]) => {
        adminSessions.set(userId, session);
      });
      console.log(`📂 Loaded ${adminSessions.size} admin session(s)`);
    })
    .catch(() => {
      console.log("📂 No previous admin sessions found");
    });

  const mainMenu = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "� Kirim Pesan Berjadwal", callback_data: "menu_schedule" }],
        [{ text: "📖 Renungan Harian", callback_data: "menu_renungan" }],
        [{ text: "🎂 Ulang Tahun", callback_data: "menu_birthday" }],
        [{ text: "🔄 Sinkronisasi Ulang", callback_data: "resync_wa" }],
        [{ text: "🚪 Logout WhatsApp", callback_data: "logout_wa" }],
      ],
    },
  };

  // Store admin chat IDs untuk kirim QR
  const adminChatIds = new Map(); // userId -> chatId

  // Function untuk show main menu
  async function showMainMenu(chatId, username) {
    const welcomeMsg = `
🤖 *Panel Kontrol WhatsApp Bot*

👋 Selamat datang *Admin @${username}*!

✅ Status: WhatsApp Terhubung
📊 Data tersinkronisasi

Pilih menu di bawah untuk memulai:
    `.trim();

    return bot.sendMessage(chatId, welcomeMsg, {
      parse_mode: "Markdown",
      ...mainMenu,
    });
  }

  bot.onText(/start/i, async (msg) => {
    const userId = msg.from.id;
    const username = msg.from.username;
    const chatId = msg.chat.id;

    // Simpan chat ID admin
    adminChatIds.set(userId, chatId);

    // Verifikasi admin
    if (!isAdmin(userId)) {
      console.log(`⛔ Akses ditolak untuk user: ${username} (ID: ${userId})`);
      return denyAccess(chatId, username);
    }

    // Cek WhatsApp login status
    const isWAConnected = await checkWhatsAppLogin(waClient);

    if (!isWAConnected) {
      // WhatsApp belum login - kirim instruksi
      const loginMsg = `
👋 *Selamat datang Admin @${username}!*

⚠️ *WhatsApp belum terhubung*

Untuk menggunakan bot, Anda perlu menghubungkan WhatsApp terlebih dahulu.

📱 Saya akan mengirimkan QR Code untuk Anda scan.

⏳ *Mohon tunggu...*
      `.trim();

      await bot.sendMessage(chatId, loginMsg, { parse_mode: "Markdown" });
      console.log(`📱 Admin ${username} (${userId}) perlu login WhatsApp`);

      // Simpan info untuk kirim QR nanti
      waClient.adminChatIds = waClient.adminChatIds || new Map();
      waClient.adminChatIds.set(userId, chatId);

      return;
    }

    // Cek apakah admin sudah punya session
    let session = adminSessions.get(userId);

    if (!session || !session.waLoggedIn) {
      // Pertama kali login atau session expired
      const syncMsg = await bot.sendMessage(
        chatId,
        `🔄 *Menyinkronkan Data WhatsApp...*\n\nMohon tunggu, sedang memuat:\n• 📇 Kontak\n• 👥 Grup\n• 📢 Channel`,
        { parse_mode: "Markdown" }
      );

      // Sinkronisasi data
      const syncData = await syncWhatsAppData(waClient, userId);

      // Update pesan
      await bot.editMessageText(
        `✅ *Sinkronisasi Selesai!*\n\n` +
          `📇 Kontak: ${syncData.contacts.length}\n` +
          `👥 Grup: ${syncData.groups.length}\n\n` +
          `Panel kontrol siap digunakan! 🚀`,
        {
          chat_id: chatId,
          message_id: syncMsg.message_id,
          parse_mode: "Markdown",
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Tampilkan menu utama
    const welcomeMsg = `
🤖 *Panel Kontrol WhatsApp Bot*

👋 Selamat datang *Admin @${username}*!

✅ Status: WhatsApp Terhubung
📊 Data tersinkronisasi

Pilih menu di bawah untuk memulai:
    `.trim();

    bot.sendMessage(chatId, welcomeMsg, {
      parse_mode: "Markdown",
      ...mainMenu,
    });
  });

  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const username = query.from.username;
    const chatId = query.message.chat.id;
    const data = query.data;

    // Verifikasi admin untuk setiap callback
    if (!isAdmin(userId)) {
      console.log(
        `⛔ Callback ditolak untuk user: ${username} (ID: ${userId})`
      );
      bot.answerCallbackQuery(query.id, {
        text: "❌ Akses ditolak! Hanya admin.",
        show_alert: true,
      });
      return denyAccess(chatId, username);
    }

    // Jawab callback query
    bot.answerCallbackQuery(query.id);

    switch (data) {
      case "menu_schedule":
        bot.sendMessage(
          chatId,
          "� *Kirim Pesan Berjadwal*\n\nPilih tipe penerima:",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "👤 Pesan Pribadi",
                    callback_data: "schedule_private",
                  },
                ],
                [{ text: "👥 Pesan Grup", callback_data: "schedule_group" }],
                [
                  {
                    text: "📢 Siaran/Channel",
                    callback_data: "schedule_broadcast",
                  },
                ],
                [{ text: "📋 Lihat Jadwal", callback_data: "list_schedule" }],
                [{ text: "⬅️ Kembali", callback_data: "back_main" }],
              ],
            },
          }
        );
        break;

      case "schedule_private":
        handleSchedulePrivate(chatId, userId);
        break;

      case "schedule_group":
        handleScheduleGroup(chatId, userId);
        break;

      case "schedule_broadcast":
        handleScheduleBroadcast(chatId, userId);
        break;

      case "add_contact_manual":
        handleAddContactManual(chatId, userId);
        break;

      case "add_group_via_link":
        handleAddGroupViaLink(chatId, userId);
        break;

      case "add_schedule":
        bot.sendMessage(
          chatId,
          "Masukkan format:\n`nomor@c.us|YYYY-MM-DD HH:mm|teks/foto/pdf|isi pesan`",
          { parse_mode: "Markdown" }
        );
        bot.once("message", async (msg) => {
          const [to, time, type, ...rest] = msg.text.split("|");
          const content = rest.join("|").trim();

          const schedules = await fs
            .readJson("./src/data/schedule.json")
            .catch(() => []);
          schedules.push({ to, time, type, content, sent: false });
          await fs.writeJson("./src/data/schedule.json", schedules, {
            spaces: 2,
          });

          bot.sendMessage(chatId, "✅ Jadwal berhasil ditambahkan!");
        });
        break;

      case "list_schedule":
        const list = await fs
          .readJson("./src/data/schedule.json")
          .catch(() => []);
        if (!list.length) return bot.sendMessage(chatId, "Belum ada jadwal.");
        const msgList = list
          .map((s, i) => `${i + 1}. ${s.to} | ${s.time} | ${s.type}`)
          .join("\n");
        bot.sendMessage(chatId, "📋 Jadwal Tersimpan:\n" + msgList);
        break;

      case "menu_renungan":
        bot.sendMessage(
          chatId,
          "📖 Renungan otomatis tiap jam " +
            process.env.RENUNGAN_TIME +
            " ke grup " +
            process.env.RENUNGAN_GROUP_ID
        );
        break;

      case "menu_birthday":
        bot.sendMessage(
          chatId,
          "🎂 Pengingat ulang tahun aktif jam 7 pagi, data dari Google Sheet."
        );
        break;

      case "resync_wa":
        const resyncMsg = await bot.sendMessage(
          chatId,
          "🔄 *Menyinkronkan ulang data WhatsApp...*",
          { parse_mode: "Markdown" }
        );

        const resyncData = await syncWhatsAppData(waClient, userId);

        await bot.editMessageText(
          `✅ *Sinkronisasi Selesai!*\n\n` +
            `📇 Kontak: ${resyncData.contacts.length}\n` +
            `👥 Grup: ${resyncData.groups.length}\n\n` +
            `Data berhasil diperbarui!`,
          {
            chat_id: chatId,
            message_id: resyncMsg.message_id,
            parse_mode: "Markdown",
          }
        );
        break;

      case "logout_wa":
        bot.sendMessage(
          chatId,
          "🚪 *Logout WhatsApp*\n\nApakah Anda yakin ingin logout?",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Ya, Logout", callback_data: "confirm_logout" },
                  { text: "❌ Batal", callback_data: "back_main" },
                ],
              ],
            },
          }
        );
        break;

      case "confirm_logout":
        try {
          await waClient.logout();
          adminSessions.delete(userId);
          await fs.writeJson(
            "./src/data/admin_sessions.json",
            Array.from(adminSessions.entries()),
            { spaces: 2 }
          );

          bot.sendMessage(
            chatId,
            "✅ *Logout Berhasil!*\n\nWhatsApp telah terputus.\n\nKetik /start untuk login kembali.",
            { parse_mode: "Markdown" }
          );
          console.log(`🚪 Admin ${userId} logout dari WhatsApp`);
        } catch (error) {
          bot.sendMessage(chatId, "❌ Gagal logout: " + error.message);
        }
        break;

      case "back_main":
        bot.sendMessage(chatId, "🏠 *Menu Utama*\n\nPilih menu:", {
          parse_mode: "Markdown",
          ...mainMenu,
        });
        break;
    }
  });

  // Handler untuk schedule private (kontak pribadi)
  async function handleSchedulePrivate(chatId, userId) {
    const session = adminSessions.get(userId);

    const contactButtons = [];

    // Tambahkan opsi input manual di paling atas
    contactButtons.push([
      {
        text: "📝 Input Nomor Manual (08xxx)",
        callback_data: "add_contact_manual",
      },
    ]);

    if (session && session.contacts && session.contacts.length > 0) {
      // Tampilkan daftar kontak yang sudah ada
      const existingContacts = session.contacts.slice(0, 50).map((contact) => [
        {
          text: `${contact.name} (${contact.number})`,
          callback_data: `select_contact_${contact.id}`,
        },
      ]);

      contactButtons.push(...existingContacts);
      contactButtons.push([
        { text: "⬅️ Kembali", callback_data: "menu_schedule" },
      ]);

      bot.sendMessage(
        chatId,
        `👤 *Pilih Kontak Pribadi*\n\nTotal: ${session.contacts.length} kontak\n(Menampilkan 50 pertama)\n\nAtau input nomor manual di tombol atas.`,
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: contactButtons },
        }
      );
    } else {
      // Tidak ada kontak, tampilkan opsi manual dan sync
      contactButtons.push([
        { text: "🔄 Sinkronisasi", callback_data: "resync_wa" },
      ]);
      contactButtons.push([
        { text: "⬅️ Kembali", callback_data: "menu_schedule" },
      ]);

      bot.sendMessage(
        chatId,
        "👤 *Kontak Pribadi*\n\n📝 Input nomor manual atau sinkronisasi kontak dari WhatsApp.",
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: contactButtons },
        }
      );
    }
  }

  // Handler input nomor manual
  async function handleAddContactManual(chatId, userId) {
    bot.sendMessage(
      chatId,
      `📝 *Input Nomor Manual*\n\n` +
        `Masukkan nomor WhatsApp tujuan:\n\n` +
        `Format yang didukung:\n` +
        `• 08123456789\n` +
        `• 628123456789\n` +
        `• +628123456789\n\n` +
        `Atau ketik "batal" untuk kembali.`,
      { parse_mode: "Markdown" }
    );

    const inputHandler = async (msg) => {
      if (msg.chat.id !== chatId || msg.from.id !== userId) return;

      bot.removeListener("message", inputHandler);

      if (msg.text.toLowerCase() === "batal") {
        return handleSchedulePrivate(chatId, userId);
      }

      // Clean & format nomor
      let number = msg.text.trim().replace(/\D/g, ""); // Hapus non-digit

      // Convert 08xxx ke 628xxx
      if (number.startsWith("08")) {
        number = "62" + number.substring(1);
      } else if (number.startsWith("8")) {
        number = "62" + number;
      } else if (!number.startsWith("62")) {
        return bot.sendMessage(
          chatId,
          "❌ Format nomor tidak valid. Gunakan format: 08xxx atau 628xxx",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔄 Coba Lagi", callback_data: "add_contact_manual" }],
              ],
            },
          }
        );
      }

      const waId = `${number}@c.us`;

      // Cek apakah nomor valid di WhatsApp
      try {
        const isRegistered = await waClient.isRegisteredUser(waId);

        if (!isRegistered) {
          return bot.sendMessage(
            chatId,
            `❌ Nomor ${number} tidak terdaftar di WhatsApp.\n\nPastikan nomor benar dan aktif di WhatsApp.`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🔄 Coba Lagi",
                      callback_data: "add_contact_manual",
                    },
                  ],
                ],
              },
            }
          );
        }

        // Nomor valid, simpan sementara untuk setup message
        const session = adminSessions.get(userId) || {
          contacts: [],
          groups: [],
        };

        // Tambahkan ke kontak jika belum ada
        if (!session.contacts.find((c) => c.id === waId)) {
          session.contacts.push({
            id: waId,
            name: number,
            number: number,
          });
          adminSessions.set(userId, session);
          await fs.writeJson(
            "./src/data/admin_sessions.json",
            Array.from(adminSessions.entries()),
            { spaces: 2 }
          );
        }

        bot.sendMessage(
          chatId,
          `✅ *Nomor Valid!*\n\n📱 ${number}\n\n📅 Sekarang atur jadwal dan pesan...`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📝 Atur Pesan",
                    callback_data: `setup_message_${waId}`,
                  },
                ],
                [{ text: "⬅️ Kembali", callback_data: "menu_schedule" }],
              ],
            },
          }
        );
      } catch (error) {
        bot.sendMessage(
          chatId,
          `❌ Error memeriksa nomor: ${error.message}\n\nSilakan coba lagi.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔄 Coba Lagi", callback_data: "add_contact_manual" }],
              ],
            },
          }
        );
      }
    };

    bot.on("message", inputHandler);
  }

  // Handler untuk schedule group
  async function handleScheduleGroup(chatId, userId) {
    const session = adminSessions.get(userId);

    const groupButtons = [];

    // Tambahkan opsi join grup via link
    groupButtons.push([
      { text: "🔗 Join Grup Via Link", callback_data: "add_group_via_link" },
    ]);

    if (session && session.groups && session.groups.length > 0) {
      // Tampilkan daftar grup
      const existingGroups = session.groups.map((group) => [
        {
          text: `${group.name} (${group.participants} anggota)`,
          callback_data: `select_group_${group.id}`,
        },
      ]);

      groupButtons.push(...existingGroups);
      groupButtons.push([
        { text: "⬅️ Kembali", callback_data: "menu_schedule" },
      ]);

      bot.sendMessage(
        chatId,
        `👥 *Pilih Grup*\n\nTotal: ${session.groups.length} grup\n\nAtau join grup baru via link.`,
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: groupButtons },
        }
      );
    } else {
      groupButtons.push([
        { text: "🔄 Sinkronisasi", callback_data: "resync_wa" },
      ]);
      groupButtons.push([
        { text: "⬅️ Kembali", callback_data: "menu_schedule" },
      ]);

      bot.sendMessage(
        chatId,
        "👥 *Grup WhatsApp*\n\n🔗 Join grup via link atau sinkronisasi grup yang sudah ada.",
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: groupButtons },
        }
      );
    }
  }

  // Handler join grup via link
  async function handleAddGroupViaLink(chatId, userId) {
    bot.sendMessage(
      chatId,
      `🔗 *Join Grup Via Link*\n\n` +
        `Kirimkan link invite grup WhatsApp:\n\n` +
        `Contoh:\n` +
        `• https://chat.whatsapp.com/AbCdEfGh...\n\n` +
        `Atau ketik "batal" untuk kembali.`,
      { parse_mode: "Markdown" }
    );

    const linkHandler = async (msg) => {
      if (msg.chat.id !== chatId || msg.from.id !== userId) return;

      bot.removeListener("message", linkHandler);

      if (msg.text.toLowerCase() === "batal") {
        return handleScheduleGroup(chatId, userId);
      }

      const inviteLink = msg.text.trim();

      // Validasi link
      if (!inviteLink.includes("chat.whatsapp.com/")) {
        return bot.sendMessage(
          chatId,
          "❌ Link tidak valid. Pastikan link mengandung 'chat.whatsapp.com/'",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔄 Coba Lagi", callback_data: "add_group_via_link" }],
              ],
            },
          }
        );
      }

      try {
        // Extract invite code
        const inviteCode = inviteLink
          .split("chat.whatsapp.com/")[1]
          .split("?")[0];

        bot.sendMessage(chatId, "⏳ Mencoba join grup...");

        // Join grup
        const result = await waClient.acceptInvite(inviteCode);

        // Get grup info
        const chat = await waClient.getChatById(result);

        // Simpan ke session
        const session = adminSessions.get(userId) || {
          contacts: [],
          groups: [],
        };

        const newGroup = {
          id: chat.id._serialized,
          name: chat.name || "Unnamed Group",
          participants: chat.participants ? chat.participants.length : 0,
        };

        // Tambahkan jika belum ada
        if (!session.groups.find((g) => g.id === newGroup.id)) {
          session.groups.push(newGroup);
          session.groups.sort((a, b) =>
            String(a.name).localeCompare(String(b.name))
          );
          adminSessions.set(userId, session);
          await fs.writeJson(
            "./src/data/admin_sessions.json",
            Array.from(adminSessions.entries()),
            { spaces: 2 }
          );
        }

        bot.sendMessage(
          chatId,
          `✅ *Berhasil Join Grup!*\n\n👥 ${newGroup.name}\n👤 ${newGroup.participants} anggota\n\n📅 Sekarang atur jadwal dan pesan...`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📝 Atur Pesan",
                    callback_data: `setup_message_${newGroup.id}`,
                  },
                ],
                [{ text: "⬅️ Kembali", callback_data: "menu_schedule" }],
              ],
            },
          }
        );

        console.log(`✅ Admin ${userId} join grup: ${newGroup.name}`);
      } catch (error) {
        bot.sendMessage(
          chatId,
          `❌ Gagal join grup: ${error.message}\n\nPastikan link valid dan bot belum join grup ini.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔄 Coba Lagi", callback_data: "add_group_via_link" }],
              ],
            },
          }
        );
      }
    };

    bot.on("message", linkHandler);
  }

  // Handler untuk broadcast
  async function handleScheduleBroadcast(chatId, userId) {
    bot.sendMessage(
      chatId,
      `📢 *Siaran/Broadcast*\n\nMasukkan nomor tujuan (pisahkan dengan koma jika lebih dari 1):\n\nFormat:\n\`6281234567890,6289876543210\`\n\nAtau ketik "batal" untuk kembali.`,
      { parse_mode: "Markdown" }
    );

    // Tunggu input dari user
    const messageHandler = async (msg) => {
      if (msg.chat.id !== chatId) return;

      bot.removeListener("message", messageHandler);

      if (msg.text.toLowerCase() === "batal") {
        return bot.sendMessage(chatId, "❌ Dibatalkan", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Kembali", callback_data: "menu_schedule" }],
            ],
          },
        });
      }

      // Process broadcast numbers
      const numbers = msg.text
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n);

      if (numbers.length === 0) {
        return bot.sendMessage(
          chatId,
          "❌ Format nomor tidak valid. Coba lagi dengan /start"
        );
      }

      bot.sendMessage(
        chatId,
        `✅ ${numbers.length} nomor siap untuk broadcast!\n\nLanjutkan dengan mengatur jadwal dan pesan.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📅 Atur Jadwal",
                  callback_data: "set_broadcast_schedule",
                },
              ],
              [{ text: "⬅️ Kembali", callback_data: "menu_schedule" }],
            ],
          },
        }
      );

      // Simpan sementara ke session
      const session = adminSessions.get(userId);
      if (session) {
        session.broadcastNumbers = numbers;
      }
    };

    bot.on("message", messageHandler);
  }

  // Handler ketika kontak atau grup dipilih
  bot.on("callback_query", async (query) => {
    const data = query.data;

    // Handle contact selection
    if (data.startsWith("select_contact_")) {
      const contactId = data.replace("select_contact_", "");
      const session = adminSessions.get(query.from.id);
      const contact = session.contacts.find((c) => c.id === contactId);

      if (contact) {
        bot.answerCallbackQuery(query.id, { text: `Dipilih: ${contact.name}` });

        bot.sendMessage(
          query.message.chat.id,
          `✅ *Kontak Dipilih:*\n${contact.name}\n\n📅 Sekarang atur jadwal dan pesan...`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📝 Atur Pesan",
                    callback_data: `setup_message_${contactId}`,
                  },
                ],
                [{ text: "⬅️ Kembali", callback_data: "menu_schedule" }],
              ],
            },
          }
        );
      }
    }

    // Handle group selection
    if (data.startsWith("select_group_")) {
      const groupId = data.replace("select_group_", "");
      const session = adminSessions.get(query.from.id);
      const group = session.groups.find((g) => g.id === groupId);

      if (group) {
        bot.answerCallbackQuery(query.id, { text: `Dipilih: ${group.name}` });

        bot.sendMessage(
          query.message.chat.id,
          `✅ *Grup Dipilih:*\n${group.name}\n\n📅 Sekarang atur jadwal dan pesan...`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📝 Atur Pesan",
                    callback_data: `setup_message_${groupId}`,
                  },
                ],
                [{ text: "⬅️ Kembali", callback_data: "menu_schedule" }],
              ],
            },
          }
        );
      }
    }

    // Handle setup message
    if (data.startsWith("setup_message_")) {
      const targetId = data.replace("setup_message_", "");

      bot.sendMessage(
        query.message.chat.id,
        `📝 *Atur Pesan Berjadwal*\n\n` +
          `Format lengkap:\n` +
          `\`YYYY-MM-DD HH:mm|tipe|isi pesan\`\n\n` +
          `Tipe: teks, foto, file\n\n` +
          `Contoh teks:\n` +
          `\`2025-11-15 10:30|teks|Selamat pagi!\`\n\n` +
          `Contoh foto:\n` +
          `\`2025-11-15 10:30|foto|nama_file.jpg|Caption foto\``,
        {
          parse_mode: "Markdown",
        }
      );

      // Tunggu input jadwal
      const scheduleHandler = async (msg) => {
        if (msg.chat.id !== query.message.chat.id) return;

        bot.removeListener("message", scheduleHandler);

        try {
          const parts = msg.text.split("|");

          if (parts.length < 3) {
            throw new Error("Format tidak lengkap");
          }

          const [datetime, type, ...contentParts] = parts;
          const content = contentParts.join("|").trim();

          // Validasi datetime
          const scheduleMoment = moment(datetime.trim(), "YYYY-MM-DD HH:mm");
          if (!scheduleMoment.isValid()) {
            throw new Error("Format tanggal/waktu tidak valid");
          }

          // Simpan jadwal
          const schedules = await fs
            .readJson("./src/data/schedule.json")
            .catch(() => []);
          schedules.push({
            to: targetId,
            time: scheduleMoment.format("YYYY-MM-DD HH:mm"),
            type: type.trim(),
            content: content,
            sent: false,
            createdBy: query.from.id,
            createdAt: new Date().toISOString(),
          });

          await fs.writeJson("./src/data/schedule.json", schedules, {
            spaces: 2,
          });

          bot.sendMessage(
            msg.chat.id,
            `✅ *Jadwal Berhasil Ditambahkan!*\n\n` +
              `📅 Waktu: ${scheduleMoment.format("DD MMM YYYY, HH:mm")}\n` +
              `📝 Tipe: ${type}\n` +
              `💬 Pesan: ${content.substring(0, 50)}${
                content.length > 50 ? "..." : ""
              }`,
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🏠 Menu Utama", callback_data: "back_main" }],
                ],
              },
            }
          );

          console.log(`✅ Jadwal baru ditambahkan oleh admin ${query.from.id}`);
        } catch (error) {
          bot.sendMessage(
            msg.chat.id,
            `❌ *Error:* ${error.message}\n\nSilakan coba lagi dengan format yang benar.`,
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🔄 Coba Lagi",
                      callback_data: `setup_message_${targetId}`,
                    },
                  ],
                ],
              },
            }
          );
        }
      };

      bot.on("message", scheduleHandler);
    }
  });
}

module.exports = { startTelegramBot, bot };
