import { useEffect, useState } from "react";
import "./ExpenseForm.css";

const emptyForm = { title: "", amount: "", category: "", date: "", notes: "" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({ categories, initialData, onSubmit, onClose }) {
  const isEdit = Boolean(initialData);
  const [form, setForm] = useState(() =>
    initialData
      ? {
          title: initialData.title,
          amount: String(initialData.amount),
          category: initialData.category,
          date: initialData.date,
          notes: initialData.notes || "",
        }
      : { ...emptyForm, date: todayISO(), category: categories[0] || "" }
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const amountNum = Number(form.amount);
    if (!form.title.trim()) return setError("Please enter a title.");
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setError("Please enter a valid amount.");
    if (!form.category) return setError("Please choose a category.");
    if (!form.date) return setError("Please choose a date.");

    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        amount: amountNum,
        category: form.category,
        date: form.date,
        notes: form.notes.trim(),
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h3>{isEdit ? "Edit Expense" : "Add Expense"}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          <label className="form-field">
            <span>Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Groceries"
              maxLength={120}
              autoFocus
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span>Amount (₹)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="0.00"
              />
            </label>

            <label className="form-field">
              <span>Date</span>
              <input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
            </label>
          </div>

          <label className="form-field">
            <span>Category</span>
            <select value={form.category} onChange={(e) => updateField("category", e.target.value)}>
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Notes (optional)</span>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Add any extra details..."
              maxLength={500}
              rows={3}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
