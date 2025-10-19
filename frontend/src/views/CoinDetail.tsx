import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { HistoryChart } from "../components/HistoryChart";
import { MetricRadar } from "../components/MetricRadar";
import { TimeframeSelector } from "../components/TimeframeSelector";
import { useCoinHistoryQuery, useCoinsQuery } from "../hooks/useCryptoData";
import type { TimeframeKey } from "../types/crypto";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format";
import {
  calculateEMA,
  calculateRSI,
  linearRegressionForecast,
  percentile,
} from "../utils/analytics";

const TIMEFRAME_INFO: Record<TimeframeKey, { label: string; days: number }> = {
  "1D": { label: "近 1 天", days: 1 },
  "7D": { label: "近 7 天", days: 7 },
  "30D": { label: "近 30 天", days: 30 },
  "90D": { label: "近 90 天", days: 90 },
  "1Y": { label: "近 1 年", days: 365 },
};

type AnalysisResult = {
  changePct: number | null;
  annualVolatility: number | null;
  volumeRatio: number | null;
  support: number | null;
  resistance: number | null;
  rsi: number | null;
  emaShort: number | null;
  emaLong: number | null;
  forecastPrice: number | null;
  forecastSlope: number | null;
  forecastSlopePct: number | null;
  forecastConfidence: number | null;
  percentileLow: number | null;
  percentileHigh: number | null;
  signals: Array<{ title: string; description: string }>;
};

