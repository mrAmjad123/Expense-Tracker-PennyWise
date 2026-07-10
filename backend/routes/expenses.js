const express = require("express");
const { pool } = require("../db/database");
const authMiddleware = require("../authMiddleware");
const asyncHandler = require("../asyncHandler");

const router = express.Router();

router.use(authMiddleware);

const CATEGORIES = new Set([
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Education",
  "Other",
]);

function validateExpense(body) {
  const errors = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const amount = Number(body.amount);
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!title) errors.push("Title is required.");
  if (title.length > 120) errors.push("Title must be under 120 characters.");
  if (!Number.isFinite(amount) || amount <= 0) errors.push("Amount must be a positive number.");
  if (!category || !CATEGORIES.has(category)) errors.push("A valid category is required.");
  if (!date || Number.isNaN(Date.parse(date))) errors.push("A valid date is required.");
  if (notes.length > 500) errors.push("Notes must be under 500 characters.");

  return { errors, value: { title, amount, category, date, notes } };
}

// GET /api/expenses - list all expenses for the current user, most recent first
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC, id DESC",
      [req.userId]
    );
    res.json(rows);
  })
);

const MONTH_RE = /^\d{4}-\d{2}$/;

// GET /api/expenses/summary - totals by category, by month + grand total (scoped to current user).
// Pass ?month=YYYY-MM to also get totals/category-breakdown scoped to that month.
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const totalResult = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = $1",
      [req.userId]
    );
    const byCategoryResult = await pool.query(
      "SELECT category, COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = $1 GROUP BY category ORDER BY total DESC",
      [req.userId]
    );
    const byMonthResult = await pool.query(
      "SELECT LEFT(date, 7) AS month, COALESCE(SUM(amount), 0) AS total, COUNT(*)::int AS count FROM expenses WHERE user_id = $1 GROUP BY month ORDER BY month DESC",
      [req.userId]
    );
    const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM expenses WHERE user_id = $1", [
      req.userId,
    ]);

    const response = {
      total: totalResult.rows[0].total,
      count: countResult.rows[0].count,
      byCategory: byCategoryResult.rows,
      byMonth: byMonthResult.rows,
    };

    const { month } = req.query;
    if (month) {
      if (!MONTH_RE.test(month)) {
        return res.status(400).json({ error: "Month must be in YYYY-MM format." });
      }
      const monthTotalResult = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = $1 AND LEFT(date, 7) = $2",
        [req.userId, month]
      );
      const monthCountResult = await pool.query(
        "SELECT COUNT(*)::int AS count FROM expenses WHERE user_id = $1 AND LEFT(date, 7) = $2",
        [req.userId, month]
      );
      const monthByCategoryResult = await pool.query(
        "SELECT category, COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = $1 AND LEFT(date, 7) = $2 GROUP BY category ORDER BY total DESC",
        [req.userId, month]
      );

      response.month = month;
      response.monthTotal = monthTotalResult.rows[0].total;
      response.monthCount = monthCountResult.rows[0].count;
      response.monthByCategory = monthByCategoryResult.rows;
    }

    res.json(response);
  })
);

// GET /api/expenses/categories - list of allowed categories
router.get("/categories", (req, res) => {
  res.json([...CATEGORIES]);
});

// GET /api/expenses/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM expenses WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.userId,
    ]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "Expense not found." });
    res.json(row);
  })
);

// POST /api/expenses - create
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { errors, value } = validateExpense(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { rows } = await pool.query(
      `INSERT INTO expenses (user_id, title, amount, category, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, value.title, value.amount, value.category, value.date, value.notes]
    );
    res.status(201).json(rows[0]);
  })
);

// PUT /api/expenses/:id - update
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows: existingRows } = await pool.query(
      "SELECT * FROM expenses WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    if (!existingRows[0]) return res.status(404).json({ error: "Expense not found." });

    const { errors, value } = validateExpense(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { rows } = await pool.query(
      `UPDATE expenses SET title = $1, amount = $2, category = $3, date = $4, notes = $5, updated_at = now()
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [value.title, value.amount, value.category, value.date, value.notes, req.params.id, req.userId]
    );
    res.json(rows[0]);
  })
);

// DELETE /api/expenses/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query("DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id", [
      req.params.id,
      req.userId,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "Expense not found." });
    res.status(204).send();
  })
);

module.exports = router;
