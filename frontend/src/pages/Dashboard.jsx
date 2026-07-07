import { useEffect, useMemo, useState } from "react";
import {
  getExpenses,
  getSummary,
  getCategories,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../api/expenses";
import { getAllBudgets, setBudget as saveBudget } from "../api/budgets";
import { currentMonthKey } from "../utils/month";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import ConfirmDialog from "../components/ConfirmDialog";
import SummaryCards from "../components/SummaryCards";
import MonthlyBreakdown from "../components/MonthlyBreakdown";
import MonthSelector from "../components/MonthSelector";
import BudgetOverview from "../components/BudgetOverview";
import BudgetForm from "../components/BudgetForm";
import CategoryChart from "../components/CategoryChart";
import "./Dashboard.css";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isBudgetFormOpen, setBudgetFormOpen] = useState(false);
  const [toast, setToast] = useState("");

  async function loadAll(month) {
    setLoading(true);
    setLoadError("");
    try {
      const [expenseData, summaryData, categoryData, budgetData] = await Promise.all([
        getExpenses(),
        getSummary(month),
        getCategories(),
        getAllBudgets(),
      ]);
      setExpenses(expenseData);
      setSummary(summaryData);
      setCategories(categoryData);
      setBudgets(budgetData);
    } catch (err) {
      setLoadError(err.message || "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const budgetsByMonth = useMemo(() => {
    const map = {};
    for (const b of budgets) map[b.month] = b.amount;
    return map;
  }, [budgets]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.slice(0, 7) === selectedMonth),
    [expenses, selectedMonth]
  );

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "All") return monthExpenses;
    return monthExpenses.filter((e) => e.category === categoryFilter);
  }, [monthExpenses, categoryFilter]);

  function openAddForm() {
    setEditingExpense(null);
    setFormOpen(true);
  }

  function openEditForm(expense) {
    setEditingExpense(expense);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingExpense(null);
  }

  async function handleFormSubmit(payload) {
    if (editingExpense) {
      await updateExpense(editingExpense.id, payload);
      setToast("Expense updated.");
    } else {
      await createExpense(payload);
      setToast("Expense added.");
    }
    closeForm();
    await loadAll(selectedMonth);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      setToast("Expense deleted.");
      setDeleteTarget(null);
      await loadAll(selectedMonth);
    } catch (err) {
      setLoadError(err.message || "Failed to delete expense.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBudgetSubmit(amount) {
    await saveBudget(selectedMonth, amount);
    setToast("Budget saved.");
    setBudgetFormOpen(false);
    await loadAll(selectedMonth);
  }

  const monthBudget = budgetsByMonth[selectedMonth] || 0;

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Track, edit, and manage every expense in one place.</p>
        </div>
        <div className="dashboard-header-actions">
          <MonthSelector month={selectedMonth} onChange={setSelectedMonth} />
          <button type="button" className="btn btn-primary" onClick={openAddForm}>
            + Add Expense
          </button>
        </div>
      </div>

      {loadError && <div className="banner banner-error">{loadError}</div>}

      {loading ? (
        <div className="loading-state">Loading your expenses...</div>
      ) : (
        <>
          <BudgetOverview
            budget={monthBudget}
            spent={summary?.monthTotal || 0}
            onEditBudget={() => setBudgetFormOpen(true)}
          />

          <SummaryCards
            summary={{
              total: summary?.monthTotal || 0,
              count: summary?.monthCount || 0,
              byCategory: summary?.monthByCategory || [],
            }}
          />

          <CategoryChart data={summary?.monthByCategory} />

          <div className="filter-bar">
            <label htmlFor="category-filter">Filter by category</label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <ExpenseList expenses={filteredExpenses} onEdit={openEditForm} onDelete={setDeleteTarget} />

          <MonthlyBreakdown
            byMonth={summary?.byMonth}
            total={summary?.total}
            budgetsByMonth={budgetsByMonth}
            activeMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
        </>
      )}

      {isFormOpen && (
        <ExpenseForm
          categories={categories}
          initialData={editingExpense}
          onSubmit={handleFormSubmit}
          onClose={closeForm}
        />
      )}

      {isBudgetFormOpen && (
        <BudgetForm
          month={selectedMonth}
          currentAmount={monthBudget}
          onSubmit={handleBudgetSubmit}
          onClose={() => setBudgetFormOpen(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this expense?"
          message={`"${deleteTarget.title}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
