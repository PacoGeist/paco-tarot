/* Overall reading analysis + trends across repeated draws of the same spread.
   Everything here runs on the device: each card has a traditional "tone" (1 difficult … 5 very favourable)
   and every position has a type (past, future, challenge…), so the app can compare readings without the internet. */
const TONE_LABEL = ['', 'Difficult', 'Challenging', 'Mixed', 'Favourable', 'Very favourable'];
const toneOf = name => (window.TAROT_TONE || {})[name] || 3;
const toneWord = v => v >= 4.2 ? 'very encouraging' : v >= 3.5 ? 'encouraging' : v >= 2.6 ? 'mixed — light and shadow in balance' : v >= 1.9 ? 'challenging' : 'difficult — a time of testing';
const firstSentence = t => (String(t || '').match(/^[^.!?]+[.!?]/) || [t || ''])[0];
const toneClass = v => v >= 3.6 ? 'up' : v <= 2.4 ? 'down' : 'mid';

/* ---------- overall analysis of one reading ---------- */
function readingAnalysisHTML(r) {
  const cs = r.cards.filter(c => c.card && TAROT_BY_NAME[c.card]);
  if (!cs.length) return '';
  const rows = cs.map(c => ({ c, t: toneOf(c.card), ctx: posContext(c.pos, c.posMeaning).ctx }));
  const avg = rows.reduce((a, x) => a + x.t, 0) / rows.length;
  const parts = [];
  parts.push(`Overall, this reading is <b>${toneWord(avg)}</b>.`);
  const pastish = rows.filter(x => ['past', 'foundation', 'release'].includes(x.ctx)), futureish = rows.filter(x => ['future', 'hopes'].includes(x.ctx));
  if (pastish.length && futureish.length) {
    const a = pastish.reduce((s, x) => s + x.t, 0) / pastish.length, b = futureish.reduce((s, x) => s + x.t, 0) / futureish.length;
    if (b - a >= 0.75) parts.push(`The story moves <b>from difficulty toward relief</b>: what lies behind is heavier than what is coming.`);
    else if (a - b >= 0.75) parts.push(`The road ahead looks <b>more demanding than the road behind</b> — forewarned is forearmed, and the advice cards show how to meet it.`);
    else parts.push(`Past and future carry <b>a similar weight</b>, suggesting a steady continuation unless you change course.`);
  }
  if (rows.length >= 3) {
    const best = rows.reduce((a, x) => x.t > a.t ? x : a), worst = rows.reduce((a, x) => x.t < a.t ? x : a);
    if (best.t >= 4) parts.push(`Your strongest support is <b>${esc(shortName(best.c.card))}</b> in “${esc(best.c.pos)}”.`);
    if (worst.t <= 2) parts.push(`The sorest point is <b>${esc(shortName(worst.c.card))}</b> in “${esc(worst.c.pos)}” — give it your attention first.`);
  }
  const adv = rows.find(x => x.ctx === 'advice') || rows.find(x => x.ctx === 'gift');
  if (adv) parts.push(`<i>The cards' counsel (${esc(adv.c.pos)}):</i> ${esc(firstSentence(interpret(adv.c.card, adv.c.pos, adv.c.posMeaning).text))}`);
  // compare with the previous reading of the same spread
  const prev = Journal.list.filter(x => x.spreadId === r.spreadId && x.at < r.at && x.cards.some(c => c.card)).sort((a, b) => b.at - a.at)[0];
  if (prev) {
    const pc = prev.cards.filter(c => c.card); const pavg = pc.reduce((a, c) => a + toneOf(c.card), 0) / pc.length;
    const d = avg - pavg;
    parts.push(`Compared with your last ${esc(r.spreadName)} (${fmtDate(new Date(prev.at), { month: 'short', day: 'numeric' })}), this reading is ${Math.abs(d) < 0.3 ? '<b>about the same</b> in tone' : d > 0 ? '<b>brighter</b> — things are easing' : '<b>heavier</b> — something is asking for more care'}. <a href="#/trends/${encodeURIComponent(r.spreadId)}">See trends ›</a>`);
  }
  const pct = Math.round((avg - 1) / 4 * 100);
  return `<div class="block frame analysis"><h3>${ART.star}Overall Reading</h3>
    <div class="tone-meter" role="img" aria-label="Overall tone ${avg.toFixed(1)} of 5"><span class="tm-bar"><span class="tm-dot ${toneClass(avg)}" style="left:${pct}%"></span></span><span class="tm-labels"><span>Difficult</span><span>Mixed</span><span>Favourable</span></span></div>
    ${parts.map(p => `<p style="margin:6px 0">${p}</p>`).join('')}</div>`;
}

