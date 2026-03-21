/**
 * match.js — Match Details Page
 * URL params:
 *   matchid  : Henrik Dev match ID  (required)
 *   mipuuid  : My player PUUID      (optional – highlights "YOU" row)
 *
 * To link here from result.js / getMatchHTML(), append to each match-row:
 *   onclick="location.href='./match.html?matchid=${meta.matchid}&mipuuid=PUUID'"
 * Replace PUUID with the puuid obtained from checkedAccountFetch().
 */

import { API_KEY } from './config.js';

/* ── URL PARAMS ── */
const params   = new URLSearchParams(window.location.search);
const REGION = params.get('region') || '';
const MATCH_ID = params.get('matchid') || '';
const MY_PUUID = params.get('mipuuid') || '';

/* ── DOM REFS ── */
const loadEl    = document.getElementById('md-loading');
const errEl     = document.getElementById('md-error');
const contentEl = document.getElementById('md-content');

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    const idDisplay = document.getElementById('md-load-id');
    if (MATCH_ID && idDisplay) {
        idDisplay.textContent = MATCH_ID.length > 32
            ? MATCH_ID.slice(0, 32) + '…'
            : MATCH_ID;
    }

    if (!MATCH_ID) {
        showError('Missing Match ID', 'Provide a "matchid" query parameter in the URL.\nExample: match.html?matchid=YOUR_ID&mipuuid=YOUR_PUUID');
        return;
    }

    try {
        const data = await fetchMatch(MATCH_ID);
        await renderMatch(data);
    } catch (err) {
        console.error('[match.js]', err);
        showError('Failed to Load Match', err.message || 'Unknown error. Check the console for details.');
    }
});


/* ══════════════════════════════════════
   API FETCH
   ══════════════════════════════════════ */
