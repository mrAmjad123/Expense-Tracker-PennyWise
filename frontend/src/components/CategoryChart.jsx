import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../utils/currency";
import "./CategoryChart.css";

// Fixed hue per category — identity stays tied to the entity, not its rank,
// so "Food" is always the same color whichever month you're looking at.
const CATEGORY_COLORS = {
  Food: "#2a78d6",
  Transport: "#1baf7a",
  Housing: "#eda100",
  Utilities: "#008300",
  Entertainment: "#4a3aa7",
  Health: "#e34948",
  Shopping: "#e87ba4",
  Education: "#eb6834",
  Other: "#898781",
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { category, total } = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-category">{category}</span>
      <span className="chart-tooltip-value">{formatCurrency(total)}</span>
    </div>
  );
}

export default function CategoryChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="category-chart card-anim">
        <h2 className="category-chart-title">Category Breakdown</h2>
        <p className="category-chart-empty">No expenses logged for this month yet.</p>
      </div>
    );
  }

  const height = Math.max(data.length * 44, 120);

  return (
    <div className="category-chart card-anim">
      <h2 className="category-chart-title">Category Breakdown</h2>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke="#e1e0d9" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              width={100}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 13, fontWeight: 600 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(108, 92, 231, 0.06)" }} />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive>
              {data.map((entry) => (
                <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.Other} />
              ))}
              <LabelList
                dataKey="total"
                position="right"
                formatter={(value) => formatCurrency(value)}
                style={{ fill: "var(--color-text)", fontSize: 12, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