/* ---------- trend maths ---------- */
function slope(vals) {
  const n = vals.length; if (n < 2) return 0;
  const mx = (n - 1) / 2, my = vals.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0; vals.forEach((v, i) => { num += (i - mx) * (v - my); den += (i - mx) ** 2; });
  return num / den;
}
function trendOf(vals) {
  if (vals.length < 2) return { label: 'One reading so far', cls: 'mid', icon: '•' };
  const s = slope(vals), mean = vals.reduce((a, b) => a + b, 0) / vals.length, range = Math.max(...vals) - Math.min(...vals);
  if (s >= 0.25) return { label: 'Improving', cls: 'up', icon: '↗' };
  if (s <= -0.25) return { label: 'Declining', cls: 'down', icon: '↘' };
  if (range >= 3) return { label: 'Up and down', cls: 'mid', icon: '↕' };
  return { label: mean >= 3.6 ? 'Steady & favourable' : mean <= 2.4 ? 'Steady but difficult' : 'Steady', cls: mean >= 3.6 ? 'up' : mean <= 2.4 ? 'down' : 'mid', icon: '→' };
}
// small line chart, tone 1–5 over time (single series: the position or the whole reading)
function sparkSVG(points, h = 70) {
  const w = 300, pad = 10, n = points.length;
  const X = i => n === 1 ? w / 2 : pad + i * (w - pad * 2) / (n - 1), Y = v => pad + (5 - v) * (h - pad * 2) / 4;
  const grid = [1, 3, 5].map(v => `<line x1="0" x2="${w}" y1="${Y(v)}" y2="${Y(v)}" class="sp-grid"/>`).join('');
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Tone over ${n} readings">${grid}
    ${n > 1 ? `<path d="${path}" class="sp-line"/>` : ''}
    ${points.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="5" class="sp-dot ${toneClass(p.v)}"><title>${esc(p.label)}</title></circle>`).join('')}</svg>`;
}

/* ---------- trends page ---------- */
route('trends/:sid', async (v, [sid]) => {
  await Journal.load();
  const spread = Store.get(sid);
  const readings = Journal.list.filter(r => r.spreadId === sid && r.cards.some(c => c.card)).sort((a, b) => a.at - b.at);
  const name = spread ? spread.name : (readings[0] || {}).spreadName || 'Spread';
  setTitle('Trends');
  if (readings.length < 2) {
    v.innerHTML = `<div class="dhead" style="margin-top:8px"><div class="type">Trends</div><h1>${esc(name)}</h1></div>
      <div class="empty">${ART.tarot}<p>Trends appear once you have drawn or recorded this spread at least twice.</p><p class="small">You have ${readings.length} so far.</p></div>
      <div class="actions"><a class="btn primary" href="#/reading/${encodeURIComponent(sid)}">${ART.shuffle} Draw it now</a><a class="btn ghost" href="#/record?s=${encodeURIComponent(sid)}">${ART.edit} Record one</a></div>`;
    return;
  }
  // positions: from the spread if it still exists, else from the latest reading
  const posList = (spread ? arr(spread.positions) : readings[readings.length - 1].positions).map(p => ({ n: p.n, name: p.name, meaning: p.meaning || '' }));
  const findCard = (r, p) => r.cards.find(c => c.pos === p.name) || r.cards.find(c => c.n === p.n);
  const overall = readings.map(r => { const cs = r.cards.filter(c => c.card); return { v: cs.reduce((a, c) => a + toneOf(c.card), 0) / cs.length, label: `${fmtDate(new Date(r.at), { month: 'short', day: 'numeric' })}: ${toneWord(cs.reduce((a, c) => a + toneOf(c.card), 0) / cs.length)}` }; });
  const ot = trendOf(overall.map(p => p.v));
  const dates = readings.map(r => fmtDate(new Date(r.at), { month: 'short', day: 'numeric' }));
  const posBlocks = posList.map(p => {
    const seq = readings.map((r, i) => { const c = findCard(r, p); return c && c.card ? { card: c.card, v: toneOf(c.card), date: dates[i], rid: r.id, deck: readingDeck(r) } : null; }).filter(Boolean);
    if (!seq.length) return '';
    const t = trendOf(seq.map(s => s.v));
    const counts = {}; seq.forEach(s => counts[s.card] = (counts[s.card] || 0) + 1);
    const repeats = Object.entries(counts).filter(([, k]) => k > 1);
    const suitOf = c => (TAROT_BY_NAME[c] || {}).arcana;
    const half = Math.ceil(seq.length / 2), dom = arr => { const m = {}; arr.forEach(s => { const a = suitOf(s.card); m[a] = (m[a] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1])[0]; };
    const early = dom(seq.slice(0, half)), late = dom(seq.slice(half));
    const first = seq[0], last = seq[seq.length - 1];
    const notes = [];
    if (seq.length >= 2) notes.push(`From <b>${esc(shortName(first.card))}</b> (${TONE_LABEL[first.v].toLowerCase()}) on ${first.date} to <b>${esc(shortName(last.card))}</b> (${TONE_LABEL[last.v].toLowerCase()}) on ${last.date}.`);
    if (t.cls === 'up' && t.label === 'Improving') notes.push('This part of your situation is getting better.');
    if (t.label === 'Declining') notes.push('This part of your situation is asking for more care than before.');
    if (t.label === 'Up and down') notes.push('This area keeps swinging — look at what changes between the good and hard days.');
    if (repeats.length) notes.push(`Recurring here: ${repeats.map(([c, k]) => `<b>${esc(shortName(c))}</b> ×${k}`).join(', ')} — a message that keeps knocking.`);
    if (seq.length >= 4 && early && late && early[0] !== late[0] && late[1] >= 2) notes.push(`The energy has shifted from <b>${early[0] === 'Major' ? 'Major Arcana' : early[0]}</b> to <b>${late[0] === 'Major' ? 'Major Arcana' : late[0]}</b>.`);
    return `<div class="block frame trend-pos">
      <div class="trend-head"><span class="n">${p.n}</span><b>${esc(p.name)}</b><span class="trend-badge ${t.cls}">${t.icon} ${t.label}</span></div>
      ${p.meaning ? `<div class="small muted">${esc(p.meaning)}</div>` : ''}
      ${sparkSVG(seq.map(s => ({ v: s.v, label: `${s.date}: ${shortName(s.card)} (${TONE_LABEL[s.v]})` })), 60)}
      <div class="trend-cards">${seq.map(s => `<a href="#/journal/${s.rid}"><img src="${tarotImg(s.card, s.deck)}" alt=""><span>${esc(s.date)}</span><span class="tone ${toneClass(s.v)}">${TONE_LABEL[s.v]}</span></a>`).join('')}</div>
      ${notes.map(x => `<p class="small" style="margin:4px 0">${x}</p>`).join('')}
    </div>`;
  }).join('');
  v.innerHTML = `<div class="dhead" style="margin-top:8px"><div class="type">Trends · ${readings.length} readings</div><h1>${esc(name)}</h1><div class="latin">${dates[0]} – ${dates[dates.length - 1]}</div></div>
    <div class="block frame"><h3>${ART.star}The Whole Reading Over Time <span class="trend-badge ${ot.cls}" style="margin-left:auto">${ot.icon} ${ot.label}</span></h3>
      <div class="spark-axis"><span>Favourable</span><span>Mixed</span><span>Difficult</span></div>${sparkSVG(overall, 90)}
      <p class="small" style="margin:6px 0 0">Your most recent ${esc(name)} was <b>${toneWord(overall[overall.length - 1].v)}</b>${overall.length > 1 ? `, compared with <b>${toneWord(overall[0].v)}</b> at the start` : ''}.</p></div>
    <p class="small muted">How each position has changed across your readings, oldest to newest. Tap a card to open that reading.</p>
    ${posBlocks}
    <p class="disclaimer">Tone is each card's traditional upright leaning, from Difficult to Very favourable. Trends are a reflection to think with, not a prediction. All analysis happens on your phone; nothing is sent anywhere.</p>`;
});
