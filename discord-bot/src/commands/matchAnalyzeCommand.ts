import {
  ChatInputCommandInteraction,
  Message,
  MessageFlags
} from 'discord.js';
import { ChatInputCommandBuilder } from '@discordjs/builders';
import { ICommand } from './ICommand';
import { HenrikApiService } from '../services/HenrikApiService';
import { GeminiAiService } from '../services/GeminiAiService';
import { UserLinkRepository } from '../database/UserLinkRepository';
import { CacheRepository } from '../database/CacheRepository';
import { ComponentsV2Builder } from '../builders/ComponentsV2Builder';
import { logger } from '../utils/logger';

export const matchAnalyzeCommand: ICommand = {
  name: 'analyze-match',
  description: 'Đánh giá thông số trận đấu gần nhất và nhận xét chiến thuật từ AI Gemini',
  aliases: ['analyze', 'danhgia', 'review', 'coach', 'match'],

  slashBuilder: new ChatInputCommandBuilder()
    .setName('analyze-match')
    .setDescription('Đánh giá trận đấu gần nhất bằng Gemini Extended Thinking')
    .addStringOptions((opt: any) =>
      opt
        .setName('name')
        .setDescription('Tên Riot ID (bỏ trống nếu đã liên kết nick)')
        .setRequired(false)
    )
    .addStringOptions((opt: any) =>
      opt
        .setName('tag')
        .setDescription('Tagline Riot (không cần dấu #)')
        .setRequired(false)
    ),

  async executeSlash(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const inputName = interaction.options.getString('name')?.trim();
    const inputTag = interaction.options.getString('tag')?.trim();

    let targetName = inputName;
    let targetTag = inputTag;
    let region = 'ap';

    if (!targetName || !targetTag) {
      const linked = await UserLinkRepository.getLinkedAccount(interaction.user.id);
      if (linked) {
        targetName = linked.name;
        targetTag = linked.tag;
        region = linked.region || 'ap';
      } else {
        const errorContainer = ComponentsV2Builder.buildErrorContainer(
          'Thiếu thông tin người chơi',
          'Vui lòng cung cấp Tên và Tag, hoặc dùng lệnh `/link` để liên kết nick trước!',
          'Ví dụ: `/analyze-match name:TenZ tag:000`'
        );
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        });
        return;
      }
    }

    try {
      // 1. Fetch account to ensure correct region
      const account = await HenrikApiService.getAccount(targetName, targetTag);
      region = account.region || region;

      // 2. Fetch recent match summary
      const match = await HenrikApiService.getRecentMatch(region, account.name, account.tag);

      // 3. Check cached analysis
      let aiAnalysis: any = null;
      const cached = await CacheRepository.getMatch(match.matchId);
      if (cached && cached.aiAnalysis) {
        aiAnalysis = cached.aiAnalysis;
      } else {
        // Run Gemini Extended Thinking evaluation
        aiAnalysis = await GeminiAiService.evaluateMatch(account.name, match);
        await CacheRepository.setMatch(
          match.matchId,
          account.puuid,
          match.map,
          match,
          aiAnalysis
        );
      }

      const container = ComponentsV2Builder.buildMatchAnalysisContainer(
        account.name,
        match,
        aiAnalysis
      );

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Analyze match slash error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Đánh giá trận đấu thất bại',
        err.message || 'Không thể lấy dữ liệu trận đấu gần nhất.',
        'Hãy chắc chắn rằng người chơi đã hoàn thành ít nhất 1 trận đấu gần đây.'
      );
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  },

  async executePrefix(message: Message, args: string[]) {
    let targetName: string | undefined;
    let targetTag: string | undefined;
    let region = 'ap';

    if (args.length >= 2) {
      targetName = args[0];
      targetTag = args[1].replace(/^#/, '');
    } else if (args.length === 1 && args[0].includes('#')) {
      const parts = args[0].split('#');
      targetName = parts[0];
      targetTag = parts[1];
    } else {
      const linked = await UserLinkRepository.getLinkedAccount(message.author.id);
      if (linked) {
        targetName = linked.name;
        targetTag = linked.tag;
        region = linked.region || 'ap';
      } else {
        const errorContainer = ComponentsV2Builder.buildErrorContainer(
          'Thiếu thông tin người chơi',
          'Cú pháp: `!analyze <Tên> <Tag>` (Ví dụ: `!analyze TenZ 000`).',
          'Hoặc anh hai dùng `!link <Tên> <Tag>` để liên kết nick, lần sau chỉ cần gõ `!analyze`!'
        );
        await message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        });
        return;
      }
    }

    try {
      const account = await HenrikApiService.getAccount(targetName, targetTag);
      region = account.region || region;

      const match = await HenrikApiService.getRecentMatch(region, account.name, account.tag);

      let aiAnalysis: any = null;
      const cached = await CacheRepository.getMatch(match.matchId);
      if (cached && cached.aiAnalysis) {
        aiAnalysis = cached.aiAnalysis;
      } else {
        aiAnalysis = await GeminiAiService.evaluateMatch(account.name, match);
        await CacheRepository.setMatch(
          match.matchId,
          account.puuid,
          match.map,
          match,
          aiAnalysis
        );
      }

      const container = ComponentsV2Builder.buildMatchAnalysisContainer(
        account.name,
        match,
        aiAnalysis
      );

      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (err: any) {
      logger.error('Analyze match prefix error:', err);
      const errorContainer = ComponentsV2Builder.buildErrorContainer(
        'Đánh giá trận đấu thất bại',
        err.message || 'Không thể lấy dữ liệu trận đấu gần nhất.'
      );
      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }
  }
};
