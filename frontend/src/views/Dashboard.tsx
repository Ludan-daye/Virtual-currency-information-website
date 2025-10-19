import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { CoinTable } from "../components/CoinTable";
import {
  CoinSelector,
  DEFAULT_TRACKED_COINS,
} from "../components/CoinSelector";
import { DominanceChart } from "../components/DominanceChart";
import { HistoryChart } from "../components/HistoryChart";
import { MetricComparisonChart } from "../components/MetricComparisonChart";
import { MetricRadar } from "../components/MetricRadar";
import { StatCards } from "../components/StatCards";
import { TimeframeSelector } from "../components/TimeframeSelector";
import { TrendingList } from "../components/TrendingList";
import {
  useCoinHistoryQuery,
  useCoinsQuery,
  useMarketOverviewQuery,
} from "../hooks/useCryptoData";
import type { CoinMetrics, TimeframeKey } from "../types/crypto";

export function Dashboard() {
  const [vsCurrency, setVsCurrency] = useState("usd");
  const [timeframe, setTimeframe] = useState<TimeframeKey>("30D");
  const [selectedCoinId, setSelectedCoinId] = useState<string | undefined>();
  const [trackedCoins, setTrackedCoins] = useState<string[]>(DEFAULT_TRACKED_COINS);
  const maxTrackedCoins = 12;

  const coinsQuery = useCoinsQuery(trackedCoins, vsCurrency);
  const overviewQuery = useMarketOverviewQuery(vsCurrency);
  const historyQuery = useCoinHistoryQuery(
    selectedCoinId ?? "",
    timeframe,
    vsCurrency
  );

  const coins: CoinMetrics[] = coinsQuery.data ?? [];
  const selectedCoin = coins.find((item) => item.coin.id === selectedCoinId);

  useEffect(() => {
    if (!selectedCoinId && coins.length > 0) {
      setSelectedCoinId(coins[0].coin.id);
    }
  }, [coins, selectedCoinId]);

  useEffect(() => {
    if (coins.length > 0 && selectedCoinId) {
      const stillExists = coins.some((item) => item.coin.id === selectedCoinId);
      if (!stillExists) {
        setSelectedCoinId(coins[0].coin.id);
      }
    }
  }, [coins, selectedCoinId]);

  const averageHealth = useMemo(() => {
    if (!coins.length) {
      return 0;
    }
    const total = coins.reduce((acc, item) => acc + item.metrics.healthScore, 0);
    return total / coins.length;
  }, [coins]);

  const topPerformer = useMemo(() => {
    if (!coins.length) {
      return undefined;
    }
    const sorted = [...coins].sort(
      (a, b) => b.coin.price_change_percentage_24h - a.coin.price_change_percentage_24h
    );
    const leader = sorted[0];
    return {
      name: leader.coin.name,
      change24h: leader.coin.price_change_percentage_24h,
    };
  }, [coins]);

  return (
    <div className="app-shell">
      <AppHeader
        lastUpdated={coinsQuery.dataUpdatedAt}
        vsCurrency={vsCurrency}
        onCurrencyChange={(value) => setVsCurrency(value.toLowerCase())}
      />

      <div className="card">
        <CoinSelector
          selected={trackedCoins}
          onChange={setTrackedCoins}
          maxSelection={maxTrackedCoins}
        />
      </div>

      <StatCards
        overview={overviewQuery.data}
        averageHealth={averageHealth}
        topPerformer={topPerformer}
        isLoading={overviewQuery.isLoading}
        vsCurrency={vsCurrency}
      />

      <div
        className="grid"
        style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "1.5rem" }}
      >
        <HistoryChart
          data={historyQuery.data}
          timeframe={timeframe}
          vsCurrency={vsCurrency}
          headerActions={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
        />

        <MetricRadar
          metrics={selectedCoin?.metrics}
          coinName={selectedCoin?.coin.name}
        />
      </div>

      <CoinTable
        data={coins}
        selectedId={selectedCoinId}
        onSelect={setSelectedCoinId}
        vsCurrency={vsCurrency}
      />

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        <MetricComparisonChart data={coins} />
        <DominanceChart overview={overviewQuery.data} />
        <TrendingList overview={overviewQuery.data} />
      </div>
    </div>
  );
}
