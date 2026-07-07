const express = require("express");
const db = require("../db/database");

const router = express.Router();

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

// GET /api/expenses - list all expenses, most recent first
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM expenses ORDER BY date DESC, id DESC").all();
  res.json(rows);
});

const MONTH_RE = /^\d{4}-\d{2}$/;

// GET /api/expenses/summary - totals by category, by month + grand total.
// Pass ?month=YYYY-MM to also get totals/category-breakdown scoped to that month.
router.get("/summary", (req, res) => {
  const total = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses").get();
  const byCategory = db
    .prepare("SELECT category, COALESCE(SUM(amount), 0) AS total FROM expenses GROUP BY category ORDER BY total DESC")
    .all();
  const byMonth = db
    .prepare(
      "SELECT strftime('%Y-%m', date) AS month, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses GROUP BY month ORDER BY month DESC"
    )
    .all();
  const count = db.prepare("SELECT COUNT(*) AS count FROM expenses").get();

  const response = { total: total.total, count: count.count, byCategory, byMonth };

  const { month } = req.query;
  if (month) {
    if (!MONTH_RE.test(month)) {
      return res.status(400).json({ error: "Month must be in YYYY-MM format." });
    }
    const monthTotal = db
      .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE strftime('%Y-%m', date) = ?")
      .get(month);
    const monthCount = db
      .prepare("SELECT COUNT(*) AS count FROM expenses WHERE strftime('%Y-%m', date) = ?")
      .get(month);
    const monthByCategory = db
      .prepare(
        "SELECT category, COALESCE(SUM(amount), 0) AS total FROM expenses WHERE strftime('%Y-%m', date) = ? GROUP BY category ORDER BY total DESC"
      )
      .all(month);

    response.month = month;
    response.monthTotal = monthTotal.total;
    response.monthCount = monthCount.count;
    response.monthByCategory = monthByCategory;
  }

  res.json(response);
});

// GET /api/expenses/categories - list of allowed categories
router.get("/categories", (req, res) => {
  res.json([...CATEGORIES]);
});

// GET /api/expenses/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM expenses WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Expense not found." });
  res.json(row);
});

// POST /api/expenses - create
router.post("/", (req, res) => {
  const { errors, value } = validateExpense(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const result = db
    .prepare(
      "INSERT INTO expenses (title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?)"
    )
    .run(value.title, value.amount, value.category, value.date, value.notes);

  const created = db.prepare("SELECT * FROM expenses WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/expenses/:id - update
router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM expenses WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Expense not found." });

  const { errors, value } = validateExpense(req.body);
  if (errors.length) return res.status(400).json({ errors });

  db.prepare(
    "UPDATE expenses SET title = ?, amount = ?, category = ?, date = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(value.title, value.amount, value.category, value.date, value.notes, req.params.id);

  const updated = db.prepare("SELECT * FROM expenses WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE /api/expenses/:id
router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM expenses WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Expense not found." });

  db.prepare("DELETE FROM expenses WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

module.exports = router;
