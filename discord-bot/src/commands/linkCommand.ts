import {
  ChatInputCommandInteraction,
  Message,
  MessageFlags
} from 'discord.js';
import { ChatInputCommandBuilder } from '@discordjs/builders';
import { ICommand } from './ICommand';
import { HenrikApiService } from '../services/HenrikApiService';
import { UserLinkRepository } from '../database/UserLinkRepository';
import { CacheRepository } from '../database/CacheRepository';
import { ComponentsV2Builder } from '../builders/ComponentsV2Builder';
import { logger } from '../utils/logger';

export const linkCommand: ICommand = {
  name: 'link',
  description: 'Liên kết tài khoản Valorant (Riot ID) với tài khoản Discord của bạn',
  aliases: ['setacc', 'setprofile', 'bind'],

  slashBuilder: new ChatInputCommandBuilder()
    .setName('link')
    .setDescription('Liên kết tài khoản Riot Valorant với Discord của bạn')
    .addStringOptions((opt: any) =>
      opt
        .setName('name')
        .setDescription('Tên Riot ID (ví dụ: TenZ)')
        .setRequired(true)
    )
    .addStringOptions((opt: any) =>
      opt
        .setName('tag')
        .setDescription('Tagline Riot (không cần dấu #, ví dụ: 000)')
        .setRequired(true)
    ),

  async executeSlash(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const name = interaction.options.getString('name', true).trim();
    const tag = interaction.options.getString('tag', true).trim().replace(/^#/, '');

    try {
      // 1. Verify account exists via HenrikDev API
      const account = await HenrikApiService.getAccount(name, tag, true);

      // 2. Save link to Drizzle Database / Memory
      await UserLinkRepository.linkAccount(
        interaction.user.id,
        account.puuid,
        account.name,
        account.tag,
        account.region
      );

      // Cache account data
      await CacheRepository.setAccount(account);

      const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
      const container = ComponentsV2Builder.buildLinkSuccessContainer(
        {
          id: interaction.user.id,
          username: interaction.user.username,
          avatarUrl
        },
        account
      );

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Link command slash error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Liên kết tài khoản thất bại',
        err.message || 'Không thể xác thực tài khoản Valorant.',
        'Vui lòng kiểm tra lại Tên và Tagline trong game Valorant chính xác nhé!'
      );
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  },

  async executePrefix(message: Message, args: string[]) {
    let name: string | undefined;
    let tag: string | undefined;

    if (args.length >= 2) {
      name = args[0];
      tag = args[1].replace(/^#/, '');
    } else if (args.length === 1 && args[0].includes('#')) {
      const parts = args[0].split('#');
      name = parts[0];
      tag = parts[1];
    } else {
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Sai cú pháp lệnh !link',
        'Cú pháp: `!link <Tên> <Tag>` hoặc `!link Tên#Tag`.\nVí dụ: `!link TenZ 000`',
        'Sau khi liên kết, anh hai có thể dùng các lệnh bot mà không cần gõ lại tên!'
      );
      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
      return;
    }

    try {
      const account = await HenrikApiService.getAccount(name, tag, true);

      await UserLinkRepository.linkAccount(
        message.author.id,
        account.puuid,
        account.name,
        account.tag,
        account.region
      );

      await CacheRepository.setAccount(account);

      const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 256 });
      const container = ComponentsV2Builder.buildLinkSuccessContainer(
        {
          id: message.author.id,
          username: message.author.username,
          avatarUrl
        },
        account
      );

      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Link command prefix error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Liên kết tài khoản thất bại',
        err.message || 'Không thể xác thực tài khoản Valorant.',
        'Kiểm tra lại xem Tên và Tagline có gõ đúng không nhé.'
      );
      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  }
};
