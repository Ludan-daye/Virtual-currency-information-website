"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMarketData = fetchMarketData;
exports.fetchMarketChart = fetchMarketChart;
exports.fetchGlobalData = fetchGlobalData;
exports.fetchTrending = fetchTrending;
exports.fetchCoinDetails = fetchCoinDetails;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const cache_1 = require("../utils/cache");
const httpError_1 = require("../utils/httpError");
const client = axios_1.default.create({
    baseURL: config_1.COINGECKO_BASE_URL,
    timeout: config_1.REQUEST_TIMEOUT_MS,
    headers: {
        Accept: "application/json",
    },
});
async function request(url, params) {
    try {
        const response = await client.get(url, { params });
        return response.data;
    }
    catch (error) {
        const status = axios_1.default.isAxiosError(error) && error.response
            ? error.response.status
            : 500;
        const message = axios_1.default.isAxiosError(error) && error.response
            ? error.response.statusText || "CoinGecko request failed"
            : error instanceof Error
                ? error.message
                : "CoinGecko request failed";
        throw new httpError_1.HttpError(status, `CoinGecko API error (${status}): ${message}`);
    }
}
async function fetchMarketData(ids, vsCurrency = config_1.DEFAULT_VS_CURRENCY, includeSparkline = true) {
    const cacheKey = `markets:${vsCurrency}:${ids.sort().join(",")}:sparkline:${includeSparkline}`;
    return (0, cache_1.cacheWrap)(cacheKey, () => request("/coins/markets", {
        vs_currency: vsCurrency,
        ids: ids.join(","),
        sparkline: includeSparkline,
        price_change_percentage: "1h,24h,7d,30d,1y",
        precision: 6,
    }));
}
async function fetchMarketChart(id, vsCurrency, days) {
    const cacheKey = `market-chart:${id}:${vsCurrency}:${days}`;
    return (0, cache_1.cacheWrap)(cacheKey, () => request("/coins/{id}/market_chart".replace("{id}", id), {
        vs_currency: vsCurrency,
        days,
        interval: days <= 1 ? "hourly" : "daily",
    }));
}
async function fetchGlobalData() {
    return (0, cache_1.cacheWrap)("global", () => request("/global"), 60);
}
async function fetchTrending() {
    return (0, cache_1.cacheWrap)("trending", () => request("/search/trending"), 120);
}
async function fetchCoinDetails(id) {
    const cacheKey = `coin-details:${id}`;
    return (0, cache_1.cacheWrap)(cacheKey, () => request(`/coins/${id}`, {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: true,
        developer_data: true,
        sparkline: false,
    }));
}
//# sourceMappingURL=coinGeckoClient.js.map