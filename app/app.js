// Leonida Trophy Atlas — tracker, roadmap, missables and save/load for the 55 GTA VI trophies.
// All state lives in localStorage; export/import move it as a JSON file. No network anywhere.
const KEY = 'leonida-atlas-v1';
const state = { earned: {}, spoilers: false, view: 'tracker',
  filters: { q: '', grade: 'all', kind: 'all', status: 'all' } };

let trophies = [];

async function load() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  restore();
  document.getElementById('tabs').addEventListener('click', onTab);
  render();
}

function norm(s) {
  return s.toLowerCase().replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/…/g, '...').replace(/\s+/g, ' ').trim();
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved.earned) state.earned = saved.earned;
    if (typeof saved.spoilers === 'boolean') state.spoilers = saved.spoilers;
    if (saved.filters) Object.assign(state.filters, saved.filters);
  } catch (e) { /* first run or corrupt save: start fresh */ }
}

function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

function gradeCounts() {
  const c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const done = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) { c[t.grade]++; if (state.earned[t.name]) done[t.grade]++; }
  return { c, done };
}

function header() {
  const { c, done } = gradeCounts();
  const n = done.platinum + done.gold + done.silver + done.bronze;
  document.getElementById('earned').textContent = n;
  document.getElementById('bar-fill').style.width = (n / trophies.length * 100) + '%';
  const row = document.getElementById('grade-row');
  row.innerHTML = '';
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const chip = document.createElement('span');
    chip.className = 'chip ' + g;
    chip.textContent = g + ' ' + done[g] + '/' + c[g];
    row.appendChild(chip);
  }
}

