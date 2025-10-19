export declare function cacheGet<T>(key: string): T | undefined;
export declare function cacheSet<T>(key: string, value: T, ttl?: number): void;
export declare function cacheWrap<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
//# sourceMappingURL=cache.d.ts.map