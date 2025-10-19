export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface CalculatedMetrics {
  healthScore: number;
  volatilityScore: number;
  liquidityScore: number;
  momentumScore: number;
  developmentScore: number;
}

export interface CoinMetrics {
  coin: MarketCoin;
  metrics: CalculatedMetrics;
}

export interface HistoricalPoint {
  timestamp: number;
  price: number;
  marketCap: number;
  volume: number;
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume: number;
  marketCapChange24h: number;
  dominance: Record<string, number>;
  trending: Array<{
    id: string;
    symbol: string;
    score: number;
  }>;
}

export type TimeframeKey = "1D" | "7D" | "30D" | "90D" | "1Y";