async function fetchMatch(id) {
    const headers = API_KEY && API_KEY !== 'YOUR_HENRIKDEV_API_KEY'
        ? { Authorization: API_KEY }
        : {};

    const res = await fetch(
        `https://api.henrikdev.xyz/valorant/v4/match/${encodeURIComponent(REGION)}/${encodeURIComponent(id)}`,
        { headers }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

    const json = await res.json();
    if (json.status !== 200) {
        throw new Error(json.errors?.[0]?.message || `API status ${json.status}`);
    }

    return json.data;
}


/* ══════════════════════════════════════
   MAIN RENDER
   ══════════════════════════════════════ */
async function renderMatch(data) {
    /* ── Normalise data ── */
    const meta    = data.metadata || {};
    // v4: players is a flat array directly
    const players = Array.isArray(data.players) ? data.players : [];
    // v4: teams is an array [{team_id, won, rounds:{won,lost}}]
    const teamsArr = Array.isArray(data.teams) ? data.teams : [];
    const rounds   = Array.isArray(data.rounds) ? data.rounds : [];
    const kills    = Array.isArray(data.kills)  ? data.kills  : [];

    // Normalise teams array → lookup by team_id
    const findTeam = id => teamsArr.find(t => t.team_id?.toLowerCase() === id) || {};
    const blueTeam = findTeam('blue');
    const redTeam  = findTeam('red');
    const blueWon  = !!(blueTeam.won ?? blueTeam.has_won);
    const redWon   = !!(redTeam.won  ?? redTeam.has_won);
    const blueRW   = blueTeam.rounds?.won ?? blueTeam.rounds_won ?? 0;
    const redRW    = redTeam.rounds?.won  ?? redTeam.rounds_won  ?? 0;
    const totalRounds = blueRW + redRW || 1;

    // Me — v4: team_id field
    const me       = players.find(p => p.puuid === MY_PUUID) || players[0] || null;
    const myTeamId = (me?.team_id || me?.team || 'Blue').toLowerCase();
    const myWon    = myTeamId === 'blue' ? blueWon : redWon;
    const result   = myWon ? 'win' : 'loss';

    // Map — v4: map is object {id, name}
    const mapName    = meta.map?.name || meta.map || 'Unknown Map';
    const mapUUID    = meta.map?.id   || null;
    // v4: game_length_in_ms
    const durationMs = meta.game_length_in_ms || meta.game_length || 0;
    // v4: queue is object {id, name}
    const mode       = meta.queue?.name || meta.mode || 'Unknown';
    // v4: started_at ISO string
    const startedAt  = meta.started_at
        ? meta.started_at
        : meta.game_start ? new Date(meta.game_start * 1000).toISOString() : null;
    const region     = meta.region?.toUpperCase() || '';

    document.title = `VALORANT — ${mapName} · ${result.toUpperCase()}`;

    /* ── HERO ── */
    renderHero({
        result, blueRW, redRW, mapName, mapUUID, mode,
        durationMs, startedAt, region, me, myTeamId
    });

    /* ── MY PERFORMANCE ── */
    if (me) {
        renderMyPerf(me, rounds, kills, totalRounds);
    } else {
        document.getElementById('md-perf-section').style.display = 'none';
    }

    /* ── SCOREBOARD ── */
    renderScoreboard(players, blueTeam, redTeam, blueWon, redWon, rounds, totalRounds);

    /* ── REVEAL ── */
    loadEl.style.display  = 'none';
    contentEl.style.display = 'block';
}


/* ══════════════════════════════════════
   HERO
   ══════════════════════════════════════ */
function renderHero({ result, blueRW, redRW, mapName, mapUUID, mode,
                       durationMs, startedAt, region, me, myTeamId }) {
    const hero = document.getElementById('md-hero');
    hero.classList.add(result);

    // Map background (async, non-blocking)
    applyMapBackground(mapName, mapUUID);

    // Agent silhouette — v4: no assets field, build URL from agent.id
    if (me?.agent?.id) {
        document.getElementById('md-hero-agent').style.backgroundImage =
            `url(https://media.valorant-api.com/agents/${me.agent.id}/fullportrait.png)`;
    }

    // Result badge
    const badge = document.getElementById('md-result-badge');
    badge.textContent = result === 'win' ? 'VICTORY' : 'DEFEAT';
    badge.className = `md-result-badge ${result}`;

    // Score — show MY rounds on left, opponent on right
    const myRW  = myTeamId === 'blue' ? blueRW : redRW;
    const oppRW = myTeamId === 'blue' ? redRW  : blueRW;
    const scoreL = document.getElementById('md-score-mine');
    const scoreR = document.getElementById('md-score-opp');
    scoreL.textContent = myRW;
    scoreR.textContent = oppRW;
    // Colour: winner bright, loser dim-red
    if (result === 'win') {
        scoreL.style.color = '#ffffff';
        scoreR.style.color = 'rgba(255,255,255,0.3)';
    } else {
        scoreL.style.color = 'rgba(255,70,85,0.75)';
        scoreR.style.color = '#ffffff';
    }

    setText('md-hero-map',  mapName.toUpperCase());
    setText('md-mode-tag',  mode.toUpperCase());
    setHTML('md-dur',   `<i class="fa-regular fa-clock"></i> ${fmtDuration(durationMs)}`);
    setHTML('md-date',  `<i class="fa-regular fa-calendar"></i> ${fmtDate(startedAt)}`);
    setText('md-region', region || '');
}


/* ══════════════════════════════════════
   MY PERFORMANCE
   ══════════════════════════════════════ */
function renderMyPerf(me, rounds, kills, totalRounds) {
    const stats    = me.stats   || {};
    const ability  = me.ability_casts || {};
    const economy  = me.economy || {};

    const hs    = stats.headshots || 0;
    const bs    = stats.bodyshots || 0;
    const ls    = stats.legshots  || 0;
    const shots = hs + bs + ls;
    const hsPct = shots > 0 ? Math.round(hs / shots * 100) : 0;

    const acs = Math.round((stats.score || 0) / totalRounds);
    // v4: stats.damage is object {dealt, received}; fallback to flat number
    const rawDmg  = typeof stats.damage === 'object'
        ? (stats.damage?.dealt ?? 0)
        : (stats.damage ?? 0);
    const dmg = computeDmg(rounds, me.puuid) || rawDmg || 0;
    const adr = Math.round(dmg / totalRounds);

    const kills_n   = stats.kills   || 0;
    const deaths_n  = stats.deaths  || 0;
    const assists_n = stats.assists || 0;
    const kd        = deaths_n > 0
        ? (kills_n / deaths_n).toFixed(2)
        : kills_n.toFixed(2);

    const fb  = computeFirstBloods(kills, me.puuid);
    // v4: ability_casts uses "ultimate" key
    const ult = ability.ultimate ?? ability.ultimate_casts ?? ability.x_cast ?? 0;
    const avgSpend = economy.spent?.average || 0;

    // Agent icon & BG art — v4: no assets field, build URLs from agent.id
    const agentIconEl = document.getElementById('md-perf-agent-icon');
    if (me.agent?.id) {
        agentIconEl.src = `https://media.valorant-api.com/agents/${me.agent.id}/displayicon.png`;
        agentIconEl.alt = me.agent.name || 'Agent';
        document.getElementById('md-perf-art').style.backgroundImage =
            `url(https://media.valorant-api.com/agents/${me.agent.id}/fullportrait.png)`;
    } else if (me.assets?.agent?.small) {
        // v3 fallback
        agentIconEl.src = me.assets.agent.small;
        agentIconEl.alt = me.character || 'Agent';
        if (me.assets.agent.full) {
            document.getElementById('md-perf-art').style.backgroundImage =
                `url(${me.assets.agent.full})`;
        }
    } else {
        agentIconEl.style.display = 'none';
    }

    // v4: agent name in me.agent.name
    setText('md-perf-agent-name', (me.agent?.name || me.character || '').toUpperCase());

    // Name & tag
    setHTML('md-perf-name',
        `${escHtml(me.name || '?')}<span class="md-tag">#${escHtml(me.tag || '?')}</span>`
    );

    // Rank — v4: tier: {id, name}  |  v3: currenttier + currenttier_patched
    const tierId   = me.tier?.id   ?? me.currenttier;
    const tierName = me.tier?.name ?? me.currenttier_patched;
    if (tierId !== undefined && tierId !== null) {
        const rIcon = document.getElementById('md-perf-rank-icon');
        rIcon.src = rankIconURL(tierId);
        rIcon.alt = tierName || '';
        setText('md-perf-rank-name', tierName || 'Unrated');
    } else {
        document.getElementById('md-perf-rank').style.display = 'none';
    }

    // Animate KDA numbers
    animCount(document.getElementById('md-k'), 0, kills_n,   900);
    animCount(document.getElementById('md-d'), 0, deaths_n,  900);
    animCount(document.getElementById('md-a'), 0, assists_n, 900);

    // Stats grid — animate after small delay
    setTimeout(() => {
        animCount(document.getElementById('md-acs'), 0, acs,    1100);
        animCount(document.getElementById('md-adr'), 0, adr,    1100);
        animStr  (document.getElementById('md-hs'),  0, hsPct,  1100, '%');
        setText  ('md-kd', kd);
        animCount(document.getElementById('md-dmg'), 0, dmg,    1200);
        setText  ('md-fb',  fb);
        setText  ('md-ult', ult);
        animCount(document.getElementById('md-econ'), 0, avgSpend, 1100);
    }, 200);
}


/* ══════════════════════════════════════
   SCOREBOARD
   ══════════════════════════════════════ */
function renderScoreboard(players, blueTeam, redTeam, blueWon, redWon, rounds, totalRounds) {
    // v4: team_id field  |  v3: team field
    const blue  = players.filter(p => (p.team_id || p.team)?.toLowerCase() === 'blue');
    const red   = players.filter(p => (p.team_id || p.team)?.toLowerCase() === 'red');
    const other = players.filter(p => !['blue','red'].includes((p.team_id || p.team)?.toLowerCase() || ''));

    const byACS = arr => [...arr].sort((a, b) =>
        (b.stats?.score || 0) - (a.stats?.score || 0)
    );

    let html = '';

    if (blue.length > 0 || red.length > 0) {
        // Standard 5v5
        if (blue.length > 0) {
            html += buildTeamBlock(byACS(blue), blueTeam, blueWon, 'blue-side', rounds, totalRounds);
        }
        if (red.length > 0) {
            html += buildTeamBlock(byACS(red), redTeam, redWon, 'red-side', rounds, totalRounds);
        }
    } else if (other.length > 0) {
        // Free-for-all (Deathmatch etc.) — single table
        html = buildFreeForAllBlock(byACS(other), rounds, totalRounds);
    }

    document.getElementById('md-scoreboard').innerHTML = html;
}

function buildTeamBlock(players, teamData, won, colorClass, rounds, totalRounds) {
    // v4: rounds.won  |  v3: rounds_won
    const rw    = teamData?.rounds?.won ?? teamData?.rounds_won ?? '?';
    const label = colorClass === 'blue-side' ? 'Blue Side' : 'Red Side';
    const resultClass = won ? 'won' : 'lost';
    const resultText  = won ? 'WON'  : 'LOST';

    const rows = players.map(p => buildPlayerRow(p, rounds, totalRounds)).join('');

    return `
<div class="md-team-block">
    <div class="md-team-header ${colorClass}">
        <span class="md-team-side-label">${label}</span>
        <span class="md-team-rounds-display">${rw}</span>
        <span class="md-team-result-badge ${resultClass}">${resultText}</span>
    </div>
    <div class="md-table-scroll">
        <table class="md-table">
            <thead>
                <tr>
                    <th style="width:44px"></th>
                    <th>Player</th>
                    <th class="hide-sm c" style="width:38px;text-align:center;">Rank</th>
                    <th class="r">ACS</th>
                    <th class="r">K&thinsp;/&thinsp;D&thinsp;/&thinsp;A</th>
                    <th class="hide-sm r">HS%</th>
                    <th class="hide-sm r">ADR</th>
                    <th class="hide-md r">K/D</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
</div>`;
}

function buildFreeForAllBlock(players, rounds, totalRounds) {
    const rows = players.map(p => buildPlayerRow(p, rounds, totalRounds)).join('');
    return `
<div class="md-team-block">
    <div class="md-team-header blue-side">
        <span class="md-team-side-label">All Players</span>
    </div>
    <div class="md-table-scroll">
        <table class="md-table">
            <thead>
                <tr>
                    <th style="width:44px"></th>
                    <th>Player</th>
                    <th class="hide-sm c" style="width:38px;text-align:center;">Rank</th>
                    <th class="r">ACS</th>
                    <th class="r">K&thinsp;/&thinsp;D&thinsp;/&thinsp;A</th>
                    <th class="hide-sm r">HS%</th>
                    <th class="hide-sm r">ADR</th>
                    <th class="hide-md r">K/D</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>
</div>`;
}

function buildPlayerRow(p, rounds, totalRounds) {
    const stats  = p.stats || {};
    const hs     = stats.headshots || 0;
    const bs     = stats.bodyshots || 0;
    const ls     = stats.legshots  || 0;
    const shots  = hs + bs + ls;
    const hsPct  = shots > 0 ? Math.round(hs / shots * 100) : 0;
    const acs    = Math.round((stats.score || 0) / totalRounds);
    // v4: stats.damage is object {dealt, received}  |  v3: plain number
    const rawDmg = typeof stats.damage === 'object'
        ? (stats.damage?.dealt ?? 0)
        : (stats.damage ?? 0);
    const dmg    = computeDmg(rounds, p.puuid) || rawDmg || 0;
    const adr    = Math.round(dmg / totalRounds);
    const kdRaw  = stats.deaths > 0
        ? stats.kills / stats.deaths
        : (stats.kills || 0);
    const kd     = kdRaw.toFixed(2);

    // v4: agent: {id, name}, no assets field — build icon URL from agent.id
    const agentName = p.agent?.name || p.character || '?';
    const agentSrc  = p.agent?.id
        ? `https://media.valorant-api.com/agents/${p.agent.id}/displayicon.png`
        : (p.assets?.agent?.small || '');
    // v4: tier: {id, name}  |  v3: currenttier + currenttier_patched
    const tierId   = p.tier?.id   ?? p.currenttier;
    const tierName = p.tier?.name ?? p.currenttier_patched ?? '';
    const rankSrc  = (tierId !== undefined && tierId !== null) ? rankIconURL(tierId) : '';
    const isMe     = p.puuid === MY_PUUID;

    // Colour coding
    const kdColor  = kdRaw >= 1.5 ? 'color:#3fa96a' : kdRaw < 1.0 ? 'color:var(--red)' : 'color:white';
    const acsColor = acs >= 250 ? 'var(--accent-cyan)' : acs >= 150 ? 'white' : 'var(--text-dim)';

    return `
<tr class="${isMe ? 'me-row' : ''}">
    <td style="width:44px;padding-right:4px;">
        ${agentSrc
            ? `<img class="td-agent-icon" src="${escHtml(agentSrc)}"
                    alt="${escHtml(agentName)}"
                    title="${escHtml(agentName)}">`
            : `<div class="td-agent-placeholder">${escHtml(agentName[0] || '?')}</div>`
        }
    </td>
    <td>
        <span class="td-name">${escHtml(p.name || '?')}</span><span class="td-tag">#${escHtml(p.tag || '?')}</span>${isMe ? ' <span class="you-tag">YOU</span>' : ''}
    </td>
    <td class="hide-sm" style="text-align:center;">
        ${rankSrc
            ? `<img class="td-rank-icon" src="${escHtml(rankSrc)}"
                    alt="${escHtml(tierName)}"
                    title="${escHtml(tierName)}">`
            : ''
        }
    </td>
    <td class="td-num td-acs" style="text-align:right;color:${acsColor}">${acs}</td>
    <td class="td-num td-kda" style="text-align:right;">
        ${stats.kills ?? '?'}&thinsp;/<span style="color:var(--red)">&thinsp;${stats.deaths ?? '?'}&thinsp;</span>/ ${stats.assists ?? '?'}
    </td>
    <td class="td-num hide-sm" style="text-align:right;color:var(--gold)">${hsPct}%</td>
    <td class="td-num hide-sm" style="text-align:right;">${adr}</td>
    <td class="td-num hide-md" style="text-align:right;${kdColor}">${kd}</td>
</tr>`;
}


/* ══════════════════════════════════════
   MAP BACKGROUND
   ══════════════════════════════════════ */
async function applyMapBackground(mapName, mapUUID) {
    const bgEl = document.getElementById('md-hero-bg');

    // 1. Try direct UUID from Henrik Dev metadata
    if (mapUUID) {
        const url = `https://media.valorant-api.com/maps/${mapUUID}/splash.png`;
        const loaded = await tryImageURL(url);
        if (loaded) { bgEl.style.backgroundImage = `url(${url})`; bgEl.classList.add('loaded'); return; }
    }

    // 2. Fetch map list from valorant-api.com and match by display name
    try {
        const res  = await fetch('https://valorant-api.com/v1/maps');
        const json = await res.json();
        const found = json.data?.find(m =>
            m.displayName?.toLowerCase() === mapName.toLowerCase()
        );
        if (found?.splash) {
            bgEl.style.backgroundImage = `url(${found.splash})`;
            bgEl.classList.add('loaded');
        }
    } catch {
        // No map image — the gradient fallback in CSS will show
    }
}

function tryImageURL(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}


/* ══════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════ */

/** Sum damage dealt by a player across all rounds */
function computeDmg(rounds, puuid) {
    if (!rounds.length) return 0;
    return rounds.reduce((sum, r) => {
        // v4: r.stats[].player.puuid, damage at r.stats[].stats.damage (number)
        const ps = (r.stats || []).find(s => s.player?.puuid === puuid);
        if (!ps) return sum;
        // v4: nested ps.stats.damage  |  fallback: flat ps.damage
        const d = ps.stats?.damage ?? ps.damage ?? 0;
        return sum + d;
    }, 0);
}

/** Count rounds where this player scored the first kill.
 *  v4: kills[].round (int), kills[].time_in_round_in_ms, kills[].killer.puuid */
function computeFirstBloods(kills, puuid) {
    if (!kills.length) return 0;
    const sorted = [...kills].sort((a, b) =>
        (a.round - b.round) ||
        ((a.time_in_round_in_ms || 0) - (b.time_in_round_in_ms || 0))
    );
    const seen = new Set();
    let fb = 0;
    for (const k of sorted) {
        const r = k.round;
        if (r === undefined || r === null) continue;
        if (!seen.has(r)) {
            seen.add(r);
            // v4: killer is object {puuid, name, tag, team}
            const kPuuid = k.killer?.puuid || k.killer_puuid;
            if (kPuuid === puuid) fb++;
        }
    }
    return fb;
}

/** Competitive tier icon URL */
function rankIconURL(tierId) {
    return `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tierId}/smallicon.png`;
}

/** ms → "MM:SS" */
function fmtDuration(ms) {
    const s  = Math.floor(ms / 1000);
    const m  = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
}

/** ISO date → "Jan 15, 2024" */
function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
}

/** Ease-out cubic counter animation */
function animCount(el, from, to, dur) {
    if (!el) return;
    const t0 = performance.now();
    const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);          // ease-out cubic
        el.textContent = Math.round(from + (to - from) * e);
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

/** Same but appends a suffix (e.g. "%") */
function animStr(el, from, to, dur, suffix = '') {
    if (!el) return;
    const t0 = performance.now();
    const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (to - from) * e) + suffix;
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

/** Safe element text setter */
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

/** Escape user-provided strings for safe innerHTML insertion */
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Show error screen */
function showError(title, msg) {
    loadEl.style.display = 'none';
    setText('md-err-title', title);
    setText('md-err-msg',   msg);
    errEl.style.display = 'flex';
}