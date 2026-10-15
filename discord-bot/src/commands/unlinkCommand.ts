import {
  ChatInputCommandInteraction,
  Message,
  MessageFlags
} from 'discord.js';
import { ChatInputCommandBuilder } from '@discordjs/builders';
import { ICommand } from './ICommand';
import { UserLinkRepository } from '../database/UserLinkRepository';
import { ComponentsV2Builder } from '../builders/ComponentsV2Builder';
import { logger } from '../utils/logger';

export const unlinkCommand: ICommand = {
  name: 'unlink',
  description: 'Hủy liên kết tài khoản Valorant khỏi tài khoản Discord của bạn',
  aliases: ['removeacc', 'resetlink'],

  slashBuilder: new ChatInputCommandBuilder()
    .setName('unlink')
    .setDescription('Hủy liên kết tài khoản Valorant khỏi Discord của bạn'),

  async executeSlash(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const removed = await UserLinkRepository.unlinkAccount(interaction.user.id);
      if (!removed) {
        const errorContainer = ComponentsV2Builder.buildErrorContainer(
          'Chưa liên kết',
          'Tài khoản Discord của anh hai hiện tại chưa liên kết với bất kỳ nick Valorant nào!',
          'Anh hai có thể dùng lệnh `/link <name> <tag>` để liên kết tài khoản.'
        );
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        });
        return;
      }

      const container = ComponentsV2Builder.buildUnlinkSuccessContainer(interaction.user.username);
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Unlink command slash error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Lỗi hủy liên kết',
        err.message || 'Không thể hủy liên kết tài khoản.'
      );
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  },

  async executePrefix(message: Message) {
    try {
      const removed = await UserLinkRepository.unlinkAccount(message.author.id);
      if (!removed) {
        const errorContainer = ComponentsV2Builder.buildErrorContainer(
          'Chưa liên kết',
          'Tài khoản Discord của anh hai chưa liên kết với nick Valorant nào!',
          'Dùng lệnh `!link <name> <tag>` để liên kết nhé.'
        );
        await message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        });
        return;
      }

      const container = ComponentsV2Builder.buildUnlinkSuccessContainer(message.author.username);
      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Unlink command prefix error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Lỗi hủy liên kết',
        err.message || 'Không thể hủy liên kết tài khoản.'
      );
      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  }
};
