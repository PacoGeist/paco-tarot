/* ---------- Tarot School: the learning game ----------
   Card-by-card lessons that teach a little, then quiz it:
   meet the card -> symbols & features in batches of ~5 (quiz after each) -> all symbols together ->
   the 15 position readings in batches of 5 (quiz after each) -> a 15-question card quiz (80% to pass).
   Group quizzes: Majors 0–4, 5–10, 11–16, 17–21 (4 per card), then all 22 (2 per card, 44 questions).
   Each suit: Ace–Five (4 per card), Six–Ten (4 per card), Ace–Ten (2 per card), Page–King (5 per card).
   Every question is built on the device from the card data, and every fact has three ways of being asked.
   Progress lives in the kv store under 'school'. All cards are upright; reversals are never mentioned. */

const SCHOOL_PASS = 0.8;
const School = {
  st: null,
  async load() {
    if (this.st) return this.st;
    const s = (await DB.get('school', null)) || {};
    this.st = { cards: {}, quizzes: {}, facts: {}, xp: 0, streak: { day: '', n: 0 }, ...s };
    return this.st;
  },
  save() { return DB.set('school', this.st); },
  // bring in progress from a backup without losing anything learned here
  async merge(b) {
    await this.load(); const st = this.st;
    for (const [k, r] of Object.entries(b.cards || {})) { const h = st.cards[k] || {}; st.cards[k] = { ...h, ...r, step: Math.max(h.step || 0, r.step || 0), best: Math.max(h.best || 0, r.best || 0), stars: Math.max(h.stars || 0, r.stars || 0), done: !!(h.done || r.done) }; }
    for (const [k, r] of Object.entries(b.quizzes || {})) { const h = st.quizzes[k] || {}; st.quizzes[k] = { ...h, ...r, best: Math.max(h.best || 0, r.best || 0), stars: Math.max(h.stars || 0, r.stars || 0), passed: !!(h.passed || r.passed) }; }
    for (const [k, r] of Object.entries(b.facts || {})) if (!st.facts[k]) st.facts[k] = r;
    st.xp = Math.max(st.xp || 0, +b.xp || 0);
    if (b.streak && (!st.streak.day || new Date(b.streak.day) > new Date(st.streak.day))) st.streak = b.streak;
    await this.save();
  },
};

/* ---------- the course map ---------- */
const SCHOOL_RANKS = [[0, 'Seeker'], [5, 'Apprentice'], [15, 'Initiate'], [30, 'Adept'], [50, 'Reader'], [78, 'Oracle']];
let _tracks = null;
function schoolTracks() {
  if (_tracks) return _tracks;
  const names = a => TAROT_DECK.filter(c => c.arcana === a).map(c => c.name);
  const maj = names('Major'), T = [];
  const items = [];
  [[0, 4], [5, 10], [11, 16], [17, 21]].forEach(([a, b], gi) => {
    const cs = maj.slice(a, b + 1);
    cs.forEach(n => items.push({ kind: 'card', name: n }));
    items.push({ kind: 'quiz', id: `major-${gi + 1}`, title: `Major Arcana ${a}–${b}`, sub: `${rwsShort(cs[0])} to ${rwsShort(cs[cs.length - 1])}`, cards: cs, per: 4 });
  });
  items.push({ kind: 'quiz', id: 'major-all', title: 'All 22 Major Arcana', sub: 'the Fool’s whole journey', cards: maj, per: 2, big: true });
  T.push({ key: 'Major', title: 'The Major Arcana', sub: 'The 22 great archetypes, from the Fool to the World', items });
  for (const suit of ['Wands', 'Cups', 'Swords', 'Pentacles']) {
    const cs = names(suit), it = [], q = (id, title, sub, cards, per, big) => it.push({ kind: 'quiz', id: `${suit.toLowerCase()}-${id}`, title, sub, cards, per, big });
    cs.slice(0, 5).forEach(n => it.push({ kind: 'card', name: n }));
    q(1, `${suit}: Ace to Five`, 'the first five cards', cs.slice(0, 5), 4);
    cs.slice(5, 10).forEach(n => it.push({ kind: 'card', name: n }));
    q(2, `${suit}: Six to Ten`, 'the next five cards', cs.slice(5, 10), 4);
    q(3, `${suit}: Ace to Ten`, 'all ten numbered cards', cs.slice(0, 10), 2, true);
    cs.slice(10).forEach(n => it.push({ kind: 'card', name: n }));
    q(4, `${suit}: the Court`, 'Page, Knight, Queen and King', cs.slice(10), 5, true);
    const g = SUIT_GROUPS.find(x => x[0] === suit) || [suit, suit, ''];
    T.push({ key: suit, title: g[1], sub: g[2], items: it });
  }
  return (_tracks = T);
}
const itemDone = it => it.kind === 'card' ? !!(School.st.cards[it.name] || {}).done : !!(School.st.quizzes[it.id] || {}).passed;
function itemUnlocked(it) {
  for (const t of schoolTracks()) {
    const i = t.items.indexOf(it);
    if (i >= 0) return i === 0 || itemDone(t.items[i - 1]);
  }
  return false;
}
const findCardItem = name => { for (const t of schoolTracks()) { const it = t.items.find(x => x.kind === 'card' && x.name === name); if (it) return it; } };
const findQuizItem = id => { for (const t of schoolTracks()) { const it = t.items.find(x => x.kind === 'quiz' && x.id === id); if (it) return it; } };
const prevOf = it => { for (const t of schoolTracks()) { const i = t.items.indexOf(it); if (i > 0) return t.items[i - 1]; } };
const itemLabel = it => it.kind === 'card' ? rwsShort(it.name) : it.title;
const itemHref = it => it.kind === 'card' ? `#/school/card/${encodeURIComponent(it.name)}` : `#/school/quiz/${it.id}`;
const cardsDone = () => Object.values(School.st.cards).filter(c => c.done).length;
const schoolRank = () => { const n = cardsDone(); let r = SCHOOL_RANKS[0][1]; SCHOOL_RANKS.forEach(([k, t]) => { if (n >= k) r = t; }); return r; };
const starsFor = p => p >= 1 ? 3 : p >= .9 ? 2 : p >= SCHOOL_PASS ? 1 : 0;
const starHTML = n => `<span class="sq-stars">${[0, 1, 2].map(i => i < n ? '★' : '☆').join('')}</span>`;

