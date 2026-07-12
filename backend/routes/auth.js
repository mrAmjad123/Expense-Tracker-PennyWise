const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/database");
const authMiddleware = require("../authMiddleware");
const asyncHandler = require("../asyncHandler");
const { sendOtpEmail, sendResetEmail } = require("../email");
const { loginLimiter, signupLimiter, otpLimiter, passwordResetLimiter } = require("../rateLimiters");

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
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
router.post(
  "/signup",
  signupLimiter,
  asyncHandler(async (req, res) => {
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

    const { rows: existingRows } = await pool.query("SELECT id FROM users WHERE email = $1", [
      trimmedEmail,
    ]);
    if (existingRows[0]) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    await pool.query("DELETE FROM pending_signups WHERE email = $1", [trimmedEmail]);
    await pool.query(
      "INSERT INTO pending_signups (name, email, password_hash, otp_hash, expires_at) VALUES ($1, $2, $3, $4, $5)",
      [trimmedName, trimmedEmail, passwordHash, hashToken(otp), expiresAt]
    );

    const emailSent = await sendOtpEmail(trimmedEmail, otp)
      .then(() => true)
      .catch((err) => {
        console.error("[email] Failed to send OTP:", err.message);
        return false;
      });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[signup otp] ${trimmedEmail} -> ${otp}`);
    }

    if (!emailSent && process.env.NODE_ENV === "production") {
      return res.status(502).json({ error: "Failed to send the verification email. Please try again." });
    }

    const response = { message: "We sent a 6-digit verification code to your email.", email: trimmedEmail };
    if (process.env.NODE_ENV !== "production") response.otp = otp;
    res.status(200).json(response);
  })
);

// POST /api/auth/verify-otp - completes signup: creates the real account and logs in.
router.post(
  "/verify-otp",
  otpLimiter,
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    const { rows: pendingRows } = await pool.query(
      "SELECT * FROM pending_signups WHERE email = $1",
      [trimmedEmail]
    );
    const pending = pendingRows[0];
    if (!pending) {
      return res.status(400).json({ error: "No pending signup found for this email. Please sign up again." });
    }

    if (new Date(pending.expires_at) < new Date()) {
      await pool.query("DELETE FROM pending_signups WHERE id = $1", [pending.id]);
      return res.status(400).json({ error: "This code has expired. Please sign up again." });
    }

    if (typeof otp !== "string" || hashToken(otp) !== pending.otp_hash) {
      const attempts = pending.attempts + 1;
      if (attempts >= MAX_OTP_ATTEMPTS) {
        await pool.query("DELETE FROM pending_signups WHERE id = $1", [pending.id]);
        return res.status(400).json({ error: "Too many incorrect attempts. Please sign up again." });
      }
      await pool.query("UPDATE pending_signups SET attempts = $1 WHERE id = $2", [attempts, pending.id]);
      return res.status(400).json({ error: `Incorrect code. ${MAX_OTP_ATTEMPTS - attempts} attempt(s) remaining.` });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const role = adminEmail && trimmedEmail === adminEmail ? "admin" : "user";

    const { rows: insertedRows } = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [pending.name, pending.email, pending.password_hash, role]
    );
    await pool.query("DELETE FROM pending_signups WHERE id = $1", [pending.id]);

    const user = insertedRows[0];
    issueToken(res, user.id);
    res.status(201).json(publicUser(user));
  })
);

// POST /api/auth/resend-otp
router.post(
  "/resend-otp",
  otpLimiter,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    const genericResponse = { message: "If a pending signup exists for that email, a new code was sent." };

    const { rows } = await pool.query("SELECT * FROM pending_signups WHERE email = $1", [trimmedEmail]);
    const pending = rows[0];
    if (!pending) return res.json(genericResponse);

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
    await pool.query(
      "UPDATE pending_signups SET otp_hash = $1, expires_at = $2, attempts = 0 WHERE id = $3",
      [hashToken(otp), expiresAt, pending.id]
    );

    await sendOtpEmail(trimmedEmail, otp).catch((err) => {
      console.error("[email] Failed to send OTP:", err.message);
    });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[signup otp resend] ${trimmedEmail} -> ${otp}`);
      return res.json({ ...genericResponse, otp });
    }
    res.json(genericResponse);
  })
);

