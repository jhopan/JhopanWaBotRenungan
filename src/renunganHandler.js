const cron = require("node-cron");
const fs = require("fs-extra");
const axios = require("axios");
const moment = require("moment-timezone");
moment.tz.setDefault(process.env.TIMEZONE);

async function generateRenungan() {
  const verses = await fs.readJson("./src/data/verses.json");
  const randomVerse =
    verses.normal[Math.floor(Math.random() * verses.normal.length)];

  const prompt = `
Buatkan renungan harian Kristen singkat 2 paragraf dari ayat berikut:
Ayat: ${randomVerse.verse}
Teks: ${randomVerse.text}`;

  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] }
  );

  return `📖 *Renungan Harian (${moment().format("DD MMMM YYYY")})*\n\n${
    res.data.candidates[0].content.parts[0].text
  }\n\n${randomVerse.verse}`;
}

function startRenunganScheduler(waClient) {
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        // Cek koneksi WhatsApp
        const state = await waClient.getState().catch(() => null);
        if (!state || state !== "CONNECTED") {
          console.log("⏳ Renungan menunggu WhatsApp reconnect...");
          return;
        }

        const message = await generateRenungan();
        await waClient.sendMessage(process.env.RENUNGAN_GROUP_ID, message);
        console.log(
          "✅ Renungan harian terkirim ke",
          process.env.RENUNGAN_GROUP_ID
        );
      } catch (error) {
        console.error("❌ Gagal kirim renungan:", error.message);
      }
    },
    { timezone: process.env.TIMEZONE }
  );

  console.log(
    `📖 Renungan harian dijadwalkan jam ${process.env.RENUNGAN_TIME}`
  );
}

module.exports = { startRenunganScheduler };
