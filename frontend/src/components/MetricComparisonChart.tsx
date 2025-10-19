import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CoinMetrics } from "../types/crypto";

interface MetricComparisonChartProps {
  data: CoinMetrics[];
}

export function MetricComparisonChart({ data }: MetricComparisonChartProps) {
  const chartData = data.slice(0, 6).map((item) => ({
    name: item.coin.symbol.toUpperCase(),
    Health: Math.round(item.metrics.healthScore),
    Liquidity: Math.round(item.metrics.liquidityScore),
    Momentum: Math.round(item.metrics.momentumScore),
    Volatility: Math.round(item.metrics.volatilityScore),
  }));

  type MetricKey = "Health" | "Liquidity" | "Momentum" | "Volatility";

  const metricLeaders = ( ["Health", "Liquidity", "Momentum", "Volatility"] as MetricKey[] ).map(
    (metricKey) => {
      let best = { name: "-", value: -Infinity };
      chartData.forEach((item) => {
        const metricValue = item[metricKey];
        if (typeof metricValue === "number" && metricValue > best.value) {
          best = { name: item.name, value: metricValue };
        }
      });
      return { metric: metricKey, ...best };
    }
  );

  return (
    <div className="card" style={{ minHeight: 340 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 200px",
          gap: "1.2rem",
        }}
      >
        <div>
          <div className="card-header">
            <span className="card-title">Metric Comparison</span>
            <span className="muted">Top 6 assets</span>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(120, 140, 210, 0.12)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#9fb4ff" }} />
                  <YAxis tick={{ fill: "#9fb4ff" }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13, 18, 34, 0.92)",
                      border: "1px solid rgba(83, 110, 215, 0.4)",
                      borderRadius: 8,
                      color: "#fff",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="left"
                    wrapperStyle={{ color: "#b8c4ff", paddingBottom: "0.5rem" }}
                  />
                  <Bar dataKey="Health" fill="#6c8dff" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Liquidity" fill="#4bd4c6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Momentum" fill="#ffb347" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Volatility" fill="#ff6f91" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="muted">No assets to compare.</div>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            justifyContent: "center",
            paddingTop: "0.6rem",
          }}
        >
          <span className="muted" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
            Metric leaders
          </span>
          {metricLeaders.map((item) => (
            <div
              key={item.metric}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(33, 42, 78, 0.55)",
                border: "1px solid rgba(73, 99, 217, 0.25)",
                borderRadius: 12,
                padding: "0.55rem 0.7rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.metric}</div>
                <div className="muted" style={{ fontSize: "0.75rem" }}>
                  Top asset
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#dfe4ff" }}>{item.name}</div>
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  {item.value > -Infinity ? `${Math.round(item.value)}%` : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
