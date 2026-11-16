/* ---------- Decks: Rider–Waite–Smith, Tarot de Marseille and Thoth ----------
   Every card keeps one identity everywhere in the app: its Rider–Waite–Smith name (e.g. "VIII · Strength"),
   which is what readings, statistics, favourites and Tarot School store. A deck only changes how a card is
   named, pictured and interpreted. Marseille's Justice (VIII) and Strength (XI), and Thoth's Adjustment and
   Lust, map to the same cards as Rider–Waite–Smith Justice and Strength.
   Marseille pictures: Nicolas Conver pattern, printed about 1890–1900 (BnF, public domain).
   Thoth: the Crowley/Harris paintings are under copyright, so each card gets an original designed face;
   anyone who owns the deck can photograph their own cards, and those photos stay on their phone. */
window.DECKS = {
  rws: { id: 'rws', name: 'Rider–Waite–Smith', sub: 'Pamela Colman Smith, 1909', credit: 'Rider–Waite–Smith artwork by Pamela Colman Smith (1909), public domain.', suits: { Wands: 'Wands', Cups: 'Cups', Swords: 'Swords', Pentacles: 'Pentacles' } },
  marseille: { id: 'marseille', name: 'Tarot de Marseille', sub: 'Nicolas Conver pattern, printed about 1890–1900', credit: 'Tarot de Marseille on the Nicolas Conver pattern, about 1890–1900, from the Bibliothèque nationale de France (public domain). The small stamps and old handwritten notes are part of the surviving copy.', suits: { Wands: 'Batons', Cups: 'Cups', Swords: 'Swords', Pentacles: 'Coins' } },
  thoth: { id: 'thoth', name: 'Thoth', sub: 'In the tradition of Crowley & Harris · designed faces', credit: 'Thoth meanings follow the tradition of Aleister Crowley and Lady Frieda Harris. The original paintings are under copyright and are not included: these are original designed faces. Add photos of your own cards in the card pages if you have the deck.', suits: { Wands: 'Wands', Cups: 'Cups', Swords: 'Swords', Pentacles: 'Disks' }, faces: true },
};
const DECK_ORDER = ['rws', 'marseille', 'thoth'];
const deckId = () => { const d = window.__deckOverride || (typeof Store !== 'undefined' && Store.settings && Store.settings.deck) || 'rws'; return DECKS[d] ? d : 'rws'; };
// a deck you photographed yourself is read exactly like the deck type you chose for it
const baseDeck = d => (DECKS[d] && DECKS[d].base) || (DECKS[d] ? d : 'rws');
const isMyDeck = d => !!(DECKS[d] && DECKS[d].custom);
const deckData = d => { d = baseDeck(d); return d === 'rws' ? null : ((window.DECK_DATA || {})[d] || null); };
const stripNum = n => String(n || '').replace(/^[0IVXL]+ · /, '');
const rwsShort = stripNum;
function deckMeaning(key, d = deckId()) { const dd = deckData(d); return (dd && dd[key]) || (window.TAROT_MEANINGS || {})[key]; }
function cardLabel(key, d = deckId()) { const dd = deckData(d); return dd && dd[key] ? dd[key].name : key; }
const cardShort = (key, d) => stripNum(cardLabel(key, d));
const cardTitle = (key, d = deckId()) => { const dd = deckData(d); const t = dd && dd[key] && dd[key].title; return t && stripNum(t) !== cardShort(key, d) ? t : ''; };
const suitLabel = (arcana, d = deckId()) => DECKS[baseDeck(d)].suits[arcana] || arcana;
const cardCode = key => { const c = TAROT_BY_NAME[key]; return c ? c.img.split('/').pop().replace('.jpg', '') : ''; };
function cardImg(key, d = deckId()) {
  const c = TAROT_BY_NAME[key]; if (!c) return '';
  if (!DECKS[d]) d = 'rws';
  const ph = DeckPhotos.get(d, key); if (ph) return ph;
  if (isMyDeck(d)) return cardImg(key, baseDeck(d));   // not photographed yet: the picture from its deck type
  if (d === 'marseille') return 'img/marseille/' + cardCode(key) + '.jpg';
  if (d === 'thoth') return ThothFaces.get(key);
  return c.img;
}
window.tarotImg = (name, d) => cardImg(name, d || deckId());
// keywords for a card in a deck, used in lists and the lightbox
const cardKeywords = (key, d) => { const m = deckMeaning(key, d); return m && m.keywords ? m.keywords : String((TAROT_BY_NAME[key] || {}).up || '').split(', '); };

/* ---- your own photos of your cards (kept on this phone only; included in backups) ---- */
const DeckPhotos = {
  map: {},
  async load() { this.map = (await DB.get('deckPhotos', {})) || {}; },
  get(d, key) { return (this.map[d] || {})[key] || ''; },
  count(d) { return Object.keys(this.map[d] || {}).length; },
  async set(d, key, url) { (this.map[d] = this.map[d] || {})[key] = url; if (!url) delete this.map[d][key]; await DB.set('deckPhotos', this.map); },
  async drop(d) { delete this.map[d]; await DB.set('deckPhotos', this.map); },
  async merge(m) { for (const d in m || {}) for (const k in m[d]) if (!this.get(d, k)) (this.map[d] = this.map[d] || {})[k] = m[d][k]; await DB.set('deckPhotos', this.map); },
};

