import type { TimeframeKey } from "../types/crypto";

const timeframeOptions: TimeframeKey[] = ["1D", "7D", "30D", "90D", "1Y"];

interface TimeframeSelectorProps {
  value: TimeframeKey;
  onChange: (value: TimeframeKey) => void;
}

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {timeframeOptions.map((option) => {
        const isActive = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: 999,
              border: `1px solid ${isActive ? "rgba(79, 110, 242, 0.8)" : "rgba(79, 110, 242, 0.25)"}`,
              background: isActive ? "rgba(79, 110, 242, 0.15)" : "#f6f8ff",
              color: isActive ? "#1f274f" : "#4452a6",
              fontSize: "0.85rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
