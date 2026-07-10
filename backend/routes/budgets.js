const express = require("express");
const { pool } = require("../db/database");
const authMiddleware = require("../authMiddleware");
const asyncHandler = require("../asyncHandler");

const router = express.Router();

router.use(authMiddleware);

const MONTH_RE = /^\d{4}-\d{2}$/;

// GET /api/budgets - all budgets for the current user, keyed by month
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT month, amount FROM budgets WHERE user_id = $1 ORDER BY month DESC",
      [req.userId]
    );
    res.json(rows);
  })
);

// GET /api/budgets/:month - budget for one month (YYYY-MM) for the current user
router.get(
  "/:month",
  asyncHandler(async (req, res) => {
    if (!MONTH_RE.test(req.params.month)) {
      return res.status(400).json({ error: "Month must be in YYYY-MM format." });
    }
    const { rows } = await pool.query("SELECT month, amount FROM budgets WHERE user_id = $1 AND month = $2", [
      req.userId,
      req.params.month,
    ]);
    res.json(rows[0] || { month: req.params.month, amount: 0 });
  })
);

// PUT /api/budgets/:month - set (create or update) the budget for a month for the current user
router.put(
  "/:month",
  asyncHandler(async (req, res) => {
    if (!MONTH_RE.test(req.params.month)) {
      return res.status(400).json({ error: "Month must be in YYYY-MM format." });
    }
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: "Amount must be a non-negative number." });
    }

    const { rows } = await pool.query(
      `INSERT INTO budgets (user_id, month, amount) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, month) DO UPDATE SET amount = EXCLUDED.amount, updated_at = now()
       RETURNING month, amount`,
      [req.userId, req.params.month, amount]
    );
    res.json(rows[0]);
  })
);

module.exports = router;
