/* Core: types, store, utilities, router */
const TYPES = {
  spell: { label: 'Spells', one: 'Spell', art: 'book', blurb: 'Charms, workings & rituals' },
  sigil: { label: 'Sigils', one: 'Sigil', art: 'eye', blurb: 'Runes, seals & marks of power' },
  oil: { label: 'Oils', one: 'Oil Formula', art: 'bottle', blurb: 'Anointing & condition oils' },
  incense: { label: 'Incense', one: 'Incense Formula', art: 'incense', blurb: 'Smoke for every working' },
  tincture: { label: 'Tinctures', one: 'Tincture', art: 'dropper', blurb: 'Herbal extracts & glycerites' },
  brew: { label: 'Brews', one: 'Brew', art: 'cauldron', blurb: 'Teas, potions, waters & washes' },
  tarot: { label: 'Tarot Layouts', one: 'Tarot Layout', art: 'tarot', blurb: 'Spreads for every question' },
  herb: { label: 'Herbs', one: 'Herb', art: 'leaf', blurb: 'The green encyclopedia' },
  crystal: { label: 'Crystals', one: 'Crystal', art: 'crystal', blurb: 'Stones & their virtues' },
  deity: { label: 'Deities', one: 'Deity', art: 'deity', blurb: 'Gods & goddesses of the old ways' },
};
const FORMULA_TYPES = ['spell', 'oil', 'incense', 'tincture', 'brew'];
const TYPE_ORDER = ['tarot']; // tarot-only edition: the other types stay defined so old backups never break

