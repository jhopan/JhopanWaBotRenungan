/**
 * Config Manager - Persistent Storage untuk Bot Settings
 */

const fs = require("fs-extra");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "../data/bot_config.json");

/**
 * Load config dari file
 */
async function loadConfig() {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      return await fs.readJson(CONFIG_FILE);
    }
    // Default config
    return {
      renunganGroupId: process.env.RENUNGAN_GROUP_ID || "",
      birthdayGroupId: process.env.BIRTHDAY_GROUP_ID || "",
      renunganTime: process.env.RENUNGAN_TIME || "08:00",
      birthdayTime: process.env.BIRTHDAY_TIME || "07:00",
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error load config:", error.message);
    return null;
  }
}

/**
 * Save config ke file
 */
async function saveConfig(config) {
  try {
    config.lastUpdated = new Date().toISOString();
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
    console.log("✅ Config tersimpan");
    return true;
  } catch (error) {
    console.error("❌ Error save config:", error.message);
    return false;
  }
}

/**
 * Update renungan group ID
 */
async function setRenunganGroupId(groupId) {
  const config = await loadConfig();
  config.renunganGroupId = groupId;
  await saveConfig(config);
  return config;
}

/**
 * Update birthday group ID
 */
async function setBirthdayGroupId(groupId) {
  const config = await loadConfig();
  config.birthdayGroupId = groupId;
  await saveConfig(config);
  return config;
}

/**
 * Update renungan time
 */
async function setRenunganTime(time) {
  const config = await loadConfig();
  config.renunganTime = time;
  await saveConfig(config);
  return config;
}

/**
 * Update birthday time
 */
async function setBirthdayTime(time) {
  const config = await loadConfig();
  config.birthdayTime = time;
  await saveConfig(config);
  return config;
}

module.exports = {
  loadConfig,
  saveConfig,
  setRenunganGroupId,
  setBirthdayGroupId,
  setRenunganTime,
  setBirthdayTime,
};