/* ---- designed faces for the Thoth deck, drawn on the phone in the app's own style ---- */
const ThothFaces = (() => {
  const cache = {};
  const W = 360, H = 576;
  const PAL = { Major: ['#2b1650', '#0b0812', '#d4ad5a'], Wands: ['#4d1a0c', '#120607', '#f0a24a'], Cups: ['#0f2c52', '#060b16', '#8fc3f0'], Swords: ['#2a3442', '#0b0e14', '#e9df9a'], Pentacles: ['#163a22', '#060f09', '#b9d98a'] };
  const ELEM = { Wands: 'Fire', Cups: 'Water', Swords: 'Air', Pentacles: 'Earth' };
  const HEB = ['א', 'ב', 'ג', 'ד', 'צ', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'ה', 'ק', 'ר', 'ש', 'ת'];
  const ROM = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  function rr(x, y, w, h, r, ctx) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function tri(ctx, x, y, s, up, bar) {
    ctx.beginPath(); if (up) { ctx.moveTo(x, y - s); ctx.lineTo(x + s * .87, y + s * .5); ctx.lineTo(x - s * .87, y + s * .5); } else { ctx.moveTo(x, y + s); ctx.lineTo(x + s * .87, y - s * .5); ctx.lineTo(x - s * .87, y - s * .5); } ctx.closePath(); ctx.stroke();
    if (bar) { const yy = up ? y + s * .05 : y - s * .05; ctx.beginPath(); ctx.moveTo(x - s * .62, yy); ctx.lineTo(x + s * .62, yy); ctx.stroke(); }
  }
  const element = (ctx, el, x, y, s) => el === 'Fire' ? tri(ctx, x, y, s, true) : el === 'Water' ? tri(ctx, x, y, s, false) : el === 'Air' ? tri(ctx, x, y, s, true, true) : tri(ctx, x, y, s, false, true);
  function symbol(ctx, suit, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = Math.max(1.6, s * .09); ctx.lineCap = 'round';
    if (suit === 'Wands') { ctx.beginPath(); ctx.moveTo(0, s); ctx.lineTo(0, -s * .55); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * .38, -s * .55, 0, -s * .38); ctx.quadraticCurveTo(-s * .38, -s * .55, 0, -s); ctx.fill(); ctx.beginPath(); ctx.arc(0, s, s * .12, 0, 7); ctx.fill(); }
    else if (suit === 'Cups') { ctx.beginPath(); ctx.moveTo(-s * .55, -s * .7); ctx.quadraticCurveTo(-s * .55, s * .05, 0, s * .1); ctx.quadraticCurveTo(s * .55, s * .05, s * .55, -s * .7); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, s * .1); ctx.lineTo(0, s * .75); ctx.moveTo(-s * .38, s * .85); ctx.lineTo(s * .38, s * .85); ctx.stroke(); }
    else if (suit === 'Swords') { ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s * .55); ctx.moveTo(-s * .42, s * .5); ctx.lineTo(s * .42, s * .5); ctx.stroke(); ctx.beginPath(); ctx.arc(0, s * .86, s * .13, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, 0, s * .82, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * .3, 0, 7); ctx.stroke(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * .3, Math.sin(a) * s * .3); ctx.lineTo(Math.cos(a) * s * .82, Math.sin(a) * s * .82); ctx.stroke(); } }
    ctx.restore();
  }
  const LAYOUT = { 1: [[0, 0]], 2: [[0, -.5], [0, .5]], 3: [[0, -.62], [0, 0], [0, .62]], 4: [[-.42, -.45], [.42, -.45], [-.42, .45], [.42, .45]], 5: [[-.42, -.55], [.42, -.55], [0, 0], [-.42, .55], [.42, .55]], 6: [[-.42, -.6], [.42, -.6], [-.42, 0], [.42, 0], [-.42, .6], [.42, .6]], 7: [[-.42, -.66], [.42, -.66], [0, -.33], [-.42, 0], [.42, 0], [-.42, .66], [.42, .66]], 8: [[-.42, -.72], [.42, -.72], [-.42, -.24], [.42, -.24], [-.42, .24], [.42, .24], [-.42, .72], [.42, .72]], 9: [[-.42, -.72], [.42, -.72], [-.42, -.24], [.42, -.24], [0, 0], [-.42, .24], [.42, .24], [-.42, .72], [.42, .72]], 10: [[-.42, -.75], [.42, -.75], [0, -.5], [-.42, -.25], [.42, -.25], [-.42, .25], [.42, .25], [0, .5], [-.42, .75], [.42, .75]] };
  function wrap(ctx, text, maxW) { const words = text.split(' '), lines = []; let cur = ''; words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
  function draw(key) {
    const c = TAROT_BY_NAME[key]; if (!c) return '';
    const m = deckMeaning(key, 'thoth') || {}, arc = c.arcana, [c1, c2, gold] = PAL[arc] || PAL.Major;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W / 2, H * .42, 10, W / 2, H * .42, W * .62); g.addColorStop(0, gold + '55'); g.addColorStop(1, gold + '00'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#d4ad5a'; ctx.lineWidth = 3; rr(9, 9, W - 18, H - 18, 14, ctx); ctx.stroke(); ctx.lineWidth = 1; ctx.globalAlpha = .6; rr(19, 19, W - 38, H - 38, 9, ctx); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#e9cf86'; ctx.strokeStyle = '#e9cf86'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const idx = TAROT_DECK.indexOf(c), rank = arc === 'Major' ? -1 : (idx - 22) % 14;
    const top = arc === 'Major' ? (String(m.name || '').split(' · ')[0] || '0') : rank < 10 ? (rank ? ROM[rank + 1] : 'ACE') : ['PRINCESS', 'KNIGHT', 'QUEEN', 'PRINCE'][rank - 10];
    ctx.font = '700 30px "Cinzel Decorative", Georgia, serif'; ctx.fillText(top, W / 2, 52);
    // the emblem
    const cy = 250, box = 150; ctx.save(); ctx.globalAlpha = .95;
    if (arc === 'Major') {
      ctx.lineWidth = 1.5; [118, 104].forEach(r => { ctx.beginPath(); ctx.arc(W / 2, cy, r, 0, 7); ctx.stroke(); });
      ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4; ctx.moveTo(W / 2 + Math.cos(a) * 104, cy + Math.sin(a) * 104); ctx.lineTo(W / 2 + Math.cos(a + Math.PI * 3 / 4) * 104, cy + Math.sin(a + Math.PI * 3 / 4) * 104); } ctx.stroke();
      ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(W / 2, cy, 52, 0, 7); ctx.fill(); ctx.fillStyle = '#f0d48a'; ctx.beginPath(); ctx.arc(W / 2, cy, 52, 0, 7); ctx.stroke();
      ctx.font = '64px "Times New Roman", serif'; ctx.fillText(HEB[idx] || '', W / 2, cy + 4);
    } else if (rank < 10) {
      const n = rank + 1, s = n === 1 ? 70 : n <= 3 ? 34 : 28;
      if (n === 1) { ctx.lineWidth = 1; for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * 88, cy + Math.sin(a) * 88); ctx.lineTo(W / 2 + Math.cos(a) * (k % 2 ? 108 : 122), cy + Math.sin(a) * (k % 2 ? 108 : 122)); ctx.stroke(); } }
      LAYOUT[n].forEach(([x, y]) => symbol(ctx, arc, W / 2 + x * box * .9, cy + y * box, s));
    } else {
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(W / 2, cy, 112, 0, 7); ctx.stroke();
      symbol(ctx, arc, W / 2, cy - 18, 46);
      const sub = { 10: 'Earth', 11: 'Fire', 12: 'Water', 13: 'Air' }[rank]; ctx.lineWidth = 2.2;
      element(ctx, sub, W / 2 - 34, cy + 64, 17); element(ctx, ELEM[arc], W / 2 + 34, cy + 64, 17);
    }
    ctx.restore();
    // title, name, astrology
    const title = (m.title || '').toUpperCase(); ctx.font = '700 25px "Cinzel Decorative", Georgia, serif';
    let lines = wrap(ctx, title, W - 64); if (lines.length > 2) { ctx.font = '700 20px "Cinzel Decorative", Georgia, serif'; lines = wrap(ctx, title, W - 60); }
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 422 + i * 30 - (lines.length - 1) * 15));
    ctx.fillStyle = '#d9c9a8'; ctx.font = 'italic 21px "Cormorant", Georgia, serif'; ctx.fillText(arc === 'Major' ? 'Major Arcana' : stripNum(cardLabel(key, 'thoth')), W / 2, 474);
    ctx.fillStyle = '#b9a98f'; ctx.font = '16px "Cormorant", Georgia, serif';
    const astro = String(m.astrology || '').replace(/^Hebrew letter /, ''); wrap(ctx, astro, W - 70).slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, 506 + i * 20));
    ctx.strokeStyle = '#d4ad5a'; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(W / 2 - 60, 88); ctx.lineTo(W / 2 + 60, 88); ctx.stroke(); ctx.globalAlpha = 1;
    return cv.toDataURL('image/jpeg', .86);
  }
  // the faces use the app's fonts; wait for them (briefly) before the first one is drawn
  let fontsP = null;
  const wait = () => fontsP || (fontsP = Promise.race([
    document.fonts && document.fonts.load ? Promise.all(['700 30px "Cinzel Decorative"', 'italic 21px "Cormorant"', '16px "Cormorant"'].map(f => document.fonts.load(f))) : Promise.resolve(),
    new Promise(r => setTimeout(r, 2500))]).catch(() => { }));
  return { get: key => cache[key] || (cache[key] = draw(key)), wait, clear: () => { for (const k in cache) delete cache[k]; } };
})();
