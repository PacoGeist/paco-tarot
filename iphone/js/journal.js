/* Journal: tarot readings + logged workings for every section, each with notes and later results */
const Journal = {   // tarot readings
  list: [], loaded: false,
  async load() { if (this.loaded) return; try { this.list = await DB.get('readings', []) || []; } catch (e) { this.list = []; } this.loaded = true; },
  async persist() { await DB.set('readings', this.list); },
  get(id) { return this.list.find(r => r.id === id); },
  async add(r) { this.list.unshift(r); await this.persist(); },
  async update(id, patch) { const r = this.get(id); if (r) { Object.assign(r, patch); await this.persist(); } },
  async remove(id) { this.list = this.list.filter(r => r.id !== id); await this.persist(); },
  forSpread(sid) { return this.list.filter(r => r.spreadId === sid); },
};
const Workings = {  // spells cast, sigils charged, oils/incense/tinctures/brews made or used, herbs & crystals worked with
  list: [], loaded: false,
  async load() { if (this.loaded) return; try { this.list = await DB.get('workings', []) || []; } catch (e) { this.list = []; } this.loaded = true; },
  async persist() { await DB.set('workings', this.list); },
  get(id) { return this.list.find(r => r.id === id); },
  async add(r) { this.list.push(r); this.list.sort((a, b) => b.at - a.at); await this.persist(); },
  async update(id, patch) { const r = this.get(id); if (r) { Object.assign(r, patch); await this.persist(); } },
  async remove(id) { this.list = this.list.filter(r => r.id !== id); await this.persist(); },
  forItem(iid) { return this.list.filter(r => r.itemId === iid); },
};
const PRACTICE_TYPE = { one: 'Practice', label: 'Practices', art: 'pentacle' };
const typeInfo = t => (t === 'practice' ? PRACTICE_TYPE : TYPES[t]) || PRACTICE_TYPE;
const LOG_WORDS = {
  practice: ['Log a practice', 'Practice logged'],
  spell: ['Log a casting', 'I cast this spell'], sigil: ['Log a charging', 'I charged this sigil'],
  oil: ['Log a batch or use', 'I made or used this oil'], incense: ['Log a batch or burning', 'I made or burned this incense'],
  tincture: ['Log a batch or use', 'I made or took this tincture'], brew: ['Log a brewing', 'I brewed this'],
  deity: ['Log an invocation or offering', 'I honoured this deity'],
  herb: ['Log a use', 'I worked with this herb'], crystal: ['Log a use', 'I worked with this crystal'],
};
const OUTCOMES = [['worked', 'It worked'], ['partly', 'Partly'], ['waiting', 'Still waiting'], ['not', "Didn't work"]];
const outcomeLabel = o => (OUTCOMES.find(x => x[0] === o) || [])[1] || '';
const fmtWhen = t => { const d = new Date(t); return `${fmtDate(d, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${fmtTime(d)}`; };
const shortCard = (n, d) => cardShort(n, d);
const moonNow = () => { const m = MOON.current(); return m.dark ? 'Dark Moon' : m.name; };
const newId = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function drawnFrom(r) { return r.cards.map(c => c.card ? ({ card: { name: c.card }, rev: false }) : null); }
function readingPositionsHTML(r) {
  return `${readingAnalysisHTML(r)}${readingOverviewHTML(r.cards.map(c => c.card))}<div class="positions reading">${r.cards.map(c => positionHTML({ ...c, guide: guideFor(Store.get(r.spreadId), c.n, c.pos, c.posMeaning) })).join('')}</div>`;
}
function readingText(r) {
  return `${r.spreadName} — ${new Date(r.at).toLocaleString()}${r.question ? `\nQuestion: ${r.question}` : ''}\n` +
    r.cards.map(c => c.card ? `${c.n}. ${c.pos}: ${cardLabel(c.card, readingDeck(r))}\n   ${interpret(c.card, c.pos, c.posMeaning).text}` : `${c.n}. ${c.pos}: —`).join('\n\n') + (r.notes ? `\n\nNotes: ${r.notes}` : '') +
    (r.results ? `\n\nResults${r.outcome ? ' (' + outcomeLabel(r.outcome) + ')' : ''}: ${r.results}` : '');
}
function copyText(txt, msg = 'Copied') {
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast(msg), () => toast('Copy not available'));
}
function bindAutosave(el, store, rid, field, onSave) {
  const save = () => { const p = { [field]: el.value.trim() }; if (field === 'results') p.resultsAt = Date.now(); store.update(rid, p); onSave && onSave(); };
  let t; el.addEventListener('input', () => { clearTimeout(t); t = setTimeout(save, 400); });
  el.addEventListener('change', save);
}
// "Results" block shared by readings and workings
function resultsHTML(r) {
  return `<div class="block frame results-box"><h3>${ART.star}Results</h3>
    <p class="small muted" style="margin-top:0">Come back later and record what came to pass.</p>
    <div class="chips" id="oc">${OUTCOMES.map(([k, l]) => `<button type="button" class="chip ${k === 'not' ? '' : 'gold'} ${r.outcome === k ? 'on' : ''}" data-o="${k}">${l}</button>`).join('')}</div>
    <div class="form"><textarea id="res" placeholder="What happened afterwards? Signs, changes, how it unfolded…">${esc(r.results || '')}</textarea>
    <div class="hint" id="resat">${r.resultsAt ? 'Results last updated ' + fmtWhen(r.resultsAt) : 'Saves automatically.'}</div></div></div>`;
}
function bindResults(v, store, rid) {
  const upd = () => { const r = store.get(rid); if (r && r.resultsAt) $('#resat', v).textContent = 'Results last updated ' + fmtWhen(r.resultsAt); };
  bindAutosave($('#res', v), store, rid, 'results', upd);
  $('#oc', v).onclick = async e => {
    const b = e.target.closest('[data-o]'); if (!b) return;
    const r = store.get(rid); const o = r.outcome === b.dataset.o ? '' : b.dataset.o;
    await store.update(rid, { outcome: o, resultsAt: Date.now() });
    $$('#oc [data-o]', v).forEach(x => x.classList.toggle('on', x.dataset.o === o)); upd();
  };
}
const statusBadge = r => r.outcome ? `<span class="chip gold" style="font-size:.72rem;padding:0 8px">${esc(outcomeLabel(r.outcome))}</span>`
  : r.results ? `<span class="chip gold" style="font-size:.72rem;padding:0 8px">Results added</span>` : `<span class="chip" style="font-size:.72rem;padding:0 8px">Awaiting results</span>`;

