import { useMemo, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { StatCards } from "../components/StatCards";
import { CoinSummaryCard } from "../components/CoinSummaryCard";
import { TrendingList } from "../components/TrendingList";
import { DominanceChart } from "../components/DominanceChart";
import { DEFAULT_TRACKED_COINS } from "../components/CoinSelector";
import {
  useCoinsQuery,
  useMarketOverviewQuery,
  usePolicyNewsQuery,
  useNfpQuery,
} from "../hooks/useCryptoData";
import { PolicyNewsPanel } from "../components/PolicyNewsPanel";
import { NfpChart } from "../components/NfpChart";
import { SubscriptionPanel } from "../components/SubscriptionPanel";
import type { CoinMetrics } from "../types/crypto";

export function Home() {
  const [vsCurrency, setVsCurrency] = useState("usd");
  const trackedCoins = DEFAULT_TRACKED_COINS;
  const coinsQuery = useCoinsQuery(trackedCoins, vsCurrency, false);
  const overviewQuery = useMarketOverviewQuery(vsCurrency);
  const policyNewsQuery = usePolicyNewsQuery();
  const nfpQuery = useNfpQuery();
  const policyNewsError = policyNewsQuery.error instanceof Error ? policyNewsQuery.error.message : undefined;
  const nfpError = nfpQuery.error instanceof Error ? nfpQuery.error.message : undefined;

  const coins: CoinMetrics[] = coinsQuery.data ?? [];

  const averageHealth = useMemo(() => {
    if (!coins.length) return 0;
    const total = coins.reduce((acc, item) => acc + item.metrics.healthScore, 0);
    return total / coins.length;
  }, [coins]);

  const topPerformer = useMemo(() => {
    if (!coins.length) return undefined;
    const sorted = [...coins].sort(
      (a, b) => (b.coin.price_change_percentage_24h || 0) - (a.coin.price_change_percentage_24h || 0)
    );
    const leader = sorted[0];
    return {
      name: leader.coin.name,
      change24h: leader.coin.price_change_percentage_24h || 0,
    };
  }, [coins]);

  return (
    <div className="page">
      <AppHeader
        lastUpdated={coinsQuery.dataUpdatedAt}
        vsCurrency={vsCurrency}
        onCurrencyChange={(value) => setVsCurrency(value.toLowerCase())}
      />

      <StatCards
        overview={overviewQuery.data}
        averageHealth={averageHealth}
        topPerformer={topPerformer}
        isLoading={overviewQuery.isLoading}
        vsCurrency={vsCurrency}
      />

      <section className="section">
        <div className="section-header">
          <h2>核心币种概览</h2>
          <p>快速浏览主流资产的价格变化与健康度，点击卡片进入专业分析页面。</p>
        </div>
        {coinsQuery.isLoading || coinsQuery.isFetching ? (
          <div className="empty-state">核心币种数据加载中…</div>
        ) : coinsQuery.isError ? (
          <div className="empty-state">
            <p>核心币种数据暂时不可用。</p>
            <span className="muted">我们会自动重试，请稍后刷新页面。</span>
          </div>
        ) : coins.length ? (
          <div className="responsive-grid">
            {coins.map((item, idx) => (
              <CoinSummaryCard
                key={item.coin.id}
                data={item}
                vsCurrency={vsCurrency}
                rank={idx + 1}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>当前数据暂不可用。</p>
            <span className="muted">正在等待最新行情，稍后自动刷新。</span>
          </div>
        )}
      </section>

      <section className="section">
        <div className="card horizontal-insights">
          <div className="insight-block">
            <div className="insight-block-header">
              <h3>市值占比</h3>
              <span className="muted">前六大资产权重</span>
            </div>
            <div className="insight-block-body">
              <DominanceChart
                overview={overviewQuery.data}
                loading={overviewQuery.isLoading}
              />
            </div>
          </div>
          <div className="insight-block">
            <div className="insight-block-header">
              <h3>趋势热搜</h3>
              <span className="muted">CoinGecko 指数</span>
            </div>
            <div className="insight-block-body scrollable">
              <TrendingList
                overview={overviewQuery.data}
                loading={overviewQuery.isLoading}
              />
            </div>
          </div>
          <div className="insight-block">
            <div className="insight-block-header">
              <h3>金融政策热搜</h3>
              <span className="muted">监管动向与潜在影响</span>
            </div>
            <div className="insight-block-body scrollable">
              <PolicyNewsPanel
                items={policyNewsQuery.data}
                loading={policyNewsQuery.isLoading}
                error={policyNewsQuery.isError ? policyNewsError : undefined}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <NfpChart
          data={nfpQuery.data?.items}
          loading={nfpQuery.isLoading || nfpQuery.isFetching}
          error={nfpQuery.isError ? nfpError : undefined}
        />
      </section>

      <SubscriptionPanel />
    </div>
  );
}
