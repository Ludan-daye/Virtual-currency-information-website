"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUEST_TIMEOUT_MS = exports.MAX_COINS_PER_REQUEST = exports.CACHE_TTL_SECONDS = exports.COINGECKO_BASE_URL = exports.SUPPORTED_TIMEFRAMES = exports.DEFAULT_VS_CURRENCY = exports.DEFAULT_COINS = exports.PORT = void 0;
exports.PORT = Number(process.env.PORT || 4000);
exports.DEFAULT_COINS = (process.env.DEFAULT_COINS ||
    "bitcoin,ethereum,solana,binancecoin,cardano,xrp,dogecoin,polkadot").split(",");
exports.DEFAULT_VS_CURRENCY = process.env.DEFAULT_VS_CURRENCY || "usd";
exports.SUPPORTED_TIMEFRAMES = {
    "1D": 1,
    "7D": 7,
    "30D": 30,
    "90D": 90,
    "1Y": 365,
};
exports.COINGECKO_BASE_URL = process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3";
exports.CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 60);
exports.MAX_COINS_PER_REQUEST = Number(process.env.MAX_COINS_PER_REQUEST || 10);
exports.REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 12000);
//# sourceMappingURL=config.js.map