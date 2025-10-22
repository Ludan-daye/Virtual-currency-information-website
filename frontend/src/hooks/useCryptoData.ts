import { useQuery } from "@tanstack/react-query";
import {
  fetchCoinHistory,
  fetchCoins,
  fetchMarketOverview,
  fetchPolicyNews,
  fetchNfpSeries,
} from "../lib/api";
import type { TimeframeKey } from "../types/crypto";

export function useCoinsQuery(ids?: string[], vsCurrency?: string, includeDetails = true) {
  return useQuery({
    queryKey: ["coins", ids?.join(","), vsCurrency, includeDetails],
    queryFn: () => fetchCoins({ ids, vsCurrency, includeDetails }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarketOverviewQuery(vsCurrency?: string) {
  return useQuery({
    queryKey: ["market-overview", vsCurrency],
    queryFn: () => fetchMarketOverview(vsCurrency),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function usePolicyNewsQuery() {
  return useQuery({
    queryKey: ["policy-news"],
    queryFn: fetchPolicyNews,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useNfpQuery() {
  return useQuery({
    queryKey: ["macro-nfp"],
    queryFn: fetchNfpSeries,
    staleTime: 60 * 60_000,
  });
}

export function useCoinHistoryQuery(
  id: string,
  timeframe: TimeframeKey,
  vsCurrency?: string
) {
  return useQuery({
    queryKey: ["coin-history", id, timeframe, vsCurrency],
    queryFn: () => fetchCoinHistory({ id, timeframe, vsCurrency }),
    enabled: Boolean(id),
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
}
