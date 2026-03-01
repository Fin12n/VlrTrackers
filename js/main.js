const API_KEY = 'HDEV-15d81876-10ca-4b51-9a22-e7abd3126c47'; // <-- Set your key here

const btn = document.getElementById('submit');
const resultEl = document.getElementById('result');

btn.addEventListener('click', async () => {
    const name = document.getElementById('riot-name').value.trim();
    const tag  = document.getElementById('riot-tag').value.trim();
    const REGION = document.getElementById('region').value;
    console.log(REGION)

    if (!name || !tag) {
        showError('Missing Input', 'Please enter both a Riot Name and Tag.');
        return;
    }

    setLoading(true);
    resultEl.className = '';
    resultEl.innerHTML = '';

    try {
        const [accountData, mmrData, matchData] = await Promise.allSettled([
            fetchAPI(`v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`),
            fetchAPI(`v2/mmr/${REGION}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`),
            fetchAPI(`v3/matches/${REGION}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=5`)
        ]);

        const account = accountData.status === 'fulfilled' ? accountData.value?.data : null;
        const mmr     = mmrData.status    === 'fulfilled' ? mmrData.value?.data    : null;
        const matches = matchData.status  === 'fulfilled' ? matchData.value?.data  : [];

        if (!account) {
            showError('Player Not Found', `Could not find "${name}#${tag}". Check the spelling and try again.`);
            return;
        }

        renderResult(account, mmr, matches || [], REGION);
        resultEl.classList.add('visible');

    } catch (e) {
        showError('Request Failed', e.message || 'An unexpected error occurred. Please try again.');
    } finally {
        setLoading(false);
    }
});

async function fetchAPI(endpoint) {
    const res = await fetch(`https://api.henrikdev.xyz/valorant/${endpoint}`, {
        headers: API_KEY !== 'YOUR_HENRIKDEV_API_KEY' ? { 'Authorization': API_KEY } : {}
    });
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    return res.json();
}

function setLoading(v) {
    btn.classList.toggle('loading', v);
    btn.disabled = v;
}

function showError(title, msg) {
    resultEl.innerHTML = `
        <div class="error-box">
            <div class="err-icon">⚠</div>
            <div class="err-text">
                <span class="err-title">${title}</span>
                ${msg}
            </div>
        </div>`;
    resultEl.classList.add('visible');
}

function renderResult(account, mmr, matches, REGION) {
    const name = account.name || '—';
    const tag  = account.tag  || '—';
    const card = account.card?.small || '';
    const puuid = account.puuid || '';
    const level = account.account_level || '?';

    // Current / Peak rank
    const curr  = mmr?.current_data  || {};
    const peak  = mmr?.highest_rank  || {};
    const currTier  = curr.currenttierpatched  || 'Unranked';
    const currRR    = curr.ranking_in_tier != null ? `${curr.ranking_in_tier} RR` : '—';
    const currImg   = curr.images?.small || '';
    const currElo   = curr.elo != null ? `${curr.elo} ELO` : '';

    const peakTier  = peak.patched_tier || 'Unranked';
    const peakSeas  = peak.season || '';
    const peakImg   = peak.images?.small || '';

    // Matches
    let matchHTML = '';
    if (matches.length > 0) {
        for (const m of matches) {
            const meta   = m.metadata || {};
            const me = m.players?.all_players?.find(p =>
                p.name?.toLowerCase() === name.toLowerCase() && p.tag?.toLowerCase() === tag.toLowerCase()
            ) || {};
            const stats  = me.stats || {};
            const k = stats.kills ?? '?', d = stats.deaths ?? '?', a = stats.assists ?? '?';
            const agentName = me.character || '?';
            const agentIcon = me.assets?.agent?.small || '';
            const mode = meta.mode || '?';
            const map  = meta.map  || '?';

            // Determine win/loss
            const team = me.team?.toLowerCase();
            const blueWon = m.teams?.blue?.has_won;
            const redWon  = m.teams?.red?.has_won;
            let result = 'draw';
            if (team === 'blue' && blueWon) result = 'win';
            else if (team === 'red'  && redWon)  result = 'win';
            else if (team !== undefined) result = 'loss';

            const blueScore = m.teams?.blue?.rounds_won ?? '';
            const redScore  = m.teams?.red?.rounds_won  ?? '';
            const scoreStr  = blueScore !== '' ? `${blueScore} — ${redScore}` : '';

            matchHTML += `
            <div class="match-row ${result}">
                <div class="match-mode">
                    <span class="mode-name">${mode}</span>
                    <span class="mode-map">${map}</span>
                </div>
                <div class="match-agent">
                    ${agentIcon
                        ? `<img src="${agentIcon}" class="agent-icon" alt="${agentName}">`
                        : `<div class="agent-icon">${agentName[0]||'?'}</div>`}
                    <span class="match-agent-name">${agentName}</span>
                </div>
                <div class="match-kda">
                    <span class="kda-val">${k} / ${d} / ${a}</span>
                    <span class="kda-lbl">K / D / A</span>
                </div>
                <div class="match-result">
                    <span class="result-badge">${result.toUpperCase()}</span>
                    ${scoreStr ? `<div class="match-score">${scoreStr}</div>` : ''}
                </div>
            </div>`;
        }
    } else {
        matchHTML = `<div style="padding:20px;color:var(--text-dim);font-size:13px;letter-spacing:1px;text-align:center;">No recent match data available</div>`;
    }

    resultEl.innerHTML = `
    <!-- Profile -->
    <div>
        <div class="section-label"><span>Player Profile</span></div>
        <div class="profile-card">
            <div class="bg-text">${name}</div>
            <div class="avatar-wrap">
                <div class="avatar-ring"></div>
                <div class="avatar-hex">
                    ${card ? `<img src="${card}" alt="${name}">` : name[0]?.toUpperCase()}
                </div>
            </div>
            <div class="profile-info">
                <div class="profile-name">${name}<span class="profile-tag"> #${tag}</span></div>
                <div class="profile-region">🌏 ${REGION.toUpperCase()} · Level ${level}</div>
                ${puuid ? `<div class="profile-puuid">${puuid}</div>` : ''}
            </div>
        </div>
    </div>

    <!-- Rank -->
    <div>
        <div class="section-label"><span>Ranked Stats</span></div>
        <div class="rank-grid">
            <div class="rank-card">
                <div class="card-title">Current Rank</div>
                ${currImg
                    ? `<img src="${currImg}" class="rank-tier-img" alt="${currTier}">`
                    : `<div class="rank-tier-placeholder">🏆</div>`}
                <div class="rank-name">${currTier}</div>
                <div class="rank-rr">${currRR}</div>
                ${currElo ? `<div class="rank-elo">${currElo}</div>` : ''}
            </div>
            <div class="rank-card">
                <div class="card-title">Peak Rank</div>
                ${peakImg
                    ? `<img src="${peakImg}" class="rank-tier-img" alt="${peakTier}">`
                    : `<div class="rank-tier-placeholder">🎖️</div>`}
                <div class="rank-name">${peakTier}</div>
                <div class="rank-rr">${peakSeas}</div>
            </div>
        </div>
    </div>

    <!-- Recent Matches -->
    <div>
        <div class="section-label"><span>Recent Matches</span></div>
        <div class="match-list">${matchHTML}</div>
    </div>`;
}

// Enter key support
document.querySelectorAll('input').forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
});