/* ---------- utils ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toLowerCase().replace(/[’‘`]/g, "'").normalize('NFD').replace(/[̀-ͯ]/g, '');
const arr = v => Array.isArray(v) ? v : (v ? [v] : []);
const art = (name, cls = '') => `<span class="${cls}">${ART[name] || ART.star}</span>`;
const uid = type => `${type}-u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
function toast(msg) {
  let t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
}
function modal(html, onMount) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="sheet fade-in">${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m) close(); });
  const close = () => { m.remove(); window.removeEventListener('hashchange', close); };
  window.addEventListener('hashchange', close);
  document.body.appendChild(m);
  onMount && onMount(m, close);
  return close;
}
function confirmBox(msg, okLabel = 'Yes') {
  return new Promise(res => {
    modal(`<h2>Are you certain?</h2><p class="center">${esc(msg)}</p><div class="actions"><button class="btn ghost" data-no>Cancel</button><button class="btn danger" data-yes>${esc(okLabel)}</button></div>`,
      (m, close) => { $('[data-no]', m).onclick = () => { close(); res(false); }; $('[data-yes]', m).onclick = () => { close(); res(true); }; });
  });
}
function fmtDate(d, opts = { weekday: 'short', month: 'short', day: 'numeric' }) { return d.toLocaleDateString(undefined, opts); }
function fmtTime(d) { return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }

/* ---------- image helpers ---------- */
function readImageFile(file, max = 1200, quality = 0.82) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = rej; img.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
function pickFile(accept = 'image/*') {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept;
    i.onchange = () => res(i.files && i.files[0]); i.click();
  });
}
// downloads: the Android app saves through its bridge; the web preview asks the viewer's
// permission through the page's "downloads" capability; otherwise a plain link.
let _dl;
const downloadsCap = () => (_dl = _dl || (window.claude && claude.use ? claude.use('downloads').catch(() => null) : Promise.resolve(null)));
async function saveFile(name, mime, dataUrlOrText) {
  let b64;
  if (dataUrlOrText.startsWith('data:')) b64 = dataUrlOrText.split(',')[1];
  else b64 = btoa(unescape(encodeURIComponent(dataUrlOrText)));
  if (window.AndroidBridge && AndroidBridge.saveFile) { AndroidBridge.saveFile(name, mime, b64); return true; }
  const dl = await downloadsCap();
  if (dl) {
    try {
      const bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      await dl.save({ filename: name, data: new Blob([bytes]) });
      return true;
    } catch (e) {
      if (e && e.code === 'declined') { toast('Save cancelled'); return false; }
      if (e && e.code === 'rate_limited') { toast('A save is already waiting for you'); return false; }
    }
  }
  // iPhone and other browsers: the share sheet (Save to Files, AirDrop, Mail…), else a normal download
  try {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    // some phones only share certain kinds of file, so a JSON file is offered as plain text too
    for (const type of [mime, 'text/plain']) {
      const file = new File([bytes], name, { type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: name }); return true; }
        catch (e) { if (e && e.name === 'AbortError') return false; break; }
      }
    }
    {   // a normal download (iPhone Safari offers to save it to Files)
      const u = URL.createObjectURL(new Blob([bytes], { type: mime })), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 60000); return true;
    }
  } catch (e) { }
  if (!dataUrlOrText.startsWith('data:') && /json|text/.test(mime)) { showTextForCopy(name, dataUrlOrText); return false; }
  const a = document.createElement('a'); a.href = `data:${mime};base64,${b64}`; a.download = name; a.click();
  return true;
}
// last resort when a file can't be saved: show the text so it can be copied
function showTextForCopy(name, text) {
  modal(`<h2>Copy your backup</h2><p class="small center">This screen can't save files, so here is your backup as text. Copy it, paste it into a new file called <b>${esc(name)}</b>, and import that file in the app.</p>
    <textarea readonly style="width:100%;height:180px;background:var(--input);color:var(--ink);border:1px solid var(--line2);border-radius:10px;font:12px monospace">${esc(text)}</textarea>
    <div class="actions"><button class="btn primary" id="cpy">Copy</button></div>`, (m, close) => {
    $('#cpy', m).onclick = () => { copyText(text, 'Backup copied'); close(); };
  });
}
// crystal placeholder illustration tinted by its colour
function crystalSVG(color = '#9d7bd8') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="${color}"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient></defs>
  <polygon points="50,6 70,30 50,94 30,30" fill="url(#cg)" stroke="${color}" stroke-width="1.5"/><polygon points="50,6 70,30 50,40 30,30" fill="#fff" fill-opacity=".35"/>
  <polygon points="26,44 38,52 30,88 14,62" fill="url(#cg)" fill-opacity=".85" stroke="${color}"/><polygon points="74,44 86,62 70,88 62,52" fill="url(#cg)" fill-opacity=".85" stroke="${color}"/></svg>`;
}
// returns inner html for an item's picture (thumb or banner)
function pictureHTML(it, big = false) {
  const img = it.image;
  if (it.type === 'sigil') {
    if (img && img.startsWith('data:')) return `<img src="${img}" alt="">`;
    if (it.svg) return `<span class="sig" style="color:var(--gold);display:block;width:100%;height:100%">${it.svg}</span>`;
  }
  if (img && img.startsWith('art:')) return `<span class="art">${ART[img.slice(4)] || ART.star}</span>`;
  if (img) return `<img src="${esc(img)}" alt="" loading="lazy">`;
  if (it.type === 'crystal') return `<span class="art">${crystalSVG(it.color)}</span>`;
  return `<span class="art">${ART[TYPES[it.type].art]}</span>`;
}

/* ---------- store ---------- */
const Store = {
  seed: {}, user: {}, hidden: new Set(), favs: new Set(), settings: {},
  async load() {
    await DB.init();
    TYPE_ORDER.forEach(t => (window.SEED[t] || []).forEach(it => { it.type = t; it.builtin = true; this.seed[it.id] = it; }));
    (await DB.all()).forEach(it => { this.user[it.id] = it; });
    this.hidden = new Set(await DB.get('hidden', []));
    this.favs = new Set(await DB.get('favs', []));
    this.settings = await DB.get('settings', {});
    if (window.MOON) { MOON.south = this.settings.hemisphere === 'south'; MOON.bright = +this.settings.moonBright || 1; }
    this.reindex();
  },
  get(id) { return this.user[id] || this.seed[id]; },
  all(type) {
    const out = [];
    for (const id in this.seed) { const s = this.seed[id]; if ((!type || s.type === type) && !this.hidden.has(id) && !this.user[id]) out.push(s); }
    for (const id in this.user) { const u = this.user[id]; if ((!type || u.type === type) && !this.hidden.has(id)) out.push(u); }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  },
  async save(it) { it.updated = Date.now(); this.user[it.id] = it; await DB.put(it); this.hidden.delete(it.id); await DB.set('hidden', [...this.hidden]); this.reindex(); },
  async remove(id) {
    if (this.user[id]) { delete this.user[id]; await DB.del(id); }
    if (this.seed[id]) { this.hidden.add(id); await DB.set('hidden', [...this.hidden]); }
    this.favs.delete(id); await DB.set('favs', [...this.favs]);
    this.reindex();
  },
  async revert(id) { if (this.seed[id] && this.user[id]) { delete this.user[id]; await DB.del(id); this.reindex(); } },
  async toggleFav(id) { this.favs.has(id) ? this.favs.delete(id) : this.favs.add(id); await DB.set('favs', [...this.favs]); return this.favs.has(id); },
  async setSetting(k, v) { this.settings[k] = v; await DB.set('settings', this.settings); },

  /* search index + cross links */
  reindex() {
    const items = this.all();
    this.index = items.map(it => ({ it, name: norm(it.name), kw: [...arr(it.metaphysical), ...arr(it.medical)].map(norm), blob: norm(blobOf(it)) }));
    // linker regex for herb & crystal names
    const names = [];
    items.filter(i => i.type === 'herb' || i.type === 'crystal').forEach(i => {
      names.push([i.name, i.id]);
      if (i.type === 'herb') arr(i.folkNames).forEach(f => f.length > 4 && names.push([f, i.id]));
    });
    [['bay leaf', 'herb-bay-laurel'], ['bay leaves', 'herb-bay-laurel'], ['bay', 'herb-bay-laurel'], ['st john\'s wort', 'herb-st-johns-wort'], ['elderberr', 'herb-elder'], ['elderflower', 'herb-elder'], ['rose petal', 'herb-rose'], ['orange', 'herb-orange-peel'], ['cinnamon', 'herb-cinnamon'], ['quartz', 'crystal-clear-quartz'], ['sea salt', null]]
      .forEach(([n, id]) => id && this.get(id) && names.push([n, id]));
    names.sort((a, b) => b[0].length - a[0].length);
    this.linkMap = {}; names.forEach(([n, id]) => { if (!this.linkMap[norm(n)]) this.linkMap[norm(n)] = id; });
    const pat = names.map(([n]) => norm(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter((v, i, a) => a.indexOf(v) === i);
    this.linkRe = pat.length ? new RegExp(`\\b(${pat.join('|')})`, 'i') : null;
    // herbs & crystals sacred to each deity
    this.sacredTo = {};
    const byName = {}; items.filter(i => i.type === 'herb' || i.type === 'crystal').forEach(i => byName[i.type + ':' + norm(i.name)] = i.id);
    items.filter(i => i.type === 'deity').forEach(d => {
      arr(d.herbs).forEach(n => { const id = byName['herb:' + norm(n)]; if (id) (this.sacredTo[id] = this.sacredTo[id] || []).push(d.id); });
      arr(d.gems).forEach(n => { const id = byName['crystal:' + norm(n)]; if (id) (this.sacredTo[id] = this.sacredTo[id] || []).push(d.id); });
    });
    // "used in" map
    this.usedIn = {};
    items.filter(i => FORMULA_TYPES.includes(i.type)).forEach(f => {
      const seen = new Set();
      arr(f.ingredients).forEach(g => {
        const txt = norm(typeof g === 'string' ? g : g.item);
        const re = this.linkRe && new RegExp(this.linkRe.source, 'ig'); let m;
        while (re && (m = re.exec(txt))) { const id = this.linkMap[m[1].toLowerCase()]; if (id && !seen.has(id)) { seen.add(id); (this.usedIn[id] = this.usedIn[id] || []).push(f.id); } }
      });
    });
  },
};
function blobOf(it) {
  const parts = [];
  for (const k in it) {
    if (['svg', 'image', 'id', 'builtin', 'updated', 'positions', 'color'].includes(k)) continue;
    const v = it[k];
    if (typeof v === 'string') parts.push(v);
    else if (Array.isArray(v)) v.forEach(x => parts.push(typeof x === 'string' ? x : Object.values(x || {}).join(' ')));
  }
  arr(it.positions).forEach(p => parts.push(p.name + ' ' + p.meaning));
  parts.push(TYPES[it.type].one);
  return parts.join(' \n ');
}
// wrap first herb/crystal mention in a link
function linkify(text) {
  const t = esc(text);
  if (!Store.linkRe) return t;
  const m = Store.linkRe.exec(norm(text));
  if (!m) return t;
  const id = Store.linkMap[m[1].toLowerCase()];
  // positions match because norm() keeps length for typical strings
  const start = m.index, end = start + m[1].length;
  if (norm(text).length !== text.length) return t;
  return esc(text.slice(0, start)) + `<a class="linked" href="#/view/${id}">${esc(text.slice(start, end))}</a>` + esc(text.slice(end));
}

/* ---------- search ---------- */
function search(q, { exactKeyword = false, types = null } = {}) {
  const nq = norm(q).trim(); if (!nq) return [];
  const toks = nq.split(/\s+/).filter(Boolean);
  const res = [];
  for (const e of Store.index) {
    if (types && !types.includes(e.it.type)) continue;
    let score = 0;
    if (exactKeyword) { if (e.kw.includes(nq)) score = 10; else continue; }
    else {
      if (!toks.every(t => e.blob.includes(t) || e.name.includes(t))) continue;
      if (e.name === nq) score += 50; else if (e.name.startsWith(nq)) score += 25; else if (e.name.includes(nq)) score += 15;
      if (e.kw.includes(nq)) score += 8;
      toks.forEach(t => { if (e.name.includes(t)) score += 4; if (e.kw.some(k => k.includes(t))) score += 2; });
      score += 1;
    }
    res.push({ it: e.it, score, blob: e.blob });
  }
  return res.sort((a, b) => b.score - a.score || a.it.name.localeCompare(b.it.name));
}
function snippet(it, q) {
  const toks = norm(q).split(/\s+/).filter(Boolean);
  const src = blobOf(it).replace(/\s*\n\s*/g, ' · ');
  const n = norm(src);
  let i = -1; for (const t of toks) { i = n.indexOf(t); if (i >= 0) break; }
  let s = i < 0 ? src.slice(0, 130) : (i > 50 ? '…' : '') + src.slice(Math.max(0, i - 50), i + 90) + '…';
  let h = esc(s);
  toks.forEach(t => { if (t.length > 1) h = h.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>'); });
  return h;
}

/* ---------- router ---------- */
const Routes = [];
function route(pattern, fn) { Routes.push({ re: new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$'), fn }); }
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  return { path: path || '', query: Object.fromEntries(new URLSearchParams(qs || '')) };
}
async function render() {
  const { path, query } = parseHash();
  const view = $('#view');
  for (const r of Routes) {
    const m = path.match(r.re);
    if (m) {
      const args = m.slice(1).map(decodeURIComponent);
      view.className = 'fade-in'; void view.offsetWidth;
      const scrollKey = 'scroll:' + location.hash;
      // which deck pictures and meanings a page shows: Tarot School and the lessons teach the Rider–Waite–Smith deck;
      // a reading page switches to the deck it was drawn with (see journal.js)
      window.__deckOverride = /^(school|learn)(\/|$)/.test(path) && !/^learn\/flash/.test(path) ? 'rws' : null;
      await r.fn(view, args, query);
      const saved = sessionStorage.getItem(scrollKey);
      window.scrollTo(0, saved ? +saved : 0);
      setTab(path);
      return;
    }
  }
  location.hash = '#/';
}
window.addEventListener('scroll', () => { try { sessionStorage.setItem('scroll:' + location.hash, String(window.scrollY)); } catch (e) { } }, { passive: true });
function setTitle(t, showBack = true) {
  $('#title').textContent = t;
  $('#backBtn').style.visibility = showBack ? 'visible' : 'hidden';
}
function setTab(path) {
  const top = path.split('/')[0];
  const sub = path.split('/')[1];
  $$('.tabbar a').forEach(a => {
    const t = a.dataset.tab;
    a.classList.toggle('on', (t === 'home' && top === '') || (t === 'layouts' && top === 'list') || (t === 'deck' && (top === 'deck' || top === 'card')) || (t === 'journal' && top === 'journal') || (t === 'moon' && top === 'moon') || (t === 'search' && top === 'search'));
  });
}
/* night-mode background colours: purple is the original look; the others are built from one hue */
const BG_PRESETS = [['purple', 'Purple', 262, 1], ['midnight', 'Midnight', 222, 1], ['ocean', 'Ocean', 184, 1], ['forest', 'Forest', 145, .85], ['wine', 'Wine', 345, 1], ['ember', 'Ember', 24, 1], ['obsidian', 'Obsidian', 262, 0]];
function bgHue() {
  const s = Store.settings, p = BG_PRESETS.find(x => x[0] === (s.bgTheme || 'purple'));
  if (s.bgTheme === 'custom' && s.bgHue != null) return [+s.bgHue, +s.bgSat];
  return p && p[0] !== 'purple' ? [p[2], p[3]] : null;
}
function bgVars(h, k = 1) {
  const S = x => Math.round(x * k), H = d => Math.round((h + d + 360) % 360);
  const c = (hh, s, l, a) => `hsl(${H(hh)} ${S(s)}% ${l}%${a == null ? '' : ` / ${a}`})`;
  return { '--bg': c(0, 38, 5), '--bg2': c(-2, 39, 9), '--card': c(0, 37, 13, .78), '--card-solid': c(0, 34, 12), '--card2': c(0, 38, 19, .6), '--input': c(0, 40, 8),
    '--muted': c(0, 13, 57), '--violet': c(0, 55, 68), '--chip': c(0, 55, 66, .16), '--chip-ink': c(0, 62, 87), '--chip-line': c(0, 55, 66, .3),
    '--neb1': c(0, 46, 51, .22), '--neb2': c(78, 55, 43, .12), '--neb3': c(-72, 33, 35, .14) };
}
function hslToHex(h, s, l) {
  s /= 100; l /= 100; const f = n => { const k = (n + h / 30) % 12, v = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(v * 255).toString(16).padStart(2, '0'); };
  return '#' + f(0) + f(8) + f(4);
}
function hexToHue(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round((h * 60 + 360) % 360), Math.min(1, Math.round(s * 100) / 60)];  // a fairly grey pick gives a grey background
}
const nightBg = () => { const hb = bgHue(); return hb ? hslToHex(hb[0], Math.round(38 * hb[1]), 5) : '#0b0812'; };
function applyTheme() {
  const t = Store.settings.theme || 'night', root = document.documentElement, hb = bgHue();
  root.dataset.mode = t;
  const vars = t === 'night' && hb ? bgVars(hb[0], hb[1]) : {};
  ['--bg', '--bg2', '--card', '--card-solid', '--card2', '--input', '--muted', '--violet', '--chip', '--chip-ink', '--chip-line', '--neb1', '--neb2', '--neb3'].forEach(k => vars[k] ? root.style.setProperty(k, vars[k]) : root.style.removeProperty(k));
  const bg = t === 'day' ? '#efe3c8' : nightBg();
  try { localStorage.setItem('theme', t); localStorage.setItem('bgvars', JSON.stringify(vars)); } catch (e) { }
  const meta = $('meta[name=theme-color]'); if (meta) meta.content = bg;
  if (window.AndroidBridge && AndroidBridge.setTheme) AndroidBridge.setTheme(t === 'day' ? 'day' : 'night:' + bg);
}
