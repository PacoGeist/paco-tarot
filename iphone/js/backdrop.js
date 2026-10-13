/* ---------- decorative backdrops behind tarot layouts ---------- */
const BACKDROPS = [
  ['auto', 'Match the spread'],
  ['night', 'Starry Night'],
  ['altar', 'Altar Cloth'],
  ['moon', 'Moon Circle'],
  ['grove', 'Herb Grove'],
  ['winter', 'Winter Snow'],
  ['spring', 'Spring Blossom'],
  ['summer', 'Summer Sun'],
  ['autumn', 'Autumn Leaves'],
  ['halloween', 'Halloween Pumpkins'],
  ['yuletide', 'Yuletide Holly'],
  ['newyear', 'New Year Fireworks'],
  ['valentine', 'Valentine Hearts'],
  ['shamrock', 'Shamrocks & Gold'],
  ['easter', 'Easter Eggs'],
  ['harvest', 'Thanksgiving Harvest'],
  ['none', 'Plain'],
];
const backdropChoice = () => (typeof Store !== 'undefined' && Store.settings && Store.settings.backdrop) || 'auto';
// 'auto' uses the spread's own theme (holiday or season), otherwise Starry Night
const backdropKind = theme => { const c = backdropChoice(); return c === 'auto' ? (theme || 'night') : c; };

// small seeded random so the stars sit in the same places every time
function seeded(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

function starField(W, H, rnd, n, gold) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (rnd() * W).toFixed(1), y = (rnd() * H).toFixed(1), r = (0.4 + rnd() * 1.1).toFixed(2), o = (0.25 + rnd() * 0.6).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff6dc" opacity="${o}"/>`;
  }
  for (let i = 0; i < Math.max(3, n / 14); i++) {
    const x = rnd() * W, y = rnd() * H, s = 3 + rnd() * 4;
    out += `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${gold}" opacity="${(0.35 + rnd() * 0.4).toFixed(2)}"/>`;
  }
  return out;
}
function pentacle(cx, cy, r, stroke, op, sw = 1.2) {
  const pts = [0, 2, 4, 1, 3].map(k => { const a = -Math.PI / 2 + k * 2 * Math.PI / 5; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; });
  return `<g fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"><circle cx="${cx}" cy="${cy}" r="${(r * 1.08).toFixed(1)}"/><circle cx="${cx}" cy="${cy}" r="${(r * 1.14).toFixed(1)}" stroke-width="${sw / 2}"/><polygon points="${pts.join(' ')}"/></g>`;
}
function moonPhaseIcon(x, y, r, k, gold) {
  // k = 0..7: new, waxing crescent, first quarter, waxing gibbous, full, waning gibbous, last quarter, waning crescent
  const lit = [0, .25, .5, .75, 1, .75, .5, .25][k], waxing = k > 0 && k < 4;
  if (k === 0) return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${gold}" stroke-width=".9" opacity=".55"/>`;
  if (k === 4) return `<circle cx="${x}" cy="${y}" r="${r}" fill="${gold}" opacity=".55"/>`;
  const side = waxing ? 1 : 0, bulge = Math.abs(1 - 2 * lit) * r, inner = lit > .5 ? (waxing ? 0 : 1) : (waxing ? 1 : 0);
  const d = `M${x} ${y - r}A${r} ${r} 0 0 ${side} ${x} ${y + r}A${bulge.toFixed(2)} ${r} 0 0 ${inner} ${x} ${y - r}Z`;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${gold}" stroke-width=".7" opacity=".35"/><path d="${d}" fill="${gold}" opacity=".55"/>`;
}
function sprig(x, y, len, ang, col, op) {
  // a curved stem with paired leaves
  const t = ang * Math.PI / 180, ex = x + Math.cos(t) * len, ey = y + Math.sin(t) * len;
  const mx = (x + ex) / 2 + Math.sin(t) * len * .12, my = (y + ey) / 2 - Math.cos(t) * len * .12;
  let g = `<path d="M${x} ${y}Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${col}" stroke-width="1.1" fill="none"/>`;
  for (let i = 1; i <= 5; i++) {
    const f = i / 6, px = x + (ex - x) * f, py = y + (ey - y) * f, L = len * (.2 - f * .02);
    for (const s of [-1, 1]) g += `<ellipse cx="${(px + Math.cos(t + s * 1.0) * L * .55).toFixed(1)}" cy="${(py + Math.sin(t + s * 1.0) * L * .55).toFixed(1)}" rx="${(L * .55).toFixed(1)}" ry="${(L * .2).toFixed(1)}" transform="rotate(${(ang + s * 57).toFixed(0)} ${(px + Math.cos(t + s * 1.0) * L * .55).toFixed(1)} ${(py + Math.sin(t + s * 1.0) * L * .55).toFixed(1)})" fill="${col}"/>`;
  }
  return `<g opacity="${op}">${g}<ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="${(len * .09).toFixed(1)}" ry="${(len * .035).toFixed(1)}" transform="rotate(${ang} ${ex.toFixed(1)} ${ey.toFixed(1)})" fill="${col}"/></g>`;
}

