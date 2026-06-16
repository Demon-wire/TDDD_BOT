const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'users.json');

function readUsers() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeUsers(users) {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

function addUser(email, hashedPassword, tier) {
    const users = readUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('A user with this email already exists.');
    }
    users.push({ email: email.toLowerCase(), password: hashedPassword, tier });
    writeUsers(users);
}

function findUserByEmail(email) {
    const users = readUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

module.exports = { addUser, findUserByEmail };
