/* ============================================================
   Viscosity MDT — tablet OS logic
   ============================================================ */
const RES = (typeof GetParentResourceName === 'function') ? GetParentResourceName() : 'viscosity_mdt';
const $ = (id) => document.getElementById(id);
const body = document.body;

let player = {};       // PlayerData from viscosity_core
let booted = false;
let maxSlots = 3;
let dmvTab = 'vehicles';
let vehicles = [];

const LICENSES = [
    { id: 'driver', label: "Driver's License" },
    { id: 'motorcycle', label: 'Motorcycle License' },
    { id: 'commercial', label: 'Commercial License' },
    { id: 'pilot', label: "Pilot's License" },
    { id: 'hunting', label: 'Hunting License' },
    { id: 'weapon', label: 'Weapon License' },
];

let toastTimer = null;
function toast(msg, ok) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast ' + (ok ? 'ok' : 'err');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}

function post(name, data = {}) {
    return fetch(`https://${RES}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data),
    }).catch(() => {});
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

const money = (n) => '$' + Number(n || 0).toLocaleString();
const initial = (s) => (String(s || 'V').trim()[0] || 'V').toUpperCase();

/* ---------- clock ---------- */
function tick() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const t = `${hh}:${mm}`;
    $('sb-time').textContent = t;
    $('home-clock').textContent = t;
    $('home-date').textContent = d.toLocaleDateString(undefined,
        { weekday: 'long', month: 'long', day: 'numeric' });
}

/* ============================================================
   Apps
   ============================================================ */
const APPS = [
    {
        id: 'character', label: 'Character', icon: '👤',
        render() {
            const c = player.charinfo || {};
            const m = player.money || {};
            const j = player.job || {};
            const name = `${player.name?.firstname || ''} ${player.name?.lastname || ''}`.trim() || 'Unknown';
            return `
                <div class="profile-head">
                    <div class="profile-pic">${esc(initial(player.name?.firstname))}</div>
                    <div>
                        <div class="profile-name">${esc(name)}</div>
                        <div class="profile-sub">${esc(player.citizenid || '')} · ${esc(c.phone || 'no phone')}</div>
                    </div>
                </div>
                <div class="card">
                    <h3>Identity</h3>
                    <div class="row"><span class="k">Date of Birth</span><span class="v">${esc(c.dob || '—')}</span></div>
                    <div class="row"><span class="k">Gender</span><span class="v">${esc(c.gender || '—')}</span></div>
                    <div class="row"><span class="k">Nationality</span><span class="v">${esc(c.nationality || '—')}</span></div>
                </div>
                <div class="card">
                    <h3>Finances</h3>
                    <div class="row"><span class="k">Cash</span><span class="v">${money(m.cash)}</span></div>
                    <div class="row"><span class="k">Bank</span><span class="v">${money(m.bank)}</span></div>
                </div>
                <div class="card">
                    <h3>Employment</h3>
                    <div class="row"><span class="k">Job</span><span class="v">${esc(j.label || 'Civilian')}</span></div>
                    <div class="row"><span class="k">Rank</span><span class="v">${esc(j.gradeLabel || '—')}</span></div>
                </div>
                <div class="card">
                    <h3>Licenses</h3>
                    <div style="display:flex;flex-wrap:wrap;gap:6px">${
                        LICENSES.filter((l) => ((player.metadata && player.metadata.licenses) || {})[l.id])
                            .map((l) => `<span class="badge ok">${esc(l.label)}</span>`).join('')
                        || '<span class="empty" style="padding:0">None yet — apply at the DMV.</span>'
                    }</div>
                </div>`;
        },
    },
    {
        id: 'dmv', label: 'DMV', icon: '🚗',
        render() {
            return `
                <div class="dmv-tabs">
                    <button class="dmv-tab${dmvTab === 'vehicles' ? ' active' : ''}" data-dmv="vehicles">Vehicles</button>
                    <button class="dmv-tab${dmvTab === 'licenses' ? ' active' : ''}" data-dmv="licenses">Licenses</button>
                </div>
                <div id="dmv-content">${dmvTab === 'vehicles' ? renderVehicles() : renderLicenses()}</div>`;
        },
        afterRender() {
            document.querySelectorAll('.dmv-tab').forEach((b) =>
                b.addEventListener('click', () => { dmvTab = b.dataset.dmv; reopenDMV(); }));
            wireDMV();
            if (dmvTab === 'vehicles') post('dmv:vehicles');   // refresh list from server
        },
    },
    {
        id: 'settings', label: 'Settings', icon: '⚙️',
        render() {
            return `
                <div class="card">
                    <h3>About</h3>
                    <div class="row"><span class="k">Device</span><span class="v">Viscosity MDT</span></div>
                    <div class="row"><span class="k">OS</span><span class="v">ViscosityOS 0.1</span></div>
                    <div class="row"><span class="k">Owner</span><span class="v">${esc((player.name?.firstname || '') + ' ' + (player.name?.lastname || ''))}</span></div>
                </div>
                <div class="card">
                    <h3>Display</h3>
                    <div class="empty">Wallpaper & accent options coming soon.</div>
                </div>`;
        },
    },
];

/* ---------- DMV render helpers ---------- */
function renderVehicles() {
    const list = vehicles.length ? vehicles.map((v) => `
        <div class="veh-item">
            <div>
                <div style="font-weight:600">${esc(v.make)}${v.model ? ' ' + esc(v.model) : ''}</div>
                <div style="color:var(--muted);font-size:12px">${esc(v.color || '')}</div>
            </div>
            <span class="plate">${esc(v.plate)}</span>
        </div>`).join('') : '<div class="empty">No vehicles registered yet.</div>';
    return `
        <div class="card">
            <h3>Register a Vehicle</h3>
            <div class="reg-form">
                <div class="field"><label>Make / Model</label><input id="reg-make" placeholder="Bravado Buffalo" /></div>
                <div class="field"><label>Color</label><input id="reg-color" placeholder="Black" /></div>
                <div class="field full"><label>Plate (optional)</label><input id="reg-plate" placeholder="auto-generated if blank" maxlength="8" /></div>
                <div class="full" style="text-align:right"><button class="btn" id="reg-btn">Register</button></div>
            </div>
        </div>
        <div class="card"><h3>Registered Vehicles</h3>${list}</div>`;
}

function renderLicenses() {
    const held = (player.metadata && player.metadata.licenses) || {};
    const rows = LICENSES.map((l) => `
        <div class="license-row">
            <span>${esc(l.label)}</span>
            ${held[l.id] ? '<span class="badge ok">APPROVED</span>'
                         : `<button class="btn sm" data-lic="${esc(l.id)}">Apply</button>`}
        </div>`).join('');
    return `<div class="card"><h3>Licenses</h3>${rows}</div>`;
}

function wireDMV() {
    const regBtn = $('reg-btn');
    if (regBtn) regBtn.addEventListener('click', () => {
        const make = $('reg-make').value.trim();
        if (!make) { toast('Enter a make/model', false); return; }
        post('dmv:register', {
            make, color: $('reg-color').value.trim(), plate: $('reg-plate').value.trim(),
        });
    });
    document.querySelectorAll('[data-lic]').forEach((b) =>
        b.addEventListener('click', () => post('dmv:license', { id: b.dataset.lic })));
}

function reopenDMV() { openApp('dmv'); }

/* ---------- character select ---------- */
function showCharSelect(chars, max) {
    maxSlots = max || 3;
    body.classList.remove('hidden');
    $('boot').classList.add('hidden');
    $('os').classList.add('hidden');
    $('cs-create').classList.add('hidden');
    $('charselect').classList.remove('hidden');
    renderSlots(chars || []);
}

function renderSlots(chars) {
    const el = $('cs-slots');
    let html = '';
    for (let i = 0; i < maxSlots; i++) {
        const c = chars[i];
        if (c) {
            let job = 'Civilian';
            try { const j = typeof c.job === 'string' ? JSON.parse(c.job) : c.job; if (j && j.label) job = j.label; } catch (_) {}
            html += `
                <div class="slot">
                    <div class="slot-name">${esc(c.firstname)} ${esc(c.lastname)}</div>
                    <div class="slot-info">${esc(c.citizenid)}</div>
                    <div class="slot-info">${esc(job)}</div>
                    <div class="slot-actions">
                        <button class="btn sm" data-select="${esc(c.citizenid)}">Play</button>
                        <button class="del-btn" data-delete="${esc(c.citizenid)}">Delete</button>
                    </div>
                </div>`;
        } else {
            html += `<div class="slot empty" data-create="1"><div class="plus">+</div><div class="lbl">Create Character</div></div>`;
        }
    }
    el.innerHTML = html;
    el.querySelectorAll('[data-select]').forEach((b) =>
        b.addEventListener('click', () => post('char:select', { citizenid: b.dataset.select })));
    el.querySelectorAll('[data-delete]').forEach((b) =>
        b.addEventListener('click', () => post('char:delete', { citizenid: b.dataset.delete })));
    el.querySelectorAll('[data-create]').forEach((b) => b.addEventListener('click', openCreate));
}

function openCreate() { $('cs-create').classList.remove('hidden'); }
function closeCreate() { $('cs-create').classList.add('hidden'); }
function submitCreate() {
    const first = $('c-first').value.trim();
    const last = $('c-last').value.trim();
    if (!first || !last) { toast('Enter a first and last name', false); return; }
    post('char:create', {
        firstname: first, lastname: last,
        dob: $('c-dob').value || '2000-01-01',
        gender: $('c-gender').value,
        nationality: $('c-nat').value.trim() || 'San Andreas',
    });
}

function buildLauncher() {
    $('apps').innerHTML = APPS.map((a) => `
        <div class="app-tile" data-app="${a.id}">
            <div class="app-icon">${a.icon}</div>
            <div class="app-label">${esc(a.label)}</div>
        </div>`).join('');
    $('apps').querySelectorAll('.app-tile').forEach((t) =>
        t.addEventListener('click', () => openApp(t.dataset.app)));
}

let currentApp = null;
function openApp(id) {
    const app = APPS.find((a) => a.id === id);
    if (!app) return;
    currentApp = id;
    $('app-title').textContent = app.label;
    $('app-body').innerHTML = app.render();
    if (app.afterRender) app.afterRender();
    $('view-home').classList.remove('active');
    $('view-app').classList.add('active');
}

function goHome() {
    currentApp = null;
    $('view-app').classList.remove('active');
    $('view-home').classList.add('active');
}

/* ============================================================
   Open / close + boot
   ============================================================ */
function openTablet() {
    body.classList.remove('hidden');
    $('charselect').classList.add('hidden');
    tick();
    $('sb-name').textContent = `${player.name?.firstname || ''} ${player.name?.lastname || ''}`.trim() || '—';
    if (!booted) {
        $('boot').classList.add('run');
        setTimeout(() => {
            $('boot').classList.add('hidden');
            $('os').classList.remove('hidden');
            booted = true;
            goHome();
        }, 1700);
    } else {
        goHome();
    }
}

function closeTablet() {
    body.classList.add('hidden');
    post('close');
}

// Power button: flash to black, then turn the tablet off (closes + reboots next open).
function powerOff() {
    if (body.classList.contains('hidden')) return;
    if (!$('charselect').classList.contains('hidden')) return;   // can't power off during select
    const scr = $('screen');
    scr.classList.add('poweroff');
    setTimeout(() => {
        scr.classList.remove('poweroff');
        booted = false;          // it was "turned off" — boot again next time
        closeTablet();
    }, 420);
}

/* ---------- inbound ---------- */
window.addEventListener('message', (e) => {
    const d = e.data || {};
    switch (d.type) {
        case 'charSelect':
            showCharSelect(d.characters, d.maxSlots);
            break;
        case 'open':
            if (d.data) player = d.data;
            openTablet();
            break;
        case 'setData':
            player = d.data || {};
            // live-refresh the open app if it depends on player data
            if (currentApp === 'character' || currentApp === 'dmv') openApp(currentApp);
            break;
        case 'vehicles':
            vehicles = d.vehicles || [];
            if (currentApp === 'dmv' && dmvTab === 'vehicles') {
                $('dmv-content').innerHTML = renderVehicles();
                wireDMV();
            }
            break;
        case 'dmvResult':
            toast(d.msg, d.ok);
            break;
        case 'close':
            body.classList.add('hidden');
            $('charselect').classList.add('hidden');
            break;
    }
});

document.addEventListener('keydown', (e) => {
    // Esc closes only the OS — character select must pick a character.
    if (e.key === 'Escape' && !body.classList.contains('hidden')
        && $('charselect').classList.contains('hidden')) {
        e.preventDefault();
        closeTablet();
    }
});

$('app-back').addEventListener('click', goHome);
$('c-cancel').addEventListener('click', closeCreate);
$('c-confirm').addEventListener('click', submitCreate);
$('power-btn').addEventListener('click', powerOff);

/* ---------- boot ---------- */
window.addEventListener('DOMContentLoaded', () => {
    buildLauncher();
    tick();
    setInterval(tick, 10000);
});
