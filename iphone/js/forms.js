/* Add / edit forms, image picker, sigil studio, tarot layout editor */
const COMMON_TAIL = [
  ['bestTime', 'Best time of year', 'text', 'e.g. Autumn, Samhain to Yule'],
  ['moonPhases', 'Best moon phase(s)', 'phases'],
];
const FORMULA_FIELDS = [
  ['name', 'Title', 'text'], ['image', 'Page image', 'image'],
  ['description', 'Description', 'area'],
  ['metaphysical', 'Keywords · metaphysical use', 'keywords', 'protection, love, money…'],
  ['medical', 'Keywords · medical use', 'keywords', 'insomnia, digestion… (leave blank if none)'],
  ['ingredients', 'Ingredients', 'ingredients'],
  ['steps', 'Steps for preparation', 'list', 'Describe a step…'],
  ['howToUse', 'How to use / work the spell', 'area'],
  ['chant', 'Chant or words to say', 'area', 'Rhymes, prayers, incantations…'],
  ['intention', 'Statement of intention', 'text'],
  ...COMMON_TAIL,
  ['caution', 'Cautions', 'area'],
];
const FIELDS = {
  deity: [
    ['name', 'Name', 'text'], ['altNames', 'Alternate names', 'keywords', 'comma separated'], ['title', 'Title or epithet', 'text', 'e.g. Keeper of the Cauldron'],
    ['pantheon', 'Pantheon / culture', 'text'], ['image', 'Picture', 'image'],
    ['metaphysical', 'What they represent (keywords)', 'keywords', 'wisdom, transformation…'], ['represents', 'What they represent', 'area'],
    ['description', 'History & lore', 'area'],
    ['gems', 'Sacred gems & stones', 'keywords', 'Amethyst, Moonstone…'], ['herbs', 'Sacred herbs', 'keywords', 'Mugwort, Vervain…'],
    ['items', 'Sacred symbols & items', 'list', 'A symbol or item…'], ['animals', 'Animals', 'keywords'], ['colors', 'Colours', 'keywords'],
    ['planet', 'Planet', 'text'], ['element', 'Element', 'text'], ['sacredDays', 'Sacred days & festivals', 'text'],
    ['howToInvoke', 'How to invoke', 'area'], ['invocation', 'Words of invocation', 'area'],
    ['offerings', 'Offerings they love', 'list', 'An offering…'], ['avoid', 'What to avoid', 'text'],
    ...COMMON_TAIL, ['caution', 'Notes on respect', 'area'],
  ],
  spell: FORMULA_FIELDS, oil: FORMULA_FIELDS, incense: FORMULA_FIELDS, tincture: FORMULA_FIELDS, brew: FORMULA_FIELDS,
  sigil: [
    ['name', 'Name', 'text'], ['sigil', 'Draw or upload the sigil', 'sigil'],
    ['description', 'Description', 'area'],
    ['metaphysical', 'Keywords · metaphysical use', 'keywords', 'protection, luck…'],
    ['intention', 'Words of intention', 'area', 'What you speak while charging it'],
    ['directions', 'Directions for use', 'area', 'How to charge, activate, where to place it…'],
    ...COMMON_TAIL, ['origin', 'Origin / tradition', 'text'],
  ],
  tarot: [
    ['name', 'Name', 'text'], ['description', 'Description', 'area'],
    ['positions', 'Card positions', 'positions'],
    ['howToUse', 'How to use', 'area'], ['intention', 'Question or words before drawing', 'area'],
    ['metaphysical', 'Keywords', 'keywords', 'divination, love…'], ['difficulty', 'Difficulty', 'text', 'Beginner / Intermediate / Advanced'],
    ...COMMON_TAIL,
  ],
  herb: [
    ['name', 'Name', 'text'], ['latin', 'Latin name', 'text'], ['folkNames', 'Witchcraft / folk names', 'keywords', 'comma separated'],
    ['image', 'Picture', 'image'], ['description', 'Description', 'area'],
    ['metaphysical', 'Keywords · metaphysical use', 'keywords'], ['medical', 'Keywords · medical use', 'keywords'],
    ['metaphysicalUses', 'Metaphysical uses', 'area'], ['medicalUses', 'Medical uses', 'area'],
    ['uses', 'Ways to use', 'list', 'A practical use…'], ['whereToFind', 'Where to find', 'area'],
    ['planet', 'Planet', 'text'], ['element', 'Element', 'text'], ['gender', 'Gender', 'text'], ['deities', 'Deities', 'keywords'], ['partsUsed', 'Parts used', 'text'],
    ...COMMON_TAIL, ['caution', 'Cautions', 'area'], ['toxic', 'Poisonous — never ingest', 'check'],
  ],
  crystal: [
    ['name', 'Name', 'text'], ['folkNames', 'Witchcraft / metaphysical names', 'keywords', 'comma separated'],
    ['image', 'Picture', 'image'], ['color', 'Colour (for its emblem)', 'color'], ['colors', 'Colours', 'text'],
    ['description', 'Description', 'area'], ['metaphysical', 'Keywords · metaphysical use', 'keywords'],
    ['metaphysicalUses', 'Metaphysical uses', 'area'], ['uses', 'Ways to use', 'list', 'A practical use…'],
    ['substitutes', 'Substitute crystals', 'keywords', 'Clear Quartz, Amethyst…'], ['substituteNotes', 'Why those substitutes work', 'text'],
    ['mineral', 'Mineral', 'text'], ['chakra', 'Chakra', 'text'], ['element', 'Element', 'text'], ['planet', 'Planet', 'text'], ['zodiac', 'Zodiac', 'keywords'], ['hardness', 'Hardness', 'text'],
    ['cleansing', 'Cleansing & charging', 'area'], ['whereToFind', 'Where to find', 'area'],
    ...COMMON_TAIL, ['caution', 'Cautions', 'area'],
  ],
};

