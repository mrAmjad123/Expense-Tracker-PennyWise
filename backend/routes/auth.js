const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/database");
const authMiddleware = require("../authMiddleware");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateOtp() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function verifyRecaptcha(token) {
  if (!token) return false;

  const params = new URLSearchParams({
    secret: process.env.RECAPTCHA_SECRET_KEY,
    response: token,
  });

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const data = await res.json();
  return data.success === true;
}

function issueToken(res, userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, COOKIE_OPTIONS);
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

// POST /api/auth/signup - starts signup, sends an OTP to verify the email.
// The account isn't created until POST /verify-otp succeeds.
router.post("/signup", async (req, res) => {
  const { name, email, password, recaptchaToken } = req.body;

  const recaptchaOk = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaOk) return res.status(400).json({ error: "reCAPTCHA verification failed." });

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  const errors = [];
  if (!trimmedName) errors.push("Name is required.");
  if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) errors.push("A valid email is required.");
  if (typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }
  if (errors.length) return res.status(400).json({ errors });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(trimmedEmail);
  if (existing) return res.status(400).json({ error: "An account with this email already exists." });

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  db.prepare("DELETE FROM pending_signups WHERE email = ?").run(trimmedEmail);
  db.prepare(
    "INSERT INTO pending_signups (name, email, password_hash, otp_hash, expires_at) VALUES (?, ?, ?, ?, ?)"
  ).run(trimmedName, trimmedEmail, passwordHash, hashToken(otp), expiresAt);

  // TODO: send otp by email once an email provider is wired up.
  console.log(`[signup otp] ${trimmedEmail} -> ${otp}`);

  const response = { message: "We sent a 6-digit verification code to your email.", email: trimmedEmail };
  if (process.env.NODE_ENV !== "production") response.otp = otp;
  res.status(200).json(response);
});

// POST /api/auth/verify-otp - completes signup: creates the real account and logs in.
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  const pending = db.prepare("SELECT * FROM pending_signups WHERE email = ?").get(trimmedEmail);
  if (!pending) {
    return res.status(400).json({ error: "No pending signup found for this email. Please sign up again." });
  }

  if (new Date(pending.expires_at) < new Date()) {
    db.prepare("DELETE FROM pending_signups WHERE id = ?").run(pending.id);
    return res.status(400).json({ error: "This code has expired. Please sign up again." });
  }

  if (typeof otp !== "string" || hashToken(otp) !== pending.otp_hash) {
    const attempts = pending.attempts + 1;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      db.prepare("DELETE FROM pending_signups WHERE id = ?").run(pending.id);
      return res.status(400).json({ error: "Too many incorrect attempts. Please sign up again." });
    }
    db.prepare("UPDATE pending_signups SET attempts = ? WHERE id = ?").run(attempts, pending.id);
    return res.status(400).json({ error: `Incorrect code. ${MAX_OTP_ATTEMPTS - attempts} attempt(s) remaining.` });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const role = adminEmail && trimmedEmail === adminEmail ? "admin" : "user";

  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(pending.name, pending.email, pending.password_hash, role);
  db.prepare("DELETE FROM pending_signups WHERE id = ?").run(pending.id);

  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(result.lastInsertRowid);
  issueToken(res, user.id);
  res.status(201).json(publicUser(user));
});

// POST /api/auth/resend-otp
router.post("/resend-otp", (req, res) => {
  const { email } = req.body;
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  const genericResponse = { message: "If a pending signup exists for that email, a new code was sent." };

  const pending = db.prepare("SELECT * FROM pending_signups WHERE email = ?").get(trimmedEmail);
  if (!pending) return res.json(genericResponse);

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  db.prepare(
    "UPDATE pending_signups SET otp_hash = ?, expires_at = ?, attempts = 0 WHERE id = ?"
  ).run(hashToken(otp), expiresAt, pending.id);

  // TODO: send otp by email once an email provider is wired up.
  console.log(`[signup otp resend] ${trimmedEmail} -> ${otp}`);

  if (process.env.NODE_ENV !== "production") {
    return res.json({ ...genericResponse, otp });
  }
  res.json(genericResponse);
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  const recaptchaOk = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaOk) return res.status(400).json({ error: "reCAPTCHA verification failed." });

  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(trimmedEmail);

  const genericError = () => res.status(401).json({ error: "Invalid email or password." });

  if (!user) return genericError();

  const passwordOk = await bcrypt.compare(typeof password === "string" ? password : "", user.password_hash);
  if (!passwordOk) return genericError();

  if (user.suspended) return res.status(403).json({ error: "This account has been suspended." });

  issueToken(res, user.id);
  res.json(publicUser(user));
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(204).send();
});

// GET /api/auth/me
router.get("/me", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(401).json({ error: "Not authenticated." });
  res.json(publicUser(user));
});

// POST /api/auth/change-password
router.post("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(401).json({ error: "Not authenticated." });

  const currentOk = await bcrypt.compare(
    typeof currentPassword === "string" ? currentPassword : "",
    user.password_hash
  );
  if (!currentOk) return res.status(400).json({ error: "Current password is incorrect." });

  const newHash = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(
    newHash,
    req.userId
  );

  res.status(204).send();
});

// POST /api/auth/forgot-password
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  const genericResponse = { message: "If an account exists for that email, a reset link has been sent." };

  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(trimmedEmail);
  if (!user) return res.json(genericResponse);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(user.id);
  db.prepare(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)"
  ).run(user.id, hashToken(rawToken), expiresAt);

  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;

  // TODO: send resetLink by email once an email provider is wired up.
  console.log(`[password reset] ${trimmedEmail} -> ${resetLink}`);

  if (process.env.NODE_ENV !== "production") {
    return res.json({ ...genericResponse, resetLink });
  }
  res.json(genericResponse);
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (typeof token !== "string" || !token) {
    return res.status(400).json({ error: "Reset token is required." });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  const row = db
    .prepare("SELECT * FROM password_reset_tokens WHERE token_hash = ?")
    .get(hashToken(token));

  if (!row || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ error: "This reset link is invalid or has expired." });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(
    newHash,
    row.user_id
  );
  db.prepare("DELETE FROM password_reset_tokens WHERE id = ?").run(row.id);

  res.status(204).send();
});

module.exports = router;