function visible() {
  const f = state.filters, q = f.q.trim().toLowerCase();
  return trophies.filter(t => {
    if (f.grade !== 'all' && t.grade !== f.grade) return false;
    if (f.kind !== 'all' && (t.kind || 'story') !== f.kind) return false;
    const e = !!state.earned[t.name];
    if (f.status === 'earned' && !e) return false;
    if (f.status === 'todo' && e) return false;
    if (f.status === 'missable' && !t.missable) return false;
    if (f.status === 'hidden' && !t.hidden) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function guideText(t) {
  // Spoiler mode masks story trophies until earned.
  if (state.spoilers && t.hidden && !state.earned[t.name]) return 'Hidden trophy — earn it to unmask the guide.';
  return t.guide;
}

function descText(t) {
  if (state.spoilers && t.hidden && !state.earned[t.name]) return 'Hidden until earned';
  return t.description;
}

function tag(text, cls, extra) { return '<span class="tag t-' + cls + (extra ? ' ' + extra : '') + '">' + esc(text) + '</span>'; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function trophyCard(t) {
  const e = !!state.earned[t.name];
  const card = document.createElement('article');
  card.className = 'card' + (e ? ' earned' : '') + (t.missable ? ' missable' : '');
  const head = document.createElement('div');
  head.className = 'card-head';
  head.innerHTML =
    '<button class="tick" data-name="' + esc(t.name) + '" aria-label="toggle earned">' + (e ? '✔' : '') + '</button>' +
    '<div class="card-title"><h3>' + (state.spoilers && t.hidden && !e ? 'Hidden trophy' : esc(t.name)) + '</h3>' +
    '<p class="desc">' + esc(descText(t)) + '</p></div>' +
    '<div class="tags">' + tag(t.grade, 'g', t.grade) + (t.kind ? tag(t.kind, 'k') : '') +
    (t.hidden ? tag('hidden', 'h') : '') + (t.missable ? tag('possibly missable', 'm') : '') + '</div>';
  card.appendChild(head);
  const body = document.createElement('div');
  body.className = 'card-body';
  body.innerHTML = '<p class="guide">' + esc(guideText(t)) + '</p>';
  const srcs = t.sources || [];
  if (srcs.length) {
    const p = document.createElement('p');
    p.className = 'sources';
    p.append('Sources: ');
    srcs.forEach((s, i) => {
      const a = document.createElement('a');
      a.href = s.url; a.textContent = s.label; a.rel = 'noopener';
      p.appendChild(a);
      if (i < srcs.length - 1) p.append(' · ');
    });
    body.appendChild(p);
  }
  if (t.roadmap) {
    const r = document.createElement('p');
    r.className = 'stage';
    r.textContent = 'Roadmap: ' + t.roadmap + (t.chapter ? ' · Chapter ' + t.chapter : '');
    body.appendChild(r);
  }
  card.appendChild(body);
  return card;
}

function renderTracker() {
  const m = document.getElementById('main');
  m.innerHTML =
    '<div class="toolbar">' +
    '<input id="q" type="search" placeholder="Search name or description… (press /)" value="' + esc(state.filters.q) + '">' +
    '<select id="f-kind"><option value="all">All kinds</option><option value="story">Story</option>' +
    '<option value="activities">Activities</option><option value="collectibles">Collectibles</option></select>' +
    '<select id="f-grade"><option value="all">All grades</option><option value="platinum">Platinum</option>' +
    '<option value="gold">Gold</option><option value="silver">Silver</option><option value="bronze">Bronze</option></select>' +
    '<select id="f-status"><option value="all">All</option><option value="todo">To do</option>' +
    '<option value="earned">Earned</option><option value="missable">Missable</option><option value="hidden">Hidden</option></select>' +
    '<label class="spoiler"><input type="checkbox" id="sp" ' + (state.spoilers ? 'checked' : '') + '> Hide spoilers</label>' +
    '<span id="shown"></span></div><div id="list" class="list"></div>';
  const list = m.querySelector('#list');
  const vis = visible();
  for (const t of vis) list.appendChild(trophyCard(t));
  m.querySelector('#shown').textContent = vis.length + ' of 55 shown';
  bindToolbar();
  bindTicks();
}

function bindToolbar() {
  const m = document.getElementById('main');
  const q = m.querySelector('#q');
  q.addEventListener('input', () => { state.filters.q = q.value; save(); renderTracker(); });
  for (const [id, key] of [['#f-kind', 'kind'], ['#f-grade', 'grade'], ['#f-status', 'status']]) {
    const el = m.querySelector(id);
    el.value = state.filters[key];
    el.addEventListener('change', () => { state.filters[key] = el.value; save(); renderTracker(); });
  }
  const sp = m.querySelector('#sp');
  sp.addEventListener('change', () => { state.spoilers = sp.checked; save(); renderTracker(); });
}

function bindTicks() {
  for (const b of document.querySelectorAll('.tick')) {
    b.addEventListener('click', () => {
      const name = b.dataset.name;
      if (state.earned[name]) delete state.earned[name]; else state.earned[name] = true;
      save(); header(); render();
    });
  }
}

const STAGES = [
  ['Stage 1: Story', 'Play the five chapters and grab side content as it appears. Nearly half the list pops here. Watch the two early warnings: Lucia\'s balcony meditation the morning after Down to Earth (Chapter 1), and the Irredeemable criminal profile, which is permanent.'],
  ['Stage 2: 100% Checklist', 'After the credits, open Progress > Stats > 100% Completion. Required in full: all robberies (8 bank vaults, 39 gang operations), underwater discoveries, all 42 Shooting Range golds, all drone races and Bret\'s 15 Target Decks. Shares: 100 optional missions, 200/277 vehicle scans, 100/255 animal studies, 15/18 meditations, 70/80 challenges, 300 stunts, 100 WAiNK scans.'],
  ['Stage 3: Strangers & Clean-up', 'Stranger strands are not part of 100%: Strangers & Freaks needs 8 qualifying strands, and character quests for Andy, Kenton, Billy, Randy and Tyrone close out their trophies. Sweep the list by grade until the platinum lands.']
];

function renderRoadmap() {
  const m = document.getElementById('main');
  let html = '<section class="roadmap"><h2>Three stages to the platinum</h2>';
  for (const [h, p] of STAGES) html += '<div class="stage-block"><h3>' + esc(h) + '</h3><p>' + esc(p) + '</p></div>';
  html += '<h3>Trophies by stage</h3><div id="stage-list"></div></section>';
  m.innerHTML = html;
  const list = m.querySelector('#stage-list');
  const stages = ['Stage 1: Story', 'Stage 2: 100% Checklist', 'Stage 3: Strangers & Clean-up', 'Finale'];
  for (const s of stages) {
    const group = trophies.filter(t => t.roadmap === s);
    if (!group.length) continue;
    const h = document.createElement('h4');
    h.textContent = s + ' — ' + group.length + (group.length === 1 ? ' trophy' : ' trophies');
    list.appendChild(h);
    const wrap = document.createElement('div');
    wrap.className = 'list';
    for (const t of group) wrap.appendChild(trophyCard(t));
    list.appendChild(wrap);
  }
  bindTicks();
}

function renderMissables() {
  const m = document.getElementById('main');
  m.innerHTML = '<section class="roadmap"><h2>Missables</h2>' +
    '<p>GTABase\'s roadmap call: <strong>only Positive Mental Attitude is possibly missable</strong> — ' +
    'Lucia\'s balcony meditation the morning after Down to Earth in Chapter 1 disappears afterwards, and it is not ' +
    'confirmed whether the trophy needs it. Do not skip it. Everything else stays available in free roam after the story. ' +
    'Cheats disable trophies and saving, so keep them off a trophy run.</p>' +
    '<div id="m-list" class="list"></div></section>';
  const list = m.querySelector('#m-list');
  for (const t of trophies.filter(t => t.missable)) list.appendChild(trophyCard(t));
  bindTicks();
}

function renderData() {
  const m = document.getElementById('main');
  m.innerHTML = '<section class="roadmap"><h2>Save / load</h2>' +
    '<p>Progress saves itself in this browser (localStorage) every time you tick a trophy. Export writes a JSON ' +
    'file you can move to another machine; import reads one back.</p>' +
    '<button id="export">Export progress</button> <label class="filebtn">Import progress ' +
    '<input id="import" type="file" accept="application/json"></label> <button id="reset">Reset</button></section>';
  m.querySelector('#export').addEventListener('click', doExport);
  m.querySelector('#import').addEventListener('change', doImport);
  m.querySelector('#reset').addEventListener('click', () => {
    state.earned = {}; save(); header(); renderData();
  });
}

function doExport() {
  const blob = new Blob([JSON.stringify({ version: 1, earned: state.earned }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-atlas-progress.json';
  a.click();
}

function doImport(ev) {
  const f = ev.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (data && data.earned) { state.earned = data.earned; save(); header(); alert('Imported ' + Object.keys(data.earned).length + ' earned trophies.'); }
    } catch (e) { alert('Not a valid progress file.'); }
  };
  r.readAsText(f);
}

function onTab(ev) {
  const b = ev.target.closest('.tab');
  if (!b) return;
  for (const t of document.querySelectorAll('.tab')) t.classList.toggle('active', t === b);
  state.view = b.dataset.view;
  render();
}

function render() {
  header();
  ({ tracker: renderTracker, roadmap: renderRoadmap, missables: renderMissables, data: renderData })[state.view]();
}

load();
