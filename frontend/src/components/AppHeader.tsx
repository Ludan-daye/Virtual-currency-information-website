import { Link } from "react-router-dom";
import { formatDateTime } from "../utils/format";

interface AppHeaderProps {
  lastUpdated?: number;
  vsCurrency: string;
  onCurrencyChange: (value: string) => void;
}

const currencyOptions = [
  { value: "usd", label: "USD" },
  { value: "eur", label: "EUR" },
  { value: "cny", label: "CNY" },
];

export function AppHeader({
  lastUpdated,
  vsCurrency,
  onCurrencyChange,
}: AppHeaderProps) {
  return (
    <header className="card" style={{ padding: "1.75rem 2rem" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1.5rem",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <span className="tag">Realtime Insight</span>
          <h1
            style={{
              margin: 0,
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#1e2554",
              letterSpacing: "-0.02em",
            }}
          >
            Crypto Health Intelligence
          </h1>
          <p className="muted" style={{ maxWidth: 480 }}>
            Track real-time market health, liquidity, momentum, and developer
            signals for the top cryptocurrencies in one interactive dashboard.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            alignItems: "flex-end",
          }}
        >
          <label
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#94a4f4",
            }}
          >
            Quote Currency
          </label>
          <select
            value={vsCurrency}
            onChange={(event) => onCurrencyChange(event.target.value)}
            style={{
              background: "#f6f8ff",
              border: "1px solid #d1d9f0",
              color: "#1f274f",
              borderRadius: 12,
              padding: "0.6rem 2.5rem 0.6rem 0.9rem",
              fontSize: "1rem",
              fontWeight: 600,
              appearance: "none",
              position: "relative",
            }}
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="muted" style={{ fontSize: "0.8rem" }}>
            Updated {lastUpdated ? formatDateTime(lastUpdated) : "—"}
          </span>
          <Link to="/admin" className="admin-link">
            后台管理
          </Link>
        </div>
      </div>
    </header>
  );
}
