import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { botConfig } from '../config/botConfig';
import { logger } from '../utils/logger';

let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;
let isDbConnected = false;

export async function initDatabase(): Promise<{ isConnected: boolean; db: NodePgDatabase<typeof schema> | null }> {
  if (!botConfig.database.url) {
    logger.info('Database URL is not provided. Running in In-Memory fallback mode.');
    isDbConnected = false;
    return { isConnected: false, db: null };
  }

  try {
    pool = new Pool({
      connectionString: botConfig.database.url,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    // Test connection
    const client = await pool.connect();
    try {
      logger.success('Connected to PostgreSQL database successfully.');

      // Auto-create tables if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_links (
          discord_id VARCHAR(32) PRIMARY KEY,
          puuid VARCHAR(100) NOT NULL,
          name VARCHAR(100) NOT NULL,
          tag VARCHAR(20) NOT NULL,
          region VARCHAR(20),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS account_cache (
          id SERIAL PRIMARY KEY,
          puuid VARCHAR(100) UNIQUE,
          name VARCHAR(100),
          tag VARCHAR(20),
          region VARCHAR(20),
          account_level INT,
          card_data JSONB,
          raw_data JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS match_cache (
          match_id VARCHAR(100) PRIMARY KEY,
          puuid VARCHAR(100),
          map VARCHAR(50),
          player_stats JSONB,
          ai_analysis JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );

        CREATE INDEX IF NOT EXISTS idx_account_cache_name_tag ON account_cache (LOWER(name), LOWER(tag));
      `);
      logger.success('Drizzle PostgreSQL schema verified & synchronized.');
    } finally {
      client.release();
    }

    db = drizzle(pool, { schema });
    isDbConnected = true;
    return { isConnected: true, db };
  } catch (error) {
    logger.warn('Could not connect to PostgreSQL. Falling back to In-Memory RAM cache.', error);
    isDbConnected = false;
    db = null;
    return { isConnected: false, db: null };
  }
}

export function getDb(): NodePgDatabase<typeof schema> | null {
  return db;
}

export function isDatabaseReady(): boolean {
  return isDbConnected && db !== null;
}
