import { pgTable, serial, varchar, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Table: user_links
 * Links a Discord User ID to their primary Valorant Riot Account
 */
export const userLinks = pgTable('user_links', {
  discordId: varchar('discord_id', { length: 32 }).primaryKey(),
  puuid: varchar('puuid', { length: 100 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  tag: varchar('tag', { length: 20 }).notNull(),
  region: varchar('region', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

/**
 * Table: account_cache
 * Caches HenrikDev API account details to save rate limits
 */
export const accountCache = pgTable('account_cache', {
  id: serial('id').primaryKey(),
  puuid: varchar('puuid', { length: 100 }).unique(),
  name: varchar('name', { length: 100 }),
  tag: varchar('tag', { length: 20 }),
  region: varchar('region', { length: 20 }),
  accountLevel: integer('account_level'),
  cardData: jsonb('card_data'),
  rawData: jsonb('raw_data'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true })
});

/**
 * Table: match_cache
 * Caches player match data and AI tactical analysis
 */
export const matchCache = pgTable('match_cache', {
  matchId: varchar('match_id', { length: 100 }).primaryKey(),
  puuid: varchar('puuid', { length: 100 }),
  map: varchar('map', { length: 50 }),
  playerStats: jsonb('player_stats'),
  aiAnalysis: jsonb('ai_analysis'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true })
});

export type UserLink = typeof userLinks.$inferSelect;
export type NewUserLink = typeof userLinks.$inferInsert;

export type AccountCacheItem = typeof accountCache.$inferSelect;
export type NewAccountCacheItem = typeof accountCache.$inferInsert;

export type MatchCacheItem = typeof matchCache.$inferSelect;
export type NewMatchCacheItem = typeof matchCache.$inferInsert;
