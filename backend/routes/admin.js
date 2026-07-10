const express = require("express");
const { pool } = require("../db/database");
const authMiddleware = require("../authMiddleware");
const adminMiddleware = require("../adminMiddleware");
const asyncHandler = require("../asyncHandler");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// GET /api/admin/users - list all users with expense counts
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.suspended, u.created_at,
              COALESCE(e.count, 0) AS "expenseCount"
       FROM users u
       LEFT JOIN (SELECT user_id, COUNT(*)::int AS count FROM expenses GROUP BY user_id) e
         ON e.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  })
);

// PUT /api/admin/users/:id/suspend - suspend or unsuspend an account
router.put(
  "/users/:id/suspend",
  asyncHandler(async (req, res) => {
    const targetId = Number(req.params.id);
    if (targetId === req.userId) {
      return res.status(400).json({ error: "You cannot suspend your own account." });
    }

    const { rows: targetRows } = await pool.query("SELECT id FROM users WHERE id = $1", [targetId]);
    if (!targetRows[0]) return res.status(404).json({ error: "User not found." });

    const suspended = Boolean(req.body.suspended);
    const { rows } = await pool.query(
      "UPDATE users SET suspended = $1, updated_at = now() WHERE id = $2 RETURNING id, name, email, role, suspended",
      [suspended, targetId]
    );
    res.json(rows[0]);
  })
);

// DELETE /api/admin/users/:id - delete an account and all of its data
router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const targetId = Number(req.params.id);
    if (targetId === req.userId) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: targetRows } = await client.query("SELECT id FROM users WHERE id = $1", [targetId]);
      if (!targetRows[0]) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "User not found." });
      }

      await client.query("DELETE FROM expenses WHERE user_id = $1", [targetId]);
      await client.query("DELETE FROM budgets WHERE user_id = $1", [targetId]);
      await client.query("DELETE FROM users WHERE id = $1", [targetId]);
      await client.query("COMMIT");
      res.status(204).send();
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