route('edit/:type', (v, [type]) => editPage(v, type, null));
route('edit/:type/:id', (v, [type, id]) => editPage(v, type, id));

function editPage(v, type, id) {
  const T = TYPES[type]; if (!T) return (location.hash = '#/');
  const orig = id ? Store.get(id) : null;
  const it = orig ? JSON.parse(JSON.stringify(orig)) : { type, name: '' };
  setTitle(orig ? `Edit ${T.one}` : `New ${T.one}`);
  const fields = FIELDS[type];
  const ctl = {}; // custom controls with get()
  v.innerHTML = `<form class="form" id="ef" autocomplete="off">${fields.map(([k, label, kind, ph]) => fieldHTML(k, label, kind, ph, it)).join('')}
    <div class="actions" style="margin-top:24px"><button type="button" class="btn ghost" id="cancel">Cancel</button><button type="submit" class="btn primary">${ART.star} Save to the Grimoire</button></div></form>`;
  fields.forEach(([k, , kind]) => {
    const el = $(`[data-field="${k}"]`, v);
    if (kind === 'ingredients') ctl[k] = dynList(el, arr(it[k]).map(g => typeof g === 'string' ? { item: g, amount: '' } : g), true);
    if (kind === 'list') ctl[k] = dynList(el, arr(it[k]), false);
    if (kind === 'image') ctl[k] = imagePicker(el, it.image);
    if (kind === 'phases') ctl[k] = phasePicker(el, arr(it.moonPhases));
    if (kind === 'sigil') ctl[k] = sigilStudio(el, it);
    if (kind === 'positions') ctl[k] = positionsEditor(el, arr(it.positions));
  });
  $('#cancel', v).onclick = () => history.back();
  $('#ef', v).onsubmit = async e => {
    e.preventDefault();
    const out = { ...it };
    for (const [k, , kind] of fields) {
      const el = $(`[data-field="${k}"]`, v);
      if (['text', 'area'].includes(kind)) out[k] = $('input,textarea', el).value.trim();
      else if (kind === 'keywords') out[k] = $('input', el).value.split(',').map(s => s.trim()).filter(Boolean).map(s => ['folkNames', 'substitutes', 'deities', 'zodiac', 'altNames', 'gems', 'herbs', 'animals', 'colors'].includes(k) ? s : s.toLowerCase());
      else if (kind === 'check') out[k] = $('input', el).checked;
      else if (kind === 'color') out[k] = $('input', el).value;
      else if (kind === 'phases') out.moonPhases = ctl[k].get();
      else if (kind === 'image') out.image = ctl[k].get();
      else if (kind === 'sigil') { const s = ctl[k].get(); if (s) { out.image = s; } }
      else out[k] = ctl[k].get();
    }
    if (!out.name) { toast('Every page needs a name'); return; }
    if (type === 'tarot') out.cardCount = arr(out.positions).length;
    if (!orig) out.id = uid(type);
    if (orig && Store.seed[orig.id]) out.edited = true;
    delete out.builtin;
    await Store.save(out);
    toast('Inscribed in the grimoire ✶');
    location.replace(`#/view/${encodeURIComponent(out.id)}`);
  };
}
function fieldHTML(k, label, kind, ph = '', it) {
  const val = it[k];
  const L = `<label>${esc(label)}</label>`;
  switch (kind) {
    case 'text': return `<div data-field="${k}">${L}<input type="text" value="${esc(val || '')}" placeholder="${esc(ph)}"></div>`;
    case 'area': return `<div data-field="${k}">${L}<textarea placeholder="${esc(ph)}">${esc(val || '')}</textarea></div>`;
    case 'keywords': return `<div data-field="${k}">${L}<input type="text" value="${esc(arr(val).join(', '))}" placeholder="${esc(ph || 'comma separated')}"><div class="hint">Separate with commas</div></div>`;
    case 'check': return `<div data-field="${k}" class="switch"><b class="fell">${esc(label)}</b><input type="checkbox" ${val ? 'checked' : ''} style="width:24px;height:24px;accent-color:var(--crimson)"></div>`;
    case 'color': return `<div data-field="${k}">${L}<input type="color" value="${esc(val || '#9d7bd8')}" style="width:70px;height:40px;border:0;background:none"></div>`;
    default: return `<div data-field="${k}">${L}<div class="ctl"></div></div>`;
  }
}

