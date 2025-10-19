import { SUPPORTED_TIMEFRAMES } from "../config";
import { CoinMetrics, HistoricalPoint, MarketOverview } from "../types/crypto";
export declare function getCoinsWithMetrics({ ids, vsCurrency, }: {
    ids?: string[];
    vsCurrency?: string;
}): Promise<CoinMetrics[]>;
export declare function getCoinHistory({ id, vsCurrency, timeframeKey, }: {
    id: string;
    vsCurrency?: string;
    timeframeKey: keyof typeof SUPPORTED_TIMEFRAMES;
}): Promise<HistoricalPoint[]>;
export declare function getMarketOverview(vsCurrency?: string): Promise<MarketOverview>;
//# sourceMappingURL=metricsService.d.ts.map