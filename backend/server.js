require("dotenv").config();
require("./env")(); // refuses to start if a required env var is missing

const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { initDb } = require("./db/database");
const authRouter = require("./routes/auth");
const expensesRouter = require("./routes/expenses");
const budgetsRouter = require("./routes/budgets");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000 },
    frameguard: { action: "deny" },
  })
);
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((err, req, res, next) => {
  // Log only message + stack — Postgres errors can carry a `.detail` field
  // that echoes back user data (e.g. "Key (email)=(...) already exists."),
  // so avoid logging the raw error object. The request ID ties this log
  // line back to the generic response the client received.
  console.error(`[${req.id}]`, err.stack || err.message);
  res.status(500).json({ error: "Internal server error.", requestId: req.id });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Expense tracker API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
