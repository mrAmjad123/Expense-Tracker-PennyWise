require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const expensesRouter = require("./routes/expenses");
const budgetsRouter = require("./routes/budgets");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 4000;

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

app.listen(PORT, () => {
  console.log(`Expense tracker API running at http://localhost:${PORT}`);
});
