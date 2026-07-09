import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { formatCurrency } from "../utils/currency";
import { formatMonthLabel, shiftMonth } from "../utils/month";
import { categoryColor, categoryIcon } from "../utils/categoryColors";
import "./StatisticsCard.css";

const MONTH_WINDOW = 6;
const YEAR_WINDOW = 5;
const TOP_SPENDING_COUNT = 5;

function formatShortDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function buildMonthSeries(expenses, selectedMonth) {
  const totals = new Map();
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    totals.set(key, (totals.get(key) || 0) + e.amount);
  }

  const keys = [];
  let cursor = selectedMonth;
  for (let i = 0; i < MONTH_WINDOW; i++) {
    keys.unshift(cursor);
    cursor = shiftMonth(cursor, -1);
  }

  return keys.map((key) => ({
    key,
    label: formatMonthLabel(key, { month: "short" }),
    total: totals.get(key) || 0,
    isActive: key === selectedMonth,
  }));
}

function buildYearSeries(expenses, selectedYear) {
  const totals = new Map();
  for (const e of expenses) {
    const year = e.date.slice(0, 4);
    totals.set(year, (totals.get(year) || 0) + e.amount);
  }

  const years = [];
  for (let i = YEAR_WINDOW - 1; i >= 0; i--) {
    years.push(String(Number(selectedYear) - i));
  }

  return years.map((year) => ({
    key: year,
    label: year,
    total: totals.get(year) || 0,
    isActive: year === selectedYear,
  }));
}

function ActiveTick({ x, y, payload, activeLabel, onPointClick }) {
  const isActive = payload.value === activeLabel;
  return (
    <g
      onClick={() => onPointClick(payload.value)}
      style={{ cursor: "pointer" }}
      role="button"
      aria-label={`Jump to ${payload.value}`}
    >
      {/* Invisible, larger hit target than the text alone (touch-friendly) */}
      <rect x={x - 20} y={y - 6} width={40} height={26} fill="transparent" />
      <text
        x={x}
        y={y + 14}
        textAnchor="middle"
        fontSize={12}
        fontWeight={isActive ? 800 : 600}
        fill={isActive ? "var(--color-primary)" : "var(--color-text-muted)"}
      >
        {payload.value}
      </text>
    </g>
  );
}

function ActiveLabel({ viewBox, value }) {
  if (!viewBox) return null;
  // viewBox is the dot's bounding box (top-left + size), not its center.
  const x = viewBox.x + viewBox.width / 2;
  const y = viewBox.y + viewBox.height / 2;
  const text = formatCurrency(value);
  const width = Math.max(text.length * 6.4 + 24, 64);

  return (
    <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: "none" }}>
      <rect
        x={-width / 2}
        y={-36}
        width={width}
        height={26}
        rx={13}
        fill="var(--color-text)"
        opacity={0.94}
      />
      <text x={0} y={-18} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fff">
        {text}
      </text>
    </g>
  );
}

export default function StatisticsCard({ expenses, selectedMonth, onSelectMonth }) {
  const [view, setView] = useState("month");

  const selectedYear = selectedMonth.slice(0, 4);

  const monthSeries = useMemo(() => buildMonthSeries(expenses, selectedMonth), [expenses, selectedMonth]);
  const yearSeries = useMemo(() => buildYearSeries(expenses, selectedYear), [expenses, selectedYear]);

  const series = view === "month" ? monthSeries : yearSeries;
  const activePoint = series.find((p) => p.isActive);
  const maxTotal = Math.max(...series.map((p) => p.total), 1);

  const periodLabel =
    view === "month" ? formatMonthLabel(selectedMonth, { month: "long", year: "numeric" }) : selectedYear;

  const topSpending = useMemo(() => {
    const inPeriod = expenses.filter((e) =>
      view === "month" ? e.date.slice(0, 7) === selectedMonth : e.date.slice(0, 4) === selectedYear
    );
    return [...inPeriod].sort((a, b) => b.amount - a.amount).slice(0, TOP_SPENDING_COUNT);
  }, [expenses, view, selectedMonth, selectedYear]);

  function handlePointClick(label) {
    const point = series.find((p) => p.label === label);
    if (!point) return;
    if (view === "month") {
      onSelectMonth(point.key);
    } else {
      const monthNum = selectedMonth.slice(5, 7);
      onSelectMonth(`${point.key}-${monthNum}`);
    }
  }

  return (
    <div className="stats-card card-anim">
      <div className="stats-header">
        <div>
          <span className="stats-total-label">Total Spent</span>
          <h2 className="stats-total-amount">{formatCurrency(activePoint?.total || 0)}</h2>
          <span className="stats-period-label">{periodLabel}</span>
        </div>

        <div
          className={`stats-tabs ${view === "year" ? "stats-tabs-year" : ""}`}
          role="tablist"
          aria-label="Statistics range"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "month"}
            className={`stats-tab ${view === "month" ? "stats-tab-active" : ""}`}
            onClick={() => setView("month")}
          >
            Month
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "year"}
            className={`stats-tab ${view === "year" ? "stats-tab-active" : ""}`}
            onClick={() => setView("year")}
          >
            Year
          </button>
        </div>
      </div>

      <div className="stats-chart">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={series} margin={{ top: 44, right: 12, left: 12, bottom: 4 }}>
            <defs>
              <linearGradient id="statsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<ActiveTick activeLabel={activePoint?.label} onPointClick={handlePointClick} />}
            />
            <YAxis hide domain={[0, maxTotal * 1.4]} />
            {activePoint && (
              <ReferenceLine
                x={activePoint.label}
                stroke="var(--color-primary)"
                strokeOpacity={0.3}
                strokeDasharray="4 4"
              />
            )}
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-primary)"
              strokeWidth={3}
              fill="url(#statsFill)"
              dot={{ r: 3, fill: "var(--color-primary)", fillOpacity: 0.35, strokeWidth: 0 }}
              activeDot={false}
              isAnimationActive
            />
            {activePoint && (
              <ReferenceDot
                x={activePoint.label}
                y={activePoint.total}
                r={6}
                fill="#fff"
                stroke="var(--color-primary)"
                strokeWidth={3}
                label={<ActiveLabel value={activePoint.total} />}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="stats-top-spending">
        <h3 className="stats-section-title">Top Spending</h3>
        {topSpending.length === 0 ? (
          <p className="stats-empty">No expenses in this period yet.</p>
        ) : (
          <div className="stats-top-list">
            {topSpending.map((e) => (
              <div className="stats-top-row" key={e.id}>
                <span
                  className="stats-top-icon"
                  style={{ "--icon-color": categoryColor(e.category) }}
                  aria-hidden="true"
                >
                  {categoryIcon(e.category)}
                </span>
                <div className="stats-top-info">
                  <span className="stats-top-title">{e.title}</span>
                  <span className="stats-top-date">{formatShortDate(e.date)}</span>
                </div>
                <span className="stats-top-amount">-{formatCurrency(e.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
