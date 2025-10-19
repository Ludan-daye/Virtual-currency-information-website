"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoinsWithMetrics = getCoinsWithMetrics;
exports.getCoinHistory = getCoinHistory;
exports.getMarketOverview = getMarketOverview;
const dayjs_1 = __importDefault(require("dayjs"));
const config_1 = require("../config");
const coinGeckoClient_1 = require("./coinGeckoClient");
const httpError_1 = require("../utils/httpError");
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function scale(value, min, max) {
    if (max - min === 0) {
        return 0;
    }
    return clamp((value - min) / (max - min), 0, 1);
}
function safeRatio(numerator, denominator) {
    if (!denominator) {
        return 0;
    }
    return numerator / denominator;
}
function computeMetrics(coin, details) {
    const priceVolatilityRatio = coin.high_24h && coin.low_24h
        ? (coin.high_24h - coin.low_24h) / coin.current_price
        : Math.abs(coin.price_change_percentage_24h) / 100;
    const volatilityScore = clamp(100 - scale(priceVolatilityRatio, 0, 0.25) * 100, 0, 100);
    const liquidityRatio = safeRatio(coin.total_volume, coin.market_cap);
    const liquidityScore = clamp(scale(liquidityRatio, 0, 1) * 100, 0, 100);
    const priceChange24h = coin.price_change_percentage_24h || 0;
    const sparkline = coin.sparkline_in_7d?.price;
    let change7d = 0;
    if (Array.isArray(sparkline) && sparkline.length > 0) {
        const base = sparkline[0];
        if (base) {
            change7d = ((coin.current_price - base) / base) * 100;
        }
        else {
            change7d = details?.market_data?.price_change_percentage_7d || 0;
        }
    }
    else {
        change7d = details?.market_data?.price_change_percentage_7d || 0;
    }
    const change30d = details?.market_data?.price_change_percentage_30d ??
        priceChange24h * 1.6;
    const momentumComposite = (priceChange24h * 0.35 + change7d * 0.4 + change30d * 0.25) / 3;
    const momentumScore = clamp(scale(momentumComposite, -20, 20) * 100, 0, 100);
    const dev = details?.developer_data;
    const community = details?.community_data;
    const developmentScore = dev
        ? clamp(scale((dev.stars || 0) * 0.2 +
            (dev.forks || 0) * 0.2 +
            (dev.commit_count_4_weeks || 0) * 0.4 +
            (dev.pull_requests_merged || 0) * 0.2, 0, 500) *
            100, 0, 100)
        : 50;
    const communityScore = community
        ? clamp(scale((community.twitter_followers || 0) * 0.00002 +
            (community.reddit_subscribers || 0) * 0.00004, 0, 30) *
            100, 0, 100)
        : 40;
    const healthScore = clamp(volatilityScore * 0.2 +
        liquidityScore * 0.3 +
        momentumScore * 0.25 +
        developmentScore * 0.15 +
        communityScore * 0.1, 0, 100);
    return {
        healthScore,
        volatilityScore,
        liquidityScore,
        momentumScore,
        developmentScore: clamp((developmentScore + communityScore * 0.4) / 1.4, 0, 100),
    };
}
async function getCoinsWithMetrics({ ids = config_1.DEFAULT_COINS, vsCurrency = config_1.DEFAULT_VS_CURRENCY, }) {
    if (ids.length === 0) {
        throw new httpError_1.HttpError(400, "At least one coin id is required");
    }
    if (ids.length > config_1.MAX_COINS_PER_REQUEST) {
        throw new httpError_1.HttpError(400, `A maximum of ${config_1.MAX_COINS_PER_REQUEST} coins can be requested at once`);
    }
    const marketData = await (0, coinGeckoClient_1.fetchMarketData)(ids, vsCurrency);
    const details = await Promise.all(marketData.map((coin) => (0, coinGeckoClient_1.fetchCoinDetails)(coin.id).catch(() => undefined)));
    return marketData.map((coin, idx) => ({
        coin,
        metrics: computeMetrics(coin, details[idx]),
    }));
}
async function getCoinHistory({ id, vsCurrency = config_1.DEFAULT_VS_CURRENCY, timeframeKey, }) {
    const days = config_1.SUPPORTED_TIMEFRAMES[timeframeKey];
    if (!days) {
        throw new httpError_1.HttpError(400, `Unsupported timeframe "${timeframeKey}"`);
    }
    const data = await (0, coinGeckoClient_1.fetchMarketChart)(id, vsCurrency, days);
    return data.prices.map((pricePoint, idx) => {
        const time = pricePoint[0] ?? Date.now();
        const price = pricePoint[1] ?? 0;
        const marketCapPoint = data.market_caps[idx];
        const volumePoint = data.total_volumes[idx];
        const marketCap = Array.isArray(marketCapPoint) && marketCapPoint.length > 1
            ? marketCapPoint[1] ?? 0
            : 0;
        const volume = Array.isArray(volumePoint) && volumePoint.length > 1
            ? volumePoint[1] ?? 0
            : 0;
        return {
            timestamp: (0, dayjs_1.default)(time).valueOf(),
            price,
            marketCap,
            volume,
        };
    });
}
async function getMarketOverview(vsCurrency = config_1.DEFAULT_VS_CURRENCY) {
    const [global, trending] = await Promise.all([(0, coinGeckoClient_1.fetchGlobalData)(), (0, coinGeckoClient_1.fetchTrending)()]);
    return {
        totalMarketCap: global.data.total_market_cap[vsCurrency] || 0,
        totalVolume: global.data.total_volume[vsCurrency] || 0,
        marketCapChange24h: global.data.market_cap_change_percentage_24h_usd || 0,
        dominance: global.data.market_cap_percentage,
        trending: trending.coins.map((coin) => ({
            id: coin.item.id,
            symbol: coin.item.symbol,
            score: coin.item.score,
        })),
    };
}
//# sourceMappingURL=metricsService.js.map