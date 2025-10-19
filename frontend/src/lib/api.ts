import axios from "axios";
import type {
  CoinMetrics,
  HistoricalPoint,
  MarketOverview,
  TimeframeKey,
} from "../types/crypto";
import type { PolicyNewsItem } from "../types/news";
import type { NfpResponse } from "../types/macro";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
  timeout: 10_000,
});

export async function fetchCoins({
  ids,
  vsCurrency,
  includeDetails,
}: { ids?: string[]; vsCurrency?: string; includeDetails?: boolean } = {}): Promise<CoinMetrics[]> {
  const response = await api.get<CoinMetrics[]>("/api/coins", {
    params: {
      ...(ids ? { ids: ids.join(",") } : {}),
      ...(vsCurrency ? { vs_currency: vsCurrency } : {}),
      ...(includeDetails === false ? { include_details: false } : {}),
    },
  });
  return response.data;
}

export async function fetchMarketOverview(
  vsCurrency?: string
): Promise<MarketOverview> {
  const response = await api.get<MarketOverview>("/api/market/overview", {
    params: vsCurrency ? { vs_currency: vsCurrency } : undefined,
  });
  return response.data;
}

export async function fetchPolicyNews(): Promise<PolicyNewsItem[]> {
  const response = await api.get<PolicyNewsItem[]>("/api/news/policies");
  return response.data;
}

export async function fetchNfpSeries(): Promise<NfpResponse> {
  const response = await api.get<NfpResponse>("/api/macro/nfp");
  return response.data;
}

export async function fetchCoinHistory({
  id,
  timeframe,
  vsCurrency,
}: {
  id: string;
  timeframe: TimeframeKey;
  vsCurrency?: string;
}): Promise<HistoricalPoint[]> {
  const response = await api.get<HistoricalPoint[]>(
    `/api/coins/${id}/history`,
    {
      params: {
        timeframe,
        ...(vsCurrency ? { vs_currency: vsCurrency } : {}),
      },
    }
  );
  return response.data;
}
