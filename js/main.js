import { API_KEY } from "./config.js";

const btn        = document.getElementById('submit');
const puuidBtn   = document.getElementById('puuid-submit');
const notifyEl   = document.getElementById('notifyEl');
const nameInput  = document.getElementById('riot-name');
const tagInput   = document.getElementById('riot-tag');
const regionSel  = document.getElementById('region');
const platformSel= document.getElementById('platform');
const puuidInput = document.getElementById('puuid-input');

/* ── Submit by Name#Tag ── */
btn.addEventListener('click', async () => {
    if (!nameInput.value || !tagInput.value) {
        showError('Input Missing!', 'Please type your Riot Name & Tag!');
        return;
    }
    setLoading(btn, true);
    await renderResult(nameInput.value.trim(), tagInput.value.trim());
    setLoading(btn, false);
});

/* ── Submit by PUUID ── */
puuidBtn.addEventListener('click', async () => {
    if (!puuidInput.value.trim()) {
        showError('Input Missing!', 'Please type your PUUID!');
        return;
    }
    setLoading(puuidBtn, true);
    await renderResultByPUUID(puuidInput.value.trim());
    setLoading(puuidBtn, false);
});

/* ── Enter key ── */
document.querySelectorAll('input').forEach(el => {
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter') btn.click();
    });
});

function setLoading(button, v) {
    button.classList.toggle('loading', v);
    button.disabled = v;
}

async function renderResult(name, tag) {
    try {
        const res  = await fetch(
            `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
            { headers: API_KEY !== 'YOUR_HENRIKDEV_API_KEY' ? { Authorization: API_KEY } : {} }
        );
        const data = await res.json();

        if (data.status === 200) {
            showSuccess('Account Found!', `Found in the <b>${data.data.region}</b> region. Redirecting…`);
            const base = window.location.href.replace(/[^/]*$/, '');
            setTimeout(() => {
                window.location.href = `${base}tracker.html?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${regionSel.value}&platform=${platformSel.value}`;
            }, 1800);
        } else if (data.status === 404) {
            showError('Not Found!', 'Account not found. Check your Riot Name & Tag.');
        } else {
            const msg = data.errors?.[0]?.message || `Error ${data.status}`;
            showError('API Error', msg);
        }
    } catch (err) {
        showError('Network Error', err.message);
    }
}

async function renderResultByPUUID(puuid) {
    try {
        const res  = await fetch(
            `https://api.henrikdev.xyz/valorant/v1/by-puuid/account/${encodeURIComponent(puuid)}`,
            { headers: API_KEY !== 'YOUR_HENRIKDEV_API_KEY' ? { Authorization: API_KEY } : {} }
        );
        const data = await res.json();

        if (data.status === 200) {
            const name = data.data.name;
            const tag  = data.data.tag;
            showSuccess('Account Found!', `Found: <b>${name}#${tag}</b>. Redirecting…`);
            const base = window.location.href.replace(/[^/]*$/, '');
            setTimeout(() => {
                window.location.href = `${base}tracker.html?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${data.data.region || regionSel.value}&platform=${platformSel.value}`;
            }, 1800);
        } else if (data.status === 404) {
            showError('Not Found!', 'No account found for this PUUID.');
        } else {
            const msg = data.errors?.[0]?.message || `Error ${data.status}`;
            showError('API Error', msg);
        }
    } catch (err) {
        showError('Network Error', err.message);
    }
}

function showError(title, msg) {
    notifyEl.innerHTML = `
        <div class="error-box">
            <div class="err-icon">⚠</div>
            <div class="err-text">
                <span class="err-title">${title}</span>${msg}
            </div>
        </div>`;
}

function showSuccess(title, msg) {
    notifyEl.innerHTML = `
        <div class="success-box">
            <div class="success-icon">✓</div>
            <div class="success-text">
                <span class="success-title">${title}</span>${msg}
            </div>
        </div>`;
}