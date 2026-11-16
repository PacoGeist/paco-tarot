/* ---------- seasonal and holiday backdrops ---------- */
(function () {
  const f = n => (+n).toFixed(1);
  const bg = (id, W, H, stops, cx = '50%', cy = '45%') => ({
    def: `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="78%">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`,
    rect: `<rect width="${W}" height="${H}" fill="url(#${id})"/>`,
  });
  const wrap = (W, H, defs, body, lineSegs, lineCol = '#d4ad5a') => {
    const lines = (lineSegs || []).map(([a, b]) => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`).join('');
    return `<svg class="bd" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><defs>${defs}</defs>${body}${lines ? `<g stroke="${lineCol}" stroke-width="1.3" opacity=".6" stroke-linecap="round">${lines}</g>` : ''}</svg>`;
  };
  // scatter n items, keeping clear of the middle where the cards sit (edgeOnly) or anywhere
  const scatter = (W, H, rnd, n, fn, edgeOnly) => {
    let o = '';
    for (let i = 0, tries = 0; i < n && tries < n * 20; tries++) {
      const x = rnd() * W, y = rnd() * H;
      if (edgeOnly && x > W * .18 && x < W * .82 && y > H * .14 && y < H * .86) continue;
      o += fn(x, y, rnd, i); i++;
    }
    return o;
  };
  const tf = (x, y, s, r = 0) => `transform="translate(${f(x)} ${f(y)}) rotate(${f(r)}) scale(${(+s).toFixed(3)})"`;

  /* shapes, drawn around 0,0 at roughly unit size 20 */
  const HEART = 'M0 7C-9 0-7-8 0-3C7-8 9 0 0 7Z';
  const MAPLE = 'M0-10L2-5L6-7L5-2L9-1L5 2L6 5L1 4L.6 9H-.6L-1 4L-6 5L-5 2L-9-1L-5-2L-6-7L-2-5Z';
  const OAK = 'M0-10C3-9 1-7 4-6C7-5 3-3 5-1C8 1 3 2 4 4C5 7 1 6 0 9C-1 6-5 7-4 4C-3 2-8 1-5-1C-3-3-7-5-4-6C-1-7-3-9 0-10Z';
  const BAT = 'M-11-2Q-7-6-3-2L-1.4-4.5L0-2.4L1.4-4.5L3-2Q7-6 11-2Q8-1 8 2.5Q6 .5 3.5 1.5Q1.5 2.5 0 5Q-1.5 2.5-3.5 1.5Q-6 .5-8 2.5Q-8-1-11-2Z';
  const HOLLY = 'M0 0L3-3L4.5-1.6L6.5-4L8.3-2.4L10.5-4.6L11.5-1.4L14 0L11.5 1.4L10.5 4.6L8.3 2.4L6.5 4L4.5 1.6L3 3Z';
  const leaf = (x, y, s, r, col, op = 1, d = MAPLE) => `<path d="${d}" ${tf(x, y, s, r)} fill="${col}" opacity="${op}"/>`;
  const heart = (x, y, s, r, col, op = 1) => `<path d="${HEART}" ${tf(x, y, s, r)} fill="${col}" opacity="${op}"/>`;
  const snowflake = (x, y, s, op) => {
    let a = '';
    for (let k = 0; k < 6; k++) a += `<g transform="rotate(${k * 60})"><line x1="0" y1="0" x2="0" y2="-10"/><line x1="0" y1="-6" x2="-3" y2="-9"/><line x1="0" y1="-6" x2="3" y2="-9"/></g>`;
    return `<g ${tf(x, y, s)} stroke="#eaf4ff" stroke-width="1.2" stroke-linecap="round" opacity="${op}">${a}</g>`;
  };
  const pumpkin = (x, y, s, face, glow) => {
    const body = `<ellipse cx="-7" cy="0" rx="8" ry="9" fill="#d9661a"/><ellipse cx="7" cy="0" rx="8" ry="9" fill="#d9661a"/><ellipse cx="0" cy="0" rx="8.5" ry="9.6" fill="#ef7f23"/>
      <path d="M-7-8.4Q-10 0-7 8.4M7-8.4Q10 0 7 8.4" stroke="#a8460e" stroke-width=".9" fill="none"/>
      <path d="M-1-9Q-1.5-13 1.5-14L2.4-12.5Q.6-12 .9-9Z" fill="#4f6b2a"/><path d="M1-12Q5-14 6-11" stroke="#6f8f3a" stroke-width=".8" fill="none"/>`;
    const carve = face ? `<g fill="${glow}"><path d="M-7-2L-4-6L-1-2Z"/><path d="M1-2L4-6L7-2Z"/><path d="M-1.2 .2L0-2L1.2 .2Z"/><path d="M-8 2.5Q0 9 8 2.5L6 3.6L5 5.4L3 4.2L1.5 6.2L0 4.6L-1.5 6.2L-3 4.2L-5 5.4L-6 3.6Z"/></g>` : '';
    return `<g ${tf(x, y, s)}>${face ? `<circle r="16" fill="${glow}" opacity=".16"/>` : ''}${body}${carve}</g>`;
  };
  const pine = (x, y, s, col, op = 1, snow) => `<g ${tf(x, y, s)} opacity="${op}"><rect x="-1.4" y="8" width="2.8" height="4" fill="#3b2a1a"/><path d="M0-14L6-5H3L8 2H4L10 9H-10L-4 2H-8L-3-5H-6Z" fill="${col}"/>${snow ? '<path d="M0-14L2.3-10.6Q0-9.6-2.3-10.6ZM-3-5Q0-3.6 3-5L3.6-4.2Q0-2.7-3.6-4.2ZM-4 2Q0 3.6 4 2L4.8 3Q0 4.6-4.8 3Z" fill="#eef6ff" opacity=".85"/>' : ''}</g>`;
  const flower = (x, y, s, petal, centre, op = 1, n = 5) => {
    let p = ''; for (let k = 0; k < n; k++) p += `<ellipse cx="0" cy="-5" rx="3.2" ry="5" fill="${petal}" transform="rotate(${k * 360 / n})"/>`;
    return `<g ${tf(x, y, s)} opacity="${op}">${p}<circle r="2.6" fill="${centre}"/></g>`;
  };
  const sunflower = (x, y, s) => {
    let p = ''; for (let k = 0; k < 16; k++) p += `<ellipse cx="0" cy="-9" rx="2.3" ry="5.5" fill="${k % 2 ? '#f2b822' : '#ffd23f'}" transform="rotate(${k * 22.5})"/>`;
    return `<g ${tf(x, y, s)}><path d="M0 8Q2 22 0 40" stroke="#4d7a2c" stroke-width="2.4" fill="none"/><path d="M1 22Q9 16 13 20Q8 25 1 22Z" fill="#5b8c33"/>${p}<circle r="6.5" fill="#6b3d17"/><circle r="4" fill="#4a2810"/></g>`;
  };
  const egg = (x, y, s, r, base, stripe, dots, uid) => `<g ${tf(x, y, s, r)}><clipPath id="egg${uid}"><path d="M0-10C6-10 8-1 8 3C8 8 4.5 10 0 10C-4.5 10-8 8-8 3C-8-1-6-10 0-10Z"/></clipPath>
      <path d="M0-10C6-10 8-1 8 3C8 8 4.5 10 0 10C-4.5 10-8 8-8 3C-8-1-6-10 0-10Z" fill="${base}"/>
      <g clip-path="url(#egg${uid})"><path d="M-9-2L-6-4L-3-2L0-4L3-2L6-4L9-2V0L6-2L3 0L0-2L-3 0L-6-2L-9 0Z" fill="${stripe}"/><rect x="-9" y="4" width="18" height="1.6" fill="${stripe}"/>
      ${[[-4, -6], [3, -7], [-3, 2.4], [4, 2], [0, 7.6]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1" fill="${dots}"/>`).join('')}</g></g>`;
  const shamrock = (x, y, s, r, col, op = 1) => `<g ${tf(x, y, s, r)} opacity="${op}" fill="${col}">${[0, 120, 240].map(a => `<path d="M0 0C-6-4-7-11-3.2-11.6C-1.2-12 0-10.6 0-9.6C0-10.6 1.2-12 3.2-11.6C7-11 6-4 0 0Z" transform="rotate(${a})"/>`).join('')}<path d="M0 0Q2 8 6 12" stroke="${col}" stroke-width="1.6" fill="none"/></g>`;
  const coin = (x, y, s) => `<g ${tf(x, y, s)}><circle r="6" fill="#e9b93a"/><circle r="4.6" fill="none" stroke="#a8781a" stroke-width=".8"/><path d="M-1.6-2.4H1.6L0 2.6Z" fill="#a8781a" opacity=".6"/></g>`;
  const firework = (x, y, s, col, rnd) => {
    let l = ''; const n = 14 + Math.floor(rnd() * 6);
    for (let k = 0; k < n; k++) { const a = k * 2 * Math.PI / n, r1 = 4, r2 = 15 + rnd() * 5; l += `<line x1="${f(Math.cos(a) * r1)}" y1="${f(Math.sin(a) * r1)}" x2="${f(Math.cos(a) * r2)}" y2="${f(Math.sin(a) * r2)}"/><circle cx="${f(Math.cos(a) * (r2 + 2.4))}" cy="${f(Math.sin(a) * (r2 + 2.4))}" r="1" fill="${col}"/>`; }
    return `<g ${tf(x, y, s)} stroke="${col}" stroke-width=".9" stroke-linecap="round" opacity=".8">${l}<circle r="2" fill="#fff"/></g>`;
  };
  const wheat = (x, y, s, r, col) => {
    let g = `<path d="M0 0Q1-14 0-30" stroke="${col}" stroke-width="1.2" fill="none"/>`;
    for (let k = 0; k < 6; k++) { const yy = -14 - k * 3; g += `<ellipse cx="-2" cy="${yy}" rx="1.4" ry="3" transform="rotate(-28 -2 ${yy})" fill="${col}"/><ellipse cx="2" cy="${yy}" rx="1.4" ry="3" transform="rotate(28 2 ${yy})" fill="${col}"/>`; }
    return `<g ${tf(x, y, s, r)}>${g}<ellipse cx="0" cy="-33" rx="1.3" ry="3" fill="${col}"/></g>`;
  };
  const sunRays = (x, y, R, col) => {
    let r = ''; for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12; r += `<path d="M${f(x + Math.cos(a - .05) * R * 1.25)} ${f(y + Math.sin(a - .05) * R * 1.25)}L${f(x + Math.cos(a) * R * (k % 2 ? 1.7 : 2.1))} ${f(y + Math.sin(a) * R * (k % 2 ? 1.7 : 2.1))}L${f(x + Math.cos(a + .05) * R * 1.25)} ${f(y + Math.sin(a + .05) * R * 1.25)}Z"/>`; }
    return `<g fill="${col}" opacity=".55">${r}</g>`;
  };
  const stars = (W, H, rnd, n, col = '#fff6dc') => scatter(W, H, rnd, n, (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${(0.4 + r() * 1).toFixed(2)}" fill="${col}" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`);

  const T = {};
  T.winter = (W, H, L) => {
    const r = seeded(W * 3 + H), m = Math.min(W, H), g = bg('bgW', W, H, [[0, '#2b4a72'], [.6, '#152841'], [1, '#08111f']], '50%', '30%');
    const drift = `<path d="M0 ${H - 30}Q${W * .25} ${H - 48} ${W * .5} ${H - 30}T${W} ${H - 34}V${H}H0Z" fill="#dfeaf7" opacity=".16"/><path d="M0 ${H - 16}Q${W * .3} ${H - 30} ${W * .6} ${H - 14}T${W} ${H - 18}V${H}H0Z" fill="#eef5ff" opacity=".26"/>`;
    return wrap(W, H, g.def, g.rect + stars(W, H, r, W * H / 1400) + drift
      + pine(16, H - 26, m / 110, '#1c3b34', .9, 1) + pine(42, H - 18, m / 150, '#1f4239', .9, 1) + pine(W - 18, H - 24, m / 105, '#1c3b34', .9, 1) + pine(W - 44, H - 16, m / 160, '#1f4239', .9, 1)
      + scatter(W, H, r, Math.round(W * H / 3800), (x, y, q) => snowflake(x, y, .35 + q() * .45, (.35 + q() * .5).toFixed(2)))
      + scatter(W, H, r, Math.round(W * H / 700), (x, y, q) => `<circle cx="${f(x)}" cy="${f(y)}" r="${(0.6 + q() * 1.3).toFixed(2)}" fill="#fff" opacity="${(0.3 + q() * 0.5).toFixed(2)}"/>`), L, '#cfe3ff');
  };
  T.spring = (W, H, L) => {
    const r = seeded(W * 5 + H), m = Math.min(W, H), g = bg('bgS', W, H, [[0, '#3f5a4a'], [.6, '#22382e'], [1, '#101d17']], '50%', '25%');
    const branch = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx * m / 300} ${sy * m / 300})"><path d="M0 0Q40 18 70 12Q95 8 120 30M40 14Q50 34 76 40" stroke="#5a3b2b" stroke-width="3" fill="none" stroke-linecap="round"/>${[[30, 8], [58, 12], [82, 10], [104, 20], [120, 30], [52, 26], [72, 40], [18, 4]].map(([a, b], i) => flower(a, b, .75 + (i % 3) * .15, i % 2 ? '#f6c3d5' : '#fbd9e5', '#f0d36b')).join('')}</g>`;
    const butterfly = (x, y, s, c) => `<g ${tf(x, y, s, -15)}><ellipse cx="-4" cy="-3" rx="4.5" ry="3.4" fill="${c}"/><ellipse cx="4" cy="-3" rx="4.5" ry="3.4" fill="${c}"/><ellipse cx="-3" cy="3" rx="3" ry="2.4" fill="${c}"/><ellipse cx="3" cy="3" rx="3" ry="2.4" fill="${c}"/><rect x="-.6" y="-5" width="1.2" height="10" rx=".6" fill="#2a1d14"/></g>`;
    return wrap(W, H, g.def, g.rect + `<rect width="${W}" height="${H}" fill="#f6c3d5" opacity=".05"/>` + branch(-6, 6, 1, 1) + branch(W + 6, H - 8, -1, -1)
      + scatter(W, H, r, Math.round(W * H / 2600), (x, y, q) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="1.4" fill="#fbd9e5" opacity="${(0.4 + q() * 0.4).toFixed(2)}" transform="rotate(${f(q() * 180)} ${f(x)} ${f(y)})"/>`)
      + butterfly(W - 30, 30, m / 260, '#bfa8f0') + butterfly(26, H - 36, m / 300, '#f2d06b')
      + `<g opacity=".55">${[16, 40, W - 40, W - 16].map((x, i) => flower(x, H - 10 - (i % 2) * 8, m / 340, i % 2 ? '#c9b6f2' : '#fff2c4', '#e9b93a')).join('')}</g>`, L, '#f3d9a8');
  };
  T.summer = (W, H, L) => {
    const r = seeded(W * 7 + H), m = Math.min(W, H), g = bg('bgSu', W, H, [[0, '#6b4318'], [.5, '#3a2410'], [1, '#160d06']], '85%', '10%');
    return wrap(W, H, g.def, g.rect + sunRays(W - 26, 26, m * .08, '#ffcf5c') + `<circle cx="${W - 26}" cy="26" r="${f(m * .085)}" fill="#ffd36b"/><circle cx="${W - 26}" cy="26" r="${f(m * .16)}" fill="#ffd36b" opacity=".12"/>`
      + scatter(W, H, r, Math.round(W * H / 2400), (x, y, q) => `<circle cx="${f(x)}" cy="${f(y)}" r="${(0.7 + q()).toFixed(2)}" fill="#ffe9a8" opacity="${(0.25 + q() * 0.45).toFixed(2)}"/>`)
      + `<path d="M0 ${H}V${H - 22}Q${W * .15} ${H - 34} ${W * .3} ${H - 22}T${W * .6} ${H - 24}T${W} ${H - 20}V${H}Z" fill="#2c3d16" opacity=".55"/>`
      + sunflower(18, H - 46, m / 240) + sunflower(44, H - 30, m / 320) + sunflower(W - 20, H - 40, m / 260), L, '#ffd36b');
  };
  T.autumn = (W, H, L) => {
    const r = seeded(W * 11 + H), m = Math.min(W, H), g = bg('bgAu', W, H, [[0, '#5a2a14'], [.6, '#2e140b'], [1, '#140805']]);
    const cols = ['#d9661a', '#b8361c', '#e8a33a', '#8f2a14', '#c97a20'];
    return wrap(W, H, g.def, g.rect
      + scatter(W, H, r, Math.round(W * H / 1500), (x, y, q, i) => leaf(x, y, .5 + q() * .7, q() * 360, cols[i % cols.length], (.5 + q() * .4).toFixed(2), i % 3 ? MAPLE : OAK))
      + `<path d="M0 ${H}V${H - 10}Q${W * .2} ${H - 18} ${W * .4} ${H - 9}T${W} ${H - 12}V${H}Z" fill="#7a3414" opacity=".5"/>`
      + leaf(14, 16, m / 140, 20, '#d9661a', .9) + leaf(34, 10, m / 200, -30, '#e8a33a', .9) + leaf(W - 16, H - 16, m / 140, 200, '#b8361c', .9) + leaf(W - 36, H - 10, m / 210, 150, '#e8a33a', .9, OAK), L);
  };
  T.halloween = (W, H, L) => {
    const r = seeded(W * 13 + H), m = Math.min(W, H), g = bg('bgH', W, H, [[0, '#3a1640'], [.55, '#1d0a22'], [1, '#0b040d']], '50%', '20%');
    const moonR = m * .11;
    return wrap(W, H, g.def + `<radialGradient id="bgHm"><stop offset=".55" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>`,
      g.rect + stars(W, H, r, W * H / 1800) + `<circle cx="${W * .5}" cy="${moonR + 8}" r="${f(moonR * 2.2)}" fill="url(#bgHm)"/><circle cx="${W * .5}" cy="${moonR + 8}" r="${f(moonR)}" fill="#f6a443" opacity=".85"/>`
      + `<path d="M0 ${H}V${H - 14}Q${W * .3} ${H - 30} ${W * .55} ${H - 16}T${W} ${H - 18}V${H}Z" fill="#120612"/>`
      + `<rect y="${H - 34}" width="${W}" height="20" fill="#cbb6e6" opacity=".05"/>`
      + [[W * .2, 22, .7, -10], [W * .78, 34, .55, 12], [W * .66, 14, .4, -6], [26, H * .45, .45, 8], [W - 22, H * .55, .5, -12]].map(([x, y, s, a]) => `<path d="${BAT}" ${tf(x, y, s * m / 200, a)} fill="#0a030b" opacity=".9"/>`).join('')
      + pumpkin(24, H - 22, m / 170, 1, '#ffd36b') + pumpkin(W - 26, H - 22, m / 160, 1, '#ffd36b') + pumpkin(52, H - 14, m / 280, 0) + pumpkin(W - 56, H - 12, m / 300, 0), L, '#f6a443');
  };
  T.yuletide = (W, H, L) => {
    const r = seeded(W * 17 + H), m = Math.min(W, H), g = bg('bgY', W, H, [[0, '#1d4a33'], [.6, '#0f2a1d'], [1, '#06140d']]);
    const holly = (x, y, s, a) => `<g ${tf(x, y, s, a)}><path d="${HOLLY}" fill="#2f7a3f" transform="rotate(-30)"/><path d="${HOLLY}" fill="#25643a" transform="rotate(-150) scale(1 -1)"/><path d="${HOLLY}" fill="#2a6e3c" transform="rotate(90)"/><circle cx="-1.6" cy="-1" r="2.2" fill="#c8202f"/><circle cx="1.8" cy="-.4" r="2.2" fill="#d42a38"/><circle cx="0" cy="2" r="2.2" fill="#b81a28"/><circle cx="-2.2" cy="-1.6" r=".6" fill="#fff" opacity=".7"/></g>`;
    const ornament = (x, y, s, c) => `<g ${tf(x, y, s)}><line x1="0" y1="-30" x2="0" y2="-7" stroke="#d4ad5a" stroke-width=".7"/><rect x="-1.8" y="-8.5" width="3.6" height="2.5" fill="#d4ad5a"/><circle r="6" fill="${c}"/><path d="M-6 0Q0 3 6 0" stroke="#f3e3b0" stroke-width=".8" fill="none"/><circle cx="-2" cy="-2" r="1.4" fill="#fff" opacity=".45"/></g>`;
    return wrap(W, H, g.def, g.rect + stars(W, H, r, W * H / 2200, '#fff2c8')
      + `<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="9" fill="none" stroke="#c8202f" stroke-width="2" opacity=".55"/><rect x="9" y="9" width="${W - 18}" height="${H - 18}" rx="7" fill="none" stroke="#d4ad5a" stroke-width=".8" opacity=".55"/>`
      + scatter(W, H, r, Math.round(W * H / 6000), (x, y, q) => snowflake(x, y, .3 + q() * .3, (.25 + q() * .35).toFixed(2)))
      + ornament(W * .3, 32, m / 260, '#c8202f') + ornament(W * .7, 26, m / 300, '#d4ad5a')
      + holly(18, 18, m / 230, 0) + holly(W - 18, 18, m / 230, 90) + holly(18, H - 18, m / 230, -90) + holly(W - 18, H - 18, m / 230, 180), L, '#f3d27a');
  };
  T.newyear = (W, H, L) => {
    const r = seeded(W * 19 + H), m = Math.min(W, H), g = bg('bgNY', W, H, [[0, '#1d1f4a'], [.6, '#0e0f29'], [1, '#05060f']], '50%', '60%');
    const cols = ['#ffd36b', '#f2f2ff', '#ff8fb8', '#8fd8ff', '#c9a8ff'];
    return wrap(W, H, g.def, g.rect + stars(W, H, r, W * H / 1500)
      + firework(W * .18, H * .12, m / 260, cols[0], r) + firework(W * .84, H * .16, m / 220, cols[3], r) + firework(W * .12, H * .78, m / 300, cols[2], r) + firework(W * .88, H * .84, m / 280, cols[4], r) + firework(W * .5, 18, m / 400, cols[1], r)
      + scatter(W, H, r, Math.round(W * H / 1600), (x, y, q, i) => `<rect x="${f(x)}" y="${f(y)}" width="2.6" height="1.3" fill="${cols[i % 5]}" opacity="${(0.4 + q() * 0.5).toFixed(2)}" transform="rotate(${f(q() * 180)} ${f(x)} ${f(y)})"/>`, true)
      + `<g opacity=".14" fill="none" stroke="#ffd36b"><circle cx="${W / 2}" cy="${H / 2}" r="${f(m * .44)}" stroke-width="1.4"/>${Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; return `<line x1="${f(W / 2 + Math.cos(a) * m * .4)}" y1="${f(H / 2 + Math.sin(a) * m * .4)}" x2="${f(W / 2 + Math.cos(a) * m * .44)}" y2="${f(H / 2 + Math.sin(a) * m * .44)}" stroke-width="2"/>`; }).join('')}</g>`, L, '#ffd36b');
  };
  T.valentine = (W, H, L) => {
    const r = seeded(W * 23 + H), m = Math.min(W, H), g = bg('bgV', W, H, [[0, '#5e1634'], [.6, '#33091c'], [1, '#18040d']]);
    const cols = ['#e8476f', '#f28aa8', '#c2185b', '#ffc1d3'];
    const rose = (x, y, s) => `<g ${tf(x, y, s)}><path d="M0 6Q4 14 2 24" stroke="#3f6b2a" stroke-width="1.4" fill="none"/><path d="M2 14Q8 10 11 13Q7 17 2 14Z" fill="#4f7d32"/><circle r="7" fill="#b3123f"/><path d="M-4-1Q0-6 4-1Q2 3-1 2Q-3 0 0-2" stroke="#7d0a2a" stroke-width="1" fill="none"/><path d="M-6 1Q-3 7 3 6" stroke="#7d0a2a" stroke-width=".8" fill="none"/></g>`;
    return wrap(W, H, g.def, g.rect
      + scatter(W, H, r, Math.round(W * H / 1700), (x, y, q, i) => heart(x, y, .3 + q() * .7, q() * 40 - 20, cols[i % 4], (.25 + q() * .5).toFixed(2)))
      + `<path d="${HEART}" transform="translate(${W / 2} ${H / 2 - m * .02}) scale(${(m * .06).toFixed(2)})" fill="none" stroke="#ffc1d3" stroke-width="${(1.6 / (m * .06)).toFixed(3)}" opacity=".18"/>`
      + rose(18, H - 30, m / 230) + rose(36, H - 22, m / 300) + rose(W - 18, 18, m / 230) + rose(W - 38, 12, m / 300)
      + heart(18, 18, m / 220, -12, '#e8476f', .85) + heart(W - 20, H - 18, m / 220, 12, '#e8476f', .85), L, '#ffc1d3');
  };
  T.shamrock = (W, H, L) => {
    const r = seeded(W * 29 + H), m = Math.min(W, H), g = bg('bgSh', W, H, [[0, '#1f5a35'], [.6, '#0f3320'], [1, '#06170e']]);
    const rb = ['#e84a4a', '#f29b38', '#f2d53c', '#4fb35a', '#3f8fe0', '#8a5cd6'];
    const rainbow = rb.map((c, i) => `<path d="M${-m * .1} ${H * .62}A${f(m * .62 - i * 5)} ${f(m * .62 - i * 5)} 0 0 1 ${f(m * 1.14 - i * 10)} ${H * .62}" stroke="${c}" stroke-width="5" fill="none" opacity=".16" transform="translate(${i * 5} 0)"/>`).join('');
    return wrap(W, H, g.def, g.rect + rainbow
      + scatter(W, H, r, Math.round(W * H / 2000), (x, y, q, i) => shamrock(x, y, .3 + q() * .5, q() * 360, i % 2 ? '#4fb35a' : '#3c9a4c', (.3 + q() * .45).toFixed(2)))
      + `<g transform="translate(${W - 30} ${H - 22}) scale(${(m / 220).toFixed(3)})"><path d="M-14-4H14L11 10Q0 16-11 10Z" fill="#1a1a1a"/><ellipse cx="0" cy="-4" rx="14" ry="3.6" fill="#2a2a2a"/>${[[-8, -8], [-2, -10], [5, -8], [-5, -12], [2, -13], [8, -11]].map(([a, b]) => coin(a, b, .55)).join('')}</g>`
      + coin(W - 58, H - 12, m / 400) + coin(W - 12, H - 46, m / 420)
      + shamrock(20, 22, m / 170, -20, '#5cc46a', .9) + shamrock(22, H - 24, m / 190, 200, '#5cc46a', .8), L, '#e9b93a');
  };
  T.easter = (W, H, L) => {
    const r = seeded(W * 31 + H), m = Math.min(W, H), g = bg('bgE', W, H, [[0, '#4a3d6b'], [.6, '#272040'], [1, '#120f20']], '50%', '30%');
    const eggs = [['#f6c3d5', '#c96a9a', '#fff'], ['#bfe3f2', '#3f8fb5', '#fff3a8'], ['#fff1a8', '#e3a12a', '#7cc47f'], ['#c9f0c3', '#4f9e55', '#f6c3d5'], ['#d9c6f6', '#7d5cc4', '#fff']];
    const grass = (y) => { let p = ''; for (let x = -4; x < W + 4; x += 5) p += `<path d="M${x} ${H}Q${x + 2} ${y + (x * 7) % 9} ${x + 4 - (x % 3)} ${y - 4 + (x * 13) % 10}" stroke="#5aa14e" stroke-width="1.6" fill="none" opacity=".6"/>`; return p; };
    return wrap(W, H, g.def, g.rect + stars(W, H, r, W * H / 3000, '#fff6dc')
      + scatter(W, H, r, Math.round(W * H / 4500), (x, y, q, i) => flower(x, y, .35 + q() * .3, i % 2 ? '#f6c3d5' : '#fff2c4', '#e9b93a', (.35 + q() * .3).toFixed(2)), true)
      + grass(H - 12)
      + egg(18, H - 20, m / 220, -14, ...eggs[0], 1) + egg(40, H - 14, m / 280, 10, ...eggs[1], 2) + egg(W - 18, H - 20, m / 220, 12, ...eggs[2], 3) + egg(W - 40, H - 13, m / 290, -8, ...eggs[3], 4) + egg(W - 22, 24, m / 300, 18, ...eggs[4], 5)
      + flower(20, 20, m / 260, '#fff2c4', '#e9b93a', .8) + flower(36, 12, m / 360, '#f6c3d5', '#e9b93a', .8), L, '#f3d9a8');
  };
  T.harvest = (W, H, L) => {
    const r = seeded(W * 37 + H), m = Math.min(W, H), g = bg('bgHv', W, H, [[0, '#5a3a18'], [.6, '#2f1d0c'], [1, '#140b04']]);
    const cols = ['#d9661a', '#b8361c', '#e8a33a', '#c97a20'];
    return wrap(W, H, g.def, g.rect
      + scatter(W, H, r, Math.round(W * H / 3200), (x, y, q, i) => leaf(x, y, .4 + q() * .5, q() * 360, cols[i % 4], (.3 + q() * .35).toFixed(2), i % 2 ? OAK : MAPLE))
      + `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="8" fill="none" stroke="#d4ad5a" stroke-width="1" stroke-dasharray="6 3" opacity=".4"/>`
      + wheat(14, H - 6, m / 200, -16, '#e3b459') + wheat(20, H - 4, m / 210, -4, '#d4a34a') + wheat(W - 14, H - 6, m / 200, 16, '#e3b459') + wheat(W - 20, H - 4, m / 210, 4, '#d4a34a')
      + pumpkin(40, H - 14, m / 260, 0) + pumpkin(W - 42, H - 14, m / 280, 0)
      + `<g transform="translate(${W / 2} 16) scale(${(m / 260).toFixed(3)})">${[-10, 0, 10].map((x, i) => `<circle cx="${x}" cy="${i === 1 ? -1 : 1}" r="5.5" fill="${['#b8361c', '#e8a33a', '#7d3c8f'][i]}"/>`).join('')}<path d="M-6-5Q0-12 6-5" stroke="#4f7d32" stroke-width="1.2" fill="none"/></g>`
      + leaf(16, 16, m / 170, 15, '#d9661a', .85) + leaf(W - 16, 16, m / 170, -25, '#e8a33a', .85, OAK), L);
  };
  window.THEMED_BD = T;
})();
