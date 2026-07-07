const express = require("express");
const cors = require("cors");
const expensesRouter = require("./routes/expenses");
const budgetsRouter = require("./routes/budgets");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/expenses", expensesRouter);
app.use("/api/budgets", budgetsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Expense tracker API running at http://localhost:${PORT}`);
});
