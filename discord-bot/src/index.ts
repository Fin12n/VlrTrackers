import {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
  ActivityType,
  MessageFlags
} from 'discord.js';
import { botConfig } from './config/botConfig';
import { initDatabase } from './database';
import { findCommand } from './commands';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.valorant('====================================================');
  logger.valorant('🚀 VALORANT CHECKERS BOT - MIỀN TÂY TẾU PRO EDITION');
  logger.valorant('⚡ Components V2 • Drizzle ORM • Gemini Extended AI');
  logger.valorant('====================================================');

  // 1. Validate environment configuration
  botConfig.validate();

  // 2. Initialize Database (Drizzle ORM + PG with In-Memory fallback)
  await initDatabase();

  // 3. Create Discord Client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
  });

  // Client Ready Event
  client.once(Events.ClientReady, (readyClient) => {
    logger.success(`Bot logged in as: ${readyClient.user.tag}`);
    logger.info(`Serving in ${readyClient.guilds.cache.size} guilds.`);
    logger.info(`Prefix commands active: [ ${botConfig.settings.prefix} ]`);

    readyClient.user.setActivity({
      name: `${botConfig.settings.prefix}account | /account`,
      type: ActivityType.Watching
    });
  });

  // Slash Command Handler (InteractionCreate)
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = findCommand(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown slash command: /${interaction.commandName}`);
      return;
    }

    try {
      logger.info(`[Slash] /${interaction.commandName} invoked by @${interaction.user.username}`);
      await command.executeSlash(interaction);
    } catch (error) {
      logger.error(`Error executing slash command /${interaction.commandName}:`, error);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: '❌ Đã xảy ra lỗi không mong muốn khi thực thi lệnh!',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: '❌ Đã xảy ra lỗi không mong muốn khi thực thi lệnh!',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  });

  // Prefix Command Handler (MessageCreate)
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const prefix = botConfig.settings.prefix;
    if (!message.content.startsWith(prefix)) return;

    const trimmed = message.content.slice(prefix.length).trim();
    if (!trimmed) return;

    const args = trimmed.split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = findCommand(commandName);
    if (!command) return;

    try {
      logger.info(`[Prefix] ${prefix}${commandName} invoked by @${message.author.username}`);
      await command.executePrefix(message, args);
    } catch (error) {
      logger.error(`Error executing prefix command ${prefix}${commandName}:`, error);
      await message.reply('❌ Đã xảy ra lỗi khi thực thi lệnh!').catch(() => {});
    }
  });

  // Process safety
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
  });

  // Login
  if (!botConfig.discord.token) {
    logger.warn('DISCORD_TOKEN is missing. Bot cannot connect to Discord gateway yet.');
    logger.info('Please create a .env file from .env.example with your bot token to start.');
    return;
  }

  try {
    await client.login(botConfig.discord.token);
  } catch (error) {
    logger.error('Failed to login to Discord:', error);
  }
}

bootstrap();
