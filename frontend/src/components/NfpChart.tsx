import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NfpItem } from "../types/macro";

interface NfpChartProps {
  data?: NfpItem[];
  loading?: boolean;
  error?: string;
}

export function NfpChart({ data, loading = false, error }: NfpChartProps) {
  if (loading) {
    return <div className="muted">美国非农就业数据加载中…</div>;
  }
  if (error) {
    return <div className="muted">非农数据暂时不可用，稍后自动更新。</div>;
  }
  if (!data || data.length === 0) {
    return <div className="muted">暂无非农就业相关数据。</div>;
  }

  const reversed = [...data].reverse();

  return (
    <div className="nfp-card">
      <div className="nfp-card-header">
        <div>
          <h3>美国非农就业数据</h3>
          <span className="muted">单位：千人（Actual vs Forecast）</span>
        </div>
      </div>
      <div className="nfp-chart-container">
        <ResponsiveContainer>
          <AreaChart data={reversed} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="nfpActual" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4f6ef2" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#4f6ef2" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="nfpForecast" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#78d3b4" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#78d3b4" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 140, 210, 0.25)" />
            <XAxis
              dataKey="month"
              tickFormatter={(value) => value.replace("-", "/")}
              tick={{ fill: "#586191", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "#586191", fontSize: 12 }}
              width={70}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(73, 94, 189, 0.25)",
                borderRadius: 10,
                color: "#1f274f",
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area type="monotone" dataKey="actual" name="实际值" stroke="#4f6ef2" fill="url(#nfpActual)" />
            <Area type="monotone" dataKey="forecast" name="预测值" stroke="#78d3b4" fill="url(#nfpForecast)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
