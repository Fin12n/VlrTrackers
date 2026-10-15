import { botConfig } from '../config/botConfig';
import { logger } from '../utils/logger';

export interface ValorantAccount {
  name: string;
  tag: string;
  puuid: string;
  region: string;
  account_level: number;
  card: {
    id: string;
    small: string;
    large: string;
    wide: string;
  };
  last_update: string;
  last_update_raw: number;
}

export interface PlayerMatchSummary {
  matchId: string;
  map: string;
  mode: string;
  agent: string;
  hasWon: boolean;
  score: {
    roundsWon: number;
    roundsLost: number;
  };
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    kda: string;
    kdRatio: number;
    score: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
    headshotPercentage: number;
    damageMade: number;
    damagePerRound: number;
  };
  economy: {
    spentAverage: number;
    loadoutAverage: number;
  };
}

export const HenrikApiService = {
  baseUrl: 'https://api.henrikdev.xyz',

  /**
   * Get player account by Riot ID (name + tag)
   */
  async getAccount(name: string, tag: string, force: boolean = false): Promise<ValorantAccount> {
    const encodedName = encodeURIComponent(name);
    const encodedTag = encodeURIComponent(tag);
    const url = `${this.baseUrl}/valorant/v1/account/${encodedName}/${encodedTag}${
      force ? '?force=true' : ''
    }`;

    logger.debug(`[HenrikDev] Fetching account: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: botConfig.henrik.apiKey,
        'User-Agent': 'ValorantCheckersBot/1.0'
      }
    });

    const body = (await res.json()) as any;

    if (!res.ok || body.status !== 200 || !body.data) {
      const errorMsg =
        body.errors?.[0]?.message ||
        body.message ||
        `HenrikDev API error (${res.status})`;

      if (res.status === 404) {
        throw new Error(
          `Không tìm thấy tài khoản Valorant **${name}#${tag}**. Hãy kiểm tra lại tên và tag nhé!`
        );
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `API Key HenrikDev không hợp lệ hoặc hết hạn. Vui lòng kiểm tra lại HENRIK_API_KEY.`
        );
      }
      if (res.status === 429) {
        throw new Error(
          `HenrikDev API đang bị giới hạn lượt gọi (Rate Limit). Vui lòng thử lại sau vài giây!`
        );
      }
      throw new Error(errorMsg);
    }

    return body.data as ValorantAccount;
  },

  /**
   * Get latest match for player and extract summarized performance metrics
   */
  async getRecentMatch(
    region: string,
    name: string,
    tag: string
  ): Promise<PlayerMatchSummary> {
    const encodedName = encodeURIComponent(name);
    const encodedTag = encodeURIComponent(tag);
    const url = `${this.baseUrl}/valorant/v3/matches/${region}/${encodedName}/${encodedTag}?size=1`;

    logger.debug(`[HenrikDev] Fetching recent match: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: botConfig.henrik.apiKey,
        'User-Agent': 'ValorantCheckersBot/1.0'
      }
    });

    const body = (await res.json()) as any;

    if (!res.ok || body.status !== 200 || !Array.isArray(body.data) || body.data.length === 0) {
      throw new Error(
        `Không tìm thấy dữ liệu trận đấu gần nhất của **${name}#${tag}** ở khu vực ${region.toUpperCase()}.`
      );
    }

    const match = body.data[0];
    const metadata = match.metadata || {};
    const allPlayers: any[] = match.players?.all_players || [];

    // Find target player in match
    const targetPlayer = allPlayers.find(
      (p) =>
        p.name?.toLowerCase() === name.toLowerCase() &&
        p.tag?.toLowerCase() === tag.toLowerCase()
    );

    if (!targetPlayer) {
      throw new Error(
        `Không tìm thấy thông số người chơi **${name}#${tag}** trong dữ liệu trận đấu vừa lấy.`
      );
    }

    const team = targetPlayer.team?.toLowerCase() || 'blue';
    const teamData = match.teams?.[team] || {};
    const hasWon = teamData.has_won ?? false;
    const roundsWon = teamData.rounds_won ?? 0;
    const roundsLost = teamData.rounds_lost ?? 0;
    const totalRounds = (roundsWon + roundsLost) || 1;

    const stats = targetPlayer.stats || {};
    const kills = stats.kills || 0;
    const deaths = stats.deaths || 0;
    const assists = stats.assists || 0;
    const score = stats.score || 0;
    const headshots = stats.headshots || 0;
    const bodyshots = stats.bodyshots || 0;
    const legshots = stats.legshots || 0;
    const totalShots = (headshots + bodyshots + legshots) || 1;
    const headshotPercentage = Math.round((headshots / totalShots) * 100);

    const kdRatio = deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : kills;
    const damageMade = targetPlayer.damage_made || 0;
    const damagePerRound = Math.round(damageMade / totalRounds);

    const economy = targetPlayer.economy || {};
    const spentAvg = economy.spent?.average || 0;
    const loadoutAvg = economy.loadout_value?.average || 0;

    return {
      matchId: metadata.matchid || `match_${Date.now()}`,
      map: metadata.map || 'Unknown Map',
      mode: metadata.mode || 'Competitive',
      agent: targetPlayer.character || 'Unknown Agent',
      hasWon,
      score: {
        roundsWon,
        roundsLost
      },
      stats: {
        kills,
        deaths,
        assists,
        kda: `${kills}/${deaths}/${assists}`,
        kdRatio,
        score,
        headshots,
        bodyshots,
        legshots,
        headshotPercentage,
        damageMade,
        damagePerRound
      },
      economy: {
        spentAverage: spentAvg,
        loadoutAverage: loadoutAvg
      }
    };
  }
};
