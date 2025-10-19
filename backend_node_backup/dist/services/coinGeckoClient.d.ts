import { MarketCoin } from "../types/crypto";
export declare function fetchMarketData(ids: string[], vsCurrency?: string, includeSparkline?: boolean): Promise<MarketCoin[]>;
export declare function fetchMarketChart(id: string, vsCurrency: string, days: number): Promise<{
    prices: number[][];
    market_caps: number[][];
    total_volumes: number[][];
}>;
export declare function fetchGlobalData(): Promise<{
    data: {
        total_market_cap: Record<string, number>;
        total_volume: Record<string, number>;
        market_cap_change_percentage_24h_usd: number;
        market_cap_percentage: Record<string, number>;
    };
}>;
export declare function fetchTrending(): Promise<{
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
}>;
export declare function fetchCoinDetails(id: string): Promise<{
    id: string;
    symbol: string;
    name: string;
    image: {
        small: string;
        large: string;
    };
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
}>;
//# sourceMappingURL=coinGeckoClient.d.ts.map