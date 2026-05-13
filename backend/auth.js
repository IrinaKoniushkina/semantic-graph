// backend/auth.js
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const USERS_FILE = path.join(__dirname, "users.json");
const SECRET = "super-secret-key-2026";   // можно потом в .env

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return { users: [] };
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function login(login, password) {
  const data = readUsers();
  const user = data.users.find(u => u.login === login && u.password === password);
  
  if (!user) return null;

  const token = jwt.sign(
    { id: user.id, login: user.login, role: user.role },
    SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      login: user.login,
      role: user.role,
      fullName: user.fullName || user.login
    }
  };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { login, readUsers, writeUsers, verifyToken };