/* ---------- logging a working from any detail page ---------- */
function logWorkingModal(it, after) {
  const [title, verb] = LOG_WORDS[it.type] || ['Log a working', 'I worked with this'];
  const now = new Date(); const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  modal(`<h2>${esc(title)}</h2><p class="center fell" style="margin-top:-4px"><i>${esc(it.name)}</i></p>
    <div class="form">
      <label for="lw-when">When</label><input type="datetime-local" id="lw-when" value="${local}" style="width:100%;background:var(--input);border:1px solid var(--line2);border-radius:10px;color:var(--ink);font:inherit;padding:9px 11px">
      <label for="lw-for">Purpose or intention (optional)</label><input type="text" id="lw-for" placeholder="What is this working for?">
      <label for="lw-notes">Notes from the working</label><textarea id="lw-notes" placeholder="What you did, any changes to the recipe, how it felt, signs you noticed…"></textarea>
      <div class="hint">You can add results later from your Journal.</div>
      <div class="actions"><button type="button" class="btn ghost" id="lw-c">Cancel</button><button type="button" class="btn primary" id="lw-s">${ART.book} Save to Journal</button></div>
    </div>`, (m, close) => {
    setTimeout(() => $('#lw-notes', m).focus(), 60);
    $('#lw-c', m).onclick = close;
    $('#lw-s', m).onclick = async () => {
      const when = $('#lw-when', m).value ? new Date($('#lw-when', m).value).getTime() : Date.now();
      const w = { id: newId('work'), itemId: it.id, type: it.type, ...(it.lessonId ? { lessonId: it.lessonId } : {}), name: it.name, at: when, moon: moonNow(), purpose: $('#lw-for', m).value.trim(), notes: $('#lw-notes', m).value.trim(), results: '', outcome: '' };
      await Workings.add(w); close(); toast(`${verb} — saved to your Journal ✶`); after && after(w);
    };
  });
}
// section shown on every detail page (not tarot, which has readings)
function journalSectionHTML(it) {
  const list = Workings.forItem(it.id);
  const [title] = LOG_WORDS[it.type] || ['Log a working'];
  return `<div class="block frame"><h3>${ART.book}Your Journal</h3>
    ${list.length ? `<div class="list">${list.slice(0, 5).map(w => `<a class="row" href="#/journal/${w.id}" style="padding:8px 10px"><div class="txt"><div class="small" style="color:var(--gold2)">${fmtWhen(w.at)} · ${esc(w.moon || '')}</div>
      ${w.purpose ? `<div class="small"><i>${esc(w.purpose)}</i></div>` : ''}<div class="sb">${esc(w.notes || 'No notes')}</div><div style="margin-top:4px">${statusBadge(w)}</div></div></a>`).join('')}</div>
      ${list.length > 5 ? `<div class="actions" style="margin:8px 0 0"><a class="btn small ghost" href="#/journal?i=${encodeURIComponent(it.id)}">All ${list.length} entries</a></div>` : ''}`
      : `<p class="small muted" style="margin:0 0 8px">Each time you use this, log it here with your notes — then add the results later.</p>`}
    <div class="actions" style="margin:10px 0 0"><button type="button" class="btn primary" id="logw">${ART.plus} ${esc(title)}</button></div></div>`;
}

