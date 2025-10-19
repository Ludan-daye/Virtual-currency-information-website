export const PORT = Number(process.env.PORT || 4000);

export const DEFAULT_COINS = (process.env.DEFAULT_COINS ||
  "bitcoin,ethereum,solana,binancecoin,cardano,xrp,dogecoin,polkadot").split(
  ","
);

export const DEFAULT_VS_CURRENCY = process.env.DEFAULT_VS_CURRENCY || "usd";

export const SUPPORTED_TIMEFRAMES = {
  "1D": 1,
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "1Y": 365,
} as const;

export type SupportedTimeframeKey = keyof typeof SUPPORTED_TIMEFRAMES;

export const COINGECKO_BASE_URL =
  process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3";

export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 60);

export const MAX_COINS_PER_REQUEST = Number(
  process.env.MAX_COINS_PER_REQUEST || 10
);

export const REQUEST_TIMEOUT_MS = Number(
  process.env.REQUEST_TIMEOUT_MS || 12_000
);
