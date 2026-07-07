import { formatCurrency } from "../utils/currency";
import "./SummaryCards.css";

export default function SummaryCards({ summary }) {
  const topCategory = summary?.byCategory?.[0];

  return (
    <div className="summary-grid">
      <div className="summary-card summary-card-primary card-anim">
        <span className="summary-label">Total Spent This Month</span>
        <span className="summary-value">{formatCurrency(summary?.total)}</span>
      </div>
      <div className="summary-card card-anim card-anim-delay-1">
        <span className="summary-label">Expenses Logged</span>
        <span className="summary-value">{summary?.count ?? 0}</span>
      </div>
      <div className="summary-card card-anim card-anim-delay-2">
        <span className="summary-label">Top Category</span>
        <span className="summary-value">{topCategory ? topCategory.category : "—"}</span>
        {topCategory && <span className="summary-sub">{formatCurrency(topCategory.total)}</span>}
      </div>
    </div>
  );
}
