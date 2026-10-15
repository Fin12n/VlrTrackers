/**
 * ==============================================================================
 * 🌟 ComponentsV2Builder.ts
 * ==============================================================================
 * Tệp quản trị & xây dựng giao diện Discord Components V2.
 * Anh hai có thể thoải mái mở tệp này ra để tùy biến màu sắc, cách bài trí,
 * thêm bớt Section, TextDisplay, Button hoặc MediaGallery theo ý thích!
 * ==============================================================================
 */

import {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  LinkButtonBuilder,
  PrimaryButtonBuilder,
  SecondaryButtonBuilder,
  SuccessButtonBuilder,
  DangerButtonBuilder,
  ActionRowBuilder
} from '@discordjs/builders';
import { ValorantAccount, PlayerMatchSummary } from '../services/HenrikApiService';
import { MatchAiAnalysis, LuckyBlessing } from '../services/GeminiAiService';
import { botConfig } from '../config/botConfig';

// Re-export toàn bộ các Builder gốc để anh hai tiện import tại bất kỳ đâu
export {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  LinkButtonBuilder,
  PrimaryButtonBuilder,
  SecondaryButtonBuilder,
  SuccessButtonBuilder,
  DangerButtonBuilder,
  ActionRowBuilder
};

export const ComponentsV2Builder = {
  /**
   * Bảng màu chủ đạo (có thể chỉnh mã HEX hoặc số nguyên tại đây)
   */
  colors: {
    valorantRed: botConfig.settings.colors.primary, // 0xFA4454
    slateDark: botConfig.settings.colors.secondary,  // 0x0F1923
    radiantTeal: botConfig.settings.colors.accent,   // 0x00F5D4
    successGreen: botConfig.settings.colors.success, // 0x2ECC71
    warningGold: botConfig.settings.colors.warning,  // 0xF1C40F
    errorRed: botConfig.settings.colors.error        // 0xE74C3C
  },

  /**
   * 1. Giao diện Hồ sơ Tài khoản Valorant (Account Profile)
   */
  buildAccountContainer(account: ValorantAccount, isLinked: boolean = false): ContainerBuilder {
    const container = new ContainerBuilder()
      .setAccentColor(this.colors.valorantRed)
      // Header Tiêu đề chính
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# 🎯 HỒ SƠ ĐẶC VỤ VALORANT ${isLinked ? '*(Đã Liên Kết)*' : ''}`
        )
      )
      // Đường phân cách
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      // Phần nội dung thông tin + Avatar thẻ bài nhỏ
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### 👤 **${account.name}#${account.tag}**`),
            new TextDisplayBuilder().setContent(
              `⭐ **Cấp độ (Level):** \`${account.account_level}\`\n` +
              `🌍 **Khu vực:** \`${account.region.toUpperCase()}\`\n` +
              `🆔 **PUUID:** \`${account.puuid}\`\n` +
              `🕒 **Cập nhật:** ${account.last_update || 'Gần đây'}`
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(
              account.card?.small ||
              'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png'
            )
          )
      );

    // Banner thẻ bài rộng dạng MediaGallery (nếu có)
    if (account.card?.wide) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(account.card.wide)
        )
      );
    }

    // Nút liên kết xem chi tiết trên Tracker.gg
    const trackerUrl = `${botConfig.settings.trackerUrl}/${encodeURIComponent(
      account.name
    )}%23${encodeURIComponent(account.tag)}`;

    const trackerBtn = new LinkButtonBuilder()
      .setLabel('Xem trên Tracker.gg')
      .setURL(trackerUrl);

    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('🔗 **Tra cứu thêm thống kê chi tiết:**')
        )
        .setLinkButtonAccessory(trackerBtn)
    );

    return container;
  },

  /**
   * 2. Giao diện Liên kết Tài khoản thành công (Account Link Success)
   */
  buildLinkSuccessContainer(
    user: { id: string; username: string; avatarUrl?: string },
    account: ValorantAccount
  ): ContainerBuilder {
    const container = new ContainerBuilder()
      .setAccentColor(this.colors.successGreen)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# 🔗 LIÊN KẾT TÀI KHOẢN THÀNH CÔNG!')
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `Đã kết nối tài khoản Discord **@${user.username}** với Riot ID:`
            ),
            new TextDisplayBuilder().setContent(
              `### 🎮 **${account.name}#${account.tag}**\n` +
              `🌍 **Khu vực:** ${account.region.toUpperCase()} • ⭐ **Cấp độ:** ${account.account_level}\n` +
              `🆔 **PUUID:** \`${account.puuid.substring(0, 18)}...\``
            ),
            new TextDisplayBuilder().setContent(
              `💡 **Mẹo:** Từ bây giờ anh hai có thể gõ \`/account\`, \`/analyze-match\`, \`/bless\` mà **không cần nhập tên hay tag** nữa nha!`
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(
              account.card?.small ||
              user.avatarUrl ||
              'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png'
            )
          )
      );

    if (account.card?.wide) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(account.card.wide)
        )
      );
    }

    return container;
  },

  /**
   * 3. Giao diện Hủy liên kết (Unlink Success)
   */
  buildUnlinkSuccessContainer(username: string): ContainerBuilder {
    return new ContainerBuilder()
      .setAccentColor(this.colors.warningGold)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# 🔓 ĐÃ HỦY LIÊN KẾT TÀI KHOẢN')
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Tài khoản Discord **@${username}** đã được gỡ liên kết khỏi hệ thống.\n` +
          `Anh hai có thể dùng lệnh \`/link <name> <tag>\` để liên kết với nick Valorant mới bất kỳ lúc nào!`
        )
      );
  },

  /**
   * 4. Giao diện Đánh giá Trận đấu & Chiến thuật AI (Gemini Match Evaluation)
   */
  buildMatchAnalysisContainer(
    playerName: string,
    match: PlayerMatchSummary,
    ai: MatchAiAnalysis
  ): ContainerBuilder {
    const isWin = match.hasWon;
    const accentColor = isWin ? this.colors.radiantTeal : this.colors.valorantRed;

    const strengthsText = ai.strengths.map((s) => `• ${s}`).join('\n');
    const improvementsText = ai.improvements.map((i) => `• ${i}`).join('\n');

    return new ContainerBuilder()
      .setAccentColor(accentColor)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ⚔️ BÁO CÁO CHIẾN THUẬT: ${match.map.toUpperCase()} [${isWin ? 'THẮNG 🏆' : 'THUA 💔'}]`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      // Thống kê người chơi
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### 🎯 Người chơi: **${playerName}** (Đặc vụ: ${match.agent})`),
            new TextDisplayBuilder().setContent(
              `📊 **K/D/A:** \`${match.stats.kda}\` (K/D: **${match.stats.kdRatio}**)\n` +
              `💥 **Headshot:** **${match.stats.headshotPercentage}%** • 🩸 **ADR:** **${match.stats.damagePerRound}**\n` +
              `🔢 **Tỉ số:** **${match.score.roundsWon} - ${match.score.roundsLost}** (${match.mode})\n` +
              `💰 **Kinh tế TB:** ${match.economy.spentAverage} creds/round`
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(
              `https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png`
            )
          )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      // Đánh giá AI
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🤖 Đánh giá từ HLV AI (Gemini Extended Thinking)`),
        new TextDisplayBuilder().setContent(
          `🏆 **Xếp hạng:** \`[ ${ai.grade} ]\` • Điểm hiệu năng: **${ai.ratingScore}/100**\n` +
          `📢 *"${ai.headline}"*`
        ),
        new TextDisplayBuilder().setContent(`💪 **Điểm sáng:**\n${strengthsText}`),
        new TextDisplayBuilder().setContent(`🔧 **Cần cải thiện:**\n${improvementsText}`),
        new TextDisplayBuilder().setContent(`🌾 **Góc HLV Miền Tây:**\n> *"${ai.coachComment}"*`)
      );
  },

  /**
   * 5. Giao diện Ban câu chúc may mắn (Lucky Blessing)
   */
  buildLuckyBlessingContainer(playerName: string, blessing: LuckyBlessing): ContainerBuilder {
    return new ContainerBuilder()
      .setAccentColor(this.colors.radiantTeal)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# 🍀 LỘC ĐẦU TRẬN - BÙA HÊN LEO RANK')
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### 🌟 Chúc đặc vụ: **${playerName}**`),
            new TextDisplayBuilder().setContent(`🛡️ **Tướng chọn:** \`${blessing.agent}\` • Vibe: **${blessing.vibe}**`),
            new TextDisplayBuilder().setContent(`> 📜 *"${blessing.quote}"*`)
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(
              'https://media.valorant-api.com/buddies/57bdf849-411a-e8d1-ea04-cca3a71b40fe/displayicon.png'
            )
          )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('🔥 *Miền Tây Tếu chúc anh hai bắn viên nào rụng viên đó, chuỗi thắng 10 trận liền tay!*')
      );
  },

  /**
   * 6. Giao diện Báo lỗi Thân thiện (Error Container)
   */
  buildErrorContainer(title: string, message: string, suggestion?: string): ContainerBuilder {
    const container = new ContainerBuilder()
      .setAccentColor(this.colors.errorRed)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ⚠️ ${title.toUpperCase()}`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(message)
      );

    if (suggestion) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`💡 **Gợi ý:** ${suggestion}`)
      );
    }

    return container;
  }
};
