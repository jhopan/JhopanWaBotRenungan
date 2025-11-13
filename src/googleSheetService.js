const { google } = require("googleapis");
const moment = require("moment-timezone");

const sheets = google.sheets({
  version: "v4",
  auth: new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  }),
});

async function getBirthdaysToday() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: "Sheet1!A:C",
  });

  const rows = res.data.values || [];
  const today = moment().format("DD-MM");
  return rows
    .filter((r) => moment(r[1], "DD-MM").format("DD-MM") === today)
    .map((r) => ({ name: r[0], date: r[1], chatId: r[2] }));
}

module.exports = { getBirthdaysToday };