/* ---------- text helpers ---------- */
const sentences = t => String(t || '').split(/(?<=[.!?])\s+(?=[A-Z“"‘'])/).filter(Boolean);
const firstSent = (t, n = 1) => sentences(t).slice(0, n).join(' ');
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, name) => { const b = rwsShort(name).replace(/^The /, ''); return new RegExp(`\\b${reEsc(b)}\\b`, 'i').test(text); };
function maskCard(text, name) {
  const sn = rwsShort(name), bare = sn.replace(/^The /, '');
  let t = String(text || '');
  [sn, bare].filter((x, i, a) => x.length > 2 && a.indexOf(x) === i).forEach(x => { t = t.replace(new RegExp(`\\b(the )?${reEsc(x)}('s)?\\b`, 'gi'), (m0, the, s) => s ? 'this card’s' : 'this card'); });
  return t.replace(/(^|[.!?]\s+)this card/g, (m0, p) => p + 'This card');
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickN = (a, n) => shuffle(a).slice(0, n);
// fill to n options from a pool, never repeating the right answer or each other
function distinctFrom(right, pool, n, key = x => norm(x)) {
  const seen = new Set([key(right)]), out = [];
  for (const p of shuffle(pool)) { const k = key(p); if (!k || seen.has(k)) continue; seen.add(k); out.push(p); if (out.length >= n) break; }
  return out;
}
const M_ = n => (window.TAROT_MEANINGS || {})[n] || {};
const S_ = n => (window.TAROT_SYMBOLS || {})[n] || [];
const CTX_KEYS = () => Object.keys(CTX_LABEL);
// positions that read too much alike to be fair wrong answers for each other
const CTX_NEAR = { past: ['foundation'], foundation: ['past'], challenge: ['shadow'], shadow: ['challenge', 'hopes'], hopes: ['shadow'], advice: ['gift'], gift: ['advice'], self: ['others'], others: ['self'] };
function otherCards(name, n, sameFirst = 2) {
  const c = TAROT_BY_NAME[name], same = TAROT_DECK.filter(x => x.arcana === c.arcana && x.name !== name), rest = TAROT_DECK.filter(x => x.arcana !== c.arcana);
  const a = pickN(same, Math.min(sameFirst, same.length));
  return [...a, ...pickN(rest.filter(x => !a.includes(x)), n - a.length)].map(x => x.name);
}

/* ---------- the facts on each card ---------- */
// fact keys: core facts 'id' (the card itself), 'kw' (keywords), 'mean' (its message), 'attr' (element, astrology, yes/no);
// 'sym:i' for each symbol or feature; 'pos:<ctx>' for each of the 15 position readings
function cardFacts(name) {
  return { core: ['id', 'kw', 'mean', 'attr'], sym: S_(name).map((s, i) => 'sym:' + i), pos: CTX_KEYS().filter(k => (M_(name).ctx || {})[k]).map(k => 'pos:' + k) };
}
const factKey = (name, f) => name + '|' + f;
function factWeight(name, f) {
  const r = School.st.facts[factKey(name, f)];
  if (!r) return 4;                                   // never asked: most likely to come up
  return 1 + 3 * Math.max(0, r.w - r.r / 2) + (r.last === false ? 3 : 0);  // missed recently: comes back
}
function weightedPick(name, facts, n) {
  const pool = facts.map(f => ({ f, w: factWeight(name, f) * (0.6 + Math.random() * 0.8) }));
  return pool.sort((a, b) => b.w - a.w).slice(0, n).map(x => x.f);
}

/* ---------- three ways to ask about every fact ---------- */
function makeQuestion(name, fact, avoidV) {
  const c = TAROT_BY_NAME[name], m = M_(name), sn = rwsShort(name), syms = S_(name);
  const V = [];
  const nameOpts = right => [right, ...otherCards(right, 3)].map(n => ({ t: rwsShort(n), ok: n === right }));
  if (fact === 'id') {
    V.push(() => ({ prompt: 'Which card is this?', img: c.img, hideTitle: true, opts: nameOpts(name), explain: firstSent(m.meaning) }));
    V.push(() => ({ prompt: `Which of these is ${sn}?`, opts: [name, ...otherCards(name, 3)].map(n => ({ img: TAROT_BY_NAME[n].img, t: rwsShort(n), ok: n === name })), imgOpts: true, hideTitle: true, explain: firstSent(m.imagery) }));
    V.push(() => ({ prompt: 'Which card shows this scene?', quote: maskCard(firstSent(m.imagery, 1), name), opts: nameOpts(name), explain: m.imagery }));
  } else if (fact === 'kw') {
    const kw = m.keywords || [];
    const three = n => pickN(M_(n).keywords || [], 3).join(', ');
    V.push(() => { const right = three(name); return { prompt: `Which keywords belong to ${sn}?`, opts: [{ t: right, ok: true }, ...distinctFrom(right, otherCards(name, 6).map(three), 3).map(t => ({ t }))], explain: `${sn}: ${kw.join(', ')}.` }; });
    const kwSafe = kw.filter(k => !leaks(k, name));
    V.push(() => ({ prompt: 'Which card is known for these keywords?', quote: pickN(kwSafe.length >= 3 ? kwSafe : kw, 3).join(' · '), opts: nameOpts(name), explain: `${sn}: ${kw.join(', ')}.` }));
    V.push(() => { const right = pickN(kw, 1)[0], other = TAROT_DECK.filter(x => x.name !== name).flatMap(x => M_(x.name).keywords || []).filter(k => !kw.map(norm).includes(norm(k))); return { prompt: `Which of these is a keyword of ${sn}?`, opts: [{ t: right, ok: true }, ...distinctFrom(right, other, 3).map(t => ({ t }))], explain: `${sn}: ${kw.join(', ')}.` }; });
  } else if (fact === 'mean') {
    const ss = sentences(m.meaning), idx = ss.length > 2 ? 1 : 0, key = n => maskCard(sentences(M_(n).meaning)[idx] || firstSent(M_(n).meaning), n);
    V.push(() => { const right = key(name); return { prompt: `What is the heart of ${sn}’s message?`, opts: [{ t: right, ok: true }, ...distinctFrom(right, otherCards(name, 6).map(key), 3).map(t => ({ t }))], explain: m.meaning }; });
    V.push(() => ({ prompt: 'Which card carries this message?', quote: maskCard(ss[Math.min(ss.length - 1, idx + 1)] || ss[0], name), opts: nameOpts(name), explain: m.meaning }));
    if (m.affirmation && !leaks(m.affirmation, name)) V.push(() => ({ prompt: 'Which card’s affirmation is this?', quote: m.affirmation, opts: nameOpts(name), explain: `${sn}: “${m.affirmation}”` }));
    else V.push(() => ({ prompt: 'Which card is this describing?', quote: maskCard(ss[ss.length - 1], name), opts: nameOpts(name), explain: m.meaning }));
  } else if (fact === 'attr') {
    const all = k => [...new Set(TAROT_DECK.map(x => M_(x.name)[k]).filter(Boolean))];
    if (m.element) V.push(() => ({ prompt: `Which element is linked to ${sn}?`, opts: [{ t: m.element, ok: true }, ...distinctFrom(m.element, [...new Set(['Fire', 'Water', 'Air', 'Earth', ...all('element')])], 3).map(t => ({ t }))], explain: `${sn} belongs to ${m.element}.${m.astrology ? ` Astrology: ${m.astrology}.` : ''}` }));
    if (m.astrology) V.push(() => ({ prompt: `Which astrological link belongs to ${sn}?`, opts: [{ t: m.astrology, ok: true }, ...distinctFrom(m.astrology, all('astrology'), 3).map(t => ({ t }))], explain: `${sn}: ${m.astrology}.` }));
    if (m.yesNo) V.push(() => ({ prompt: `Asked a yes-or-no question, how does ${sn} usually answer?`, opts: ['Yes', 'No', 'Maybe'].map(t => ({ t, ok: t === m.yesNo })), explain: `${sn} leans “${m.yesNo}”.` }));
  } else if (fact.startsWith('sym:')) {
    const s = syms[+fact.slice(4)]; if (!s) return null;
    const meanKey = x => firstSent(x.meaning);
    const explain = `${s.feature}${s.where ? ` (${s.where})` : ''}: ${s.meaning}`;
    const otherFeat = () => distinctFrom(s.feature, syms.map(x => x.feature), 3).map(t => ({ t }));
    V.push(() => { const pool = TAROT_DECK.filter(x => x.name !== name).flatMap(x => S_(x.name).filter(y => norm(y.feature) !== norm(s.feature)).map(meanKey)); return { prompt: `On ${sn}, what does this feature mean?`, quote: s.feature, opts: [{ t: meanKey(s), ok: true }, ...distinctFrom(meanKey(s), pool, 3).map(t => ({ t }))], explain }; });
    V.push(() => ({ prompt: `Which feature of ${sn} carries this meaning?`, quote: meanKey(s), opts: [{ t: s.feature, ok: true }, ...otherFeat()], explain }));
    if (s.where) V.push(() => ({ prompt: `Look at ${sn}. Which feature is found here?`, img: c.img, quote: s.where, opts: [{ t: s.feature, ok: true }, ...otherFeat()], explain }));
    else V.push(() => { const mine = syms.map(x => norm(x.feature)), pool = TAROT_DECK.filter(x => x.name !== name).flatMap(x => S_(x.name).map(y => y.feature)).filter(f => !mine.includes(norm(f))); return { prompt: `Which of these features appears on ${sn}?`, img: c.img, opts: [{ t: s.feature, ok: true }, ...distinctFrom(s.feature, pool, 3).map(t => ({ t }))], explain }; });
  } else if (fact.startsWith('pos:')) {
    const k = fact.slice(4), txt = (m.ctx || {})[k]; if (!txt) return null;
    const lab = CTX_LABEL[k], key = n => maskCard(firstSent((M_(n).ctx || {})[k]), n);
    V.push(() => { const right = key(name); return { prompt: `${sn} falls in a “${lab}” position. What does it suggest?`, opts: [{ t: right, ok: true }, ...distinctFrom(right, otherCards(name, 6).map(key), 3).map(t => ({ t }))], explain: `${lab}: ${txt}` }; });
    V.push(() => { const others = CTX_KEYS().filter(x => x !== k && !(CTX_NEAR[k] || []).includes(x)); return { prompt: `This is how ${sn} reads in one kind of position. Which position?`, quote: firstSent(txt, 2), opts: [{ t: lab, ok: true }, ...pickN(others, 3).map(x => ({ t: CTX_LABEL[x] }))], explain: `${lab}: ${txt}` }; });
    V.push(() => ({ prompt: `Which card, falling in a “${lab}” position, would say this?`, quote: maskCard(firstSent(txt, 2), name), opts: nameOpts(name), explain: `${sn} · ${lab}: ${txt}` }));
  }
  if (!V.length) return null;
  let vi = Math.floor(Math.random() * V.length);
  if (V.length > 1 && vi === avoidV) vi = (vi + 1 + Math.floor(Math.random() * (V.length - 1))) % V.length;
  const q = V[vi]();
  if (!q || q.opts.length < 2) return null;
  q.opts = shuffle(q.opts); q.name = name; q.fact = fact; q.v = vi;
  return q;
}
const lastV = (name, f) => (School.st.facts[factKey(name, f)] || {}).v;
const qFor = (name, f) => makeQuestion(name, f, lastV(name, f));

/* question sets */
function cardFinalSet(name) {
  const F = cardFacts(name);
  const picks = [...weightedPick(name, F.core, 3), ...weightedPick(name, F.sym, 7), ...weightedPick(name, F.pos, 5)];
  return shuffle(picks).map(f => qFor(name, f)).filter(Boolean);
}
function groupSet(cards, per) {
  const plan = { 2: ['core', 'any'], 4: ['core', 'sym', 'sym', 'pos'], 5: ['core', 'sym', 'sym', 'pos', 'pos'] }[per] || ['core', 'sym', 'pos'];
  const qs = [];
  cards.forEach(n => {
    const F = cardFacts(n), used = new Set();
    plan.forEach(cat => {
      const pool = (cat === 'any' ? [...F.sym, ...F.pos] : F[cat]).filter(f => !used.has(f));
      const f = weightedPick(n, pool, 1)[0]; if (!f) return;
      used.add(f); const q = qFor(n, f); if (q) qs.push(q);
    });
  });
  return shuffle(qs);
}
function practiceSet(n = 10) {
  const done = Object.keys(School.st.cards).filter(k => School.st.cards[k].done);
  const all = done.flatMap(c => { const F = cardFacts(c); return [...F.core, ...F.sym, ...F.pos].map(f => ({ c, f, w: factWeight(c, f) * (0.5 + Math.random()) })); });
  return all.sort((a, b) => b.w - a.w).slice(0, n).map(x => qFor(x.c, x.f)).filter(Boolean);
}

/* ---------- the quiz engine ---------- */
function bumpStreak() {
  const st = School.st, d = new Date(), today = d.toDateString(), y = new Date(d.getTime() - 864e5).toDateString();
  if (st.streak.day === today) return;
  st.streak = { day: today, n: st.streak.day === y ? st.streak.n + 1 : 1 };
}
// opts: { title, sub, qs, mini (missed questions return until answered right; nothing to pass), pass (graded), onDone(result), again() }
function runQuiz(el, opts) {
  let queue = opts.qs.slice(), i = 0, first = new Map(), combo = 0, best = 0, xp = 0, answered = false;
  const total = opts.qs.length, missed = [];
  const top = () => { const y = el.getBoundingClientRect().top + scrollY - 70; if (scrollY > y) window.scrollTo({ top: Math.max(0, y) }); };
  const draw = () => {
    const q = queue[i]; answered = false;
    const scored = [...first.values()].filter(Boolean).length;
    const done = first.size;
    el.innerHTML = `<div class="sq">
      <div class="sq-top"><span>${esc(opts.title || 'Quiz')}</span><span>${combo >= 2 ? `<b class="sq-combo">${combo} in a row</b> · ` : ''}${scored}/${total}</span></div>
      <div class="sq-bar"><i style="width:${Math.round(done / total * 100)}%"></i></div>
      ${q.retry ? '<div class="sq-again">Second chance: this one came back</div>' : ''}
      <div class="sq-q">${esc(q.prompt)}</div>
      ${q.img ? `<div class="sq-img"><img src="${q.img}" alt="" ${q.hideTitle ? 'class="hide-title"' : `data-card="${esc(q.name)}"`}></div>` : ''}
      ${q.quote ? `<blockquote class="sq-quote">${esc(q.quote)}</blockquote>` : ''}
      <div class="sq-opts ${q.imgOpts ? 'imgs' : ''}">${q.opts.map((o, k) => `<button class="sq-opt" data-k="${k}">${o.img ? `<img src="${o.img}" alt="${esc(o.t)}" class="${q.hideTitle ? 'hide-title' : ''}">` : esc(o.t)}</button>`).join('')}</div>
      <div id="sqfb"></div></div>`;
    top();
    $$('.sq-opt', el).forEach(b => b.onclick = () => answer(+b.dataset.k));
  };
  const answer = k => {
    if (answered) return; answered = true;
    const q = queue[i], ok = !!q.opts[k].ok, isFirst = !q.retry;
    $$('.sq-opt', el).forEach((b, j) => { b.disabled = true; if (q.opts[j].ok) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); });
    $$('.sq img.hide-title', el).forEach(im => im.classList.remove('hide-title'));  // reveal the printed names once answered
    if (q.imgOpts) $$('.sq-opt', el).forEach((b, j) => b.insertAdjacentHTML('beforeend', `<span>${esc(q.opts[j].t)}</span>`));
    if (isFirst) {
      first.set(q, ok);
      const fk = factKey(q.name, q.fact), r = School.st.facts[fk] || { r: 0, w: 0 };
      ok ? r.r++ : r.w++; r.last = ok; r.v = q.v; School.st.facts[fk] = r;
      if (!ok) missed.push(q);
    }
    if (ok) { combo++; best = Math.max(best, combo); const g = (isFirst ? 10 : 3) + (combo >= 3 ? 5 : 0); xp += g; }
    else { combo = 0; if (opts.mini && (q.tries || 0) < 2) { const again = makeQuestion(q.name, q.fact, q.v) || { ...q, opts: shuffle(q.opts) }; again.tries = (q.tries || 0) + 1; again.retry = true; queue.push(again); } }
    const right = q.opts.find(o => o.ok);
    $('#sqfb', el).innerHTML = `<div class="sq-fb ${ok ? 'ok' : 'no'}"><b>${ok ? pickN(['Well read!', 'Yes!', 'Exactly so.', 'Spot on.', 'The cards agree.'], 1)[0] : 'Not quite.'}</b>
      ${ok ? '' : `<div class="small">The answer: <b>${esc(right.t)}</b></div>`}<p>${esc(q.explain || '')}</p>
      <div class="actions"><button class="btn primary" id="sqn">${i + 1 < queue.length ? 'Next ›' : 'See results ›'}</button></div></div>`;
    $('#sqn', el).onclick = () => { i++; i < queue.length ? draw() : finish(); };
    $('#sqn', el).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  const finish = async () => {
    const right = opts.qs.filter(q => first.get(q)).length, pct = total ? right / total : 1, stars = starsFor(pct);
    const passed = !opts.pass || pct >= SCHOOL_PASS;
    if (opts.pass && passed) xp += 25 + stars * 10;
    School.st.xp += xp; bumpStreak();
    const res = { right, total, pct, stars, passed, xp };
    if (opts.onDone) await opts.onDone(res);
    await School.save();
    el.innerHTML = `<div class="sq sq-end fade-in">
      <div class="sq-score">${right}<small>/${total}</small></div>
      ${opts.pass ? starHTML(stars) : ''}
      <h2 style="margin:6px 0">${opts.pass ? (passed ? (stars === 3 ? 'Flawless!' : 'Passed!') : 'Almost there') : (pct >= .8 ? 'Well learned' : 'Keep at it')}</h2>
      <p class="small muted" style="margin:0">${Math.round(pct * 100)}% on the first try · best streak ${best} · +${xp} XP</p>
      ${opts.pass && !passed ? `<p>You need ${Math.ceil(total * SCHOOL_PASS)} of ${total} to pass. Look over the ones you missed, then try again: you'll get a fresh set of questions.</p>` : ''}
      ${missed.length ? `<details class="sq-missed" ${opts.pass && !passed ? 'open' : ''}><summary>Review what you missed (${missed.length})</summary>${missed.map(q => `<div class="sq-m"><div class="small muted">${esc(rwsShort(q.name))}</div><b>${esc(q.prompt)}</b>${q.quote ? `<div class="small"><i>${esc(q.quote)}</i></div>` : ''}<div>✓ ${esc(q.opts.find(o => o.ok).t)}</div><p class="small">${esc(q.explain || '')}</p></div>`).join('')}</details>` : ''}
      <div class="actions">${opts.again ? `<button class="btn ${passed ? 'ghost' : 'primary'}" id="sqa">Try again</button>` : ''}${passed && opts.next ? `<button class="btn primary" id="sqc">${esc(opts.nextLabel || 'Continue ›')}</button>` : ''}${opts.back ? `<a class="btn ghost" href="${opts.back}">Tarot School</a>` : ''}</div></div>`;
    top();
    if ($('#sqa', el)) $('#sqa', el).onclick = opts.again;
    if ($('#sqc', el)) $('#sqc', el).onclick = opts.next;
  };
  if (!queue.length) { el.innerHTML = '<div class="empty">No questions could be made here.</div>'; return; }
  draw();
}

/* ---------- the lesson for one card ---------- */
function cardSteps(name) {
  const syms = S_(name), n = syms.length, nb = Math.max(1, Math.ceil(n / 5)), steps = [];
  steps.push({ t: 'meet' }, { t: 'quiz', title: 'Check: the card', facts: ['id', 'kw', 'mean', 'attr'] });
  let k = 0;
  for (let b = 0; b < nb; b++) {
    const size = Math.floor(n / nb) + (b < n % nb ? 1 : 0), idx = Array.from({ length: size }, (_, j) => k + j); k += size;
    steps.push({ t: 'sym', idx, part: b + 1, parts: nb }, { t: 'quiz', title: `Check: features ${idx[0] + 1}–${idx[idx.length - 1] + 1}`, facts: idx.map(i => 'sym:' + i) });
  }
  if (nb > 1) steps.push({ t: 'symall' }, { t: 'quiz', title: `All ${n} symbols & features`, facts: syms.map((s, i) => 'sym:' + i) });
  const keys = CTX_KEYS().filter(x => (M_(name).ctx || {})[x]);
  for (let b = 0; b < keys.length; b += 5) {
    const ks = keys.slice(b, b + 5);
    steps.push({ t: 'pos', ks, part: b / 5 + 1, parts: Math.ceil(keys.length / 5) }, { t: 'quiz', title: `Check: positions ${b + 1}–${b + ks.length}`, facts: ks.map(x => 'pos:' + x) });
  }
  steps.push({ t: 'final' });
  return steps;
}
function nextAfter(it) {
  for (const t of schoolTracks()) { const i = t.items.indexOf(it); if (i >= 0 && i + 1 < t.items.length) return t.items[i + 1]; }
}
function lockedHTML(it) {
  const p = prevOf(it);
  return `<div class="empty" style="margin-top:20px">${ART.moon}<p><b>${esc(itemLabel(it))}</b> opens once you finish <a href="${itemHref(p)}">${esc(itemLabel(p))}</a>.</p><a class="btn" href="#/school">Back to Tarot School</a></div>`;
}
route('school/card/:name', async (v, [name]) => {
  await School.load();
  const it = findCardItem(name); if (!it) return (location.hash = '#/school');
  setTitle(rwsShort(name));
  if (!itemUnlocked(it) && !itemDone(it)) { v.innerHTML = lockedHTML(it); return; }
  const c = TAROT_BY_NAME[name], m = M_(name), syms = S_(name), steps = cardSteps(name);
  const rec = School.st.cards[name] = School.st.cards[name] || { step: 0 };
  let s = rec.done ? 0 : Math.min(rec.step || 0, steps.length - 1);
  const go = async n => { s = Math.max(0, Math.min(n, steps.length - 1)); if (!rec.done) rec.step = Math.max(rec.step || 0, s); await School.save(); draw(); window.scrollTo(0, 0); };
  const head = () => `<div class="sl-head"><img src="${c.img}" alt="" data-card="${esc(name)}"><div><div class="small muted">${c.arcana === 'Major' ? 'Major Arcana' : c.arcana} · Step ${s + 1} of ${steps.length}</div><b>${esc(rwsShort(name))}</b><div class="sq-bar"><i style="width:${Math.round(s / (steps.length - 1) * 100)}%"></i></div></div></div>`;
  const nav = (label = 'Continue ›') => `<div class="actions">${s ? '<button class="btn ghost" id="slb">‹ Back</button>' : ''}<button class="btn primary" id="sln">${label}</button></div>`;
  const wire = () => { if ($('#slb', v)) $('#slb', v).onclick = () => go(s - 1); if ($('#sln', v)) $('#sln', v).onclick = () => go(s + 1); };
  const symHTML = i => { const x = syms[i]; return `<div class="sym-row"><div class="sym-f"><span class="sl-n">${i + 1}</span>${esc(x.feature)}</div>${x.where ? `<div class="small muted">${esc(x.where)}</div>` : ''}<p>${esc(x.meaning)}</p></div>`; };
  const draw = () => {
    const st = steps[s];
    if (st.t === 'meet') {
      v.innerHTML = `${head()}<div class="card-hero"><img src="${c.img}" alt="" data-card="${esc(name)}"></div>
        <div class="dhead" style="margin-top:10px"><div class="type">Meet the card</div><h1>${esc(rwsShort(name))}</h1>${m.affirmation ? `<div class="latin">“${esc(m.affirmation)}”</div>` : ''}</div>
        <div class="chips" style="justify-content:center;margin:10px 0">${(m.keywords || []).map(k => `<span class="chip gold">${esc(k)}</span>`).join('')}</div>
        <div class="facts">${[['ELEMENT', m.element], ['ASTROLOGY', m.astrology], ['YES OR NO', m.yesNo]].filter(f => f[1]).map(f => `<div class="fact"><small>${f[0]}</small><span>${esc(f[1])}</span></div>`).join('')}</div>
        <p class="lead">${esc(m.meaning || c.up)}</p>
        ${m.imagery ? `<div class="block"><h3>${ART.eye}The Imagery</h3><p>${esc(m.imagery)}</p></div>` : ''}
        <p class="sl-tip">${ART.star} Next: four quick questions on the card, its keywords, its message and its element. Tap the card to look closer.</p>${nav('I’m ready ›')}`;
    } else if (st.t === 'sym') {
      v.innerHTML = `${head()}<div class="dhead"><div class="type">Symbols & features · part ${st.part} of ${st.parts}</div><h2>${st.idx.length} things to notice</h2></div>
        <p class="small muted center">Find each one on the card (tap it to zoom). A short quiz on these ${st.idx.length} follows.</p>
        <div class="block frame">${st.idx.map(symHTML).join('')}</div>${nav('Quiz me on these ›')}`;
    } else if (st.t === 'symall') {
      v.innerHTML = `${head()}<div class="dhead"><div class="type">Symbols & features</div><h2>All ${syms.length} together</h2></div>
        <p class="small muted center">You’ve met every feature on this card. Look them over once more: the next quiz asks about all of them, in a new order.</p>
        <div class="block frame">${syms.map((x, i) => symHTML(i)).join('')}</div>${nav('Quiz me on all of them ›')}`;
    } else if (st.t === 'pos') {
      v.innerHTML = `${head()}<div class="dhead"><div class="type">Reading it in positions · part ${st.part} of ${st.parts}</div><h2>Where it falls changes what it says</h2></div>
        <p class="small muted center">The same card speaks differently depending on the place it lands in a spread. Here are ${st.ks.length} of the ${CTX_KEYS().length} kinds of position.</p>
        <div class="block frame">${st.ks.map(k => `<div class="sym-row"><div class="sym-f">${esc(CTX_LABEL[k])}</div><p>${esc(m.ctx[k])}</p></div>`).join('')}</div>${nav('Quiz me on these ›')}`;
    } else if (st.t === 'quiz') {
      v.innerHTML = `${head()}<div id="slq"></div>`;
      runQuiz($('#slq', v), { title: st.title, mini: true, qs: shuffle(st.facts).map(f => qFor(name, f)).filter(Boolean), again: () => draw(), next: () => go(s + 1) });
    } else if (st.t === 'final') {
      const r = rec.best != null ? `<p class="small muted center">Your best: ${Math.round(rec.best * 100)}% ${starHTML(rec.stars || 0)}</p>` : '';
      v.innerHTML = `${head()}<div class="dhead"><div class="type">The card quiz</div><h2>${esc(rwsShort(name))}: 15 questions</h2></div>${r}
        <p class="center">Symbols and features, the card’s meaning and its readings in different positions, all mixed together. Score <b>12 of 15</b> (80%) to finish the card${nextAfter(it) ? ` and open <b>${esc(itemLabel(nextAfter(it)))}</b>` : ''}.</p>
        <div class="actions"><button class="btn ghost" id="slb">‹ Back</button><button class="btn primary" id="slgo">Begin the card quiz</button></div><div id="slq"></div>`;
      $('#slgo', v).onclick = () => start();
      if ($('#slb', v)) $('#slb', v).onclick = () => go(s - 1);
      return;
    }
    wire();
  };
  const start = () => {
    v.innerHTML = `${head()}<div id="slq"></div>`;
    const nx = nextAfter(it);
    runQuiz($('#slq', v), {
      title: `${rwsShort(name)} · card quiz`, pass: true, qs: cardFinalSet(name), again: start, back: '#/school',
      next: () => { location.hash = nx ? itemHref(nx) : '#/school'; }, nextLabel: nx ? `On to ${itemLabel(nx)} ›` : 'Back to Tarot School',
      onDone: r => { rec.best = Math.max(rec.best || 0, r.pct); rec.stars = Math.max(rec.stars || 0, r.stars); if (r.passed && !rec.done) { rec.done = true; rec.at = Date.now(); toast(`${rwsShort(name)} finished! ✶`); } },
    });
  };
  draw();
});

/* ---------- group quizzes ---------- */
route('school/quiz/:id', async (v, [id]) => {
  await School.load();
  const it = findQuizItem(id); if (!it) return (location.hash = '#/school');
  setTitle(it.title);
  if (!itemUnlocked(it) && !itemDone(it)) { v.innerHTML = lockedHTML(it); return; }
  const rec = School.st.quizzes[id] = School.st.quizzes[id] || {}, n = it.cards.length * it.per, nx = nextAfter(it);
  const intro = () => {
    v.innerHTML = `<div class="dhead" style="margin-top:8px"><div class="type">${it.big ? 'Milestone quiz' : 'Group quiz'}</div><h1>${esc(it.title)}</h1><div class="latin">${esc(it.sub || '')}</div></div>
      <div class="sq-fan">${it.cards.slice(0, 14).map((c, i, a) => `<img src="${TAROT_BY_NAME[c].img}" alt="" style="--r:${(i - (a.length - 1) / 2) * (a.length > 8 ? 5 : 8)}deg">`).join('')}</div>
      <p class="center">${n} questions in random order, ${it.per} from each of the ${it.cards.length} cards: symbols, features, meanings and positions. Score <b>${Math.ceil(n * SCHOOL_PASS)} of ${n}</b> (80%) to pass.</p>
      ${rec.best != null ? `<p class="small muted center">Your best: ${Math.round(rec.best * 100)}% ${starHTML(rec.stars || 0)}</p>` : ''}
      <div class="actions"><button class="btn primary" id="qgo">Begin</button></div>`;
    $('#qgo', v).onclick = start;
  };
  const start = () => {
    v.innerHTML = '<div id="slq"></div>';
    runQuiz($('#slq', v), {
      title: it.title, pass: true, qs: groupSet(it.cards, it.per), again: start, back: '#/school',
      next: () => { location.hash = nx ? itemHref(nx) : '#/school'; }, nextLabel: nx ? `On to ${itemLabel(nx)} ›` : 'Back to Tarot School',
      onDone: r => { rec.best = Math.max(rec.best || 0, r.pct); rec.stars = Math.max(rec.stars || 0, r.stars); if (r.passed && !rec.passed) { rec.passed = true; rec.at = Date.now(); toast(`${it.title}: passed! ✶`); } },
    });
  };
  intro();
});
route('school/practice', async v => {
  await School.load();
  setTitle('Practice');
  const start = () => {
    const qs = practiceSet(10);
    if (!qs.length) { v.innerHTML = `<div class="empty">${ART.book}<p>Finish your first card and its questions will turn up here for practice.</p><a class="btn" href="#/school">Back to Tarot School</a></div>`; return; }
    v.innerHTML = '<p class="small muted center" style="margin:6px 0">Ten questions from the cards you’ve finished, leaning on the ones you’ve missed.</p><div id="slq"></div>';
    runQuiz($('#slq', v), { title: 'Practice round', qs, again: start, back: '#/school' });
  };
  start();
});

/* ---------- the school map ---------- */
route('school', async (v, a, qs) => {
  await School.load();
  setTitle('Tarot School');
  const T = schoolTracks(), st = School.st, done = cardsDone();
  const today = new Date().toDateString(), y = new Date(Date.now() - 864e5).toDateString();
  const streak = st.streak.day === today || st.streak.day === y ? st.streak.n : 0;
  const nextIn = t => t.items.find(x => !itemDone(x) && itemUnlocked(x));
  const cont = (() => { // the most recently touched track first
    const started = T.filter(t => t.items.some(x => x.kind === 'card' && (st.cards[x.name] || {}).step) && nextIn(t));
    return (started.length ? nextIn(started[0]) : nextIn(T[0]));
  })();
  const sel = qs.t && T.some(t => t.key === qs.t) ? qs.t : (T.find(t => t.items.includes(cont)) || T[0]).key;
  const row = it => {
    const ok = itemDone(it), open = ok || itemUnlocked(it);
    if (it.kind === 'card') {
      const r = st.cards[it.name] || {}, steps = cardSteps(it.name).length;
      const sub = ok ? `${starHTML(r.stars || 0)} ${Math.round((r.best || 0) * 100)}%` : !open ? 'Locked' : r.step ? `Step ${r.step + 1} of ${steps}` : 'Ready to learn';
      return `<a class="row sch-row ${open ? '' : 'locked'} ${ok ? 'done' : ''}" href="${open ? itemHref(it) : 'javascript:void 0'}" data-lock="${open ? '' : esc(itemLabel(prevOf(it)))}">
        <div class="thumb sch-thumb"><img src="${TAROT_BY_NAME[it.name].img}" alt="" loading="lazy"></div><div class="txt"><div class="nm">${esc(rwsShort(it.name))}</div><div class="sb">${sub}</div></div>${ok ? '<span class="sch-tick">✓</span>' : ''}</a>`;
    }
    const r = st.quizzes[it.id] || {}, n = it.cards.length * it.per;
    return `<a class="row sch-row sch-quiz ${it.big ? 'big' : ''} ${open ? '' : 'locked'} ${ok ? 'done' : ''}" href="${open ? itemHref(it) : 'javascript:void 0'}" data-lock="${open ? '' : esc(itemLabel(prevOf(it)))}">
      <div class="thumb">${ART.star}</div><div class="txt"><div class="nm">${esc(it.title)}</div><div class="sb">${ok ? `${starHTML(r.stars || 0)} ${Math.round((r.best || 0) * 100)}%` : `${n} questions · ${it.per} per card${open ? '' : ' · locked'}`}</div></div>${ok ? '<span class="sch-tick">✓</span>' : ''}</a>`;
  };
  const tdone = t => t.items.filter(itemDone).length;
  v.innerHTML = `<div class="frame sch-hero">
      <div class="sch-rank"><small>RANK</small><b>${schoolRank()}</b></div>
      <div class="sch-stats"><div><b>${st.xp}</b><small>XP</small></div><div><b>${done}/78</b><small>cards</small></div><div><b>${streak}</b><small>day streak</small></div></div>
      <div class="sq-bar"><i style="width:${Math.round(done / 78 * 100)}%"></i></div>
      <div class="actions" style="margin:12px 0 2px">${cont ? `<a class="btn primary" href="${itemHref(cont)}">${(cont.kind === 'card' && (st.cards[cont.name] || {}).step) ? 'Continue' : 'Start'}: ${esc(itemLabel(cont))} ›</a>` : '<b>Every card learned. Blessed be!</b>'}${done ? '<a class="btn ghost" href="#/school/practice">Practice</a>' : ''}</div>
    </div>
    <p class="small muted center" style="margin:10px 4px">Learn each card a little at a time, with a quick quiz after every part. Pass a card’s 15-question quiz to open the next one. Every so often, a group quiz mixes the cards you’ve learned.</p>
    <div class="chips scroll" id="scht">${T.map(t => `<button class="chip ${t.key === sel ? 'on' : ''}" data-t="${t.key}">${t.key === 'Major' ? 'Major Arcana' : t.key} · ${tdone(t)}/${t.items.length}</button>`).join('')}</div>
    ${T.filter(t => t.key === sel).map(t => `<div class="section-title"><h2>${esc(t.title)}</h2></div><p class="small muted" style="margin:-4px 0 8px">${esc(t.sub)}</p><div class="list">${t.items.map(row).join('')}</div>`).join('')}`;
  $('#scht', v).onclick = e => { const b = e.target.closest('[data-t]'); if (b) location.hash = '#/school?t=' + b.dataset.t; };
  $$('.sch-row.locked', v).forEach(r => r.onclick = e => { e.preventDefault(); toast(`Finish ${r.dataset.lock} first`); });
});
