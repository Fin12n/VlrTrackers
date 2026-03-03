import { API_KEY } from "./config.js";
const btn = document.getElementById('submit');
const notifyEl = document.getElementById('notifyEl');
const nameInput = document.getElementById('riot-name');
const tagInput = document.getElementById('riot-tag');

const regionSel = document.getElementById('region');
const platformSel = document.getElementById('platform');

btn.addEventListener("click", async () => {
  if (!nameInput.value || !tagInput.value) {
    showError("Input Missing!", "Please type your Riot Name & tag!");
    return;
  }
  setLoading(true);
  await renderResult(nameInput.value, tagInput.value);

});

function setLoading(v) {
    btn.classList.toggle('loading', v);
    btn.disabled = v;
}

async function renderResult(name, tag) {
    const res = await fetch(`https://api.henrikdev.xyz/valorant/v2/account/${name}/${tag}`, {
        headers: API_KEY !== 'YOUR_HENRIKDEV_API_KEY' ? { 'Authorization': API_KEY } : {}
    });
    const data = await res.json();
    const baseURL = window.location.href;
    const redirectURL = `${baseURL}tracker.html?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${regionSel.value}&platform=${platformSel.value}`;
    if (data.status === 404) {
        showError("Account Not Found!", "Please check your Riot Name & tag and try again.");
        setLoading(false);
    } else if (data.status === 200) {
        showError("Account Found!", `Your account was found in the ${data.data.region} region.`);
        setLoading(false);
        setTimeout(() => {
            window.location.href = redirectURL;
        }, 3000);
    } else if (data.status !== 200) {
        showError("Error", data.errors ? data.errors[0].message + " (Code: " + data.errors[0].code + ")" : "An error occurred while fetching your account data.");
        setLoading(false);
    }



    setLoading(false);
}

function showError(title, msg) {
    notifyEl.innerHTML = `
        <div class="error-box">
            <div class="err-icon">⚠</div>
            <div class="err-text">
                <span class="err-title">${title}</span>
                ${msg}
            </div>
        </div>`;
    notifyEl.classList.add('visible');
}

// Enter key support
document.querySelectorAll('input').forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
});