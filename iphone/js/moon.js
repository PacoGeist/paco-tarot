/* Moon phase calculations (Meeus, Astronomical Algorithms ch. 49) — fully offline. */
(function () {
  const rad = d => d * Math.PI / 180;
  const SYN = 29.530588861;
  const PHASES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

  function jdToDate(jd) { return new Date((jd - 2440587.5) * 86400000); }
  function dateToJd(d) { return d.getTime() / 86400000 + 2440587.5; }

  // q: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter
  function truePhase(kInt, q) {
    const k = kInt + q, T = k / 1236.85;
    let jde = 2451550.09766 + SYN * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = rad(2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3);
    const Mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4);
    const F = rad(160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4);
    const O = rad(124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3);
    const s = Math.sin; let c = 0;
    if (q === 0 || q === 0.5) {
      const nm = q === 0;
      c = (nm ? -0.4072 : -0.40614) * s(Mp) + (nm ? 0.17241 : 0.17302) * E * s(M) + (nm ? 0.01608 : 0.01614) * s(2 * Mp)
        + (nm ? 0.01039 : 0.01043) * s(2 * F) + (nm ? 0.00739 : 0.00734) * E * s(Mp - M) - (nm ? 0.00514 : 0.00515) * E * s(Mp + M)
        + (nm ? 0.00208 : 0.00209) * E * E * s(2 * M) - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M)
        - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F) - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O)
        - 0.00007 * s(Mp + 2 * M) + 0.00004 * s(2 * Mp - 2 * F) + 0.00004 * s(3 * M) + 0.00003 * s(Mp + M - 2 * F) + 0.00003 * s(2 * Mp + 2 * F)
        - 0.00003 * s(Mp + M + 2 * F) + 0.00003 * s(Mp - M + 2 * F) - 0.00002 * s(Mp - M - 2 * F) - 0.00002 * s(3 * Mp + M) + 0.00002 * s(4 * Mp);
    } else {
      c = -0.62801 * s(Mp) + 0.17172 * E * s(M) - 0.01183 * E * s(Mp + M) + 0.00862 * s(2 * Mp) + 0.00804 * s(2 * F) + 0.00454 * E * s(Mp - M)
        + 0.00204 * E * E * s(2 * M) - 0.0018 * s(Mp - 2 * F) - 0.0007 * s(Mp + 2 * F) - 0.0004 * s(3 * Mp) - 0.00034 * E * s(2 * Mp - M)
        + 0.00032 * E * s(M + 2 * F) + 0.00032 * E * s(M - 2 * F) - 0.00028 * E * E * s(Mp + 2 * M) + 0.00027 * E * s(2 * Mp + M) - 0.00017 * s(O)
        - 0.00005 * s(Mp - M - 2 * F) + 0.00004 * s(2 * Mp + 2 * F) - 0.00004 * s(Mp + M + 2 * F) + 0.00004 * s(Mp - 2 * M)
        + 0.00003 * s(Mp + M - 2 * F) + 0.00003 * s(3 * M) + 0.00002 * s(2 * Mp - 2 * F) + 0.00002 * s(Mp - M + 2 * F) - 0.00002 * s(3 * Mp + M);
      const W = 0.00306 - 0.00038 * E * Math.cos(M) + 0.00026 * Math.cos(Mp) - 0.00002 * Math.cos(Mp - M) + 0.00002 * Math.cos(Mp + M) + 0.00002 * Math.cos(2 * F);
      c += q === 0.25 ? W : -W;
    }
    jde += c;
    return jdToDate(jde - 69.2 / 86400); // TT -> UT (approx. ΔT)
  }

  const NAMES = ['Wolf Moon', 'Snow Moon', 'Worm Moon', 'Pink Moon', 'Flower Moon', 'Strawberry Moon', 'Buck Moon', 'Sturgeon Moon', 'Corn Moon', "Hunter's Moon", 'Beaver Moon', 'Cold Moon'];
  const PHASE_INFO = {
    'New Moon': 'Plant seeds of intention, new beginnings, rest and inner work.',
    'Waxing Crescent': 'Gather energy: attraction, luck, building and drawing magic.',
    'First Quarter': 'Take action, courage and decisions; push through obstacles.',
    'Waxing Gibbous': 'Refine and nurture; patience, healing, strengthening workings.',
    'Full Moon': 'Peak power: divination, charging tools, moon water, gratitude and celebration.',
    'Waning Gibbous': 'Gratitude and sharing wisdom; begin releasing what no longer serves.',
    'Last Quarter': 'Banish, break habits, cut cords, cleanse and forgive.',
    'Waning Crescent': 'Rest, reflection, banishing and shadow work; surrender before rebirth.',
    'Dark Moon': 'The hidden face: shadow work, hex breaking, ancestor work and deep divination.',
  };

  // list principal phases between two dates
  function phasesBetween(from, to) {
    const out = [];
    const y = from.getUTCFullYear() + from.getUTCMonth() / 12;
    let k = Math.floor((y - 2000) * 12.3685) - 1;
    for (; ; k++) {
      let stop = false;
      for (const q of [0, 0.25, 0.5, 0.75]) {
        const d = truePhase(k, q);
        if (d > to) { stop = true; break; }
        if (d >= from) out.push({ date: d, phase: PHASES[q * 8], q });
      }
      if (stop) break;
    }
    // name full moons (by local month) & detect blue moons
    const seen = {};
    out.forEach(p => {
      if (p.q !== 0.5) return;
      const key = p.date.getFullYear() + '-' + p.date.getMonth();
      p.moonName = (seen[key] ? 'Blue Moon · ' : '') + NAMES[p.date.getMonth()];
      seen[key] = 1;
    });
    return out;
  }

  function current(now = new Date()) {
    const back = phasesBetween(new Date(now.getTime() - 32 * 864e5), now).filter(p => p.q === 0);
    const lastNew = back.length ? back[back.length - 1].date : new Date(now.getTime() - 15 * 864e5);
    const age = (now - lastNew) / 864e5;
    // true illuminated fraction from the Sun and Moon positions (Meeus ch. 48), accurate to a fraction of a percent
    const T = (dateToJd(now) + 69.2 / 86400 - 2451545) / 36525;
    const D = 297.8501921 + 445267.1114034 * T, M = 357.5291092 + 35999.0502909 * T, Mp = 134.9633964 + 477198.8675055 * T;
    const ang = 180 - D - 6.289 * Math.sin(rad(Mp)) + 2.1 * Math.sin(rad(M)) - 1.274 * Math.sin(rad(2 * D - Mp)) - 0.658 * Math.sin(rad(2 * D)) - 0.214 * Math.sin(rad(2 * Mp)) - 0.11 * Math.sin(rad(D));
    const illum = (1 + Math.cos(rad(ang))) / 2;
    const waxingNow = (((D % 360) + 360) % 360) < 180;
    const half = Math.acos(1 - 2 * illum) / (2 * Math.PI); // 0..0.5
    const f = waxingNow ? half : 1 - half; // drawing fraction: 0 new, .5 full
    // phase name: principal phases ±~1 day around exact
    const upcoming = phasesBetween(new Date(now.getTime() - 1.1 * 864e5), new Date(now.getTime() + 1.1 * 864e5));
    let name;
    const near = upcoming.find(p => Math.abs(p.date - now) < 864e5 * (p.q === 0 ? 1.1 : 1));
    if (near) name = near.phase;
    else name = f < 0.25 ? 'Waxing Crescent' : f < 0.5 ? 'Waxing Gibbous' : f < 0.75 ? 'Waning Gibbous' : 'Waning Crescent';
    return { fraction: f, age, illum, name, dark: illum < 0.02, info: PHASE_INFO[name], waxing: f < 0.5 };
  }

  // moon SVG for phase fraction f (0 new -> .5 full -> 1)
  function svg(f, size = 100) {
    const r = 44, cx = 50, cy = 50;
    const k = Math.cos(2 * Math.PI * f); // 1 new, -1 full
    const rx = Math.abs(k) * r;
    const waxing = f < 0.5;
    // lit side: right when waxing
    const sweepOuter = waxing ? 1 : 0;
    const gibbous = k < 0;
    const sweepInner = waxing ? (gibbous ? 1 : 0) : (gibbous ? 0 : 1);
    const lit = `M${cx} ${cy - r} A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${sweepInner} ${cx} ${cy - r}Z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
      <defs><radialGradient id="mg${size}" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#fff6dc"/><stop offset=".7" stop-color="#e6d3a3"/><stop offset="1" stop-color="#b79c63"/></radialGradient></defs>
      <circle cx="50" cy="50" r="${r}" fill="#2a2238" stroke="rgba(212,173,90,.45)" stroke-width="1"/>
      <path d="${lit}" fill="url(#mg${size})"/>
      <circle cx="38" cy="40" r="5" fill="rgba(120,100,70,.18)"/><circle cx="60" cy="62" r="7" fill="rgba(120,100,70,.15)"/><circle cx="62" cy="34" r="3" fill="rgba(120,100,70,.18)"/>
    </svg>`;
  }
  // a real photograph of the full moon, masked to show only the sunlit part for phase fraction f.
  // The faint unlit side is earthshine. Southern hemisphere viewers see the moon turned upside down.
  let uid = 0;
  function photo(f, size = 100) {
    const id = 'mp' + (++uid), r = 49, cx = 50, cy = 50;
    const k = Math.cos(2 * Math.PI * f), rx = Math.abs(k) * r, waxing = f < 0.5, gibbous = k < 0;
    const sweepOuter = waxing ? 1 : 0, sweepInner = waxing ? (gibbous ? 1 : 0) : (gibbous ? 0 : 1);
    const lit = `M${cx} ${cy - r} A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${sweepInner} ${cx} ${cy - r}Z`;
    const full = Math.abs(f - .5) < 0.003, blur = Math.max(0.5, 1.6 * 100 / Math.max(size, 40));
    const rot = MOON.south ? ' transform="rotate(180 50 50)"' : '';
    // brightness of the sunlit part only (Settings > Moon brightness); 1 is the original look, the earthshine side is unchanged
    const gb = Math.min(1.6, Math.max(0.6, +MOON.bright || 1));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" class="moon-photo">
      <defs><clipPath id="${id}c"><circle cx="50" cy="50" r="${r}"/></clipPath>
        <filter id="${id}b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${blur.toFixed(2)}"/></filter>
        <filter id="${id}l" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude="${(1.18 * gb).toFixed(3)}" exponent=".78" offset=".02"/><feFuncG type="gamma" amplitude="${(1.17 * gb).toFixed(3)}" exponent=".78" offset=".02"/><feFuncB type="gamma" amplitude="${(1.12 * gb).toFixed(3)}" exponent=".8" offset=".02"/></feComponentTransfer></filter>
        <mask id="${id}m"><rect width="100" height="100" fill="#000"/>${full ? `<circle cx="50" cy="50" r="${r}" fill="#fff"/>` : `<path d="${lit}" fill="#fff" filter="url(#${id}b)"/>`}</mask>
        <radialGradient id="${id}g" cx="50%" cy="50%" r="50%"><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient></defs>
      <g${rot}><g clip-path="url(#${id}c)">
        <circle cx="50" cy="50" r="${r}" fill="#0c0b12"/>
        <image href="${MOON.IMG}" x="1" y="1" width="98" height="98" opacity=".13" preserveAspectRatio="xMidYMid slice"/>
        <g mask="url(#${id}m)"><image href="${MOON.IMG}" x="1" y="1" width="98" height="98" filter="url(#${id}l)" preserveAspectRatio="xMidYMid slice"/></g>
        <circle cx="50" cy="50" r="${r}" fill="url(#${id}g)"/></g>
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(230,220,200,.12)" stroke-width=".6"/></g>
    </svg>`;
  }
  const PRINCIPAL_F = { 'New Moon': 0, 'First Quarter': .25, 'Full Moon': .5, 'Last Quarter': .75 };

  // Wheel of the Year (northern hemisphere, approximate dates)
  function sabbats(year) {
    return [
      ['Imbolc', 1, 1], ['Ostara', 2, 20], ['Beltane', 4, 1], ['Litha', 5, 21], ['Lughnasadh', 7, 1], ['Mabon', 8, 22], ['Samhain', 9, 31], ['Yule', 11, 21],
    ].map(([n, m, d]) => ({ name: n, date: new Date(year, m, d) }));
  }

  window.MOON = { IMG: 'img/moon/full-moon.jpg', south: false, bright: 1, photo, phasesBetween, current, svg, PHASES, PHASE_INFO, PRINCIPAL_F, sabbats, ALL_PHASES: [...PHASES.slice(0, 8), 'Dark Moon'] };
})();
