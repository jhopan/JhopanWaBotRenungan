const cron = require("node-cron");
const { getBirthdaysToday } = require("./googleSheetService");
const moment = require("moment-timezone");
moment.tz.setDefault(process.env.TIMEZONE);

function startBirthdayReminder(waClient) {
  cron.schedule(
    "0 7 * * *",
    async () => {
      try {
        // Cek koneksi WhatsApp
        const state = await waClient.getState().catch(() => null);
        if (!state || state !== "CONNECTED") {
          console.log("⏳ Birthday reminder menunggu WhatsApp reconnect...");
          return;
        }

        const birthdays = await getBirthdaysToday();

        if (birthdays.length === 0) {
          console.log("ℹ️ Tidak ada ulang tahun hari ini.");
          return;
        }

        for (const b of birthdays) {
          try {
            const msg = `🎉 *Selamat ulang tahun, ${b.name}!* 🎂\nSemoga selalu diberkati dan bertumbuh dalam kasih Tuhan.`;
            await waClient.sendMessage(b.chatId, msg);
            console.log(`✅ Ucapan ultah terkirim ke ${b.name}`);
          } catch (err) {
            console.error(`❌ Gagal kirim ke ${b.name}:`, err.message);
          }
        }

        console.log(
          `🎂 Selesai mengirim ${birthdays.length} ucapan ulang tahun.`
        );
      } catch (error) {
        console.error("❌ Error birthday reminder:", error.message);
      }
    },
    { timezone: process.env.TIMEZONE }
  );

  console.log("🎂 Birthday reminder dijadwalkan jam 07:00");
}

module.exports = { startBirthdayReminder };