/* ---------- draw a reading (every reading is saved to the journal) ---------- */
route('reading/:id', async (v, [id], qs) => {
  const it = Store.get(id); if (!it) return (location.hash = '#/');
  await Journal.load();
  setTitle('Reading');
  let question = '';
  const draw = async () => {
    const deck = TAROT_DECK.slice();
    for (let i = deck.length - 1; i > 0; i--) { const r = new Uint32Array(1); crypto.getRandomValues(r); const j = r[0] % (i + 1);[deck[i], deck[j]] = [deck[j], deck[i]]; }
    const ps = arr(it.positions);
    // all cards are read upright
    const r = {
      id: newId('reading'), spreadId: it.id, spreadName: it.name, at: Date.now(), moon: moonNow(),
      question, notes: '', results: '', outcome: '', deck: deckId(), deckBase: baseDeck(deckId()),
      positions: ps.map(p => ({ n: p.n, x: p.x, y: p.y, rotate: p.rotate || 0, name: p.name })),
      cards: ps.map((p, i) => ({ n: p.n, pos: p.name, posMeaning: p.meaning || '', card: deck[i].name, arcana: deck[i].arcana, meaning: deck[i].up })),
    };
    await Journal.add(r);
    show(r);
  };
  // the URL remembers the reading so going back or reloading doesn't draw a new one
  const show = r => {
    window.__deckOverride = readingDeck(r);
    question = r.question || '';
    history.replaceState(null, '', `#/reading/${encodeURIComponent(id)}?r=${r.id}`);
    v.innerHTML = `<div class="dhead" style="margin-top:6px"><div class="type">${esc(it.name)}</div><h1>Your Reading</h1><div class="latin">${fmtDate(new Date(r.at), { weekday: 'long', month: 'long', day: 'numeric' })} · ${esc(r.moon)}</div></div>
      ${it.intention ? `<p class="intention">“${esc(it.intention)}”</p>` : ''}
      <div class="form" style="margin:8px 0 12px"><label for="rq">Your question (optional)</label><input type="text" id="rq" placeholder="What do I need to know about…" value="${esc(question)}"></div>
      <div class="block frame">${layoutHTML(readingLayout(r), drawnFrom(r), (Store.get(r.spreadId) || {}).lines, (Store.get(r.spreadId) || {}).backdrop)}</div>
      ${walkButtonHTML(r)}
      ${readingPositionsHTML(r)}
      <div class="form"><label for="rn">Notes & impressions</label><textarea id="rn" placeholder="What stood out, how it felt, first impressions…">${esc(r.notes || '')}</textarea><div class="hint">Saved to your Journal automatically. Add the results later from the Journal.</div></div>
      <div class="actions"><button class="btn primary" id="again">${ART.shuffle} Shuffle & draw again</button><button class="btn ghost" id="copy">Copy reading</button></div>
      <div class="actions" style="margin-top:4px"><a class="btn small ghost" href="#/journal?t=tarot">${ART.book} Journal (${Journal.list.length})</a><button class="btn small danger" id="discard">Don't keep this reading</button></div>
      <p class="disclaimer">All cards are read upright.</p>`;
    const q = $('#rq', v); bindAutosave(q, Journal, r.id, 'question'); q.addEventListener('input', () => question = q.value.trim());
    bindAutosave($('#rn', v), Journal, r.id, 'notes');
    $('#again', v).onclick = () => { window.scrollTo(0, 0); draw(); };
    $('#copy', v).onclick = () => copyText(readingText(Journal.get(r.id) || r), 'Reading copied');
    $('#discard', v).onclick = async () => { await Journal.remove(r.id); toast('Reading removed from the journal'); history.back(); };
  };
  const existing = qs.r && Journal.get(qs.r);
  if (existing) show(existing); else draw();
});

