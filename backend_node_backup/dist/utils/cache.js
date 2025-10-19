"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheWrap = cacheWrap;
const node_cache_1 = __importDefault(require("node-cache"));
const config_1 = require("../config");
const cache = new node_cache_1.default({
    stdTTL: config_1.CACHE_TTL_SECONDS,
    checkperiod: Math.max(1, Math.floor(config_1.CACHE_TTL_SECONDS * 0.8)),
    useClones: false,
});
function cacheGet(key) {
    return cache.get(key);
}
function cacheSet(key, value, ttl) {
    if (typeof ttl === "number") {
        cache.set(key, value, ttl);
        return;
    }
    cache.set(key, value);
}
function cacheWrap(key, factory, ttl) {
    const cached = cacheGet(key);
    if (cached) {
        return Promise.resolve(cached);
    }
    return factory().then((value) => {
        cacheSet(key, value, ttl);
        return value;
    });
}
//# sourceMappingURL=cache.js.map