import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import { botConfig } from './config/botConfig';
import { logger } from './utils/logger';

async function deploy() {
  const { token, clientId, guildId } = botConfig.discord;

  if (!token || !clientId) {
    logger.error('Cannot deploy slash commands: Missing DISCORD_TOKEN or CLIENT_ID in .env.');
    process.exit(1);
  }

  const slashPayload = commands.map((c) => c.slashBuilder.toJSON());

  logger.info(`Starting slash commands registration (${slashPayload.length} commands)...`);

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    if (guildId) {
      logger.info(`Deploying commands to GUILD: ${guildId} (Instant propagation)...`);
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: slashPayload }
      );
      logger.success(`Successfully registered ${slashPayload.length} guild slash commands!`);
    } else {
      logger.info('No GUILD_ID set. Deploying commands GLOBALLY...');
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: slashPayload }
      );
      logger.success(`Successfully registered ${slashPayload.length} global slash commands!`);
    }
  } catch (error) {
    logger.error('Failed to register slash commands:', error);
    process.exit(1);
  }
}

deploy();
