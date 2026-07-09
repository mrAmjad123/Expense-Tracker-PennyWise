import { formatCurrency } from "../utils/currency";
import { formatMonthLabel } from "../utils/month";
import "./MonthlyBreakdown.css";

export default function MonthlyBreakdown({ byMonth, total, budgetsByMonth, activeMonth, onSelectMonth }) {
  if (!byMonth || byMonth.length === 0) return null;

  return (
    <div className="monthly-breakdown card-anim">
      <h2 className="monthly-title">Monthly History</h2>
      <div className="monthly-list">
        <div className="monthly-row monthly-header">
          <span>Month</span>
          <span className="align-right">Budget</span>
          <span className="align-right">Spent</span>
          <span className="align-right">Remaining</span>
          <span className="align-right">Status</span>
        </div>
        {byMonth.map((m) => {
          const budget = budgetsByMonth?.[m.month];
          const hasBudget = Number.isFinite(budget) && budget > 0;
          const remaining = hasBudget ? budget - m.total : null;
          const isActive = m.month === activeMonth;

          let statusLabel = "No budget";
          let statusClass = "monthly-status-neutral";
          if (hasBudget) {
            if (remaining < 0) {
              statusLabel = "Over budget";
              statusClass = "monthly-status-danger";
            } else if (m.total / budget >= 0.8) {
              statusLabel = "Near limit";
              statusClass = "monthly-status-warning";
            } else {
              statusLabel = "Under budget";
              statusClass = "monthly-status-ok";
            }
          }

          return (
            <button
              type="button"
              className={`monthly-row monthly-row-btn ${isActive ? "monthly-row-active" : ""}`}
              key={m.month}
              onClick={() => onSelectMonth?.(m.month)}
            >
              <span className="monthly-field monthly-field-month">{formatMonthLabel(m.month)}</span>
              <span className="monthly-field align-right">
                <span className="monthly-field-label">Budget</span>
                {hasBudget ? formatCurrency(budget) : "—"}
              </span>
              <span className="monthly-field align-right monthly-amount">
                <span className="monthly-field-label">Spent</span>
                {formatCurrency(m.total)}
              </span>
              <span className="monthly-field align-right">
                <span className="monthly-field-label">Remaining</span>
                {hasBudget ? formatCurrency(remaining) : "—"}
              </span>
              <span className="monthly-field align-right">
                <span className={`monthly-status-pill ${statusClass}`}>{statusLabel}</span>
              </span>
            </button>
          );
        })}
        <div className="monthly-row monthly-total">
          <span className="monthly-field monthly-field-month">All Time</span>
          <span className="monthly-field align-right">—</span>
          <span className="monthly-field align-right monthly-amount">
            <span className="monthly-field-label">Spent</span>
            {formatCurrency(total)}
          </span>
          <span className="monthly-field align-right">—</span>
          <span className="monthly-field align-right">—</span>
        </div>
      </div>
    </div>
  );
}
