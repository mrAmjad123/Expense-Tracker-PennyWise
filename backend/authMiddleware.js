const jwt = require("jsonwebtoken");
const db = require("./db/database");

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare("SELECT id, role, suspended FROM users WHERE id = ?").get(payload.userId);
    if (!user || user.suspended) return res.status(401).json({ error: "Not authenticated." });

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated." });
  }
}

module.exports = authMiddleware;
