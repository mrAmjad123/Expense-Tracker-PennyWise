const express = require("express");
const db = require("../db/database");
const authMiddleware = require("../authMiddleware");
const adminMiddleware = require("../adminMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// GET /api/admin/users - list all users with expense counts
router.get("/users", (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.suspended, u.created_at,
              COALESCE(e.count, 0) AS expenseCount
       FROM users u
       LEFT JOIN (SELECT user_id, COUNT(*) AS count FROM expenses GROUP BY user_id) e
         ON e.user_id = u.id
       ORDER BY u.created_at DESC`
    )
    .all();
  res.json(rows);
});

// PUT /api/admin/users/:id/suspend - suspend or unsuspend an account
router.put("/users/:id/suspend", (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.userId) {
    return res.status(400).json({ error: "You cannot suspend your own account." });
  }

  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(targetId);
  if (!target) return res.status(404).json({ error: "User not found." });

  const suspended = req.body.suspended ? 1 : 0;
  db.prepare("UPDATE users SET suspended = ?, updated_at = datetime('now') WHERE id = ?").run(
    suspended,
    targetId
  );

  const updated = db
    .prepare("SELECT id, name, email, role, suspended FROM users WHERE id = ?")
    .get(targetId);
  res.json(updated);
});

// DELETE /api/admin/users/:id - delete an account and all of its data
router.delete("/users/:id", (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.userId) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(targetId);
  if (!target) return res.status(404).json({ error: "User not found." });

  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM expenses WHERE user_id = ?").run(targetId);
    db.prepare("DELETE FROM budgets WHERE user_id = ?").run(targetId);
    db.prepare("DELETE FROM users WHERE id = ?").run(targetId);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  res.status(204).send();
});

module.exports = router;
