import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { MarketOverview } from "../types/crypto";
import { formatPercent } from "../utils/format";

interface DominanceChartProps {
  overview?: MarketOverview;
  loading?: boolean;
}

const colors = [
  "#7187ff",
  "#9d72ff",
  "#4bd4c6",
  "#ffb347",
  "#ff6f91",
  "#56cfe1",
];

export function DominanceChart({ overview, loading = false }: DominanceChartProps) {
  if (loading) {
    return <div className="muted">正在加载市值数据…</div>;
  }
  const dominanceEntries = overview
    ? Object.entries(overview.dominance)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([id, value], index) => ({
          name: id.toUpperCase(),
          value,
          fill: colors[index % colors.length],
        }))
    : [];

  return dominanceEntries.length > 0 ? (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={dominanceEntries}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={1}
          stroke="none"
        />
        <Tooltip
          contentStyle={{
            background: "rgba(255, 255, 255, 0.96)",
            border: "1px solid rgba(73, 94, 189, 0.25)",
            borderRadius: 10,
            color: "#1f274f",
          }}
          formatter={(value: number) => formatPercent(value)}
        />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <div className="muted" style={{ paddingTop: "1.5rem" }}>暂无市值占比数据。</div>
  );
}