/* ---------- the Journal ---------- */
function allEntries() {
  return [
    ...Journal.list.map(r => ({ kind: 'reading', type: 'tarot', r, at: r.at, text: norm([r.spreadName, r.question, r.notes, r.results, r.moon, ...r.cards.map(c => c.card + ' ' + cardLabel(c.card, readingDeck(r)) + ' ' + c.pos)].join(' ')) })),
    ...Workings.list.map(w => ({ kind: 'working', type: w.type, r: w, at: w.at, text: norm([w.name, w.purpose, w.notes, w.results, w.moon].join(' ')) })),
  ].sort((a, b) => b.at - a.at);
}
function entryRow(e) {
  const r = e.r;
  if (e.kind === 'reading') return `<a class="row" href="#/journal/${r.id}" style="align-items:flex-start">
      <div class="thumb">${r.cards[0] && tarotImg(r.cards[0].card, readingDeck(r)) ? `<img src="${tarotImg(r.cards[0].card, readingDeck(r))}" alt="" style="object-fit:cover;object-position:top">` : ART.tarot}</div>
      <div class="txt"><div class="nm">${esc(r.spreadName)}</div>
        <div class="small muted">Tarot reading${r.manual ? ' · recorded' : ''} · ${fmtWhen(r.at)} · ${esc(r.moon || '')}</div>
        ${r.question ? `<div class="small" style="font-style:italic;margin:2px 0">“${esc(r.question)}”</div>` : ''}
        <div class="chips" style="margin-top:4px;gap:4px">${r.cards.slice(0, 5).map(c => `<span class="chip" style="font-size:.74rem;padding:0 8px">${esc(shortCard(c.card, readingDeck(r)))}</span>`).join('')}${r.cards.length > 5 ? `<span class="chip" style="font-size:.74rem;padding:0 8px">+${r.cards.length - 5}</span>` : ''}</div>
        <div style="margin-top:4px">${statusBadge(r)}</div>
      </div></a>`;
  const item = Store.get(r.itemId);
  return `<a class="row" href="#/journal/${r.id}" style="align-items:flex-start">
      <div class="thumb">${item ? pictureHTML(item) : ART[typeInfo(r.type).art]}</div>
      <div class="txt"><div class="nm">${esc(r.name)}</div>
        <div class="small muted">${esc(typeInfo(r.type).one)} · ${fmtWhen(r.at)} · ${esc(r.moon || '')}</div>
        ${r.purpose ? `<div class="small" style="font-style:italic;margin:2px 0">${esc(r.purpose)}</div>` : ''}
        ${r.notes ? `<div class="sb">${esc(r.notes)}</div>` : ''}
        <div style="margin-top:4px">${statusBadge(r)}</div>
      </div></a>`;
}
route('journal', async (v, a, qs) => {
  await Journal.load(); await Workings.load();
  setTitle('Journal');
  let filter = qs.f || '', tab = qs.t || '', waiting = qs.w === '1', spread = qs.s || '', itemId = qs.i || '';
  if (spread) tab = 'tarot';
  const all = allEntries();
  if (!all.length) {
    v.innerHTML = `<div class="empty">${ART.book}<p>Your Journal is empty.</p><p class="small">Every reading you draw is saved here automatically. Come back later to note what came to pass, and watch your trends grow over time. You can also import readings from a Witches' Companion backup in Settings.</p></div>
      <div class="actions"><a class="btn ghost" href="#/record">${ART.edit} Record a tarot reading I did</a><a class="btn primary" href="#/list/tarot">${ART.tarot} Choose a spread</a></div>`;
    return;
  }
  const counts = {}; all.forEach(e => counts[e.type] = (counts[e.type] || 0) + 1);
  const awaiting = all.filter(e => !e.r.results && !e.r.outcome).length;
  const tabs = [...TYPE_ORDER.filter(t => counts[t]), ...(counts.practice ? ['practice'] : [])];
  v.innerHTML = `
    <div class="facts" style="margin-top:6px">
      <div class="fact"><small>ENTRIES</small><span>${all.length}</span></div>
      <div class="fact"><small>AWAITING RESULTS</small><span>${awaiting}</span></div>
      <div class="fact"><small>WORKED</small><span>${all.filter(e => e.r.outcome === 'worked').length}</span></div>
    </div>
    <div class="chips scroll" id="jt" style="margin-top:12px"><button class="chip ${!tab ? 'on' : ''}" data-t="">All · ${all.length}</button>${tabs.map(t => `<button class="chip ${tab === t ? 'on' : ''}" data-t="${t}">${t === 'tarot' ? 'Tarot' : typeInfo(t).label} · ${counts[t]}</button>`).join('')}</div>
    <div class="actions" style="margin:10px 0 4px"><a class="btn small" href="#/record">${ART.edit} Record a tarot reading I did</a></div>
    <div class="chips" style="margin:6px 0"><button class="chip gold ${waiting ? 'on' : ''}" id="jw">Awaiting results only</button>${itemId && Store.get(itemId) ? `<button class="chip on" id="ji">${esc(Store.get(itemId).name)} ✕</button>` : ''}</div>
    <div id="jx"></div>
    <div class="searchbar">${ART.search}<input id="jf" type="search" placeholder="Search names, notes, results, cards…" value="${esc(filter)}"></div>
    <div class="count" id="jc"></div><div id="jl"></div>`;
  const extras = () => {
    // tarot extras: spread filter + cards that keep appearing
    if (tab !== 'tarot') { $('#jx', v).innerHTML = ''; return; }
    const spreads = [...new Map(Journal.list.map(r => [r.spreadId, r.spreadName])).entries()];
    const cc = {}; Journal.list.forEach(r => r.cards.forEach(c => cc[c.card] = (cc[c.card] || 0) + 1));
    const top = Object.entries(cc).filter(t => t[1] > 1).sort((a, b) => b[1] - a[1]).slice(0, 6);
    $('#jx', v).innerHTML = `${top.length ? `<div class="block"><h3>${ART.eye}Cards that keep appearing</h3><div class="chips">${top.map(([n, c]) => `<button class="chip gold" data-card="${esc(shortCard(n))}">${esc(shortCard(n))} ×${c}</button>`).join('')}</div></div>` : ''}
      ${(() => { const many = spreads.filter(([sid]) => Journal.forSpread(sid).filter(r => r.cards.some(c => c.card)).length >= 2); return many.length ? `<div class="block"><h3>${ART.star}Trends</h3><div class="chips">${many.map(([sid, n]) => `<a class="chip gold" href="#/trends/${encodeURIComponent(sid)}">${esc(n)} · ${Journal.forSpread(sid).length}</a>`).join('')}</div></div>` : ''; })()}
      ${spreads.length > 1 ? `<div class="chips scroll" id="js"><button class="chip ${!spread ? 'on' : ''}" data-s="">All spreads</button>${spreads.map(([sid, n]) => `<button class="chip ${spread === sid ? 'on' : ''}" data-s="${esc(sid)}">${esc(n)}</button>`).join('')}</div>` : ''}`;
  };
  const draw = () => {
    const f = norm(filter);
    const list = all.filter(e => (!tab || e.type === tab) && (!waiting || (!e.r.results && !e.r.outcome)) && (!spread || e.r.spreadId === spread) && (!itemId || e.r.itemId === itemId) && (!f || e.text.includes(f)));
    $('#jc', v).textContent = `${list.length} entr${list.length === 1 ? 'y' : 'ies'}`;
    const months = {};
    list.forEach(e => { const k = new Date(e.at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); (months[k] = months[k] || []).push(e); });
    $('#jl', v).innerHTML = Object.keys(months).map(m => `<div class="group-h">${esc(m)}</div><div class="list">${months[m].map(entryRow).join('')}</div>`).join('') || `<div class="empty">No entries match.</div>`;
    history.replaceState(null, '', `#/journal?t=${tab}&f=${encodeURIComponent(filter)}&w=${waiting ? 1 : ''}&s=${encodeURIComponent(spread)}&i=${encodeURIComponent(itemId)}`);
  };
  $('#jt', v).onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; spread = ''; $$('#jt .chip', v).forEach(x => x.classList.toggle('on', x === b)); extras(); draw(); };
  $('#jw', v).onclick = e => { waiting = !waiting; e.target.classList.toggle('on', waiting); draw(); };
  const ji = $('#ji', v); if (ji) ji.onclick = () => { itemId = ''; ji.remove(); draw(); };
  $('#jf', v).oninput = e => { filter = e.target.value; draw(); };
  v.addEventListener('click', e => {
    const c = e.target.closest('[data-card]'); if (c) { filter = c.dataset.card; $('#jf', v).value = filter; draw(); return; }
    const s = e.target.closest('#js [data-s]'); if (s) { spread = s.dataset.s; $$('#js .chip', v).forEach(x => x.classList.toggle('on', x === s)); draw(); }
  });
  extras(); draw();
});