/* dynamic list (steps / uses / ingredients) */
function dynList(el, items, ingredients) {
  const box = $('.ctl', el); box.className = 'ctl dyn';
  const add = (v = ingredients ? { item: '', amount: '' } : '') => {
    const d = document.createElement('div'); d.className = 'item';
    d.innerHTML = ingredients
      ? `<input type="text" class="it" placeholder="Ingredient" value="${esc(v.item)}"><input type="text" class="amt" placeholder="Amount" value="${esc(v.amount || '')}"><button type="button" class="iconbtn del">${ART.close}</button>`
      : `<span class="num"></span><textarea rows="2" style="min-height:44px">${esc(v)}</textarea><button type="button" class="iconbtn del">${ART.close}</button>`;
    $('.del', d).onclick = () => { d.remove(); renum(); };
    list.appendChild(d); renum();
  };
  box.innerHTML = `<div class="items"></div><button type="button" class="btn small ghost">${ART.plus} Add ${ingredients ? 'ingredient' : 'line'}</button>`;
  const list = $('.items', box);
  const renum = () => $$('.num', list).forEach((n, i) => n.textContent = i + 1 + '.');
  $('button.btn', box).onclick = () => { add(); const last = list.lastElementChild; $('input,textarea', last).focus(); };
  (items.length ? items : [undefined]).forEach(x => add(x));
  return {
    get: () => $$('.item', list).map(d => ingredients ? { item: $('.it', d).value.trim(), amount: $('.amt', d).value.trim() } : $('textarea', d).value.trim()).filter(x => ingredients ? x.item : x)
  };
}

