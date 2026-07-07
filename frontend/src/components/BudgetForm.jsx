import { useEffect, useState } from "react";
import { formatMonthLabel } from "../utils/month";
import "./ExpenseForm.css";

export default function BudgetForm({ month, currentAmount, onSubmit, onClose }) {
  const [amount, setAmount] = useState(currentAmount ? String(currentAmount) : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      return setError("Please enter a valid budget amount.");
    }

    setSubmitting(true);
    try {
      await onSubmit(amountNum);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h3>Set Budget — {formatMonthLabel(month)}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          <label className="form-field">
            <span>Monthly Budget (₹)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              autoFocus
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
