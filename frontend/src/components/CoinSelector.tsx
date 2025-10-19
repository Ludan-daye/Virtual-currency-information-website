const DEFAULT_OPTIONS = [
  { value: "bitcoin", label: "Bitcoin (BTC)" },
  { value: "ethereum", label: "Ethereum (ETH)" },
  { value: "solana", label: "Solana (SOL)" },
  { value: "binancecoin", label: "BNB (BNB)" },
  { value: "cardano", label: "Cardano (ADA)" },
  { value: "xrp", label: "XRP (XRP)" },
  { value: "dogecoin", label: "Dogecoin (DOGE)" },
  { value: "polkadot", label: "Polkadot (DOT)" },
  { value: "tron", label: "TRON (TRX)" },
  { value: "avalanche-2", label: "Avalanche (AVAX)" },
  { value: "chainlink", label: "Chainlink (LINK)" },
  { value: "polygon-pos", label: "Polygon (MATIC)" },
];

interface CoinSelectorProps {
  selected: string[];
  onChange: (next: string[]) => void;
  maxSelection?: number;
}

export function CoinSelector({
  selected,
  onChange,
  maxSelection = 12,
}: CoinSelectorProps) {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      const next = selected.filter((item) => item !== value);
      if (next.length === 0) {
        return;
      }
      onChange(next);
    } else {
      if (selected.length >= maxSelection) {
        return;
      }
      onChange([...selected, value]);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
      }}
    >
      <div>
        <span className="card-title">选择关注币种</span>
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
          最多可同时追踪 {maxSelection} 个币种，至少保留 1 个。
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.6rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {DEFAULT_OPTIONS.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.65rem 0.85rem",
                borderRadius: 12,
                border: `1px solid ${
                  active ? "rgba(68, 82, 166, 0.7)" : "rgba(68, 82, 166, 0.25)"
                }`,
                background: active ? "rgba(103, 123, 220, 0.12)" : "#f6f8ff",
                color: active ? "#1f274f" : "#4452a6",
                fontWeight: active ? 700 : 500,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span>{option.label}</span>
              <span
                className={`status-pill ${active ? "success" : ""}`}
                style={{
                  background: active ? "rgba(61, 213, 152, 0.18)" : "#edf1ff",
                  border: active
                    ? "1px solid rgba(61, 213, 152, 0.5)"
                    : "1px solid rgba(68, 82, 166, 0.2)",
                  color: active ? "#267f5d" : "#4452a6",
                  minWidth: "3rem",
                  justifyContent: "center",
                }}
              >
                {active ? "已选" : "可选"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const DEFAULT_TRACKED_COINS = DEFAULT_OPTIONS.map((option) => option.value);
