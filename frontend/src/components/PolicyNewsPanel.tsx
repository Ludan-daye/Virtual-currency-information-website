import type { ElementType, MouseEvent } from "react";
import type { PolicyNewsItem } from "../types/news";
import { formatDateTime } from "../utils/format";

interface PolicyNewsPanelProps {
  items?: PolicyNewsItem[];
  loading?: boolean;
  error?: string;
}

type PolicyNewsSection = {
  key: string;
  title: string;
  description: string;
  items: PolicyNewsItem[];
};

const FALLBACK_THEME = "政策观察";

const THEME_ORDER: Array<{
  key: string;
  title: string;
  description: string;
}> = [
  {
    key: "全球动荡",
    title: "全球动荡观察",
    description: "战争升级、制裁与地缘冲突对市场造成的实时冲击。",
  },
  {
    key: "世界局势",
    title: "世界局势脉络",
    description: "宏观政治、外交关系与国际合作的关键信号。",
  },
  {
    key: "能源市场",
    title: "能源市场焦点",
    description: "原油、天然气等能源供需与价格波动带来的连锁影响。",
  },
  {
    key: "市场稳定度",
    title: "市场稳定度速览",
    description: "央行政策、评级调整与市场波动性指标的最新动向。",
  },
  {
    key: "政策动向",
    title: "政策动向追踪",
    description: "监管框架、合规进展与金融政策的阶段性更新。",
  },
  {
    key: FALLBACK_THEME,
    title: "政策观察",
    description: "其他值得关注的政策或宏观消息。",
  },
];

function resolvePrimaryTheme(themes?: string[] | null): string {
  const normalized = Array.isArray(themes)
    ? themes.map((theme) => theme.trim()).filter(Boolean)
    : [];

  for (const { key } of THEME_ORDER) {
    if (normalized.includes(key)) {
      return key;
    }
  }
  if (normalized.length > 0) {
    return normalized[0];
  }
  return FALLBACK_THEME;
}

function buildThemeBuckets(newsItems: PolicyNewsItem[]) {
  const buckets: Record<string, PolicyNewsItem[]> = {};

  newsItems.forEach((item) => {
    const primaryTheme = resolvePrimaryTheme(item.themes);
    if (!buckets[primaryTheme]) {
      buckets[primaryTheme] = [];
    }
    buckets[primaryTheme].push(item);
  });

  return buckets;
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

  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.publishedAt).getTime();
    const timeB = new Date(b.publishedAt).getTime();
    return timeB - timeA;
  });

  const buckets = buildThemeBuckets(sortedItems);
  const primarySections: PolicyNewsSection[] = THEME_ORDER.map((section) => ({
    ...section,
    items: buckets[section.key] ?? [],
  }));
  const assignedKeys = new Set<string>();
  primarySections.forEach((section) => {
    section.items.forEach((item) => {
      assignedKeys.add(`${item.title}-${item.publishedAt}`);
    });
  });

  const extraSections: PolicyNewsSection[] = Object.entries(buckets)
    .filter(([key]) => !THEME_ORDER.some((theme) => theme.key === key))
    .map(([key, value]) => ({
      key,
      title: key,
      description: "相关热点资讯。",
      items: value.filter(
        (item) => !assignedKeys.has(`${item.title}-${item.publishedAt}`)
      ),
    }));

  const fallbackPool = sortedItems.filter(
    (item) => !assignedKeys.has(`${item.title}-${item.publishedAt}`)
  );

  let fallbackIndex = 0;
  const getFallbackItem = () => {
    if (!sortedItems.length) {
      return undefined;
    }
    const total = sortedItems.length;
    for (let attempt = 0; attempt < total; attempt += 1) {
      const index = (fallbackIndex + attempt) % total;
      const candidate = sortedItems[index];
      const key = `${candidate.title}-${candidate.publishedAt}`;
      if (!assignedKeys.has(key)) {
        fallbackIndex = index + 1;
        return candidate;
      }
    }
    const item = sortedItems[fallbackIndex % total];
    fallbackIndex += 1;
    return item;
  };

  primarySections.forEach((section) => {
    if (section.items.length === 0) {
      let fallbackItem = fallbackPool.shift();
      while (
        fallbackItem &&
        assignedKeys.has(`${fallbackItem.title}-${fallbackItem.publishedAt}`)
      ) {
        fallbackItem = fallbackPool.shift();
      }
      if (!fallbackItem) {
        fallbackItem = getFallbackItem();
      }
      if (fallbackItem) {
        section.items = [fallbackItem];
        assignedKeys.add(`${fallbackItem.title}-${fallbackItem.publishedAt}`);
      }
    }
  });

  const sections: PolicyNewsSection[] = [...primarySections, ...extraSections];

  return (
    <div className="policy-news-sections">
      {sections.map((section) => {
        const bucketItems = section.items ?? [];
        return (
          <div key={section.key} className="policy-news-section">
            <div className="policy-news-section-header">
              <h4>{section.title}</h4>
              <p className="muted">{section.description}</p>
            </div>
            {bucketItems.length > 0 ? (
              <div className="policy-news-grid">
                {bucketItems.map((item) => {
                  const themes = Array.isArray(item.themes) ? item.themes.filter(Boolean) : [];
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
                      key={`${section.key}-${item.title}-${item.publishedAt}`}
                      {...wrapperProps}
                      className="policy-news-card-item"
                      onMouseEnter={(event: MouseEvent<HTMLElement>) => {
                        (event.currentTarget as HTMLElement).style.background = "#eef3ff";
                        (event.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(event: MouseEvent<HTMLElement>) => {
                        (event.currentTarget as HTMLElement).style.background = "#f8faff";
                        (event.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      }}
                    >
                      <div className="policy-news-card-item-header">
                        <span>{item.title}</span>
                        <span className="status-pill warning" style={{ borderRadius: 8 }}>
                          {item.impact}
                        </span>
                      </div>
                      <p className="policy-news-card-item-summary">{item.summary}</p>
                      {themes.length > 0 && (
                        <div className="policy-news-card-item-themes">
                          {themes.map((theme) => (
                            <span key={theme}>{theme}</span>
                          ))}
                        </div>
                      )}
                      <div className="policy-news-card-item-footer">
                        <span>{item.source} · {item.region}</span>
                        <span>{formatDateTime(new Date(item.publishedAt).getTime())}</span>
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            ) : (
              <div className="policy-news-empty">
                暂无关于此主题的实时资讯，稍后自动刷新。
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
