import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Read config.json
const configPath = path.resolve(process.cwd(), 'config.json');
let fileConfig = {
  prefix: '!',
  colors: {
    primary: 0xfa4454,
    secondary: 0x0f1923,
    accent: 0x00f5d4,
    success: 0x2ecc71,
    warning: 0xf1c40f,
    error: 0xe74c3c
  },
  cache: {
    accountTtlSeconds: 600,
    matchTtlSeconds: 3600
  },
  gemini: {
    defaultModel: 'gemini-2.5-pro',
    thinkingBudget: 2048
  },
  trackerUrl: 'https://tracker.gg/valorant/profile/riot'
};

if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    fileConfig = { ...fileConfig, ...JSON.parse(raw) };
  } catch (err) {
    logger.warn('Failed to parse config.json, using defaults.', err);
  }
}

export const botConfig = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID || ''
  },
  henrik: {
    apiKey: process.env.HENRIK_API_KEY || ''
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || fileConfig.gemini.defaultModel,
    thinkingBudget: fileConfig.gemini.thinkingBudget
  },
  database: {
    url: process.env.DATABASE_URL || ''
  },
  settings: {
    prefix: fileConfig.prefix,
    colors: fileConfig.colors,
    cache: fileConfig.cache,
    trackerUrl: fileConfig.trackerUrl
  },

  validate() {
    const missing: string[] = [];
    if (!this.discord.token) missing.push('DISCORD_TOKEN');
    if (!this.discord.clientId) missing.push('CLIENT_ID');
    if (!this.henrik.apiKey) missing.push('HENRIK_API_KEY');

    if (missing.length > 0) {
      logger.warn(
        `Missing required environment variables in .env: ${missing.join(', ')}`
      );
      logger.warn('Please check .env.example and populate your .env file.');
    }

    if (!this.gemini.apiKey) {
      logger.warn(
        'GEMINI_API_KEY is not set. AI Match Analysis & Lucky Blessing will use fallback templates.'
      );
    }

    if (!this.database.url) {
      logger.info(
        'DATABASE_URL not set. Bot will use In-Memory RAM Cache with graceful fallback.'
      );
    }
  }
};
