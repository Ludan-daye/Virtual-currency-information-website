import axios from "axios";
import {
  COINGECKO_BASE_URL,
  DEFAULT_VS_CURRENCY,
  REQUEST_TIMEOUT_MS,
} from "../config";
import { cacheWrap } from "../utils/cache";
import { HttpError } from "../utils/httpError";
import { MarketCoin } from "../types/crypto";

const client = axios.create({
  baseURL: COINGECKO_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
});

async function request<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await client.get<T>(url, { params });
    return response.data;
  } catch (error) {
    const status =
      axios.isAxiosError(error) && error.response
        ? error.response.status
        : 500;
    const message =
      axios.isAxiosError(error) && error.response
        ? error.response.statusText || "CoinGecko request failed"
        : error instanceof Error
        ? error.message
        : "CoinGecko request failed";

    throw new HttpError(
      status,
      `CoinGecko API error (${status}): ${message}`
    );
  }
}

export async function fetchMarketData(
  ids: string[],
  vsCurrency: string = DEFAULT_VS_CURRENCY,
  includeSparkline = true
): Promise<MarketCoin[]> {
  const cacheKey = `markets:${vsCurrency}:${ids.sort().join(",")}:sparkline:${includeSparkline}`;
  return cacheWrap(cacheKey, () =>
    request<MarketCoin[]>("/coins/markets", {
      vs_currency: vsCurrency,
      ids: ids.join(","),
      sparkline: includeSparkline,
      price_change_percentage: "1h,24h,7d,30d,1y",
      precision: 6,
    })
  );
}

export async function fetchMarketChart(
  id: string,
  vsCurrency: string,
  days: number
): Promise<{ prices: number[][]; market_caps: number[][]; total_volumes: number[][] }> {
  const cacheKey = `market-chart:${id}:${vsCurrency}:${days}`;
  return cacheWrap(cacheKey, () =>
    request("/coins/{id}/market_chart".replace("{id}", id), {
      vs_currency: vsCurrency,
      days,
      interval: days <= 1 ? "hourly" : "daily",
    })
  );
}

export async function fetchGlobalData(): Promise<{
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    market_cap_percentage: Record<string, number>;
  };
}> {
  return cacheWrap("global", () => request("/global"), 60);
}

export async function fetchTrending(): Promise<{
  coins: Array<{
    item: {
      id: string;
      coin_id: number;
      name: string;
      symbol: string;
      market_cap_rank: number;
      score: number;
      price_btc: number;
      data?: Record<string, unknown>;
    };
  }>;
}> {
  return cacheWrap("trending", () => request("/search/trending"), 120);
}

export async function fetchCoinDetails(
  id: string
): Promise<{
  id: string;
  symbol: string;
  name: string;
  image: { small: string; large: string };
  market_data?: {
    price_change_percentage_7d?: number;
    price_change_percentage_30d?: number;
    price_change_percentage_200d?: number;
    price_change_percentage_1y?: number;
  };
  developer_data?: {
    forks?: number;
    stars?: number;
    subscribers?: number;
    total_issues?: number;
    closed_issues?: number;
    pull_requests_merged?: number;
    commit_count_4_weeks?: number;
  };
  community_data?: {
    twitter_followers?: number;
    reddit_subscribers?: number;
  };
}> {
  const cacheKey = `coin-details:${id}`;
  return cacheWrap(cacheKey, () =>
    request(`/coins/${id}`, {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: true,
      developer_data: true,
      sparkline: false,
    })
  );
}
