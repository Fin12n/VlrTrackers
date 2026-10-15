import { ComponentsV2Builder } from '../src/builders/ComponentsV2Builder';
import { ValorantAccount, PlayerMatchSummary } from '../src/services/HenrikApiService';
import { MatchAiAnalysis, LuckyBlessing } from '../src/services/GeminiAiService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runUiTests() {
  console.log('🧪 Starting Discord Components V2 UI Tests...\n');

  // Sample Account Data
  const sampleAccount: ValorantAccount = {
    name: 'TenZ',
    tag: '000',
    puuid: '12345678-abcd-ef01-2345-6789abcdef01',
    region: 'ap',
    account_level: 250,
    card: {
      id: 'card-1',
      small: 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png',
      large: 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/largeart.png',
      wide: 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png'
    },
    last_update: '2026-10-15 03:00:00',
    last_update_raw: 1760497200
  };

  // 1. Test buildAccountContainer
  const accountContainer = ComponentsV2Builder.buildAccountContainer(sampleAccount, true);
  const accountJson = accountContainer.toJSON() as any;

  assert(accountJson.type === 17, 'Account Container has ComponentType 17 (Container)');
  assert(accountJson.accent_color !== undefined, 'Account Container has accent_color');
  assert(Array.isArray(accountJson.components), 'Account Container has components array');
  assert(accountJson.components.some((c: any) => c.type === 10), 'Account Container contains TextDisplay (10)');
  assert(accountJson.components.some((c: any) => c.type === 14), 'Account Container contains Separator (14)');
  assert(accountJson.components.some((c: any) => c.type === 9), 'Account Container contains Section (9)');
  assert(accountJson.components.some((c: any) => c.type === 12), 'Account Container contains MediaGallery (12)');

  // 2. Test buildLinkSuccessContainer
  const linkContainer = ComponentsV2Builder.buildLinkSuccessContainer(
    { id: '123456789', username: 'pro_gamer' },
    sampleAccount
  );
  const linkJson = linkContainer.toJSON() as any;
  assert(linkJson.type === 17, 'Link Success Container has ComponentType 17');
  assert(Array.isArray(linkJson.components), 'Link Success Container has components');

  // 3. Test buildUnlinkSuccessContainer
  const unlinkContainer = ComponentsV2Builder.buildUnlinkSuccessContainer('pro_gamer');
  const unlinkJson = unlinkContainer.toJSON() as any;
  assert(unlinkJson.type === 17, 'Unlink Container has ComponentType 17');

  // 4. Test buildMatchAnalysisContainer
  const sampleMatch: PlayerMatchSummary = {
    matchId: 'match-123',
    map: 'Ascent',
    mode: 'Competitive',
    agent: 'Jett',
    hasWon: true,
    score: { roundsWon: 13, roundsLost: 8 },
    stats: {
      kills: 24,
      deaths: 12,
      assists: 5,
      kda: '24/12/5',
      kdRatio: 2.0,
      score: 340,
      headshots: 14,
      bodyshots: 18,
      legshots: 2,
      headshotPercentage: 41,
      damageMade: 3600,
      damagePerRound: 171
    },
    economy: { spentAverage: 3900, loadoutAverage: 4500 }
  };

  const sampleAi: MatchAiAnalysis = {
    ratingScore: 92,
    grade: 'S',
    headline: 'Jett gánh team khét lẹt!',
    strengths: ['Entry site quá mượt', 'Tỉ lệ headshot 41% cực gắt'],
    improvements: ['Chú ý smoke che góc kê của Operator địch'],
    coachComment: 'Bắn như này thì ai chơi lại anh hai nữa!'
  };

  const matchContainer = ComponentsV2Builder.buildMatchAnalysisContainer('TenZ', sampleMatch, sampleAi);
  const matchJson = matchContainer.toJSON() as any;
  assert(matchJson.type === 17, 'Match Analysis Container has ComponentType 17');

  // 5. Test buildLuckyBlessingContainer
  const sampleBlessing: LuckyBlessing = {
    quote: 'Bước vô trận là sấy đỏ lòm như tôm luộc!',
    agent: 'Jett',
    vibe: 'Chiến thần bất tử'
  };
  const blessContainer = ComponentsV2Builder.buildLuckyBlessingContainer('TenZ', sampleBlessing);
  const blessJson = blessContainer.toJSON() as any;
  assert(blessJson.type === 17, 'Lucky Blessing Container has ComponentType 17');

  // 6. Test buildErrorContainer
  const errorContainer = ComponentsV2Builder.buildErrorContainer(
    'Lỗi kết nối',
    'Không thể kết nối đến máy chủ Riot.',
    'Vui lòng thử lại sau!'
  );
  const errorJson = errorContainer.toJSON() as any;
  assert(errorJson.type === 17, 'Error Container has ComponentType 17');

  console.log('\n🎉 ALL COMPONENTS V2 UI TESTS PASSED SUCCESSFULLY! 🚀\n');
}

runUiTests();
