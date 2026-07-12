const jwt = require("jsonwebtoken");
const { pool } = require("./db/database");

async function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      "SELECT id, role, suspended, token_valid_after FROM users WHERE id = $1",
      [payload.userId]
    );
    const user = rows[0];
    if (!user || user.suspended) return res.status(401).json({ error: "Not authenticated." });

    // Tokens issued before a logout or password change are rejected even if
    // still within their expiry — this is how sessions get invalidated,
    // since JWTs otherwise can't be revoked before they naturally expire.
    // Compared at whole-second granularity (JWT `iat` has second precision,
    // `token_valid_after` has microsecond precision) so a token re-issued in
    // the same request that just bumped `token_valid_after` isn't rejected.
    const validAfterSeconds = Math.floor(user.token_valid_after.getTime() / 1000);
    if (payload.iat < validAfterSeconds) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated." });
  }
}

module.exports = authMiddleware;
