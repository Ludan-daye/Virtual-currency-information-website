import type { MarketOverview } from "../types/crypto";

interface TrendingListProps {
  overview?: MarketOverview;
  loading?: boolean;
}

export function TrendingList({ overview, loading = false }: TrendingListProps) {
  if (loading) {
    return <div className="muted">正在获取热门搜索…</div>;
  }
  return (
    <div style={{ display: "grid", gap: "0.85rem" }}>
      {overview?.trending?.length ? (
        overview.trending.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f5f7ff",
              border: "1px solid #d9def4",
              borderRadius: 12,
              padding: "0.75rem 1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "#ecf1ff",
                  color: "#4452a6",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                {index + 1}
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>{item.symbol.toUpperCase()}</div>
                <div className="muted" style={{ fontSize: "0.75rem" }}>
                  {item.id}
                </div>
              </div>
            </div>
            <span className="status-pill warning">Score {item.score}</span>
          </div>
        ))
      ) : (
        <div className="muted">暂无热度数据。</div>
      )}
    </div>
  );
}