/* ---------- one journal entry ---------- */
route('journal/:rid', async (v, [rid]) => {
  await Journal.load(); await Workings.load();
  const r = Journal.get(rid);
  if (r) {
    window.__deckOverride = readingDeck(r);
    setTitle('Past Reading');
    const spreadExists = !!Store.get(r.spreadId);
    v.innerHTML = `<div class="dhead" style="margin-top:6px"><div class="type">${esc(r.spreadName)}${r.manual ? ' · recorded reading' : ''}</div><h1>${fmtDate(new Date(r.at), { month: 'long', day: 'numeric', year: 'numeric' })}</h1><div class="latin">${fmtTime(new Date(r.at))} · ${esc(r.moon || '')}</div></div>
      <div class="form" style="margin:8px 0 12px"><label for="pq">Question</label><input type="text" id="pq" value="${esc(r.question || '')}" placeholder="No question recorded"></div>
      <div class="block frame">${layoutHTML(readingLayout(r), drawnFrom(r), (Store.get(r.spreadId) || {}).lines, (Store.get(r.spreadId) || {}).backdrop)}</div>
      ${walkButtonHTML(r)}
      ${readingPositionsHTML(r)}
      <div class="form"><label for="pn">Notes & impressions</label><textarea id="pn" placeholder="What stood out at the time of the reading…">${esc(r.notes || '')}</textarea></div>
      ${resultsHTML(r)}
      <div class="actions">
        ${r.manual ? `<a class="btn" href="#/record?edit=${r.id}">${ART.edit} Edit cards & date</a>` : ''}
        ${spreadExists ? `<a class="btn primary" href="#/reading/${encodeURIComponent(r.spreadId)}">${ART.shuffle} Draw this spread again</a>` : ''}
        <button class="btn ghost" id="pc">Copy reading</button>
        <button class="btn danger" id="pd">${ART.trash} Delete</button>
      </div>`;
    bindAutosave($('#pq', v), Journal, rid, 'question');
    bindAutosave($('#pn', v), Journal, rid, 'notes');
    bindResults(v, Journal, rid);
    $('#pc', v).onclick = () => copyText(readingText(Journal.get(rid)), 'Reading copied');
    $('#pd', v).onclick = async () => { if (await confirmBox('Delete this reading from your journal?', 'Delete')) { await Journal.remove(rid); toast('Reading deleted'); location.replace('#/journal'); } };
    return;
  }
  const w = Workings.get(rid); if (!w) return (location.hash = '#/journal');
  const item = Store.get(w.itemId);
  setTitle('Journal Entry');
  v.innerHTML = `${item ? `<div class="banner" style="height:150px">${pictureHTML(item, true)}</div>` : ''}
    <div class="dhead" style="${item ? '' : 'margin-top:6px'}"><div class="type">${esc(typeInfo(w.type).one)}</div><h1>${esc(w.name)}</h1><div class="latin">${fmtWhen(w.at)} · ${esc(w.moon || '')}</div></div>
    <div class="form">
      <label for="wp">Purpose or intention</label><input type="text" id="wp" value="${esc(w.purpose || '')}" placeholder="What was this working for?">
      <label for="wn">Notes from the working</label><textarea id="wn" placeholder="What you did, changes you made, how it felt…">${esc(w.notes || '')}</textarea>
    </div>
    ${resultsHTML(w)}
    <div class="actions">
      ${w.lessonId ? `<a class="btn primary" href="#/craft/${encodeURIComponent(w.lessonId)}">${ART.book} Open the lesson</a>` : item ? `<a class="btn primary" href="#/view/${encodeURIComponent(item.id)}">${ART[typeInfo(w.type).art]} Open the ${esc(typeInfo(w.type).one.toLowerCase())}</a>` : `<span class="small muted">The original entry is no longer in the grimoire.</span>`}
      <button class="btn ghost" id="wc">Copy entry</button>
      <button class="btn danger" id="wd">${ART.trash} Delete</button>
    </div>`;
  bindAutosave($('#wp', v), Workings, rid, 'purpose');
  bindAutosave($('#wn', v), Workings, rid, 'notes');
  bindResults(v, Workings, rid);
  $('#wc', v).onclick = () => { const x = Workings.get(rid); copyText(`${x.name} (${typeInfo(x.type).one}) — ${new Date(x.at).toLocaleString()} · ${x.moon}${x.purpose ? `\nPurpose: ${x.purpose}` : ''}${x.notes ? `\n\nNotes: ${x.notes}` : ''}${x.results || x.outcome ? `\n\nResults${x.outcome ? ' (' + outcomeLabel(x.outcome) + ')' : ''}: ${x.results || ''}` : ''}`, 'Entry copied'); };
  $('#wd', v).onclick = async () => { if (await confirmBox('Delete this journal entry?', 'Delete')) { await Workings.remove(rid); toast('Entry deleted'); history.back(); } };
});