/* image picker: phone photo or built-in witchy art */
function imagePicker(el, value) {
  let val = value || '';
  const box = $('.ctl', el); box.className = 'ctl imgpick';
  const paint = () => {
    $('.preview', box).innerHTML = !val ? `<span class="muted small">No image — a sigil-mark will be used</span>` : val.startsWith('art:') ? ART[val.slice(4)] : `<img src="${esc(val)}">`;
  };
  box.innerHTML = `<div class="preview"></div><button type="button" class="btn small" data-a="photo">${ART.image} Photo from phone</button><button type="button" class="btn small ghost" data-a="art">${ART.moon} Witchy artwork</button><button type="button" class="btn small ghost" data-a="none">Remove</button>`;
  box.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'photo') { const f = await pickFile('image/*'); if (f) { try { val = await readImageFile(f); paint(); } catch (er) { toast('Could not read that image'); } } }
    if (b.dataset.a === 'none') { val = ''; paint(); }
    if (b.dataset.a === 'art') {
      modal(`<h2>Choose Artwork</h2><div class="gallery">${ART_GALLERY.map(n => `<button type="button" data-n="${n}" class="${val === 'art:' + n ? 'on' : ''}">${ART[n]}</button>`).join('')}</div>`, (m, close) => {
        m.onclick = ev => { const g = ev.target.closest('[data-n]'); if (g) { val = 'art:' + g.dataset.n; paint(); close(); } else if (ev.target === m) close(); };
      });
    }
  };
  paint();
  makeZoomable($('.preview', box));
  return { get: () => val };
}
function phasePicker(el, sel) {
  const s = new Set(sel);
  const box = $('.ctl', el); box.className = 'ctl chips';
  box.innerHTML = MOON.ALL_PHASES.map((p, i) => `<button type="button" class="chip gold ${s.has(p) ? 'on' : ''}" data-p="${p}"><span style="width:16px;height:16px;display:inline-block">${MOON.svg(p === 'Dark Moon' ? .995 : i / 8, 16)}</span>${p}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('button'); if (!b) return; const p = b.dataset.p; s.has(p) ? s.delete(p) : s.add(p); b.classList.toggle('on'); };
  return { get: () => MOON.ALL_PHASES.filter(p => s.has(p)) };
}

/* ---------- Sigil studio ---------- */
// geometry for the shape tools: returns [{pts, closed}] for a centre c, radius r, rotation a
const SIGIL_TOOLS = [
  ['pen', 'Pen'], ['line', 'Line'], ['arrow', 'Arrow'], ['circle', 'Circle'], ['triangle', 'Triangle'], ['square', 'Square'],
  ['diamond', 'Diamond'], ['pentagon', 'Pentagon'], ['hexagon', 'Hexagon'], ['pentagram', 'Pentagram'], ['arc', 'Arc'], ['star', 'Star'],
  ['crescent', 'Crescent'], ['triplemoon', 'Triple Moon'], ['cross', 'Cross'], ['spiral', 'Spiral'], ['heart', 'Heart'], ['eraser', 'Eraser'],
];
function shapeGeom(sh, c, r, a, p1, p2, sweep = Math.PI) {
  const P = (ang, rad, cc = c) => [cc[0] + Math.cos(ang) * rad, cc[1] + Math.sin(ang) * rad];
  const poly = (n, off = 0, rad = r) => Array.from({ length: n }, (_, k) => P(a + off + k * 2 * Math.PI / n, rad));
  const circ = (cc, rad, steps = 96) => Array.from({ length: steps }, (_, k) => P(k * 2 * Math.PI / steps, rad, cc));
  const crescent = (cc, rad, dir) => { // bite taken out on the `dir` side
    const d = 0.45 * rad, r2 = 0.85 * rad;
    const del = Math.acos((rad * rad + d * d - r2 * r2) / (2 * rad * d));
    const beta = Math.atan2(rad * Math.sin(del), rad * Math.cos(del) - d);
    const c2 = P(dir, d, cc), pts = [];
    for (let k = 0; k <= 40; k++) pts.push(P(dir + del + k * (2 * Math.PI - 2 * del) / 40, rad, cc));
    for (let k = 0; k <= 40; k++) pts.push(P(dir + 2 * Math.PI - beta - k * (2 * Math.PI - 2 * beta) / 40, r2, c2));
    return pts;
  };
  switch (sh) {
    case 'line': return [{ pts: [p1, p2] }];
    case 'arrow': {
      const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), h = Math.max(18, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 0.18);
      return [{ pts: [p1, p2] }, { pts: [[p2[0] - h * Math.cos(ang - 0.5), p2[1] - h * Math.sin(ang - 0.5)], p2, [p2[0] - h * Math.cos(ang + 0.5), p2[1] - h * Math.sin(ang + 0.5)]] }];
    }
    case 'circle': return [{ pts: circ(c, r), closed: true }];
    case 'arc': { const n = Math.max(2, Math.ceil(Math.abs(sweep) / (Math.PI / 48))); return [{ pts: Array.from({ length: n + 1 }, (_, k) => P(a + sweep * k / n, r)) }]; }
    case 'triangle': return [{ pts: poly(3), closed: true }];
    case 'square': return [{ pts: poly(4, Math.PI / 4), closed: true }];
    case 'diamond': { const q = poly(4); q[1] = P(a + Math.PI / 2, r * 0.62); q[3] = P(a - Math.PI / 2, r * 0.62); return [{ pts: q, closed: true }]; }
    case 'pentagon': return [{ pts: poly(5), closed: true }];
    case 'hexagon': return [{ pts: poly(6), closed: true }];
    case 'pentagram': { const v = poly(5); return [{ pts: [0, 2, 4, 1, 3].map(i => v[i]), closed: true }]; }
    case 'hexagram': return [{ pts: poly(3), closed: true }, { pts: poly(3, Math.PI), closed: true }];
    case 'star': return [{ pts: Array.from({ length: 10 }, (_, k) => P(a + k * Math.PI / 5, k % 2 ? r * 0.42 : r)), closed: true }];
    case 'crescent': return [{ pts: crescent(c, r, a + Math.PI / 2), closed: true }];
    case 'triplemoon': {
      const rr = r * 0.34, side = a + Math.PI / 2; // left/right of the drag direction
      const L = P(side, r * 0.66), R = P(side + Math.PI, r * 0.66);
      return [{ pts: circ(c, rr), closed: true }, { pts: crescent(L, rr, side + Math.PI), closed: true }, { pts: crescent(R, rr, side), closed: true }];
    }
    case 'cross': return [{ pts: [P(a, r), P(a + Math.PI, r)] }, { pts: [P(a + Math.PI / 2, r), P(a - Math.PI / 2, r)] }];
    case 'spiral': return [{ pts: Array.from({ length: 160 }, (_, k) => P(a + k / 159 * 6 * Math.PI, r * k / 159)) }];
    case 'heart': {
      const pts = [];
      for (let k = 0; k < 100; k++) {
        const t = k / 100 * 2 * Math.PI, x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const rot = a + Math.PI / 2, xs = x / 17 * r, ys = (y + 2) / 17 * r;
        pts.push([c[0] + xs * Math.cos(rot) - ys * Math.sin(rot), c[1] + xs * Math.sin(rot) + ys * Math.cos(rot)]);
      }
      return [{ pts, closed: true }];
    }
  }
  return [];
}
function toolIcon(t) {
  if (t === 'pen') return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 18c3-1 4-6 7-7s3 4 6 2 3-6 3-6"/></svg>`;
  if (t === 'eraser') return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 15l8-8 6 6-5 5H8z"/><path d="M10 9l6 6M8 18h12"/></svg>`;
  const g = t === 'arc' ? shapeGeom('arc', [12, 15], 8.5, Math.PI * 1.05, null, null, Math.PI * 0.9) : shapeGeom(t, [12, 12], 8.5, -Math.PI / 2, [4, 19], [20, 5]);
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${g.map(p => `<${p.closed ? 'polygon' : 'polyline'} points="${p.pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')}"/>`).join('')}</svg>`;
}
function sigilStudio(el, it) {
  const box = $('.ctl', el);
  const N = 900;
  const colors = ['#d4ad5a', '#f3ead6', '#c0c6d6', '#c4475b', '#9d7bd8', '#7fae8c', '#111111'];
  let color = colors[0], size = 14, sym = 0, glow = true, dirty = false, tool = 'pen', fill = false, snap = true;
  let base = null; // Image used as background layer (uploaded / existing / svg)
  const strokes = []; let cur = null;
  box.innerHTML = `
    <div class="canvas-wrap"><svg class="guide" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width=".4"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="22" stroke-dasharray="1 2"/><circle cx="50" cy="50" r="2"/><line x1="50" y1="4" x2="50" y2="96" stroke-dasharray="1 2"/><line x1="4" y1="50" x2="96" y2="50" stroke-dasharray="1 2"/></svg><canvas width="${N}" height="${N}"></canvas></div>
    <div class="toolgrid" id="tools">${SIGIL_TOOLS.map(([t, l]) => `<button type="button" data-t="${t}" class="${t === tool ? 'on' : ''}" aria-label="${l}">${toolIcon(t)}<span>${l}</span></button>`).join('')}</div>
    <div class="tools">${colors.map(c => `<button type="button" class="swatch ${c === color ? 'on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div>
    <div class="tools"><span class="small">Brush</span><input type="range" min="3" max="48" value="${size}" id="bs">
      <div class="seg" id="sym"><button type="button" data-s="0" class="on">Free</button><button type="button" data-s="1">Mirror</button><button type="button" data-s="4">4×</button><button type="button" data-s="6">6×</button><button type="button" data-s="8">8×</button></div></div>
    <div class="tools">
      <div class="seg"><button type="button" data-a="fill">Outline</button><button type="button" data-a="snap" class="on">Snap</button></div>
      <button type="button" class="btn small ghost" data-a="undo">Undo</button>
      <button type="button" class="btn small ghost" data-a="clear">Clear</button>
      <button type="button" class="btn small ghost" data-a="guide">Guide</button>
      <button type="button" class="btn small ghost" data-a="glow">Glow</button>
    </div>
    <div class="tools">
      <button type="button" class="btn small" data-a="upload">${ART.image} Upload</button>
      <button type="button" class="btn small" data-a="gen">${ART.eye} From words</button>
    </div>
    <p class="hint center" id="thint"></p>`;
  const HINTS = {
    pen: 'Draw freely with your finger.', eraser: 'Rub out parts of your drawing.',
    line: 'Drag from one end of the line to the other.', arrow: 'Drag from the tail to the point.',
    arc: 'Touch where the centre of the arc goes, drag out to where the arc should start, then keep your finger down and sweep around to draw the curve. With Snap on, it locks to the centre, the guide rings and 15° steps.',
  };
  const setHint = () => $('#thint', box).textContent = HINTS[tool] || `Touch where the centre of the ${SIGIL_TOOLS.find(x => x[0] === tool)[1].toLowerCase()} goes, then drag outward to size and turn it. With Snap on, it locks to the centre, the guide rings and 15° turns.`;
  setHint();
  const cv = $('canvas', box), ctx = cv.getContext('2d');
  const redraw = () => {
    ctx.clearRect(0, 0, N, N);
    if (base) { const s = Math.min(N / base.width, N / base.height); const w = base.width * s, h = base.height * s; ctx.drawImage(base, (N - w) / 2, (N - h) / 2, w, h); }
    strokes.forEach(drawStroke);
  };
  function tracePts(p, closed) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); p.slice(1).forEach(q => ctx.lineTo(q[0], q[1])); if (closed) ctx.closePath(); }
  function drawStroke(st) {
    const c = N / 2;
    const n = st.sym === 1 ? 2 : st.sym || 1;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = st.color; ctx.fillStyle = st.color; ctx.lineWidth = st.size;
    if (st.erase) ctx.globalCompositeOperation = 'destination-out';
    else if (st.glow) { ctx.shadowColor = st.color; ctx.shadowBlur = st.size * 1.2; }
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.translate(c, c);
      if (st.sym === 1) { if (i === 1) ctx.scale(-1, 1); } else if (st.sym > 1) ctx.rotate(i * 2 * Math.PI / st.sym);
      ctx.translate(-c, -c);
      const p = st.pts;
      if (st.kind === 'shape') {
        shapeGeom(st.shape, st.c, st.r, st.a, st.p1, st.p2, st.sweep).forEach(g => { tracePts(g.pts, g.closed); if (st.fill && g.closed) ctx.fill(); ctx.stroke(); });
      }
      else if (st.kind === 'circle') { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], st.r, 0, Math.PI * 2); ctx.stroke(); }
      else if (st.straight) { tracePts(p); ctx.stroke(); }
      else if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], st.size / 2, 0, Math.PI * 2); ctx.fill(); }
      else {
        ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
        for (let j = 1; j < p.length - 1; j++) { const mx = (p[j][0] + p[j + 1][0]) / 2, my = (p[j][1] + p[j + 1][1]) / 2; ctx.quadraticCurveTo(p[j][0], p[j][1], mx, my); }
        ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  // snapping helpers
  const RINGS = [0.44 * N, 0.22 * N];
  const snapPoint = q => {
    if (!snap) return q;
    const cands = [[N / 2, N / 2]];
    strokes.forEach(s => { if (s.kind === 'shape') { if (s.p1) cands.push(s.p1, s.p2); else cands.push(s.c); } });
    for (const k of cands) if (Math.hypot(q[0] - k[0], q[1] - k[1]) < N * 0.035) return k.slice();
    return q;
  };
  const snapAngle = ang => snap ? Math.round(ang / (Math.PI / 12)) * (Math.PI / 12) : ang;
  const snapRadius = (r, c) => {
    if (!snap) return r;
    if (Math.hypot(c[0] - N / 2, c[1] - N / 2) < 1) for (const R of RINGS) if (Math.abs(r - R) < N * 0.025) return R;
    return r;
  };
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * N, (e.clientY - r.top) / r.height * N]; };
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    const q = pos(e);
    if (tool === 'pen' || tool === 'eraser') cur = { color, size: tool === 'eraser' ? Math.max(size, 24) : size, sym, glow, erase: tool === 'eraser', pts: [q] };
    else if (tool === 'line' || tool === 'arrow') { const s0 = snapPoint(q); cur = { kind: 'shape', shape: tool, p1: s0, p2: s0.slice(), color, size, sym, glow }; }
    else if (tool === 'arc') cur = { kind: 'shape', shape: 'arc', c: snapPoint(q), r: 0, a: 0, sweep: 0, color, size, sym, glow, _raw: 0, _last: null };
    else cur = { kind: 'shape', shape: tool, c: snapPoint(q), r: 0, a: -Math.PI / 2, color, size, sym, glow, fill };
    cur._start = q;
    strokes.push(cur); dirty = true; redraw();
  });
  cv.addEventListener('pointermove', e => {
    if (!cur) return;
    const q = pos(e);
    if (!cur.kind) cur.pts.push(q);
    else if (cur.p1) {
      let ang = Math.atan2(q[1] - cur.p1[1], q[0] - cur.p1[0]), len = Math.hypot(q[0] - cur.p1[0], q[1] - cur.p1[1]);
      const sp = snapPoint(q);
      if (snap && (sp[0] !== q[0] || sp[1] !== q[1]) && Math.hypot(sp[0] - cur.p1[0], sp[1] - cur.p1[1]) > 1) cur.p2 = sp;
      else { ang = snapAngle(ang); cur.p2 = [cur.p1[0] + Math.cos(ang) * len, cur.p1[1] + Math.sin(ang) * len]; }
    } else if (cur.shape === 'arc') {
      const d = Math.hypot(q[0] - cur.c[0], q[1] - cur.c[1]), ang = Math.atan2(q[1] - cur.c[1], q[0] - cur.c[0]);
      cur.r = snapRadius(d, cur.c);
      if (cur._last === null) { if (d > N * 0.03) { cur.a = snapAngle(ang); cur._last = ang; } }
      else {
        let dA = ang - cur._last; if (dA > Math.PI) dA -= 2 * Math.PI; if (dA < -Math.PI) dA += 2 * Math.PI;
        cur._raw = Math.max(-2 * Math.PI, Math.min(2 * Math.PI, cur._raw + dA)); cur._last = ang;
        cur.sweep = snap ? Math.round(cur._raw / (Math.PI / 12)) * (Math.PI / 12) : cur._raw;
      }
    } else {
      cur.r = snapRadius(Math.hypot(q[0] - cur.c[0], q[1] - cur.c[1]), cur.c);
      if (cur.r > 2) cur.a = snapAngle(Math.atan2(q[1] - cur.c[1], q[0] - cur.c[0]));
    }
    redraw();
  });
  const end = () => {
    if (cur && cur.kind === 'shape' && (cur.p1 ? Math.hypot(cur.p2[0] - cur.p1[0], cur.p2[1] - cur.p1[1]) < 6 : cur.r < 6 || (cur.shape === 'arc' && Math.abs(cur.sweep) < 0.05))) { strokes.pop(); redraw(); }
    if (cur) { delete cur._start; delete cur._raw; delete cur._last; }
    cur = null;
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  box.addEventListener('click', async e => {
    const tb = e.target.closest('#tools [data-t]'); if (tb) { tool = tb.dataset.t; $$('#tools [data-t]', box).forEach(x => x.classList.toggle('on', x === tb)); setHint(); return; }
    const sw = e.target.closest('.swatch'); if (sw) { color = sw.dataset.c; $$('.swatch', box).forEach(s => s.classList.toggle('on', s === sw)); return; }
    const sb = e.target.closest('#sym button'); if (sb) { sym = +sb.dataset.s; $$('#sym button', box).forEach(s => s.classList.toggle('on', s === sb)); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'fill') { fill = !fill; b.textContent = fill ? 'Filled' : 'Outline'; b.classList.toggle('on', fill); }
    if (a === 'snap') { snap = !snap; b.classList.toggle('on', snap); toast(snap ? 'Snap on' : 'Snap off'); }
    if (a === 'undo') { strokes.pop(); dirty = true; redraw(); }
    if (a === 'clear') { strokes.length = 0; base = null; dirty = true; redraw(); }
    if (a === 'guide') $('.guide', box).classList.toggle('hidden');
    if (a === 'glow') { glow = !glow; toast(glow ? 'Glow on' : 'Glow off'); }
    if (a === 'upload') {
      const f = await pickFile('image/*'); if (!f) return;
      const url = await readImageFile(f, 1000, 0.9); const img = new Image(); img.onload = () => { base = img; dirty = true; redraw(); }; img.src = url;
    }
    if (a === 'gen') sigilFromWords(gen => { strokes.push(...gen); dirty = true; redraw(); }, () => ({ color, size, glow }), N);
  });
  $('#bs', box).oninput = e => size = +e.target.value;
  // load existing sigil
  const src = it.image && it.image.startsWith('data:') ? it.image : it.svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(it.svg.replace(/currentColor/g, '#d4ad5a').replace('<svg ', `<svg width="${N}" height="${N}" `)) : null;
  if (src) { const img = new Image(); img.onload = () => { base = img; redraw(); }; img.src = src; }
  return {
    get: () => {
      if (!dirty && it.image) return it.image;
      if (!dirty && it.svg) return null; // keep the original vector
      if (!strokes.length && !base) return null;
      return cv.toDataURL('image/png');
    }
  };
}
// Sigil wheel method: remove vowels & repeats, connect letters on a three-ring wheel
const WHEEL = [['A', 'B', 'C', 'D', 'E', 'F'], ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'], ['O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']];
function wheelPoint(L, N) {
  const radii = [0.15, 0.29, 0.43];
  for (let r = 0; r < 3; r++) { const i = WHEEL[r].indexOf(L); if (i >= 0) { const a = -Math.PI / 2 + i * 2 * Math.PI / WHEEL[r].length; return [N / 2 + Math.cos(a) * radii[r] * N, N / 2 + Math.sin(a) * radii[r] * N]; } }
  return null;
}
function reduceLetters(txt) {
  const up = txt.toUpperCase().replace(/[^A-Z]/g, '');
  let r = up.replace(/[AEIOU]/g, ''); if (!r) r = up;
  return [...new Set(r)].join('');
}
function sigilFromWords(cb, style, N) {
  modal(`<h2>Sigil from Words</h2>
    <div class="form sigil-gen"><label>Your intention</label><input type="text" id="sw" placeholder="I am protected and at peace"><div class="hint">Vowels and repeated letters are removed, and the remaining letters are joined on the sigil wheel.</div>
    <div class="letters" id="sl">—</div>
    <div style="max-width:260px;margin:auto;color:var(--gold)" id="wh"></div>
    <div class="switch"><span>Draw the letter wheel ring</span><input type="checkbox" id="ring" checked style="width:22px;height:22px;accent-color:var(--gold)"></div>
    <div class="actions"><button type="button" class="btn ghost" id="sc">Cancel</button><button type="button" class="btn primary" id="sok">Place on canvas</button></div></div>`,
    (m, close) => {
      const inp = $('#sw', m);
      const prev = () => {
        const L = reduceLetters(inp.value); $('#sl', m).textContent = L || '—';
        const pts = [...L].map(c => wheelPoint(c, 100)).filter(Boolean);
        const lettersSvg = WHEEL.flatMap(r => r.map(c => { const p = wheelPoint(c, 100); return `<text x="${p[0]}" y="${p[1] + 1.6}" font-size="4.4" text-anchor="middle" fill="currentColor" opacity="${L.includes(c) ? 1 : .35}" font-family="Cinzel Decorative">${c}</text>`; })).join('');
        $('#wh', m).innerHTML = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"><circle cx="50" cy="50" r="22" stroke-width=".3"/><circle cx="50" cy="50" r="36" stroke-width=".3"/><circle cx="50" cy="50" r="49" stroke-width=".3"/>${lettersSvg}${pts.length ? `<polyline points="${pts.map(p => p.join(',')).join(' ')}" stroke-width="1.2" stroke="var(--crimson)"/><circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="1.8" stroke="var(--crimson)"/>` : ''}</svg>`;
      };
      inp.oninput = prev; prev(); setTimeout(() => inp.focus(), 50);
      $('#sc', m).onclick = close;
      $('#sok', m).onclick = () => {
        const L = reduceLetters(inp.value); if (!L) { toast('Write an intention first'); return; }
        const st = style(); const pts = [...L].map(c => wheelPoint(c, N)).filter(Boolean);
        const out = [];
        if ($('#ring', m).checked) out.push({ kind: 'circle', pts: [[N / 2, N / 2]], r: N * 0.47, color: st.color, size: Math.max(4, st.size * 0.5), glow: st.glow, sym: 0 });
        out.push({ kind: 'circle', pts: [pts[0]], r: st.size * 1.4, color: st.color, size: Math.max(4, st.size * .7), glow: st.glow, sym: 0 });
        if (pts.length > 1) {
          out.push({ pts, color: st.color, size: st.size, glow: st.glow, sym: 0, straight: true });
          // end bar perpendicular to last segment
          const [a, b] = pts.slice(-2); const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1; const nx = -dy / len * st.size * 2.2, ny = dx / len * st.size * 2.2;
          out.push({ straight: true, pts: [[b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny]], color: st.color, size: st.size, glow: st.glow, sym: 0 });
        }
        cb(out); close();
      };
    });
}

/* ---------- Tarot positions editor with draggable layout ---------- */
function positionsEditor(el, positions) {
  let ps = positions.map(p => ({ ...p }));
  const box = $('.ctl', el);
  box.innerHTML = `
    <div class="tools"><span class="small">Arrange:</span><select id="preset" style="width:auto"><option value="">Keep / drag freely</option><option value="row">In a row</option><option value="rows">Two rows</option><option value="cross">Cross</option><option value="circle">Circle</option><option value="pyramid">Pyramid</option><option value="vertical">Column</option></select></div>
    <div class="frame" style="padding:10px;overflow:hidden"><div id="lay"></div><p class="hint center">Drag cards to arrange your spread. Tap a card to turn it sideways.</p></div>
    <div id="plist" class="dyn" style="margin-top:10px"></div>
    <button type="button" class="btn small ghost" id="padd">${ART.plus} Add position</button>`;
  const paintList = () => {
    $('#plist', box).innerHTML = ps.map((p, i) => `<div class="item" data-i="${i}"><span class="num">${i + 1}.</span><div style="flex:1;display:flex;flex-direction:column;gap:4px"><input type="text" class="pn" placeholder="Position name" value="${esc(p.name || '')}"><input type="text" class="pm" placeholder="What this position reveals" value="${esc(p.meaning || '')}"><input type="text" class="pg" placeholder="Guiding prompt (optional)" value="${esc(p.guide || '')}"></div><button type="button" class="iconbtn del">${ART.close}</button></div>`).join('');
  };
  const paintLayout = () => {
    ps.forEach((p, i) => p.n = i + 1);
    $('#lay', box).innerHTML = layoutHTML(ps);
    const lay = $('.layout', box); if (!lay) return;
    const g = layoutGeom(ps);
    $$('.card', lay).forEach(c => {
      let start = null, moved = false;
      c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); start = [e.clientX, e.clientY, +ps[c.dataset.i].x, +ps[c.dataset.i].y]; moved = false; });
      c.addEventListener('pointermove', e => {
        if (!start) return; const dx = (e.clientX - start[0]) / g.s, dy = (e.clientY - start[1]) / g.s;
        if (Math.abs(dx) + Math.abs(dy) > .08) moved = true;
        const p = ps[c.dataset.i]; p.x = Math.round((start[2] + dx) * 10) / 10; p.y = Math.round((start[3] + dy) * 10) / 10;
        c.style.left = (p.x - g.minX) * g.s + 'px'; c.style.top = (p.y - g.minY) * g.s + 'px';
      });
      c.addEventListener('pointerup', () => {
        if (!start) return; start = null;
        const p = ps[c.dataset.i];
        if (!moved) p.rotate = p.rotate == 90 ? 0 : 90;
        normalize(); paintLayout();
      });
    });
  };
  const normalize = () => { const mx = Math.min(...ps.map(p => +p.x)), my = Math.min(...ps.map(p => +p.y)); ps.forEach(p => { p.x = Math.round((p.x - mx) * 100) / 100; p.y = Math.round((p.y - my) * 100) / 100; }); };
  const sync = () => $$('#plist .item', box).forEach(d => { const p = ps[d.dataset.i]; p.name = $('.pn', d).value; p.meaning = $('.pm', d).value; p.guide = $('.pg', d).value; });
  const preset = kind => {
    const n = ps.length;
    ps.forEach((p, i) => {
      p.rotate = 0;
      if (kind === 'row') { p.x = i * 1.2; p.y = 0; }
      if (kind === 'rows') { const half = Math.ceil(n / 2); p.x = (i % half) * 1.2; p.y = Math.floor(i / half) * 1.7; }
      if (kind === 'vertical') { p.x = 0; p.y = i * 1.7; }
      if (kind === 'circle') { const a = -Math.PI / 2 + i * 2 * Math.PI / n, R = Math.max(1.6, n * 0.42); p.x = Math.round((R + R * Math.cos(a)) * 100) / 100; p.y = Math.round((R + R * Math.sin(a)) * 100) / 100; }
      if (kind === 'cross') { const c = [[1.2, 1.7], [1.2, 0], [2.4, 1.7], [1.2, 3.4], [0, 1.7]]; const q = c[i % 5]; p.x = q[0] + Math.floor(i / 5) * 3.8; p.y = q[1]; }
      if (kind === 'pyramid') { let row = 0, cnt = 0; while (cnt + row + 1 <= i) { cnt += row + 1; row++; } const col = i - cnt; p.x = col * 1.2 + (3 - row) * 0.6; p.y = row * 1.7; }
    });
    normalize();
  };
  box.addEventListener('input', sync);
  box.addEventListener('click', e => {
    const d = e.target.closest('.del'); if (d) { sync(); ps.splice(+d.closest('.item').dataset.i, 1); paintList(); paintLayout(); }
  });
  $('#padd', box).onclick = () => { sync(); const last = ps[ps.length - 1]; ps.push({ name: '', meaning: '', x: last ? +last.x + 1.2 : 0, y: last ? +last.y : 0, rotate: 0 }); paintList(); paintLayout(); $$('.pn', box).pop().focus(); };
  $('#preset', box).onchange = e => { if (e.target.value) { sync(); preset(e.target.value); paintLayout(); } };
  if (!ps.length) { ps = [{ name: 'Past', meaning: '', x: 0, y: 0 }, { name: 'Present', meaning: '', x: 1.2, y: 0 }, { name: 'Future', meaning: '', x: 2.4, y: 0 }]; }
  paintList(); paintLayout();
  return { get: () => { sync(); return ps.filter(p => p.name.trim()).map((p, i) => ({ n: i + 1, name: p.name.trim(), meaning: (p.meaning || '').trim(), ...((p.guide || '').trim() ? { guide: p.guide.trim() } : {}), x: +p.x, y: +p.y, rotate: +p.rotate || 0 })); } };
}
