import { formatMonthLabel, shiftMonth } from "../utils/month";
import "./MonthSelector.css";

export default function MonthSelector({ month, onChange }) {
  return (
    <div className="month-selector">
      <button
        type="button"
        className="month-nav-btn"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Previous month"
      >
        ‹
      </button>
      <div className="month-current">
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label="Select month"
        />
        <span className="month-label">{formatMonthLabel(month)}</span>
      </div>
      <button
        type="button"
        className="month-nav-btn"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  );
}
