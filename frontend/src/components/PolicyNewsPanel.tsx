import type { ElementType, MouseEvent } from "react";
import type { PolicyNewsItem } from "../types/news";
import { formatDateTime } from "../utils/format";

interface PolicyNewsPanelProps {
  items?: PolicyNewsItem[];
  loading?: boolean;
  error?: string;
}

export function PolicyNewsPanel({ items, loading = false, error }: PolicyNewsPanelProps) {
  if (loading) {
    return <div className="muted">政策资讯加载中…</div>;
  }
  if (error) {
    return <div className="muted">政策资讯暂不可用：{error}</div>;
  }
  if (!items || items.length === 0) {
    return <div className="muted">暂无政策类事件。</div>;
  }

  return (
    <div style={{ display: "grid", gap: "0.85rem" }}>
      {items.map((item) => {
        const Wrapper: ElementType = item.url ? "a" : "div";
        const wrapperProps = item.url
          ? {
              href: item.url,
              target: "_blank",
              rel: "noopener noreferrer",
            }
          : {};
        return (
          <Wrapper
            key={`${item.title}-${item.publishedAt}`}
            {...wrapperProps}
            style={{
              display: "block",
              padding: "0.85rem 1rem",
              borderRadius: 12,
              border: "1px solid #d9def4",
              background: "#f8faff",
              color: "inherit",
              transition: "background 0.2s ease, transform 0.2s ease",
              textDecoration: "none",
            }}
            onMouseEnter={(event: MouseEvent<HTMLElement>) => {
              (event.currentTarget as HTMLElement).style.background = "#eef3ff";
              (event.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(event: MouseEvent<HTMLElement>) => {
              (event.currentTarget as HTMLElement).style.background = "#f8faff";
              (event.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.45rem" }}>
              <span style={{ fontWeight: 600, color: "#1f274f" }}>{item.title}</span>
              <span className="status-pill warning" style={{ borderRadius: 8 }}>
                {item.impact}
              </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#53608c" }}>{item.summary}</p>
            <div
              style={{
                marginTop: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.78rem",
                color: "#7a84ae",
              }}
            >
              <span>{item.source} · {item.region}</span>
              <span>{formatDateTime(new Date(item.publishedAt).getTime())}</span>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}
