import clsx from "clsx";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  XAxis,
} from "recharts";
import type { CoinMetrics } from "../types/crypto";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format";

interface CoinTableProps {
  data: CoinMetrics[];
  selectedId?: string;
  onSelect: (id: string) => void;
  vsCurrency: string;
}

function Sparkline({ prices }: { prices: number[] }) {
  if (!prices || prices.length === 0) {
    return <div className="muted">—</div>;
  }

  const chartData = prices.map((value, index) => ({
    value,
    index,
  }));
  const color = prices[0] <= prices[prices.length - 1] ? "#3dd598" : "#ff6f91";

  return (
    <div style={{ width: 160, height: 50 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.7} />
              <stop offset="100%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis dataKey="index" hide />
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "rgba(13, 18, 34, 0.9)",
              border: "1px solid rgba(83, 110, 215, 0.4)",
              borderRadius: 8,
              color: "#fff",
            }}
            formatter={(value: number) => formatNumber(value)}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#spark-${color})`}
            strokeWidth={1.8}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CoinTable({
  data,
  selectedId,
  onSelect,
  vsCurrency,
}: CoinTableProps) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <div className="card-header">
        <span className="card-title">Tracked Assets</span>
        <span className="muted">{data.length} tokens</span>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 860,
        }}
      >
        <thead>
          <tr
            style={{
              textAlign: "left",
              color: "#7f8ab5",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <th style={{ paddingBottom: "0.75rem" }}>Asset</th>
            <th>Price ({vsCurrency.toUpperCase()})</th>
            <th>24h</th>
            <th>Volume</th>
            <th>Health</th>
            <th>Liquidity</th>
            <th>Momentum</th>
            <th>7d Trend</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const { coin, metrics } = item;
            const isActive = coin.id === selectedId;
            return (
              <tr
                key={coin.id}
                onClick={() => onSelect(coin.id)}
                style={{
                  cursor: "pointer",
                  background: isActive ? "#f0f4ff" : "transparent",
                }}
              >
                <td style={{ padding: "0.85rem 0", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <img
                    src={coin.image}
                    alt={coin.name}
                    width={28}
                    height={28}
                    style={{ borderRadius: "50%" }}
                    loading="lazy"
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{coin.name}</div>
                    <div className="muted">{coin.symbol.toUpperCase()}</div>
                  </div>
                </td>
                <td>
                  {formatCurrency(coin.current_price, { currency: vsCurrency })}
                </td>
                <td>
                  <span
                    className={clsx("status-pill", {
                      success: coin.price_change_percentage_24h >= 0,
                      danger: coin.price_change_percentage_24h < 0,
                    })}
                    style={{ justifyContent: "center", minWidth: "5rem" }}
                  >
                    {formatPercent(coin.price_change_percentage_24h)}
                  </span>
                </td>
                <td>
                  {formatCurrency(coin.total_volume, {
                    compact: true,
                    currency: vsCurrency,
                  })}
                </td>
                <td>
                  <div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: "rgba(33, 197, 102, 0.2)",
                        width: 120,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${metrics.healthScore}%`,
                          background: "rgba(57, 211, 124, 0.9)",
                          height: "100%",
                        }}
                      />
                    </div>
                    <span className="muted">{Math.round(metrics.healthScore)}%</span>
                  </div>
                </td>
                <td>{Math.round(metrics.liquidityScore)}%</td>
                <td>{Math.round(metrics.momentumScore)}%</td>
                <td>
                  {coin.sparkline_in_7d?.price ? (
                    <Sparkline prices={coin.sparkline_in_7d.price} />
                  ) : (
                    <div className="muted">—</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
