const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log("🔍 Tool untuk mendapatkan Telegram User ID");
console.log("═══════════════════════════════════════\n");
console.log("📝 Instruksi:");
console.log("1. Buka Telegram");
console.log("2. Chat dengan bot Anda");
console.log("3. Ketik: /myid");
console.log("4. Bot akan membalas dengan User ID Anda\n");
console.log("═══════════════════════════════════════");
console.log("⏳ Menunggu pesan...\n");

// Command untuk mendapatkan user ID
bot.onText(/\/myid/i, (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;
  const chatId = msg.chat.id;

  console.log(`\n📌 User Request:`);
  console.log(`   Name: ${username}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Chat ID: ${chatId}\n`);

  const message = `
🆔 *Informasi Akun Anda*

👤 *Username:* @${username}
🔢 *User ID:* \`${userId}\`
💬 *Chat ID:* \`${chatId}\`

📋 *Cara Setup sebagai Admin:*
1. Copy User ID di atas
2. Buka file \`.env\`
3. Tambahkan ke \`ADMIN_TELEGRAM_IDS\`

Contoh:
\`\`\`
ADMIN_TELEGRAM_IDS=${userId}
\`\`\`

Untuk multiple admin:
\`\`\`
ADMIN_TELEGRAM_IDS=${userId},111222333,444555666
\`\`\`

✅ Setelah itu restart bot!
  `.trim();

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

// Command /start
bot.onText(/\/start/i, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "👋 Halo! Ketik /myid untuk mendapatkan User ID Anda."
  );
});

// Log semua pesan untuk debugging
bot.on("message", (msg) => {
  if (!msg.text.startsWith("/")) {
    console.log(
      `💬 Pesan dari ${msg.from.username || msg.from.first_name}: ${msg.text}`
    );
  }
});

console.log("✅ Bot aktif dan siap menerima command /myid\n");
