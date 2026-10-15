import { eq } from 'drizzle-orm';
import { getDb, isDatabaseReady } from './index';
import { userLinks, UserLink } from './schema';
import { logger } from '../utils/logger';

// In-Memory Fallback Map: discordId -> UserLink
const memoryUserLinks = new Map<string, UserLink>();

export const UserLinkRepository = {
  /**
   * Link or update a user's Discord account to a Valorant Riot ID
   */
  async linkAccount(
    discordId: string,
    puuid: string,
    name: string,
    tag: string,
    region?: string
  ): Promise<UserLink> {
    const record: UserLink = {
      discordId,
      puuid,
      name,
      tag,
      region: region || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Always update memory fallback
    memoryUserLinks.set(discordId, record);

    if (isDatabaseReady()) {
      const db = getDb();
      if (db) {
        try {
          await db
            .insert(userLinks)
            .values({
              discordId,
              puuid,
              name,
              tag,
              region: region || null,
              updatedAt: new Date()
            })
            .onConflictDoUpdate({
              target: userLinks.discordId,
              set: {
                puuid,
                name,
                tag,
                region: region || null,
                updatedAt: new Date()
              }
            });
          logger.debug(`[Drizzle] Linked user ${discordId} to ${name}#${tag}`);
        } catch (err) {
          logger.error(`[Drizzle] Error saving user link, using in-memory store:`, err);
        }
      }
    }

    return record;
  },

  /**
   * Find linked account by Discord User ID
   */
  async getLinkedAccount(discordId: string): Promise<UserLink | null> {
    if (isDatabaseReady()) {
      const db = getDb();
      if (db) {
        try {
          const results = await db
            .select()
            .from(userLinks)
            .where(eq(userLinks.discordId, discordId))
            .limit(1);

          if (results.length > 0) {
            return results[0];
          }
        } catch (err) {
          logger.error(`[Drizzle] Error querying user link:`, err);
        }
      }
    }

    // Fallback to in-memory store
    return memoryUserLinks.get(discordId) || null;
  },

  /**
   * Unlink a user's Discord account
   */
  async unlinkAccount(discordId: string): Promise<boolean> {
    const existedInMemory = memoryUserLinks.delete(discordId);
    let existedInDb = false;

    if (isDatabaseReady()) {
      const db = getDb();
      if (db) {
        try {
          const res = await db
            .delete(userLinks)
            .where(eq(userLinks.discordId, discordId))
            .returning();
          existedInDb = res.length > 0;
        } catch (err) {
          logger.error(`[Drizzle] Error deleting user link:`, err);
        }
      }
    }

    return existedInMemory || existedInDb;
  }
};
