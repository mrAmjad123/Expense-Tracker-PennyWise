const express = require("express");
const db = require("../db/database");

const router = express.Router();

const MONTH_RE = /^\d{4}-\d{2}$/;

// GET /api/budgets - all budgets, keyed by month
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT month, amount FROM budgets ORDER BY month DESC").all();
  res.json(rows);
});

// GET /api/budgets/:month - budget for one month (YYYY-MM)
router.get("/:month", (req, res) => {
  if (!MONTH_RE.test(req.params.month)) {
    return res.status(400).json({ error: "Month must be in YYYY-MM format." });
  }
  const row = db.prepare("SELECT month, amount FROM budgets WHERE month = ?").get(req.params.month);
  res.json(row || { month: req.params.month, amount: 0 });
});

// PUT /api/budgets/:month - set (create or update) the budget for a month
router.put("/:month", (req, res) => {
  if (!MONTH_RE.test(req.params.month)) {
    return res.status(400).json({ error: "Month must be in YYYY-MM format." });
  }
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ error: "Amount must be a non-negative number." });
  }

  db.prepare(
    `INSERT INTO budgets (month, amount) VALUES (?, ?)
     ON CONFLICT(month) DO UPDATE SET amount = excluded.amount, updated_at = datetime('now')`
  ).run(req.params.month, amount);

  const row = db.prepare("SELECT month, amount FROM budgets WHERE month = ?").get(req.params.month);
  res.json(row);
});

module.exports = router;
