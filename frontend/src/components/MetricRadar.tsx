import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { CalculatedMetrics } from "../types/crypto";

interface MetricRadarProps {
  metrics?: CalculatedMetrics;
  coinName?: string;
}

export function MetricRadar({ metrics, coinName }: MetricRadarProps) {
  const data = metrics
    ? [
        { subject: "Health", value: metrics.healthScore },
        { subject: "Liquidity", value: metrics.liquidityScore },
        { subject: "Momentum", value: metrics.momentumScore },
        { subject: "Volatility", value: metrics.volatilityScore },
        { subject: "Development", value: metrics.developmentScore },
      ]
    : [];

  return (
    <div className="card" style={{ minHeight: 320 }}>
      <div className="card-header">
        <span className="card-title">多维健康雷达</span>
        <span className="muted">{coinName}</span>
      </div>
      <div style={{ width: "100%", height: 260 }}>
        {metrics ? (
          <ResponsiveContainer>
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid stroke="rgba(120, 140, 210, 0.35)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#586191", fontSize: 12 }} />
              <PolarRadiusAxis tick={false} domain={[0, 100]} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="#4f6ef2"
                fill="#4f6ef2"
                fillOpacity={0.25}
                strokeWidth={2.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="muted">请选择币种以查看指标分布。</div>
        )}
      </div>
    </div>
  );
}
