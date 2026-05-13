const { verifyToken } = require('../auth');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Нет токена" });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Неверный токен" });

  req.user = payload;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Доступ запрещён. Требуется роль администратора" });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };