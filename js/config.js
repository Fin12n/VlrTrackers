const API_KEY = 'HDEV-15d81876-10ca-4b51-9a22-e7abd3126c47';

function renderRegionIcon(region) {
    const regionIcons = {
        na: '<i class="fa-solid fa-earth-americas"></i>',
        eu: '<i class="fa-solid fa-earth-europe"></i>',
        ap: '<i class="fa-solid fa-earth-asia"></i>',
        kr: '<i class="fa-solid fa-earth-asia"></i>',
        latam: '<i class="fa-solid fa-earth-americas"></i>',
        br: '<i class="fa-solid fa-earth-americas"></i>',
    };
    return regionIcons[region] || '<i class="fa-solid fa-earth-asia"></i>';
};

function renderRegionFullname(region) {
    const regions = {
        'na': 'North America',
        'eu': 'Europe',
        'ap': 'Asia Pacific',
        'kr': 'Korea',
        'latam': 'Latin America',
        'br': 'Brazil',
    };
    return regions[region] || region.toUpperCase();
}

async function renderSeason(uuid) {
    const res = await fetch(`https://valorant-api.com/v1/seasons/${uuid}`);
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const seasonData = await res.json();
    return seasonData.data.title || seasonData.data.displayName || 'Unknown Season';
}

export { API_KEY, renderRegionIcon, renderRegionFullname, renderSeason };