const cron = require("node-cron");
const fs = require("fs-extra");
const moment = require("moment-timezone");
const { MessageMedia } = require("whatsapp-web.js");

moment.tz.setDefault(process.env.TIMEZONE);

function setupScheduler(waClient) {
  cron.schedule("* * * * *", async () => {
    try {
      // Cek koneksi WhatsApp
      const state = await waClient.getState().catch(() => null);
      if (!state || state !== "CONNECTED") {
        console.log("⏳ Scheduler menunggu WhatsApp reconnect...");
        return;
      }

      const schedules = await fs
        .readJson("./src/data/schedule.json")
        .catch(() => []);
      const now = moment().format("YYYY-MM-DD HH:mm");

      for (let s of schedules) {
        if (s.time === now && !s.sent) {
          try {
            if (s.type === "teks") {
              await waClient.sendMessage(s.to, s.content);
            } else if (
              s.type === "foto" ||
              s.type === "pdf" ||
              s.type === "file"
            ) {
              const media = MessageMedia.fromFilePath(
                `./src/data/${s.content}`
              );
              await waClient.sendMessage(s.to, media, {
                caption: s.caption || "",
              });
            }
            s.sent = true;
            console.log(`✅ Pesan terjadwal terkirim ke ${s.to}`);
          } catch (err) {
            console.error("❌ Gagal kirim pesan terjadwal:", err.message);
            // Tidak set sent = true, biarkan retry di menit berikutnya
          }
        }
      }

      await fs.writeJson("./src/data/schedule.json", schedules, { spaces: 2 });
    } catch (error) {
      console.error("❌ Error scheduler:", error.message);
    }
  });

  console.log("🕒 Scheduler pesan aktif (berjalan setiap menit)");
}

module.exports = { setupScheduler };
