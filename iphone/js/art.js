/* Hand-drawn style SVG emblems. All use currentColor so they theme automatically. */
(function () {
  const S = (inner, vb = '0 0 100 100') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const star5 = (cx, cy, r) => {
    let p = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (4 * Math.PI / 5);
      p.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2));
    }
    return `<polygon points="${p.join(' ')}"/>`;
  };
  const twinkle = (x, y, s) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="currentColor" stroke="none"/>`;

  const ART = {
    moon: S(`<path d="M62 14a38 38 0 1 0 24 58A30 30 0 0 1 62 14z"/>${twinkle(70, 34, 6)}${twinkle(80, 52, 3.5)}`),
    triplemoon: S(`<circle cx="50" cy="50" r="17"/><path d="M30 26a26 26 0 0 0 0 48A30 30 0 0 1 30 26z"/><path d="M70 26a26 26 0 0 1 0 48A30 30 0 0 0 70 26z"/>`),
    pentacle: S(`<circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="35" stroke-width="1.2"/>${star5(50, 50, 35)}`),
    candle: S(`<path d="M50 12c-6 9-7 15-3 20 2 2 4 2 6 0 4-5 3-11-3-20z"/><path d="M50 22c-2 4-2 7 0 9" stroke-width="1.4"/><rect x="38" y="38" width="24" height="44" rx="2"/><path d="M38 46c4 3 6 0 8 4s2 8 4 8 2-6 4-8 4-2 8-3"/><path d="M26 88h48M32 82h36"/><line x1="50" y1="32" x2="50" y2="38"/>`),
    cauldron: S(`<path d="M18 40h64"/><path d="M22 40c-4 26 8 40 28 40s32-14 28-40"/><path d="M30 80l-6 10M70 80l6 10"/><path d="M15 40c0-4 3-6 6-6M85 40c0-4-3-6-6-6"/><circle cx="40" cy="28" r="4"/><circle cx="56" cy="22" r="6"/><circle cx="64" cy="32" r="3"/><path d="M36 60c6 4 22 4 28 0" stroke-width="1.4"/>`),
    bottle: S(`<path d="M43 10h14v8H43z"/><path d="M45 18v12c-14 6-22 18-22 32 0 16 12 28 27 28s27-12 27-28c0-14-8-26-22-32V18"/><path d="M28 60c8 4 36 4 44 0" stroke-width="1.4"/>${twinkle(50, 72, 7)}<path d="M40 10l-4-4M60 10l4-4" stroke-width="1.4"/>`),
    incense: S(`<path d="M30 84h40l-6-12H36z"/><line x1="50" y1="72" x2="50" y2="44"/><path d="M50 44c-8-6 6-10-2-18s6-10 0-16" stroke-width="1.8"/><path d="M58 40c6-5-4-9 2-15" stroke-width="1.4"/><path d="M42 36c-5-4 3-7-1-12" stroke-width="1.4"/><circle cx="50" cy="44" r="2" fill="currentColor"/>`),
    dropper: S(`<rect x="42" y="8" width="16" height="16" rx="5"/><path d="M44 24h12v6H44z"/><path d="M47 30v30l3 8 3-8V30"/><path d="M50 74c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12z"/><path d="M28 44c-6 12-6 26 4 34M72 44c6 12 6 26-4 34" stroke-width="1.4"/>`),
    teacup: S(`<path d="M20 46h52c0 20-10 32-26 32S20 66 20 46z"/><path d="M72 52c10 0 12 12 2 14h-4"/><path d="M14 84h64"/><path d="M38 38c-4-6 4-8 0-14M50 36c-4-6 4-8 0-14M62 38c-4-6 4-8 0-14" stroke-width="1.6"/>${twinkle(46, 60, 5)}`),
    tarot: S(`<rect x="22" y="12" width="40" height="64" rx="4" transform="rotate(-10 42 44)"/><rect x="38" y="20" width="40" height="64" rx="4" transform="rotate(8 58 52)"/><g transform="rotate(8 58 52)"><circle cx="58" cy="44" r="9"/><path d="M58 30v4M58 54v4M44 44h4M68 44h4"/><path d="M48 70h20" stroke-width="1.4"/></g>`),
    eye: S(`<path d="M10 50c18-24 62-24 80 0-18 24-62 24-80 0z"/><circle cx="50" cy="50" r="12"/><circle cx="50" cy="50" r="4" fill="currentColor"/><path d="M50 18v-8M30 22l-4-7M70 22l4-7M50 82v8" stroke-width="1.6"/>`),
    leaf: S(`<path d="M20 82C20 40 44 18 84 16c-2 40-24 64-64 66z"/><path d="M20 82L66 34"/><path d="M36 66l-2-14M46 56l-2-16M56 46l-1-14M36 66l14 2M46 56l16 1M56 46l14-1" stroke-width="1.4"/>`),
    mortar: S(`<path d="M16 50h68"/><path d="M20 50c0 18 12 30 30 30s30-12 30-30"/><path d="M38 80l-4 8h32l-4-8"/><path d="M58 46L80 14c3-3 8 0 6 4L64 48"/><circle cx="36" cy="44" r="2" fill="currentColor"/><circle cx="46" cy="42" r="2" fill="currentColor"/>`),
    crystal: S(`<path d="M50 8l16 20-16 64-16-64z"/><path d="M34 28h32M50 8v84"/><path d="M28 46l-12 10 14 26 8-14M72 46l12 10-14 26-8-14" stroke-width="1.6"/>`),
    book: S(`<path d="M50 24c-10-8-24-10-38-8v62c14-2 28 0 38 8 10-8 24-10 38-8V16c-14-2-28 0-38 8z"/><line x1="50" y1="24" x2="50" y2="86"/>${star5(31, 44, 9)}<path d="M62 38h16M62 46h16M62 54h12M24 62h16" stroke-width="1.3"/>`),
    sun: S(`<circle cx="50" cy="50" r="16"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, r1 = 24, r2 = i % 2 ? 34 : 40; return `<line x1="${(50 + r1 * Math.cos(a)).toFixed(1)}" y1="${(50 + r1 * Math.sin(a)).toFixed(1)}" x2="${(50 + r2 * Math.cos(a)).toFixed(1)}" y2="${(50 + r2 * Math.sin(a)).toFixed(1)}"/>`; }).join('')}`),
    broom: S(`<line x1="78" y1="10" x2="40" y2="62"/><path d="M40 62l-8-6-20 30c10 2 22-2 30-10l6-8z"/><path d="M22 80l14-18M28 84l12-16" stroke-width="1.4"/><path d="M36 56l10 8" stroke-width="3"/>`),
    skull: S(`<path d="M50 14c-20 0-32 14-32 30 0 10 5 17 12 21v13h40V65c7-4 12-11 12-21 0-16-12-30-32-30z"/><circle cx="38" cy="46" r="7"/><circle cx="62" cy="46" r="7"/><path d="M50 56l-4 8h8z"/><path d="M42 78v-6M50 78v-6M58 78v-6"/>`),
    spider: S(`<circle cx="50" cy="50" r="38" stroke-width="1"/><circle cx="50" cy="50" r="26" stroke-width="1"/><circle cx="50" cy="50" r="14" stroke-width="1"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="50" y1="50" x2="${(50 + 42 * Math.cos(a)).toFixed(1)}" y2="${(50 + 42 * Math.sin(a)).toFixed(1)}" stroke-width="1"/>`; }).join('')}<circle cx="64" cy="36" r="5" fill="currentColor"/>`),
    hand: S(`<path d="M34 84V46c0-4 6-4 6 0V30c0-4 6-4 6 0v-6c0-4 6-4 6 0v6c0-4 6-4 6 0v18c0-4 6-4 6 0v14c0 12-8 22-20 22z"/><circle cx="50" cy="60" r="7"/><circle cx="50" cy="60" r="2" fill="currentColor"/>`),
    deity: S(`<circle cx="50" cy="20" r="8"/><path d="M50 28v8"/><path d="M24 14c-6 10-2 26 14 30M76 14c6 10 2 26-14 30"/><path d="M38 44c-10 10-12 24-8 42h40c4-18 2-32-8-42"/><path d="M50 52c-6 0-8 6-4 9s9 0 8-5-7-8-12-5" stroke-width="1.8"/>${twinkle(16, 30, 4)}${twinkle(84, 30, 4)}<path d="M26 86h48"/>`),
    silverwheel: S(`<circle cx="50" cy="50" r="34"/><circle cx="50" cy="50" r="8"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${(50 + 8 * Math.cos(a)).toFixed(1)}" y1="${(50 + 8 * Math.sin(a)).toFixed(1)}" x2="${(50 + 34 * Math.cos(a)).toFixed(1)}" y2="${(50 + 34 * Math.sin(a)).toFixed(1)}"/>`; }).join('')}${twinkle(12, 14, 5)}${twinkle(88, 18, 4)}${twinkle(86, 86, 5)}${twinkle(14, 84, 3.5)}${twinkle(50, 6, 3)}`),
    spindle: S(`<line x1="50" y1="10" x2="50" y2="90"/><path d="M50 40c-14 4-14 22 0 26 14-4 14-22 0-26z"/><path d="M40 48h20M39 54h22M40 60h20" stroke-width="1.4"/><path d="M50 22c10-6 22-2 28 6" stroke-width="1.6"/><circle cx="80" cy="30" r="3"/><path d="M22 70a6 6 0 1 1 0 .1M22 76v12M22 82h6M22 87h5" stroke-width="2"/>${twinkle(78, 76, 4)}`),
    halfface: S(`<circle cx="50" cy="50" r="36"/><path d="M50 14a36 36 0 0 0 0 72z" fill="currentColor"/><path d="M58 44q6-4 12 0" /><path d="M30 44q6 4 12 0" stroke="var(--bg)"/><path d="M58 62q6 4 12 0"/><path d="M50 14v72"/>`),
    crow: S(`<path d="M18 62c10-2 18-10 24-20 6-10 18-14 28-8l12-2-8 8c2 14-8 26-22 28l-8 14M42 72l-4 12M54 72l2 12"/><circle cx="66" cy="38" r="2" fill="currentColor"/><path d="M30 56c6 2 14 0 20-6" stroke-width="1.4"/>${twinkle(20, 22, 4)}`),
    search: S(`<circle cx="42" cy="42" r="24"/><line x1="60" y1="60" x2="84" y2="84" stroke-width="5"/>${twinkle(42, 42, 8)}`),
    home: S(`<path d="M14 48L50 16l36 32"/><path d="M22 42v42h56V42"/><path d="M42 84V62h16v22"/><path d="M50 30a8 8 0 1 0 6 12A6 6 0 0 1 50 30z" stroke-width="1.6"/>`),
    gear: S(`<circle cx="50" cy="50" r="12"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${(50 + 22 * Math.cos(a)).toFixed(1)}" y1="${(50 + 22 * Math.sin(a)).toFixed(1)}" x2="${(50 + 34 * Math.cos(a)).toFixed(1)}" y2="${(50 + 34 * Math.sin(a)).toFixed(1)}" stroke-width="7"/>`; }).join('')}<circle cx="50" cy="50" r="24"/>`),
    plus: S(`<line x1="50" y1="18" x2="50" y2="82"/><line x1="18" y1="50" x2="82" y2="50"/>`),
    star: S(star5(50, 52, 38)),
    starFill: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">${star5(50, 52, 38).replace('<polygon', '<polygon fill-rule="nonzero"')}</svg>`,
    back: S(`<path d="M62 18L30 50l32 32" stroke-width="7"/>`),
    edit: S(`<path d="M20 80l6-22 42-42 16 16-42 42z"/><path d="M60 24l16 16"/><path d="M20 80h26"/>`),
    trash: S(`<path d="M22 28h56M40 28V18h20v10M28 28l4 56h36l4-56"/><path d="M42 40v32M58 40v32"/>`),
    table: S(`<rect x="14" y="18" width="72" height="64" rx="3"/><path d="M14 36h72M14 54h72M38 18v64"/>`),
    menu: S(`<line x1="18" y1="30" x2="82" y2="30"/><line x1="18" y1="50" x2="82" y2="50"/><line x1="18" y1="70" x2="82" y2="70"/>`),
    close: S(`<line x1="24" y1="24" x2="76" y2="76" stroke-width="6"/><line x1="76" y1="24" x2="24" y2="76" stroke-width="6"/>`),
    image: S(`<rect x="12" y="20" width="76" height="60" rx="4"/><path d="M12 70l22-22 18 18 12-10 24 20"/><path d="M70 32a7 7 0 1 0 5 11 5 5 0 0 1-5-11z"/>`),
    shuffle: S(`<path d="M14 30h18c16 0 20 40 36 40h18M14 70h18c16 0 20-40 36-40h18"/><path d="M78 22l8 8-8 8M78 62l8 8-8 8"/>`),
    divider: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M6 12h104M190 12h104"/><circle cx="114" cy="12" r="2" fill="currentColor"/><circle cx="186" cy="12" r="2" fill="currentColor"/><path d="M138 4a9 9 0 1 0 0 16 11 11 0 0 1 0-16z"/><circle cx="150" cy="12" r="8"/><path d="M162 4a9 9 0 1 1 0 16 11 11 0 0 0 0-16z"/><path d="M20 12l-8-5M20 12l-8 5M280 12l8-5M280 12l8 5"/></svg>`,
  };

  // emblem for each content type
  const TYPE_ART = { deity: 'deity', spell: 'book', sigil: 'eye', oil: 'bottle', incense: 'incense', tincture: 'dropper', brew: 'cauldron', tarot: 'tarot', herb: 'leaf' };
  // decorative pictures the user can choose for their pages
  const GALLERY = ['moon', 'triplemoon', 'pentacle', 'candle', 'cauldron', 'bottle', 'incense', 'dropper', 'teacup', 'tarot', 'eye', 'leaf', 'mortar', 'crystal', 'book', 'sun', 'broom', 'skull', 'spider', 'hand', 'deity', 'silverwheel', 'spindle', 'halfface', 'crow'];

  window.ART = ART; window.TYPE_ART = TYPE_ART; window.ART_GALLERY = GALLERY;
})();