// POST /api/auth/login
router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, recaptchaToken } = req.body;

    const recaptchaOk = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaOk) return res.status(400).json({ error: "reCAPTCHA verification failed." });

    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [trimmedEmail]);
    const user = rows[0];

    const genericError = () => res.status(401).json({ error: "Invalid email or password." });

    if (!user) return genericError();

    const passwordOk = await bcrypt.compare(typeof password === "string" ? password : "", user.password_hash);
    if (!passwordOk) return genericError();

    if (user.suspended) return res.status(403).json({ error: "This account has been suspended." });

    issueToken(res, user.id);
    res.json(publicUser(user));
  })
);

// POST /api/auth/logout
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        await pool.query("UPDATE users SET token_valid_after = now() WHERE id = $1", [payload.userId]);
      } catch {
        // Token already invalid/expired — nothing to invalidate.
      }
    }
    res.clearCookie("token", COOKIE_OPTIONS);
    res.status(204).send();
  })
);

// GET /api/auth/me
router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [req.userId]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Not authenticated." });
    res.json(publicUser(user));
  })
);

// POST /api/auth/change-password
router.post(
  "/change-password",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Not authenticated." });

    const currentOk = await bcrypt.compare(
      typeof currentPassword === "string" ? currentPassword : "",
      user.password_hash
    );
    if (!currentOk) return res.status(400).json({ error: "Current password is incorrect." });

    const newHash = await bcrypt.hash(newPassword, 10);
    // Bumping token_valid_after invalidates every session issued before now
    // (e.g. a stolen cookie) — re-issue a fresh one so the current browser
    // tab that just authenticated this request isn't logged out too.
    await pool.query(
      "UPDATE users SET password_hash = $1, token_valid_after = now(), updated_at = now() WHERE id = $2",
      [newHash, req.userId]
    );
    issueToken(res, req.userId);

    res.status(204).send();
  })
);

// DELETE /api/auth/me - permanently deletes the current user's account and all their data
router.delete(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { currentPassword } = req.body;

    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Not authenticated." });

    const currentOk = await bcrypt.compare(
      typeof currentPassword === "string" ? currentPassword : "",
      user.password_hash
    );
    if (!currentOk) return res.status(400).json({ error: "Current password is incorrect." });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM expenses WHERE user_id = $1", [req.userId]);
      await client.query("DELETE FROM budgets WHERE user_id = $1", [req.userId]);
      await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [req.userId]);
      await client.query("DELETE FROM users WHERE id = $1", [req.userId]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.clearCookie("token", COOKIE_OPTIONS);
    res.status(204).send();
  })
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  passwordResetLimiter,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    const genericResponse = { message: "If an account exists for that email, a reset link has been sent." };

    const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [trimmedEmail]);
    const user = rows[0];
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, hashToken(rawToken), expiresAt]
    );

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;

    await sendResetEmail(trimmedEmail, resetLink).catch((err) => {
      console.error("[email] Failed to send reset link:", err.message);
    });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[password reset] ${trimmedEmail} -> ${resetLink}`);
      return res.json({ ...genericResponse, resetLink });
    }
    res.json(genericResponse);
  })
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  passwordResetLimiter,
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (typeof token !== "string" || !token) {
      return res.status(400).json({ error: "Reset token is required." });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    const { rows } = await pool.query("SELECT * FROM password_reset_tokens WHERE token_hash = $1", [
      hashToken(token),
    ]);
    const row = rows[0];

    if (!row || new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: "This reset link is invalid or has expired." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    // Invalidate any existing sessions too — a password reset is often used
    // precisely because the account may be compromised.
    await pool.query(
      "UPDATE users SET password_hash = $1, token_valid_after = now(), updated_at = now() WHERE id = $2",
      [newHash, row.user_id]
    );
    await pool.query("DELETE FROM password_reset_tokens WHERE id = $1", [row.id]);

    res.status(204).send();
  })
);

module.exports = router;