export function CoinDetail() {
  const { coinId } = useParams();
  const navigate = useNavigate();
  const [vsCurrency, setVsCurrency] = useState("usd");
  const [timeframe, setTimeframe] = useState<TimeframeKey>("30D");

  const coinsQuery = useCoinsQuery(coinId ? [coinId] : [], vsCurrency, false);
  const coinData = coinsQuery.data?.[0];

  const historyQuery = useCoinHistoryQuery(coinId ?? "", timeframe, vsCurrency);
  const historyError = historyQuery.error instanceof Error ? historyQuery.error.message : undefined;

  if (!coinId) {
    navigate("/");
    return null;
  }

  const coin = coinData?.coin;
  const metrics = coinData?.metrics;

  const priceDiff = coin ? coin.price_change_percentage_24h || 0 : 0;
  const isUp = priceDiff >= 0;

  const metricPairs = useMemo(() => {
    if (!coin || !metrics) return [];
    return [
      {
        title: "综合健康",
        value: `${Math.round(metrics.healthScore)}%`,
        description: "融合波动、流动性、动量和开发情况的综合评分。",
      },
      {
        title: "流动性",
        value: `${Math.round(metrics.liquidityScore)}%`,
        description: "日成交额与市值比值，衡量资金进出效率。",
      },
      {
        title: "动量",
        value: `${Math.round(metrics.momentumScore)}%`,
        description: "短中期涨跌幅权重，观察趋势延续性。",
      },
      {
        title: "波动率",
        value: `${Math.round(metrics.volatilityScore)}%`,
        description: "近 24h 高低价分布换算的风险指标。",
      },
    ];
  }, [coin, metrics]);

  const analysis = useMemo<AnalysisResult | null>(() => {
    const history = historyQuery.data ?? [];
    if (history.length < 2) {
      return null;
    }
    if (!coin) {
      return null;
    }

    const ordered = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const prices = ordered.map((item) => item.price).filter((price) => price > 0);
    const volumes = ordered.map((item) => item.volume).filter((volume) => volume >= 0);

    if (prices.length < 2) {
      return null;
    }

    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const changePct = startPrice ? ((endPrice - startPrice) / startPrice) * 100 : null;

    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i += 1) {
      const prev = prices[i - 1];
      if (prev) {
        returns.push((prices[i] - prev) / prev);
      }
    }

    let annualVolatility: number | null = null;
    if (returns.length > 1) {
      const mean = returns.reduce((acc, value) => acc + value, 0) / returns.length;
      const variance = returns.reduce((acc, value) => acc + (value - mean) ** 2, 0) /
        (returns.length - 1);
      const dailyVolatility = Math.sqrt(Math.max(variance, 0));
      annualVolatility = dailyVolatility * Math.sqrt(365) * 100;
    }

    const avgVolume = volumes.length
      ? volumes.reduce((acc, value) => acc + value, 0) / volumes.length
      : null;
    const lastVolume = volumes.length ? volumes[volumes.length - 1] : null;
    const volumeRatio = avgVolume && lastVolume ? (lastVolume / avgVolume) * 100 : null;

    const shortEMA = calculateEMA(prices, Math.min(12, prices.length));
    const longEMA = calculateEMA(prices, Math.min(26, prices.length));

    const regressionSeries = prices.map((price, index) => ({ x: index, y: price }));
    const regression = linearRegressionForecast(regressionSeries);

    const rsi = calculateRSI(prices, Math.min(14, Math.max(2, prices.length - 1)));

    const pctLow = percentile(prices, 10);
    const pctHigh = percentile(prices, 90);

    let maSignal: string | null = null;
    if (shortEMA && longEMA) {
      if (shortEMA > longEMA * 1.01) {
        maSignal = "短期 EMA 在长期 EMA 之上，动量偏强";
      } else if (shortEMA < longEMA * 0.99) {
        maSignal = "短期 EMA 跌破长期 EMA，动量趋弱";
      } else {
        maSignal = "短期与长期 EMA 接近，趋势不明朗";
      }
    }

    const signals: Array<{ title: string; description: string }> = [];
    const timeframeInfo = TIMEFRAME_INFO[timeframe];

    if (changePct !== null) {
      signals.push({
        title: changePct >= 0 ? "趋势偏强" : "趋势承压",
        description: `${timeframeInfo.label}价格变化约 ${formatPercent(changePct)}，` +
          `${changePct >= 0 ? "延续上行节奏" : "需警惕进一步回落"}。`,
      });
    }

    if (maSignal) {
      signals.push({
        title: "均线结构",
        description: maSignal,
      });
    }

    if (volumeRatio !== null && avgVolume) {
      signals.push({
        title: "成交量节奏",
        description: `最新成交量约为近段均值的 ${volumeRatio.toFixed(0)}%，` +
          `${volumeRatio >= 130 ? "量能放大" : volumeRatio <= 80 ? "量能收缩" : "量能维持中性"}。`,
      });
    }

    if (annualVolatility !== null) {
      signals.push({
        title: "波动率",
        description: `年化波动率约 ${annualVolatility.toFixed(1)}%，` +
          `${annualVolatility >= 120 ? "风险偏高" : annualVolatility <= 60 ? "波动温和" : "处于常态区间"}。`,
      });
    }

    if (pctLow && pctHigh) {
      signals.push({
        title: "支撑 / 压力",
        description: `估算支撑位 ${formatCurrency(pctLow, { currency: vsCurrency })}，` +
          `压力位 ${formatCurrency(pctHigh, { currency: vsCurrency })}。`,
      });
    }

    if (metrics) {
      signals.push({
        title: "健康结构",
        description: `综合健康评分 ${Math.round(metrics.healthScore)}，流动性 ${Math.round(metrics.liquidityScore)} 分，动量 ${Math.round(metrics.momentumScore)} 分。`,
      });
    }

    if (rsi !== null) {
      signals.push({
        title: "RSI 指标",
        description: `RSI ≈ ${rsi.toFixed(1)}，${rsi >= 70 ? "涨势过热，或面临回调" : rsi <= 30 ? "买盘活跃度低，或接近超卖" : "处于中性区间"}。`,
      });
    }

    let slopePct: number | null = null;
    if (regression && prices[prices.length - 1]) {
      slopePct = (regression.slope / prices[prices.length - 1]) * 100;
      signals.push({
        title: "线性趋势",
        description:
          `线性回归斜率 ${slopePct >= 0 ? "向上" : "向下"} (${slopePct.toFixed(2)}%/步)，模型拟合优度 ${(regression.rSquared * 100).toFixed(0)}%。`,
      });
    }

    return {
      changePct,
      annualVolatility,
      volumeRatio,
      support: lowPrice,
      resistance: highPrice,
      rsi,
      emaShort: shortEMA,
      emaLong: longEMA,
      forecastPrice: regression ? regression.nextY : null,
      forecastSlope: regression ? regression.slope : null,
      forecastSlopePct: slopePct,
      forecastConfidence: regression ? regression.rSquared : null,
      percentileLow: pctLow,
      percentileHigh: pctHigh,
      signals,
    };
  }, [coin, historyQuery.data, metrics, timeframe, vsCurrency]);

  const highlightTiles = useMemo(
    () => {
      const timeframeInfo = TIMEFRAME_INFO[timeframe];
      if (!analysis) {
        return [] as Array<{ label: string; value: string; tone: "up" | "down" | "neutral" | "risk" }>;
      }
      return [
        {
          label: `${timeframeInfo.label}收益`,
          value:
            analysis.changePct !== null
              ? `${analysis.changePct >= 0 ? "▲" : "▼"} ${Math.abs(analysis.changePct).toFixed(1)}%`
              : "—",
          tone:
            analysis.changePct !== null
              ? analysis.changePct >= 0
                ? "up"
                : "down"
              : "neutral",
        },
        {
          label: "预测价",
          value:
            analysis.forecastPrice !== null
              ? formatCurrency(analysis.forecastPrice, { currency: vsCurrency })
              : "—",
          tone: "neutral",
        },
        {
          label: "年化波动率",
          value:
            analysis.annualVolatility !== null
              ? `${analysis.annualVolatility.toFixed(1)}%`
              : "—",
          tone:
            analysis.annualVolatility !== null && analysis.annualVolatility > 120
              ? "risk"
              : "neutral",
        },
        {
          label: "RSI",
          value:
            analysis.rsi !== null ? `${analysis.rsi.toFixed(1)}` : "—",
          tone:
            analysis.rsi !== null && analysis.rsi >= 70
              ? "risk"
              : analysis.rsi !== null && analysis.rsi <= 30
              ? "down"
              : "neutral",
        },
      ];
    },
    [analysis, timeframe, vsCurrency]
  );

  return (
    <div className="page">
      <AppHeader
        lastUpdated={coinsQuery.dataUpdatedAt}
        vsCurrency={vsCurrency}
        onCurrencyChange={(value) => setVsCurrency(value.toLowerCase())}
      />

      <div className="section">
        <Link to="/" className="back-link">
          ← 返回总览
        </Link>
        {coin ? (
          <div className="detail-header">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <img
                src={coin.image}
                alt={coin.name}
                width={48}
                height={48}
                style={{ borderRadius: "50%" }}
              />
              <div>
                <h1>{coin.name}</h1>
                <span className="muted">{coin.symbol.toUpperCase()} · 市值排名 #{coin.market_cap_rank}</span>
              </div>
            </div>
            <div className="price-block">
              <span className="price-value">
                {formatCurrency(coin.current_price, { currency: vsCurrency })}
              </span>
              <span className={`status-pill ${isUp ? "success" : "danger"}`}>
                24h {formatPercent(priceDiff)}
              </span>
            </div>
          </div>
        ) : (
          <div className="muted">正在载入...</div>
        )}
      </div>

      <div className="section duo-grid">
        <HistoryChart
          data={historyQuery.data}
          timeframe={timeframe}
          vsCurrency={vsCurrency}
          headerActions={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
          loading={historyQuery.isLoading || historyQuery.isFetching}
          error={historyQuery.isError ? historyError : undefined}
        />
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <span className="card-title">核心指标</span>
            <p className="muted" style={{ marginTop: "0.35rem" }}>
              从交易活跃、趋势和风险多个角度评估资产状态。
            </p>
          </div>
          <div className="metric-grid">
            {metricPairs.map((item) => (
              <div key={item.title} className="metric-tile">
                <span className="metric-title">{item.title}</span>
                <span className="metric-value">{item.value}</span>
                <p className="muted" style={{ fontSize: "0.8rem" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section duo-grid">
        <MetricRadar metrics={metrics} coinName={coin?.name} />
        <div className="card">
          <div className="card-header">
            <span className="card-title">基本面 & 资金面</span>
            <span className="muted">Real-time</span>
          </div>
          {coin ? (
            <div className="info-grid">
              <InfoRow label="市值" value={formatCurrency(coin.market_cap, { compact: true, currency: vsCurrency })} />
              <InfoRow
                label="24h 成交量"
                value={formatCurrency(coin.total_volume, { compact: true, currency: vsCurrency })}
              />
              <InfoRow
                label="流通供应"
                value={`${formatNumber(coin.circulating_supply)} ${coin.symbol.toUpperCase()}`}
              />
              <InfoRow
                label="总供应"
                value={
                  coin.total_supply
                    ? `${formatNumber(coin.total_supply)} ${coin.symbol.toUpperCase()}`
                    : "—"
                }
              />
              <InfoRow
                label="历史最高价"
                value={formatCurrency(coin.ath, { currency: vsCurrency })}
                helper={`距今 ${formatPercent(coin.ath_change_percentage || 0)}`}
              />
              <InfoRow
                label="历史最低价"
                value={formatCurrency(coin.atl, { currency: vsCurrency })}
                helper={`距今 ${formatPercent(coin.atl_change_percentage || 0)}`}
              />
            </div>
          ) : (
            <div className="muted">暂无数据</div>
          )}
        </div>
      </div>

      <section className="section">
        <div className="card analysis-card">
          <div className="analysis-header">
            <h2>走势研判</h2>
            <span className="muted">{TIMEFRAME_INFO[timeframe].label} 数据</span>
          </div>
          {historyQuery.isLoading || historyQuery.isFetching ? (
            <div className="muted">走势研判加载中…</div>
          ) : historyQuery.isError ? (
            <div className="muted">无法生成走势研判：{historyError}</div>
          ) : analysis ? (
            <>
              <div className="highlight-grid">
                {highlightTiles.map((tile) => (
                  <div key={tile.label} className={`highlight-tile ${tile.tone}`}>
                    <span className="highlight-label">{tile.label}</span>
                    <span className="highlight-value">{tile.value}</span>
                  </div>
                ))}
              </div>
              {analysis.forecastPrice !== null ? (
                <div className="forecast-summary">
                  <div>
                    <span className="muted">模型预测</span>
                    <h3>
                      下一时段目标价约 {formatCurrency(analysis.forecastPrice, { currency: vsCurrency })}
                    </h3>
                  </div>
                  <div className="forecast-details">
                    <span>
                      趋势斜率 {analysis.forecastSlopePct !== null ? `${analysis.forecastSlopePct.toFixed(2)}%` : "—"}
                    </span>
                    <span>
                      拟合优度 {analysis.forecastConfidence !== null ? `${(analysis.forecastConfidence * 100).toFixed(0)}%` : "—"}
                    </span>
                    <span>
                      参考区间 {analysis.percentileLow !== null && analysis.percentileHigh !== null
                        ? `${formatCurrency(analysis.percentileLow, { currency: vsCurrency })} - ${formatCurrency(analysis.percentileHigh, { currency: vsCurrency })}`
                        : "—"}
                    </span>
                  </div>
                </div>
              ) : null}
              <ul className="analysis-list">
                {analysis.signals.map((signal) => (
                  <li key={signal.title}>
                    <strong>{signal.title}</strong>
                    <p>{signal.description}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="muted">暂缺足够数据进行走势分析。</div>
          )}
        </div>
      </section>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  helper?: string;
}

function InfoRow({ label, value, helper }: InfoRowProps) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <div className="info-value">
        <span>{value}</span>
        {helper ? <span className="muted">{helper}</span> : null}
      </div>
    </div>
  );
}
