import NodeCache from "node-cache";
import { CACHE_TTL_SECONDS } from "../config";

const cache = new NodeCache({
  stdTTL: CACHE_TTL_SECONDS,
  checkperiod: Math.max(1, Math.floor(CACHE_TTL_SECONDS * 0.8)),
  useClones: false,
});

export function cacheGet<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function cacheSet<T>(key: string, value: T, ttl?: number): void {
  if (typeof ttl === "number") {
    cache.set(key, value, ttl);
    return;
  }
  cache.set(key, value);
}

export function cacheWrap<T>(
  key: string,
  factory: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached) {
    return Promise.resolve(cached);
  }
  return factory().then((value) => {
    cacheSet(key, value, ttl);
    return value;
  });
}
