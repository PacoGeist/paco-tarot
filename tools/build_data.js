// Bundles all JSON content in tools/data into ../iphone/js/data.js and ../iphone/js/tarot-meanings.js
const fs = require('fs'), D = __dirname + '/data/';
const J = f => JSON.parse(fs.readFileSync(D + f));
const timing = fs.existsSync(D + 'timing-formulas.json') ? { ...J('timing-spells.json'), ...J('timing-formulas.json') } : {};
// Tarot only: layouts from tarot.json plus expansion files tarot-2.json, tarot-3.json …
const SEED = { tarot: J('tarot.json') };
for (const n of [2, 3, 4, 5]) if (fs.existsSync(D + 'tarot-' + n + '.json')) SEED.tarot.push(...J('tarot-' + n + '.json'));
for (const t in SEED) { const ids = new Set(); SEED[t].forEach(it => { if (ids.has(it.id)) throw new Error('duplicate id ' + it.id); ids.add(it.id); }); }
let missing = 0;
for (const t in SEED) SEED[t].forEach(it => {
  delete it.type;
  const tm = timing[it.id];
  if (tm) { if (!it.bestTime) it.bestTime = tm.bestTime; if (!it.moonPhases) it.moonPhases = tm.moonPhases; }
  else if (!it.bestTime) { missing++; console.warn('no timing', it.id); }
});
fs.writeFileSync(__dirname + '/../iphone/js/data.js', 'window.SEED=' + JSON.stringify(SEED) + ';');
console.log(Object.entries(SEED).map(([k, v]) => k + ':' + v.length).join(' '), 'missing timing', missing, Math.round(fs.statSync(__dirname + '/../iphone/js/data.js').size / 1024) + 'KB');
// tarot interpretations + position contexts
{
  const M = {}; for (let i = 1; i <= 6; i++) for (const c of J(`tarot-meanings-${i}.json`)) M[c.name] = c;
  const SY = {}; for (let i = 1; i <= 6; i++) for (const c of J(`tarot-symbols-${i}.json`)) SY[c.name] = c.symbols;
  fs.writeFileSync(__dirname + '/../iphone/js/tarot-meanings.js', 'window.TAROT_MEANINGS=' + JSON.stringify(M) + ';window.POS_CTX=' + JSON.stringify(J('tarot-position-context.json')) + ';window.TAROT_SYMBOLS=' + JSON.stringify(SY) + ';window.SYMBOL_DICT=' + JSON.stringify(J('tarot-symbol-dictionary.json')) + ';window.TAROT_LESSONS=' + JSON.stringify(J('tarot-lessons.json')) + ';window.TAROT_TONE=' + JSON.stringify(J('tarot-tone.json')) + ';');
  console.log('symbols for', Object.keys(SY).length, 'cards');
  console.log('tarot meanings', Object.keys(M).length, Math.round(fs.statSync(__dirname + '/../iphone/js/tarot-meanings.js').size / 1024) + 'KB');
}
// other decks: meanings keyed by the card's Rider–Waite–Smith name (see iphone/js/decks.js)
{
  const DD = {};
  for (const d of ['marseille', 'thoth']) if (fs.existsSync(D + `deck-${d}.json`)) { DD[d] = {}; for (const c of J(`deck-${d}.json`)) { const k = c.key; delete c.key; DD[d][k] = c; } }
  fs.writeFileSync(__dirname + '/../iphone/js/decks-data.js', 'window.DECK_DATA=' + JSON.stringify(DD) + ';');
  console.log('decks', Object.entries(DD).map(([k, v]) => k + ':' + Object.keys(v).length).join(' '), Math.round(fs.statSync(__dirname + '/../iphone/js/decks-data.js').size / 1024) + 'KB');
}
