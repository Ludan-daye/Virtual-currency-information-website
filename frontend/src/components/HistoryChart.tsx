import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import type { HistoricalPoint, TimeframeKey } from "../types/crypto";
import { formatCurrency, formatDate } from "../utils/format";

interface HistoryChartProps {
  data?: HistoricalPoint[];
  timeframe: TimeframeKey;
  vsCurrency: string;
  headerActions?: ReactNode;
  loading?: boolean;
  error?: string;
}

export function HistoryChart({
  data,
  timeframe,
  vsCurrency,
  headerActions,
  loading = false,
  error,
}: HistoryChartProps) {
  return (
    <div className="card" style={{ minHeight: 320 }}>
      <div className="card-header">
        <span className="card-title">Price & Volume</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="muted">{timeframe} window</span>
          {headerActions}
        </div>
      </div>
      <div style={{ width: "100%", height: 260 }}>
        {loading ? (
          <div className="muted">价格与成交量数据加载中…</div>
        ) : error ? (
          <div className="muted">走势数据暂时不可用，系统稍后自动重试。</div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4f6ef2" stopOpacity={0.75} />
                  <stop offset="100%" stopColor="#4f6ef2" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(120, 140, 210, 0.25)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatDate(value)}
                tick={{ fill: "#586191", fontSize: 12 }}
              />
              <YAxis
                dataKey="price"
                width={80}
                tickFormatter={(value) =>
                  formatCurrency(value, { compact: true, currency: vsCurrency })
                }
                tick={{ fill: "#586191", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(73, 94, 189, 0.25)",
                  borderRadius: 12,
                  color: "#1f274f",
                }}
                labelFormatter={(value) => formatDate(value as number)}
                formatter={(value, key) => {
                  if (key === "price") {
                    return [
                      formatCurrency(value as number, {
                        currency: vsCurrency,
                      }),
                      "Price",
                    ];
                  }
                  if (key === "volume") {
                    return [
                      formatCurrency(value as number, {
                        compact: true,
                        currency: vsCurrency,
                      }),
                      "Volume",
                    ];
                  }
                  if (key === "marketCap") {
                    return [
                      formatCurrency(value as number, {
                        compact: true,
                        currency: vsCurrency,
                      }),
                      "Market Cap",
                    ];
                  }
                  return [value as number, key as string];
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#4f6ef2"
                fill="url(#priceGradient)"
                strokeWidth={2.2}
                name="Price"
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="rgba(79, 195, 135, 0.65)"
                fill="rgba(79, 195, 135, 0.16)"
                strokeWidth={1.6}
                name="Volume"
                yAxisId={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="muted">暂无可用的价格走势数据。</div>
        )}
      </div>
    </div>
  );
}
