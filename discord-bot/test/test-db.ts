import { UserLinkRepository } from '../src/database/UserLinkRepository';
import { CacheRepository } from '../src/database/CacheRepository';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runDbTests() {
  console.log('🧪 Starting Database & Cache Tests (with in-memory fallback verification)...\n');

  const testUserId = 'test-discord-user-123';
  const testPuuid = 'puuid-test-valorant-456';

  // 1. Test User Linking
  console.log('--- Testing UserLinkRepository ---');
  await UserLinkRepository.linkAccount(testUserId, testPuuid, 'TenZ', '000', 'ap');

  const linked = await UserLinkRepository.getLinkedAccount(testUserId);
  assert(linked !== null, 'User link was successfully retrieved');
  assert(linked?.name === 'TenZ', 'Linked account name matches "TenZ"');
  assert(linked?.tag === '000', 'Linked account tag matches "000"');
  assert(linked?.puuid === testPuuid, 'Linked account PUUID matches');

  // 2. Test Unlinking
  const unlinked = await UserLinkRepository.unlinkAccount(testUserId);
  assert(unlinked === true, 'User was successfully unlinked');
  const postUnlink = await UserLinkRepository.getLinkedAccount(testUserId);
  assert(postUnlink === null, 'After unlinking, account returns null');

  // 3. Test CacheRepository for Account
  console.log('\n--- Testing CacheRepository ---');
  const sampleAccount = {
    name: 'yay',
    tag: 'ELDIABLO',
    puuid: 'puuid-yay-789',
    region: 'na',
    account_level: 300,
    card: { small: 'url1', large: 'url2', wide: 'url3' }
  };

  await CacheRepository.setAccount(sampleAccount, 5); // 5 seconds TTL
  const cached = await CacheRepository.getAccount('yay', 'ELDIABLO');
  assert(cached !== null, 'Account cache was retrieved successfully');
  assert(cached?.name === 'yay', 'Cached account name matches "yay"');
  assert(cached?.account_level === 300, 'Cached account level matches 300');

  // 4. Test CacheRepository for Match
  const sampleMatch = { kills: 30, deaths: 10 };
  const sampleAi = { score: 98, grade: 'S+' };
  await CacheRepository.setMatch('match-999', 'puuid-yay-789', 'Haven', sampleMatch, sampleAi, 5);

  const cachedMatch = await CacheRepository.getMatch('match-999');
  assert(cachedMatch !== null, 'Match cache was retrieved successfully');
  assert(cachedMatch?.playerStats?.kills === 30, 'Cached match kills matches 30');
  assert(cachedMatch?.aiAnalysis?.grade === 'S+', 'Cached AI analysis grade matches S+');

  console.log('\n🎉 ALL DATABASE & CACHE TESTS PASSED SUCCESSFULLY! 🚀\n');
}

runDbTests();
