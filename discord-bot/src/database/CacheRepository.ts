import { sql, eq } from 'drizzle-orm';
import { getDb, isDatabaseReady } from './index';
import { accountCache, matchCache, AccountCacheItem, MatchCacheItem } from './schema';
import { botConfig } from '../config/botConfig';
import { logger } from '../utils/logger';

// In-Memory Fallback Caches
interface MemoryCacheItem<T> {
  data: T;
  expiresAt: number;
}
const memoryAccountCache = new Map<string, MemoryCacheItem<any>>();
const memoryMatchCache = new Map<string, MemoryCacheItem<any>>();

export const CacheRepository = {
  /**
   * Get cached account data if not expired
   */
  async getAccount(name: string, tag: string): Promise<any | null> {
    const key = `${name.toLowerCase()}#${tag.toLowerCase()}`;

    // 1. Try Drizzle PostgreSQL
    if (isDatabaseReady()) {
      const db = getDb();
      if (db) {
        try {
          const results = await db
            .select()
            .from(accountCache)
            .where(
              sql`LOWER(${accountCache.name}) = LOWER(${name}) AND LOWER(${accountCache.tag}) = LOWER(${tag}) AND ${accountCache.expiresAt} > NOW()`
            )
            .limit(1);

          if (results.length > 0 && results[0].rawData) {
            logger.debug(`[Cache] DB Hit for account: ${key}`);
            return results[0].rawData;
          }
        } catch (err) {
          logger.error(`[Cache] DB read error for account:`, err);
        }
      }
    }

    // 2. Fallback to Memory Cache
    const memItem = memoryAccountCache.get(key);
    if (memItem) {
      if (Date.now() < memItem.expiresAt) {
        logger.debug(`[Cache] Memory Hit for account: ${key}`);
        return memItem.data;
      }
      memoryAccountCache.delete(key);
    }

    return null;
  },

  /**
   * Cache account data with TTL
   */
  async setAccount(data: any, ttlSeconds?: number): Promise<void> {
    if (!data || !data.name || !data.tag) return;
    const ttl = ttlSeconds ?? botConfig.settings.cache.accountTtlSeconds;
    const key = `${data.name.toLowerCase()}#${data.tag.toLowerCase()}`;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    // Save to memory
    memoryAccountCache.set(key, {
      data,
      expiresAt: expiresAt.getTime()
    });

    // Save to DB
    if (isDatabaseReady()) {
      const db = getDb();
      if (db) {
        try {
          await db
            .insert(accountCache)
            .values({
              puuid: data.puuid || null,
              name: data.name,
              tag: data.tag,
              region: data.region || null,
              accountLevel: data.account_level || null,
              cardData: data.card || null,
              rawData: data,
              updatedAt: new Date(),
              expiresAt
            })
            .onConflictDoUpdate({
              target: accountCache.puuid,
              set: {
                name: data.name,
                tag: data.tag,
                region: data.region || null,
                accountLevel: data.account_level || null,
                cardData: data.card || null,
                rawData: data,
                updatedAt: new Date(),
                expiresAt
              }
            });
          logger.debug(`[Cache] DB Cached account: ${key} for ${ttl}s`);
        } catch (err) {
          logger.error(`[Cache] DB write error for account:`, err);
        }
      }
    }
  },

  /**
   * Get cached match and analysis
   */
  async getMatch(matchId: string): Promise<{ playerStats: any; aiAnalysis: any } | null> {
    if (isDatabaseReady()) {
      const db = getDb();
      if (db) {
        try {
          const results = await db
            .select()
            .from(matchCache)
            .where(
              sql`${matchCache.matchId} = ${matchId} AND ${matchCache.expiresAt} > NOW()`
            )
            .limit(1);

          if (results.length > 0) {
            return {
              playerStats: results[0].playerStats,
              aiAnalysis: results[0].aiAnalysis
            };
          }
        } catch (err) {
          logger.error(`[Cache] DB read error for match:`, err);
        }
      }
    }

    const mem = memoryMatchCache.get(matchId);
    if (mem) {
      if (Date.now() < mem.expiresAt) {
        return mem.data;
      }
      memoryMatchCache.delete(matchId);
    }

    return null;
  },

  /**
   * Save match and analysis to cache
   */
  async setMatch(
    matchId: string,
    puuid: string,
    map: string,
    playerStats: any,
    aiAnalysis: any,
    ttlSeconds?: number
  ): Promise<void> {
    const ttl = ttlSeconds ?? botConfig.settings.cache.matchTtlSeconds;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    memoryMatchCache.set(matchId, {
      data: { playerStats, aiAnalysis },
      expiresAt: expiresAt.getTime()
    });

    if (isDatabaseReady()) {
      const db = getDb();
      if (db) {
        try {
          await db
            .insert(matchCache)
            .values({
              matchId,
              puuid,
              map,
              playerStats,
              aiAnalysis,
              updatedAt: new Date(),
              expiresAt
            })
            .onConflictDoUpdate({
              target: matchCache.matchId,
              set: {
                map,
                playerStats,
                aiAnalysis,
                updatedAt: new Date(),
                expiresAt
              }
            });
        } catch (err) {
          logger.error(`[Cache] DB write error for match:`, err);
        }
      }
    }
  }
};
