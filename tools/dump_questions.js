// Prints every Tarot School question (one of each variation per fact) as JSON, using the app's own code.
const fs = require('fs'), vm = require('vm'), J = __dirname + '/../iphone/js/';
const ctx = { console, Math, Date, JSON, Object, Array, String, Set, Map, RegExp, Number };
ctx.window = ctx; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(J + f, 'utf8'), ctx, { filename: f });
run('tarot-deck.js'); run('tarot-meanings.js');
vm.runInContext(fs.readFileSync(J + 'tarot.js', 'utf8').match(/const CTX_LABEL = \{[^}]*\};/)[0] + "\nconst norm = s => String(s || '').toLowerCase().replace(/[’‘`]/g, \"'\").normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');\nconst stripNum = n => String(n || '').replace(/^[0IVXL]+ · /, ''); const rwsShort = stripNum; const route = () => {};", ctx);
vm.runInContext(fs.readFileSync(J + 'school.js', 'utf8') + '\nSchool.st = { cards: {}, quizzes: {}, facts: {} }; this.makeQuestion = makeQuestion; this.cardSteps = cardSteps;', ctx);
const rows = [];
for (const c of ctx.TAROT_DECK) for (const st of ctx.cardSteps(c.name)) if (st.t === 'quiz' && !/^All /.test(st.title)) for (const f of st.facts) for (let v = 0; v < 3; v++) {
  const q = ctx.makeQuestion(c.name, f, null, v); if (!q) continue;
  rows.push({ card: c.name, step: st.title, fact: f, v, prompt: q.prompt, quote: q.quote || '', img: !!q.img, imgOpts: !!q.imgOpts, answer: q.opts.find(o => o.ok).t });
}
process.stdout.write(JSON.stringify(rows));
