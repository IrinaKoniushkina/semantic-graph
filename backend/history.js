const fs = require('fs');
const path = require('path');
const HISTORY_FILE = path.join(__dirname, "history.json");

function logAction(userLogin, action, target) {
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE));
  }

  history.push({
    id: Date.now().toString(),
    user: userLogin,
    action,
    target,
    date: new Date().toISOString()
  });

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

module.exports = { logAction };