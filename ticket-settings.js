const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, 'ticket-settings.json');

function getSettings() {
    if (!fs.existsSync(SETTINGS_PATH)) return { staffRoleId: null, categoryId: null };
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
}

function saveSettings(data) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
}

module.exports = { getSettings, saveSettings };
