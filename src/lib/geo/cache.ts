// ==============================================================================
// HIPOTECALY GEOCORE - CACHE EN MEMORIA CON TTL
// ==============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class GeoCache {
  private static instance: GeoCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTtlMs: number = 1000 * 60 * 60 * 24; // 24 horas por defecto

  private constructor() {}

  public static getInstance(): GeoCache {
    if (!GeoCache.instance) {
      GeoCache.instance = new GeoCache();
    }
    return GeoCache.instance;
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.defaultTtlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + (ttlMs ? ttlMs - this.defaultTtlMs : 0),
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}
