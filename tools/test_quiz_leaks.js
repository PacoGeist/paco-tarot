// Measures how often a Tarot School question gives its answer away:
// the right option shares a telling word with the question or quote, and no wrong option does.
// Run: node tools/test_quiz_leaks.js [samples]   (add --show to print examples)
const fs = require('fs'), vm = require('vm'), J = __dirname + '/../iphone/js/';
const ctx = { console, Math, Date, JSON, Object, Array, String, Set, Map, RegExp, Number };
ctx.window = ctx; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(J + f, 'utf8'), ctx, { filename: f });
run('tarot-deck.js'); run('tarot-meanings.js');
const tarot = fs.readFileSync(J + 'tarot.js', 'utf8');
vm.runInContext(tarot.match(/const CTX_LABEL = \{[^}]*\};/)[0] + "\nconst norm = s => String(s || '').toLowerCase().replace(/[’‘`]/g, \"'\").normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');\nconst stripNum = n => String(n || '').replace(/^[0IVXL]+ · /, ''); const rwsShort = stripNum; const route = () => {};", ctx);
vm.runInContext(fs.readFileSync(J + 'school.js', 'utf8') + '\nSchool.st = { cards: {}, quizzes: {}, facts: {} }; this.makeQuestion = makeQuestion; this.cardFacts = cardFacts; this.CTX_LABEL = CTX_LABEL; this.rwsShort = rwsShort;', ctx);
const STOP = new Set('this that with from into your their there they them have been being were what which when where while about above below over under after before again other some such only same than very just also more most much many each every both their these those card cards here shows show seen held holds hold hand hands figure figures stands standing behind front left right centre center side back upon through toward towards around across along beneath under within without itself himself herself something someone often usually still even like would could should does doing done make makes made bring brings brought known well whole time will shall must might feel feels sense mean means suggest position message heart belong carri carry carries'.split(' '));
const stem = w => w.replace(/(ings?|edly|ed|es|s|ly)$/,'').replace(/(.)\1$/,'$1');
const words = t => new Set(String(t || '').toLowerCase().replace(/[’']s\b/g,'').match(/[a-z]{4,}/g)?.filter(w => !STOP.has(w)).map(stem).filter(w => w.length >= 4) || []);
const N = +process.argv[2] || 3, show = process.argv.includes('--show');
const tally = {}, ex = {};
const ID = { id: ['Q01','Q02','Q03'], kw: ['Q04','Q05','Q06'], mean: ['Q07','Q08','Q09/10'], attr: ['Q11','Q12','Q13'], sym: ['Q14','Q15','Q16/17'], pos: ['Q18','Q19','Q20'] };
for (const c of ctx.TAROT_DECK) {
  const F = ctx.cardFacts(c.name);
  for (const f of [...F.core, ...F.sym, ...F.pos]) for (let v = 0; v < 3; v++) for (let k = 0; k < N; k++) {
    const q = ctx.makeQuestion(c.name, f, null, v); if (!q) continue;
    const kind = f.split(':')[0], qid = ID[kind][q.v] || '?';
    if (qid === 'Q02') continue;          // "which picture is X?": the name is the question, the pictures are the answers
    // the card's own name in the prompt is the subject of the question, not a clue
    const prompt = (q.prompt || '').split(ctx.rwsShort(c.name)).join(' ');
    const shown = words(prompt + ' ' + (q.quote || ''));
    const ov = o => [...words(o.t)].filter(w => shown.has(w));
    const right = q.opts.find(o => o.ok), wrong = q.opts.filter(o => !o.ok);
    const r = ov(right), wmax = Math.max(0, ...wrong.map(o => ov(o).length));
    const t = tally[qid] || (tally[qid] = { n: 0, bad: 0 }); t.n++;
    if (r.length > wmax) { t.bad++; (ex[qid] = ex[qid] || []).push(`${c.name} | ${q.prompt} | ${q.quote || ''} → ${right.t}   [${r.join(',')}]`); }
  }
}
let n = 0, bad = 0;
for (const k of Object.keys(tally).sort()) { const t = tally[k]; n += t.n; bad += t.bad; console.log(k.padEnd(7), String(t.n).padStart(6), 'asked', String(t.bad).padStart(6), 'give-aways', (100 * t.bad / t.n).toFixed(1).padStart(5) + '%'); }
console.log('ALL    ', String(n).padStart(6), 'asked', String(bad).padStart(6), 'give-aways', (100 * bad / n).toFixed(1).padStart(5) + '%');
if (show) for (const k of Object.keys(ex).sort()) { console.log('\n== ' + k); ex[k].sort(() => Math.random() - .5).slice(0, 6).forEach(x => console.log('  ' + x)); }
