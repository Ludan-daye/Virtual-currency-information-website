import clsx from "clsx";
import type { MarketOverview } from "../types/crypto";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format";

interface StatCardsProps {
  overview?: MarketOverview;
  averageHealth: number;
  topPerformer?: {
    name: string;
    change24h: number;
  };
  isLoading?: boolean;
  vsCurrency: string;
}

export function StatCards({
  overview,
  averageHealth,
  topPerformer,
  isLoading = false,
  vsCurrency,
}: StatCardsProps) {
  const currencyLabel = vsCurrency.toUpperCase();
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      }}
    >
      <div className="card">
        <div className="card-header">
          <span className="card-title">Global Market Cap</span>
          <span className="tag">{currencyLabel}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <span style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {isLoading || !overview
              ? "—"
              : formatCurrency(overview.totalMarketCap, {
                  compact: true,
                  currency: vsCurrency,
                })}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              className={clsx("status-pill", {
                success: (overview?.marketCapChange24h ?? 0) >= 0,
                danger: (overview?.marketCapChange24h ?? 0) < 0,
              })}
            >
              {overview
                ? formatPercent(overview.marketCapChange24h)
                : formatPercent(0)}
            </span>
            <span className="muted">24h change</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Total Volume</span>
          <span className="tag">Liquidity</span>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {isLoading || !overview
              ? "—"
              : formatCurrency(overview.totalVolume, {
                  compact: true,
                  currency: vsCurrency,
                })}
          </span>
          <div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "#e5e9f6",
              overflow: "hidden",
            }}
          >
              <div
                style={{
                  width: `${Math.min(100, (overview?.totalVolume || 0) / 1_000_000_000)}%`,
                  background: "linear-gradient(90deg, #6c8dff, #8f9cff)",
                  height: "100%",
                }}
              />
            </div>
            <span className="muted">
              {overview
                ? `${formatNumber(overview.totalVolume / 1_000_000_000, {
                    compact: false,
                  })}B ${currencyLabel}`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Average Health</span>
          <span className="tag">Composite</span>
        </div>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {Math.round(averageHealth)}%
          </span>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "rgba(33, 197, 102, 0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${averageHealth}%`,
                background: "linear-gradient(90deg, #4ad9a7, #7cf2c6)",
                height: "100%",
              }}
            />
          </div>
          <span className="muted">
            {topPerformer
              ? `${topPerformer.name} leads with ${formatPercent(
                  topPerformer.change24h
                )} daily momentum`
              : "Momentum balanced across tracked assets"}
          </span>
        </div>
      </div>
    </div>
  );
}
