import { formatCurrency } from "../utils/currency";
import "./ExpenseList.css";

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ExpenseList({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return (
      <div className="empty-state card-anim">
        <p>No expenses for this month yet.</p>
        <span>Click "Add Expense" to log your first one.</span>
      </div>
    );
  }

  return (
    <div className="expense-list card-anim">
      <div className="expense-list-header">
        <span>Title</span>
        <span>Category</span>
        <span>Date</span>
        <span className="align-right">Amount</span>
        <span className="align-right">Actions</span>
      </div>
      {expenses.map((expense, index) => (
        <div
          className="expense-row"
          key={expense.id}
          style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
        >
          <div className="expense-title">
            <span>{expense.title}</span>
            {expense.notes && <span className="expense-notes">{expense.notes}</span>}
          </div>
          <div>
            <span className="category-pill">{expense.category}</span>
          </div>
          <div className="expense-date">{formatDate(expense.date)}</div>
          <div className="expense-amount align-right">{formatCurrency(expense.amount)}</div>
          <div className="expense-actions align-right">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(expense)}>
              Edit
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(expense)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
