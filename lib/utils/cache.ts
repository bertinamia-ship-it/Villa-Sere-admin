/**
 * Simple in-memory cache for client-side data
 * Used to avoid unnecessary refetches when navigating between modules
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Invalidate all cache entries matching a pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
export const cache = new SimpleCache()

// Cache keys
export const CACHE_KEYS = {
  profile: (userId: string) => `profile:${userId}`,
  properties: (tenantId: string) => `properties:${tenantId}`,
  tenant: (tenantId: string) => `tenant:${tenantId}`,
  property: (propertyId: string) => `property:${propertyId}`,
}