function backdropSVG(kind, W, H, lineSegs) {
  if (window.THEMED_BD && THEMED_BD[kind]) return THEMED_BD[kind](W, H, lineSegs);
  const gold = '#d4ad5a', rnd = seeded(Math.round(W * 7 + H * 13)), cx = W / 2, cy = H / 2, m = Math.min(W, H);
  const lines = (lineSegs || []).map(([a, b]) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`).join('');
  const lineG = lines ? `<g stroke="${gold}" stroke-width="1.3" opacity=".55" stroke-linecap="round">${lines}</g>` : '';
  let defs = '', body = '';
  if (kind === 'night') {
    defs = `<radialGradient id="bgN" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#2d1d52"/><stop offset=".6" stop-color="#160e2c"/><stop offset="1" stop-color="#08060f"/></radialGradient>
      <linearGradient id="bgMw" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7a5cc0" stop-opacity="0"/><stop offset=".5" stop-color="#9b84d8" stop-opacity=".14"/><stop offset="1" stop-color="#7a5cc0" stop-opacity="0"/></linearGradient>`;
    body = `<rect width="${W}" height="${H}" fill="url(#bgN)"/><rect width="${W}" height="${H}" fill="url(#bgMw)"/>${starField(W, H, rnd, Math.round(W * H / 520), gold)}
      <g transform="translate(${W - 30} 28)" opacity=".7"><circle r="13" fill="#f3e3b0"/><circle cx="6" cy="-4" r="12" fill="#1b1233"/></g>`;
  } else if (kind === 'altar') {
    defs = `<radialGradient id="bgA" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#5a1838"/><stop offset=".65" stop-color="#2e0b1d"/><stop offset="1" stop-color="#14040c"/></radialGradient>
      <pattern id="bgAp" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M11 3l2 8-2 8-2-8z" fill="${gold}" opacity=".07"/></pattern>`;
    const corner = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" fill="none" stroke="${gold}" stroke-width="1" opacity=".7"><path d="M0 26Q0 0 26 0"/><path d="M6 30Q6 6 30 6" opacity=".6"/><circle cx="9" cy="9" r="3" fill="${gold}"/></g>`;
    body = `<rect width="${W}" height="${H}" fill="url(#bgA)"/><rect width="${W}" height="${H}" fill="url(#bgAp)"/>
      <rect x="7" y="7" width="${W - 14}" height="${H - 14}" rx="8" fill="none" stroke="${gold}" stroke-width="1.2" opacity=".55"/>
      <rect x="11" y="11" width="${W - 22}" height="${H - 22}" rx="6" fill="none" stroke="${gold}" stroke-width=".6" stroke-dasharray="2 3" opacity=".5"/>
      ${corner(10, 10, 1, 1)}${corner(W - 10, 10, -1, 1)}${corner(10, H - 10, 1, -1)}${corner(W - 10, H - 10, -1, -1)}
      ${pentacle(cx, cy, m * .36, gold, lines ? .1 : .16, 1.4)}`;
  } else if (kind === 'moon') {
    defs = `<radialGradient id="bgM" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#1e2448"/><stop offset=".7" stop-color="#0f1128"/><stop offset="1" stop-color="#070812"/></radialGradient>`;
    const R = m / 2 - 16;
    let phases = '';
    for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4; phases += moonPhaseIcon((cx + R * Math.cos(a)).toFixed(1), (cy + R * Math.sin(a)).toFixed(1), 7, k, '#e9dcae'); }
    body = `<rect width="${W}" height="${H}" fill="url(#bgM)"/>${starField(W, H, rnd, Math.round(W * H / 900), '#e9dcae')}
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#e9dcae" stroke-width=".8" opacity=".3"/>
      <circle cx="${cx}" cy="${cy}" r="${R - 13}" fill="none" stroke="#e9dcae" stroke-width=".6" stroke-dasharray="1 4" opacity=".4"/>
      <circle cx="${cx}" cy="${cy}" r="${R * .45}" fill="#e9dcae" opacity=".05"/>${phases}`;
  } else if (kind === 'grove') {
    defs = `<radialGradient id="bgG" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#1f3d2a"/><stop offset=".65" stop-color="#10221a"/><stop offset="1" stop-color="#06100b"/></radialGradient>`;
    let fireflies = '';
    for (let i = 0; i < Math.round(W * H / 2600); i++) fireflies += `<circle cx="${(rnd() * W).toFixed(1)}" cy="${(rnd() * H).toFixed(1)}" r="${(0.8 + rnd()).toFixed(2)}" fill="#f4e7a1" opacity="${(0.3 + rnd() * 0.5).toFixed(2)}"/>`;
    const col = '#8fbf87';
    body = `<rect width="${W}" height="${H}" fill="url(#bgG)"/>
      ${sprig(-4, H + 4, m * .42, -55, col, .32)}${sprig(W + 4, H + 4, m * .42, -125, col, .32)}${sprig(-4, -4, m * .3, 40, col, .22)}${sprig(W + 4, -4, m * .3, 140, col, .22)}
      ${sprig(W * .2, H + 6, m * .25, -80, col, .18)}${sprig(W * .8, H + 6, m * .25, -100, col, .18)}${fireflies}`;
  } else return lineG ? `<svg class="bd" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${lineG}</svg>` : '';
  return `<svg class="bd" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><defs>${defs}</defs>${body}${lineG}</svg>`;
}

// the little chooser under a layout
function backdropPickerHTML() {
  const k = backdropChoice();
  return `<div class="bd-pick" role="group" aria-label="Layout backdrop">${BACKDROPS.map(([id, label]) => `<button type="button" class="bd-sw bd-sw-${id} ${id === k ? 'on' : ''}" data-bd="${id}" title="${label}" aria-label="${label}"></button>`).join('')}</div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-bd]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  await Store.setSetting('backdrop', b.dataset.bd);
  document.querySelectorAll('.spread-stage').forEach(st => {
    const old = st.querySelector('svg.bd'); if (old) old.remove();
    const kind = backdropKind(st.dataset.theme);
    const svg = backdropSVG(kind, +st.dataset.w, +st.dataset.h, JSON.parse(st.dataset.lines || '[]'));
    if (svg) st.insertAdjacentHTML('afterbegin', svg);
    st.className = `spread-stage bd-${kind}`;
  });
  document.querySelectorAll('.bd-sw').forEach(x => x.classList.toggle('on', x.dataset.bd === b.dataset.bd));
  const name = (BACKDROPS.find(x => x[0] === b.dataset.bd) || [])[1]; if (name && window.toast) toast(name);
}, true);
