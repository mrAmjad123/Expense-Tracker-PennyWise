const express = require("express");
const db = require("../db/database");
const authMiddleware = require("../authMiddleware");

const router = express.Router();

router.use(authMiddleware);

const MONTH_RE = /^\d{4}-\d{2}$/;

// GET /api/budgets - all budgets for the current user, keyed by month
router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT month, amount FROM budgets WHERE user_id = ? ORDER BY month DESC")
    .all(req.userId);
  res.json(rows);
});

// GET /api/budgets/:month - budget for one month (YYYY-MM) for the current user
router.get("/:month", (req, res) => {
  if (!MONTH_RE.test(req.params.month)) {
    return res.status(400).json({ error: "Month must be in YYYY-MM format." });
  }
  const row = db
    .prepare("SELECT month, amount FROM budgets WHERE user_id = ? AND month = ?")
    .get(req.userId, req.params.month);
  res.json(row || { month: req.params.month, amount: 0 });
});

// PUT /api/budgets/:month - set (create or update) the budget for a month for the current user
router.put("/:month", (req, res) => {
  if (!MONTH_RE.test(req.params.month)) {
    return res.status(400).json({ error: "Month must be in YYYY-MM format." });
  }
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ error: "Amount must be a non-negative number." });
  }

  db.prepare(
    `INSERT INTO budgets (user_id, month, amount) VALUES (?, ?, ?)
     ON CONFLICT(user_id, month) DO UPDATE SET amount = excluded.amount, updated_at = datetime('now')`
  ).run(req.userId, req.params.month, amount);

  const row = db
    .prepare("SELECT month, amount FROM budgets WHERE user_id = ? AND month = ?")
    .get(req.userId, req.params.month);
  res.json(row);
});

module.exports = router;
