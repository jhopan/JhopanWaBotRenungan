/**
 * Google Sheets Service
 * Untuk akses data ulang tahun dari spreadsheet
 */

const { google } = require("googleapis");
const moment = require("moment-timezone");
moment.tz.setDefault(process.env.TIMEZONE || "Asia/Makassar");

let sheetsClient = null;
let auth = null;

/**
 * Inisialisasi Google Sheets client
 */
async function initGoogleSheets() {
  try {
    auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT || "./credentials.json",
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    sheetsClient = google.sheets({ version: "v4", auth });
    console.log("✅ Google Sheets service siap");
    return true;
  } catch (error) {
    console.error("❌ Error init Google Sheets:", error.message);
    return false;
  }
}

/**
 * Get data ulang tahun hari ini dari spreadsheet
 * Format Sheet: Kolom A = Nama, Kolom B = Tanggal (DD-MM), Kolom C = ChatID
 */
async function getBirthdaysToday() {
  try {
    if (!sheetsClient) {
      await initGoogleSheets();
    }

    const spreadsheetId = process.env.BIRTHDAY_SPREADSHEET_ID;
    const sheetName = process.env.BIRTHDAY_SHEET_NAME || "Sheet1";
    const range = process.env.BIRTHDAY_RANGE || "A:C";

    const res = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${range}`,
    });

    const rows = res.data.values || [];
    const today = moment().format("DD-MM");

    // Filter baris yang ulang tahunnya hari ini
    const birthdaysToday = rows
      .slice(1) // Skip header row
      .filter((row) => {
        if (!row[1]) return false;
        const birthDate = moment(row[1], [
          "DD-MM",
          "DD/MM",
          "D-M",
          "D/M",
        ]).format("DD-MM");
        return birthDate === today;
      })
      .map((row) => ({
        name: row[0] || "Unknown",
        date: row[1],
        chatId: row[2] || null, // ChatID bisa kosong jika kirim ke grup
      }));

    console.log(`📅 ${birthdaysToday.length} orang berulang tahun hari ini`);
    return birthdaysToday;
  } catch (error) {
    console.error("❌ Error get birthdays:", error.message);
    return [];
  }
}

/**
 * Get semua data ulang tahun dari spreadsheet
 */
async function getAllBirthdays() {
  try {
    if (!sheetsClient) {
      await initGoogleSheets();
    }

    const spreadsheetId = process.env.BIRTHDAY_SPREADSHEET_ID;
    const sheetName = process.env.BIRTHDAY_SHEET_NAME || "Sheet1";
    const range = process.env.BIRTHDAY_RANGE || "A:C";

    const res = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${range}`,
    });

    const rows = res.data.values || [];

    // Skip header, map ke object
    const birthdays = rows.slice(1).map((row) => ({
      name: row[0] || "Unknown",
      date: row[1] || "",
      chatId: row[2] || null,
    }));

    return birthdays;
  } catch (error) {
    console.error("❌ Error get all birthdays:", error.message);
    return [];
  }
}

/**
 * Get ulang tahun yang akan datang dalam N hari ke depan
 */
async function getUpcomingBirthdays(daysAhead = 7) {
  try {
    const allBirthdays = await getAllBirthdays();
    const today = moment();

    const upcoming = allBirthdays
      .filter((b) => {
        if (!b.date) return false;

        // Parse tanggal (hanya DD-MM)
        const birthMoment = moment(b.date, ["DD-MM", "DD/MM", "D-M", "D/M"]);

        // Set tahun ke tahun ini
        birthMoment.year(today.year());

        // Jika sudah lewat tahun ini, set ke tahun depan
        if (birthMoment.isBefore(today, "day")) {
          birthMoment.year(today.year() + 1);
        }

        const daysUntil = birthMoment.diff(today, "days");
        return daysUntil >= 0 && daysUntil <= daysAhead;
      })
      .map((b) => {
        const birthMoment = moment(b.date, ["DD-MM", "DD/MM", "D-M", "D/M"]);
        birthMoment.year(today.year());
        if (birthMoment.isBefore(today, "day")) {
          birthMoment.year(today.year() + 1);
        }

        return {
          ...b,
          daysUntil: birthMoment.diff(today, "days"),
          fullDate: birthMoment.format("DD MMMM"),
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return upcoming;
  } catch (error) {
    console.error("❌ Error get upcoming birthdays:", error.message);
    return [];
  }
}

/**
 * Get info spreadsheet (untuk verifikasi koneksi)
 */
async function getSpreadsheetInfo() {
  try {
    if (!sheetsClient) {
      await initGoogleSheets();
    }

    const spreadsheetId = process.env.BIRTHDAY_SPREADSHEET_ID;

    const res = await sheetsClient.spreadsheets.get({
      spreadsheetId,
    });

    return {
      title: res.data.properties.title,
      sheets: res.data.sheets.map((s) => s.properties.title),
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  } catch (error) {
    console.error("❌ Error get spreadsheet info:", error.message);
    return null;
  }
}

/**
 * Tambah data ulang tahun baru ke spreadsheet
 */
async function addBirthday(name, date, chatId = "") {
  try {
    if (!sheetsClient) {
      await initGoogleSheets();
    }

    const spreadsheetId = process.env.BIRTHDAY_SPREADSHEET_ID;
    const sheetName = process.env.BIRTHDAY_SHEET_NAME || "Sheet1";

    await sheetsClient.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:C`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, date, chatId]],
      },
    });

    console.log(`✅ Data ulang tahun ${name} ditambahkan ke sheet`);
    return true;
  } catch (error) {
    console.error("❌ Error add birthday:", error.message);
    return false;
  }
}

module.exports = {
  initGoogleSheets,
  getBirthdaysToday,
  getAllBirthdays,
  getUpcomingBirthdays,
  getSpreadsheetInfo,
  addBirthday,
};
