import { API_KEY, renderRegionIcon, renderRegionFullname, renderSeason } from './config.js';
const urlParams = new URLSearchParams(window.location.search);

const riotName = urlParams.get('name') || '';
const riotTag = urlParams.get('tag') || '';
const REGION   = urlParams.get('region') || 'ap';
const PLATFORM = urlParams.get('platform') || 'pc';
console.log(`${riotName}#${riotTag} - ${REGION} (${PLATFORM})`);

const resultEl = document.getElementById('result');
const loadingEl = document.getElementById('loading');

// resultEl.style.display = 'none';

document.addEventListener('DOMContentLoaded', async () => {
    const resultEl = document.getElementById('result');
    if (!riotName || !riotTag) {
        resultEl.innerHTML = `<div class="error"><h2>Missing Input</h2><p>Please provide both "name" and "tag" query parameters in the URL.</p></div>`;
        resultEl.classList = '';
        document.getElementById('loading').style.display = 'none';
        return;
    }
    const { puuid, region, accountLevel, cardId } = await checkedAccountFetch(riotName, riotTag);
    renderResult(cardId, riotName, riotTag, puuid, accountLevel, region);
});

// https://media.valorant-api.com/playercards/ea5af728-4df1-b1a4-e73e-21b6235be71f/displayicon.png

async function renderResult(cardId, name, tag, puuid, accountLevel, region) {
    // Player Profile
    document.getElementById('profileIcon').src = `https://media.valorant-api.com/playercards/${cardId}/displayicon.png`;
    document.getElementById('name').innerHTML = `${name}<span class="profile-tag" id="tag">#${tag}</span>`;
    document.getElementById('profile-puuid').innerText = `PUUID: ${puuid}`;
    document.getElementById('profile-region').innerHTML = renderRegion(region, accountLevel);
    document.getElementById('bg-text').innerText = `${name}`;
    
    try {
        const mmrData = await checkedMMRFetch(PLATFORM, REGION, name, tag);
        const { current, peak } = mmrData;
    //Player Rank & MMR
   
        if (current) {
            document.querySelector('.rank-tier-img').src = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${current.tier.id}/largeicon.png`;
            document.querySelector('.rank-name').innerText = current.tier.name;
            document.querySelector('.rank-rr').innerText = `${current.rr} RR`;
            document.querySelector('.rank-elo').innerText = `${current.elo} Elo`;
            document.getElementById('rank-protection').innerText = `${current.rank_protection_shields} Rank Protection Shield${current.rank_protection_shields !== 1 ? 's' : ''} Remaining`;
        }
        if (peak) {
            const seasonName = await renderSeason(peak.season.id); 
            
            document.getElementById('peak-name').innerText = peak.tier.name;
            document.getElementById('peak-ss').innerText = `Season ${seasonName}`;
            console.log(renderSeason(peak.season.id));
            document.getElementById('img-peak').src = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${peak.tier.id}/largeicon.png`;
        }   
    } catch (err) {
        console.error("Error fetching MMR data:", err);
        document.getElementById('mmr-error').innerText = "MMR data is currently unavailable.";
    }

    const matchsEl = document.getElementById('matches');
    matchsEl.innerHTML = await getMatchHTML(REGION, riotName, riotTag); // Hiện placeholder trước

    resultEl.style.display = 'block';
    loadingEl.style.display = 'none';
}


async function checkedAccountFetch(name, tag) {
    const res = await fetch(`https://api.henrikdev.xyz/valorant/v2/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, {
        headers: API_KEY !== 'YOUR_HENRIKDEV_API_KEY' ? { 'Authorization': API_KEY } : {}
    });
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const account = await res.json();
    const puuid = account.data?.puuid;
    const region = account.data?.region;
    const accountLevel = account.data?.account_level;
    const cardId = account.data?.card;
    return { puuid, region, accountLevel, cardId };
}

async function checkedMMRFetch(platform, region, name, tag) {
    const res = await fetch(`https://api.henrikdev.xyz/valorant/v3/mmr/${region}/${platform}/${name}/${tag}`, {
        headers: API_KEY !== 'YOUR_HENRIKDEV_API_KEY' ? { 'Authorization': API_KEY } : {}
    });
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const mmrData = await res.json();
    const current = mmrData.data?.current;
    const peak = mmrData.data?.peak;
    return { current, peak };
}

async function getMatchHTML(region, name, tag) {
    try {
        // Fetch trực tiếp từ API v3
        const res = await fetch(`https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=5`, {
            headers: API_KEY !== 'YOUR_HENRIKDEV_API_KEY' ? { 'Authorization': API_KEY } : {}
        });

        if (!res.ok) throw new Error(`API Error ${res.status}`);
        
        const json = await res.json();
        const matches = json.data || [];

        // Nếu không có trận nào
        if (matches.length === 0) {
            return `<div style="padding:20px;color:var(--text-dim);font-size:13px;letter-spacing:1px;text-align:center;">No recent match data available</div>`;
        }

        let matchHTML = '';
        
        // Vòng lặp render UI
        for (const m of matches) {
            const meta   = m.metadata || {};
            const me = m.players?.all_players?.find(p =>
                p.name?.toLowerCase() === name.toLowerCase() && p.tag?.toLowerCase() === tag.toLowerCase()
            ) || {};
            
            const stats  = me.stats || {};
            const k = stats.kills ?? '?'; 
            const d = stats.deaths ?? '?'; 
            const a = stats.assists ?? '?';
            
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

            // ĐÃ THÊM: style="margin-bottom: 12px;" để tạo khoảng cách giữa các trận
            matchHTML += `
            <div class="match-row ${result}" style="margin-bottom: 12px;">
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

        return matchHTML;

    } catch (error) {
        console.error("Match Fetch Error:", error);
        return `<div style="padding:20px;color:#ff4655;font-size:13px;text-align:center;">Failed to load matches: ${error.message}</div>`;
    }
}

function renderRegion(region, accountLevel) {
    const iconRegion = renderRegionIcon(region);
    const fullname = renderRegionFullname(region);
    const result = `${iconRegion} ${fullname} · Level ${accountLevel}`;
    return result;
};