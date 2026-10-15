import { ChatInputCommandInteraction, Message } from 'discord.js';
import { ChatInputCommandBuilder } from '@discordjs/builders';

export interface ICommand {
  name: string;
  description: string;
  aliases?: string[];
  slashBuilder: ChatInputCommandBuilder;
  executeSlash: (interaction: ChatInputCommandInteraction) => Promise<void>;
  executePrefix: (message: Message, args: string[]) => Promise<void>;
}
