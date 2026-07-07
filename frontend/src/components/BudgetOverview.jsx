import { formatCurrency } from "../utils/currency";
import { useCountUp } from "../utils/useCountUp";
import "./BudgetOverview.css";

export default function BudgetOverview({ budget, spent, onEditBudget }) {
  const hasBudget = budget > 0;
  const remaining = budget - spent;
  const percent = hasBudget ? Math.min((spent / budget) * 100, 100) : 0;
  const rawPercent = hasBudget ? (spent / budget) * 100 : 0;

  const animatedSpent = useCountUp(spent);
  const animatedRemaining = useCountUp(remaining);
  const animatedPercent = useCountUp(percent);

  let status = "ok";
  if (hasBudget && rawPercent >= 100) status = "exceeded";
  else if (hasBudget && rawPercent >= 80) status = "warning";

  return (
    <div className="budget-overview card-anim">
      <div className="budget-overview-header">
        <div>
          <span className="budget-overview-label">Monthly Budget</span>
          <h2 className="budget-overview-amount">
            {hasBudget ? formatCurrency(budget) : "Not set"}
          </h2>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onEditBudget}>
          {hasBudget ? "Edit Budget" : "Set Budget"}
        </button>
      </div>

      {hasBudget ? (
        <>
          <div className="budget-stats">
            <div className="budget-stat">
              <span className="budget-stat-label">Spent</span>
              <span className="budget-stat-value">{formatCurrency(animatedSpent)}</span>
            </div>
            <div className="budget-stat">
              <span className="budget-stat-label">Remaining</span>
              <span
                className={`budget-stat-value ${remaining < 0 ? "text-danger" : ""}`}
              >
                {formatCurrency(animatedRemaining)}
              </span>
            </div>
          </div>

          <div className={`progress-track progress-${status}`}>
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="progress-caption">
            <span>{animatedPercent.toFixed(0)}% of budget used</span>
            {status === "exceeded" && (
              <span className="progress-overspend">
                Over by {formatCurrency(Math.abs(remaining))}
              </span>
            )}
          </div>

          {status === "warning" && (
            <div className="budget-alert budget-alert-warning">
              You've used {rawPercent.toFixed(0)}% of your budget — {formatCurrency(remaining)} left
              for the month.
            </div>
          )}
          {status === "exceeded" && (
            <div className="budget-alert budget-alert-danger">
              You've exceeded your monthly budget by {formatCurrency(Math.abs(remaining))}.
            </div>
          )}
        </>
      ) : (
        <p className="budget-empty-hint">
          Set a monthly budget to track your remaining balance and get alerts as you spend.
        </p>
      )}
    </div>
  );
}
