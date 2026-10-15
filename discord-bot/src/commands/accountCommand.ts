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

export const accountCommand: ICommand = {
  name: 'account',
  description: 'Tra cứu thông tin tài khoản Valorant qua HenrikDev API',
  aliases: ['acc', 'check', 'profile', 'val'],

  slashBuilder: new ChatInputCommandBuilder()
    .setName('account')
    .setDescription('Tra cứu hồ sơ tài khoản Valorant (Hỗ trợ Components V2)')
    .addStringOptions((opt: any) =>
      opt
        .setName('name')
        .setDescription('Tên Riot ID (Bỏ trống nếu đã liên kết nick với bot)')
        .setRequired(false)
    )
    .addStringOptions((opt: any) =>
      opt
        .setName('tag')
        .setDescription('Tagline Riot (không cần dấu #)')
        .setRequired(false)
    )
    .addBooleanOptions((opt: any) =>
      opt
        .setName('force')
        .setDescription('Làm mới dữ liệu từ Riot API (bỏ qua cache)')
        .setRequired(false)
    ),

  async executeSlash(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const inputName = interaction.options.getString('name')?.trim();
    const inputTag = interaction.options.getString('tag')?.trim();
    const force = interaction.options.getBoolean('force') || false;

    let targetName = inputName;
    let targetTag = inputTag;
    let isLinked = false;

    // Auto-detect linked account if not provided
    if (!targetName || !targetTag) {
      const linked = await UserLinkRepository.getLinkedAccount(interaction.user.id);
      if (linked) {
        targetName = linked.name;
        targetTag = linked.tag;
        isLinked = true;
      } else {
        const errorContainer = ComponentsV2Builder.buildErrorContainer(
          'Chưa nhập thông tin tài khoản',
          'Anh hai chưa nhập Tên và Tagline, và cũng chưa liên kết nick với bot nè!',
          'Hãy gõ `/account name:TenZ tag:000` hoặc dùng lệnh `/link name:TenZ tag:000` để liên kết nick vĩnh viễn nha!'
        );
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        });
        return;
      }
    }

    try {
      let accountData: any = null;

      // Check cache if not forcing refresh
      if (!force) {
        accountData = await CacheRepository.getAccount(targetName, targetTag);
      }

      if (!accountData) {
        accountData = await HenrikApiService.getAccount(targetName, targetTag, force);
        await CacheRepository.setAccount(accountData);
      }

      const container = ComponentsV2Builder.buildAccountContainer(accountData, isLinked);

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Account command slash error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Tra cứu thất bại',
        err.message || 'Đã có lỗi xảy ra khi tra cứu tài khoản Valorant.',
        'Kiểm tra lại xem Riot ID và Tagline có chính xác không nhé.'
      );
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  },

  async executePrefix(message: Message, args: string[]) {
    let force = false;
    const cleanArgs = args.filter((a) => {
      if (a.toLowerCase() === '--force' || a.toLowerCase() === '-f') {
        force = true;
        return false;
      }
      return true;
    });

    let targetName: string | undefined;
    let targetTag: string | undefined;
    let isLinked = false;

    if (cleanArgs.length >= 2) {
      targetName = cleanArgs[0];
      targetTag = cleanArgs[1].replace(/^#/, '');
    } else if (cleanArgs.length === 1 && cleanArgs[0].includes('#')) {
      const parts = cleanArgs[0].split('#');
      targetName = parts[0];
      targetTag = parts[1];
    } else {
      // Check linked account
      const linked = await UserLinkRepository.getLinkedAccount(message.author.id);
      if (linked) {
        targetName = linked.name;
        targetTag = linked.tag;
        isLinked = true;
      } else {
        const errorContainer = ComponentsV2Builder.buildErrorContainer(
          'Thiếu thông tin tài khoản',
          `Cú pháp: \`!account <Tên> <Tag>\` (Ví dụ: \`!account TenZ 000\`).`,
          'Hoặc anh hai dùng `!link TenZ 000` để liên kết nick, lần sau chỉ cần gõ `!account` là xong!'
        );
        await message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        });
        return;
      }
    }

    try {
      let accountData: any = null;

      if (!force) {
        accountData = await CacheRepository.getAccount(targetName, targetTag);
      }

      if (!accountData) {
        accountData = await HenrikApiService.getAccount(targetName, targetTag, force);
        await CacheRepository.setAccount(accountData);
      }

      const container = ComponentsV2Builder.buildAccountContainer(accountData, isLinked);

      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Account command prefix error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Tra cứu thất bại',
        err.message || 'Đã có lỗi xảy ra khi tra cứu tài khoản Valorant.',
        'Kiểm tra lại xem Riot ID và Tagline có chính xác không nhé.'
      );
      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  }
};
