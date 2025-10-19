import { Link } from "react-router-dom";
import type { CoinMetrics } from "../types/crypto";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format";
import clsx from "clsx";

interface CoinSummaryCardProps {
  data: CoinMetrics;
  vsCurrency: string;
  rank?: number;
}

export function CoinSummaryCard({ data, vsCurrency, rank }: CoinSummaryCardProps) {
  const { coin, metrics } = data;
  const isUp = (coin.price_change_percentage_24h || 0) >= 0;

  return (
    <Link
      to={`/coins/${coin.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem",
        padding: "1.2rem",
        borderRadius: 16,
        border: "1px solid #d8def0",
        background: "#ffffff",
        boxShadow: "0 10px 24px rgba(26, 38, 100, 0.08)",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(event) => {
        (event.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        (event.currentTarget as HTMLElement).style.boxShadow =
          "0 16px 32px rgba(26, 38, 100, 0.12)";
      }}
      onMouseLeave={(event) => {
        (event.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (event.currentTarget as HTMLElement).style.boxShadow =
          "0 10px 24px rgba(26, 38, 100, 0.08)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#f0f2fb",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            color: "#4452a6",
          }}
        >
          {rank ?? coin.market_cap_rank ?? "-"}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{coin.name}</div>
          <div style={{ fontSize: "0.85rem", color: "#6f7a9b" }}>{coin.symbol.toUpperCase()}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: "0.4rem" }}>
          <span style={{ fontSize: "1.6rem", fontWeight: 700 }}>
            {formatCurrency(coin.current_price, { currency: vsCurrency })}
          </span>
          <span className={clsx("status-pill", isUp ? "success" : "danger")}>
            24h {formatPercent(coin.price_change_percentage_24h || 0)}
          </span>
        </div>
        <img
          src={coin.image}
          alt={coin.name}
          width={40}
          height={40}
          style={{ borderRadius: "50%" }}
        />
      </div>

      <div style={{ display: "grid", gap: "0.4rem" }}>
        <label className="muted" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
          健康评分
        </label>
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
              width: `${Math.round(metrics.healthScore)}%`,
              background: "linear-gradient(90deg, #4b7bff, #5ed0aa)",
              height: "100%",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.9rem",
            color: "#303a62",
          }}
        >
          <span>综合: {Math.round(metrics.healthScore)}%</span>
          <span>流动性: {Math.round(metrics.liquidityScore)}%</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.85rem",
          color: "#6f7a9b",
        }}
      >
        <span>市值 {formatNumber(coin.market_cap / 1_000_000_000, { compact: false })}B</span>
        <span>成交量 {formatNumber(coin.total_volume / 1_000_000_000, { compact: false })}B</span>
      </div>
    </Link>
  );
}
