import {
  ChatInputCommandInteraction,
  Message,
  MessageFlags
} from 'discord.js';
import { ChatInputCommandBuilder } from '@discordjs/builders';
import { ICommand } from './ICommand';
import { GeminiAiService } from '../services/GeminiAiService';
import { UserLinkRepository } from '../database/UserLinkRepository';
import { ComponentsV2Builder } from '../builders/ComponentsV2Builder';
import { logger } from '../utils/logger';

export const luckyBlessingCommand: ICommand = {
  name: 'bless',
  description: 'Xin một câu chúc may mắn / gáy hype từ Miền Tây Tếu trước khi leo rank',
  aliases: ['lucky', 'chuc', 'buff', 'caumay', 'hen'],

  slashBuilder: new ChatInputCommandBuilder()
    .setName('bless')
    .setDescription('Xin bùa may mắn trước khi vào trận đấu rank căng thẳng')
    .addStringOptions((opt: any) =>
      opt
        .setName('agent')
        .setDescription('Tên đặc vụ dự kiến cầm (Jett, Reyna, Omen, Sova...)')
        .setRequired(false)
    )
    .addStringOptions((opt: any) =>
      opt
        .setName('name')
        .setDescription('Tên của bạn (bỏ trống nếu đã liên kết nick)')
        .setRequired(false)
    ),

  async executeSlash(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const inputAgent = interaction.options.getString('agent')?.trim();
    const inputName = interaction.options.getString('name')?.trim();

    let playerName = inputName;

    if (!playerName) {
      const linked = await UserLinkRepository.getLinkedAccount(interaction.user.id);
      if (linked) {
        playerName = `${linked.name}#${linked.tag}`;
      } else {
        playerName = interaction.user.displayName || interaction.user.username;
      }
    }

    try {
      const blessing = await GeminiAiService.getLuckyBlessing(playerName, inputAgent);
      const container = ComponentsV2Builder.buildLuckyBlessingContainer(playerName, blessing);

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Bless command slash error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Xin bùa may mắn thất bại',
        err.message || 'Hôm nay thầy bói bận đi bắt ốc rồi, chúc anh hai vào trận tự tin bắn đỏ lòm nha!'
      );
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  },

  async executePrefix(message: Message, args: string[]) {
    let agent = args.length > 0 ? args.join(' ') : undefined;
    let playerName = message.member?.displayName || message.author.username;

    const linked = await UserLinkRepository.getLinkedAccount(message.author.id);
    if (linked) {
      playerName = `${linked.name}#${linked.tag}`;
    }

    try {
      const blessing = await GeminiAiService.getLuckyBlessing(playerName, agent);
      const container = ComponentsV2Builder.buildLuckyBlessingContainer(playerName, blessing);

      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Bless command prefix error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Xin bùa may mắn thất bại',
        err.message || 'Chúc anh hai vào trận tự tin kê góc chắc tay nha!'
      );
      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  }
};
