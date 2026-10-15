import { GoogleGenAI } from '@google/genai';
import { botConfig } from '../config/botConfig';
import { PlayerMatchSummary } from './HenrikApiService';
import { logger } from '../utils/logger';

export interface MatchAiAnalysis {
  ratingScore: number; // 0 - 100
  grade: string; // S+, S, A, B, C, D
  headline: string;
  strengths: string[];
  improvements: string[];
  coachComment: string;
}

export interface LuckyBlessing {
  quote: string;
  agent: string;
  vibe: string;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && botConfig.gemini.apiKey) {
    aiClient = new GoogleGenAI({ apiKey: botConfig.gemini.apiKey });
  }
  return aiClient;
}

export const GeminiAiService = {
  /**
   * Evaluate match performance with Gemini Extended Thinking
   */
  async evaluateMatch(
    playerName: string,
    match: PlayerMatchSummary
  ): Promise<MatchAiAnalysis> {
    const client = getAiClient();

    if (!client) {
      logger.info('Gemini API key missing, generating rule-based match analysis.');
      return this.fallbackMatchEvaluation(playerName, match);
    }

    try {
      const prompt = `
Bạn là Huấn luyện viên Valorant chuyên nghiệp mang phong cách "Miền Tây Tếu" (hài hước, chân chất, hào sảng nhưng cực kỳ sắc bén và am hiểu meta Radiant).
Hãy phân tích thông số trận đấu sau của người chơi "${playerName}" và đưa ra đánh giá:

Thông tin trận đấu:
- Map: ${match.map} (${match.mode})
- Agent: ${match.agent}
- Kết quả: ${match.hasWon ? 'CHIẾN THẮNG 🏆' : 'THẤT BẠI 💔'} (${match.score.roundsWon} - ${match.score.roundsLost})
- KDA: ${match.stats.kda} (K/D: ${match.stats.kdRatio})
- Combat Score: ${match.stats.score}
- Tỉ lệ Headshot: ${match.stats.headshotPercentage}% (${match.stats.headshots} head, ${match.stats.bodyshots} body, ${match.stats.legshots} leg)
- Sát thương trung bình/round (ADR): ${match.stats.damagePerRound}
- Kinh tế tiêu hao TB: ${match.economy.spentAverage} credits / round

Yêu cầu đầu ra: Hãy trả về DUY NHẤT một JSON hợp lệ (không kèm markdown \`\`\`json) với cấu trúc sau:
{
  "ratingScore": <số nguyên từ 0 đến 100>,
  "grade": "<S+, S, A, B, C hoặc D>",
  "headline": "<tiêu đề ngắn gọn giật tít, tếu táo>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "improvements": ["<điểm cần cải thiện 1>", "<điểm cần cải thiện 2>"],
  "coachComment": "<lời nhận xét chân chất, dí dỏm bằng giọng Miền Tây nhưng chiến thuật cực chuẩn>"
}
`;

      const response = await client.models.generateContent({
        model: botConfig.gemini.model,
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: botConfig.gemini.thinkingBudget
          }
        }
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        ratingScore: Number(parsed.ratingScore) || 75,
        grade: String(parsed.grade) || 'B',
        headline: String(parsed.headline) || 'Trận đấu đầy cảm xúc!',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Cố gắng bám đuổi tỷ số'],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Chỉnh lại tâm súng kê góc'],
        coachComment: String(parsed.coachComment) || 'Cứ tự tin bắn tiếp đi anh hai ơi!'
      };
    } catch (err) {
      logger.error('Gemini Extended Thinking match evaluation failed, falling back:', err);
      return this.fallbackMatchEvaluation(playerName, match);
    }
  },

  /**
   * Generate lucky blessing / hype quote before queuing
   */
  async getLuckyBlessing(playerName: string, preferredAgent?: string): Promise<LuckyBlessing> {
    const agent = preferredAgent || 'Radiant Champion';
    const client = getAiClient();

    if (!client) {
      return this.fallbackLuckyBlessing(playerName, agent);
    }

    try {
      const prompt = `
Bạn là "Miền Tây Tếu" - linh vật đem lại may mắn cho game thủ Valorant.
Người chơi "${playerName}" chuẩn bị vào trận đấu rank căng thẳng với đặc vụ "${agent}".
Hãy sáng tạo 1 câu chúc may mắn / câu gáy khích lệ tinh thần cực kỳ độc lạ, hào sảng, pha chút chất miền Tây sông nước (ví dụ: bốc khói mờ ảo như sương sớm Cần Thơ, sấy đỏ lòm như tôm luộc, kê góc cứng như cây đước Cà Mau).

Yêu cầu đầu ra: Trả về DUY NHẤT một chuỗi JSON (không kèm markdown):
{
  "quote": "<câu chúc / gáy hype khoảng 2-3 câu>",
  "vibe": "<tinh thần: Bất tử, Bắn đâu trúng đó, Đỏ lòm, v.v.>"
}
`;

      const response = await client.models.generateContent({
        model: botConfig.gemini.model,
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 1024
          }
        }
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        quote: parsed.quote || 'Vào trận là kê góc cứng ngắc, đạn bay tới đâu địch nằm tới đó nha anh hai!',
        agent,
        vibe: parsed.vibe || 'Chiến thần bất tử'
      };
    } catch (err) {
      logger.error('Gemini Extended Thinking blessing failed, falling back:', err);
      return this.fallbackLuckyBlessing(playerName, agent);
    }
  },

  /**
   * Fallback rule-based match evaluation
   */
  fallbackMatchEvaluation(playerName: string, match: PlayerMatchSummary): MatchAiAnalysis {
    const kd = match.stats.kdRatio;
    const hs = match.stats.headshotPercentage;
    let score = 50;
    let grade = 'C';

    if (match.hasWon) score += 20;
    score += Math.min(20, Math.round(kd * 10));
    score += Math.min(10, Math.round(hs / 5));
    score = Math.max(10, Math.min(99, score));

    if (score >= 90) grade = 'S+';
    else if (score >= 80) grade = 'S';
    else if (score >= 70) grade = 'A';
    else if (score >= 55) grade = 'B';
    else if (score >= 40) grade = 'C';
    else grade = 'D';

    return {
      ratingScore: score,
      grade,
      headline: match.hasWon ? 'Chiến thắng oanh liệt!' : 'Vấp ngã là mẹ thành công!',
      strengths: [
        `Tỉ lệ Headshot đạt ${hs}% với súng chính`,
        `Đạt K/D ${kd} trên bản đồ ${match.map}`
      ],
      improvements: [
        kd < 1.0 ? 'Hạn chế dry-peek khi chưa có đồng đội cover' : 'Tối ưu hóa quản lý tiền econ sau round thắng',
        'Kê góc cẩn thận tránh bị flash bất ngờ'
      ],
      coachComment: `Trận này cầm ${match.agent} bắn ${match.hasWon ? 'quá đã tay' : 'hơi căng thẳng xíu'} nè anh hai! Tĩnh tâm làm ly cà phê sữa đá rồi vào gỡ lại trận sau là lên rank ầm ầm!`
    };
  },

  /**
   * Fallback lucky blessings
   */
  fallbackLuckyBlessing(playerName: string, agent: string): LuckyBlessing {
    const blessings = [
      `Bước vô bombsite là tâm súng dính chặt đầu địch như keo dán sắt, sấy viên nào đỏ viên đó nghe anh hai ${playerName}!`,
      `Trận này anh hai cầm ${agent} múa dẻo như cá kèo bơi ngược nước, clutch 1v4 nhẹ tựa lông hồng!`,
      `Trời ban cho anh hai góc kê thần thánh, địch vừa ló mặt là lên bảng đếm số liền, không nói nhiều!`,
      `Chúc anh hai súng chắc tay, mạng thông mượt mà không delay, bắn tới đâu ace tới đó như sấm rền miền Tây!`
    ];
    const quote = blessings[Math.floor(Math.random() * blessings.length)];
    return {
      quote,
      agent,
      vibe: 'Đỏ lòm toàn tập'
    };
  }
};
