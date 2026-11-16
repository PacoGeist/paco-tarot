/* ---------- Favourite cards, card statistics, flashcard progress and the deck setting ----------
   Kept in the kv store: 'favCards' (card keys) and 'flash' ({ "<deck>|<card>": {box, due, k, l, at} }).
   Statistics are worked out from the Journal each time, so they always match your readings. */
const DAILY_ID = 'tarot-one-card-daily';
// the deck a reading was drawn with; if that was your own deck and it's since been deleted, its deck type
const readingDeck = r => DECKS[r.deck] ? r.deck : (r.deckBase || (DECKS[r.deck] ? r.deck : 'rws'));
const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const CardStore = {
  favs: new Set(), flash: {},
  async load() { this.favs = new Set((await DB.get('favCards', [])) || []); this.flash = (await DB.get('flash', {})) || {}; },
  isFav(k) { return this.favs.has(k); },
  async toggleFav(k) { this.favs.has(k) ? this.favs.delete(k) : this.favs.add(k); await DB.set('favCards', [...this.favs]); },
  saveFlash() { return DB.set('flash', this.flash); },
  async merge(data) {
    if (Array.isArray(data.favCards)) { data.favCards.forEach(k => TAROT_BY_NAME[k] && this.favs.add(k)); await DB.set('favCards', [...this.favs]); }
    if (data.flash && typeof data.flash === 'object') { for (const [k, r] of Object.entries(data.flash)) { const h = this.flash[k]; if (!h || (r.at || 0) > (h.at || 0)) this.flash[k] = r; } await this.saveFlash(); }
    if (data.myDecks) await MyDecks.merge(data.myDecks);
    if (data.deckPhotos) await DeckPhotos.merge(data.deckPhotos);
  },
  // every card drawn or recorded, newest first
  draws(onlyDaily) {
    const out = [];
    Journal.list.forEach(r => { if (onlyDaily && r.spreadId !== DAILY_ID) return; const dk = readingDeck(r); r.cards.forEach(c => { if (c.card && TAROT_BY_NAME[c.card]) out.push({ card: c.card, at: r.at, rid: r.id, deck: dk, daily: r.spreadId === DAILY_ID, pos: c.pos }); }); });
    return out.sort((a, b) => b.at - a.at);
  },
  cardStatHTML(name) {
    const all = this.draws(false).filter(x => x.card === name);
    if (!all.length) return `<p class="center small muted" style="margin:6px 0 0">You haven’t drawn this card in a reading yet.</p>`;
    const daily = all.filter(x => x.daily).length, last = all[0];
    return `<p class="center small" style="margin:6px 0 0">Drawn <b>${all.length}</b> time${all.length === 1 ? '' : 's'} in your readings${daily ? `, ${daily} as Card of the Day` : ''} · last on <a href="#/journal/${last.rid}">${esc(fmtDate(new Date(last.at), { month: 'short', day: 'numeric', year: 'numeric' }))}</a> · <a href="#/stats">Card stats</a></p>`;
  },
  favsHTML() {
    const favs = [...this.favs].filter(k => TAROT_BY_NAME[k]);
    if (!favs.length) return '';
    const counts = {}; this.draws(false).forEach(x => counts[x.card] = (counts[x.card] || 0) + 1);
    return `<div class="section-title"><h2>Favourite cards</h2></div><div class="deck-grid">${favs.map(k => `<a class="deck-card" href="#/card/${encodeURIComponent(k)}"><img src="${tarotImg(k)}" alt="" loading="lazy"><b>${esc(cardShort(k))}</b><span>${counts[k] ? `drawn ${counts[k]}×` : 'not drawn yet'}</span></a>`).join('')}</div>`;
  },
};

/* ---------- Card statistics ---------- */
route('stats', async (v, a, qs) => {
  await Journal.load();
  setTitle('Card Stats');
  const mode = qs.m === 'all' ? 'all' : 'daily', daily = mode === 'daily';
  const draws = CardStore.draws(daily);
  const tabs = `<div class="seg" id="stm" style="display:flex;width:max-content;margin:6px auto 10px"><button data-m="daily" class="${daily ? 'on' : ''}">Card of the Day</button><button data-m="all" class="${daily ? '' : 'on'}">All readings</button></div>`;
  if (!draws.length) {
    v.innerHTML = `${tabs}<div class="empty">${ART.tarot}<p>${daily ? 'No Card of the Day yet.' : 'No readings yet.'}</p><p class="small">${daily ? 'Draw one each morning and your patterns will grow here: the cards that keep returning, the suits that lead, and your daily streak.' : 'Every reading you draw or record is counted here.'}</p><a class="btn primary" href="#/reading/${DAILY_ID}">${ART.sun} Draw today’s card</a></div>`;
  } else {
    const counts = {}; draws.forEach(x => counts[x.card] = (counts[x.card] || 0) + 1);
    const top = Object.entries(counts).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 6);
    const days = [...new Set(draws.map(x => dayKey(x.at)))];
    const has = new Set(days);
    let streak = 0; for (let d = new Date(); ; d.setDate(d.getDate() - 1)) { if (has.has(dayKey(d))) streak++; else if (streak || dayKey(d) !== dayKey(Date.now())) break; }
    let best = 0, run = 0, prev = null; [...days].map(k => { const [y, m, dd] = k.split('-').map(Number); return new Date(y, m, dd).getTime(); }).sort((x, y) => x - y).forEach(t => { run = prev != null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; });
    const tally = { Major: 0, Wands: 0, Cups: 0, Swords: 0, Pentacles: 0 }; let courts = 0;
    draws.forEach(x => { const c = TAROT_BY_NAME[x.card]; tally[c.arcana]++; if (/^(Page|Knight|Queen|King) /.test(c.name)) courts++; });
    const n = draws.length, pct = k => Math.round(tally[k] / n * 100);
    const el = { Major: 'Spirit', Wands: 'Fire', Cups: 'Water', Swords: 'Air', Pentacles: 'Earth' };
    const avgTone = draws.slice(0, 30).reduce((s, x) => s + toneOf(x.card), 0) / Math.min(30, n);
    const never = TAROT_DECK.filter(c => !counts[c.name]);
    // the last fourteen days of daily cards
    const strip = daily ? (() => { const out = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = dayKey(d), x = draws.find(y => dayKey(y.at) === k); out.push(`<a class="st-day ${x ? '' : 'none'}" ${x ? `href="#/journal/${x.rid}"` : ''}>${x ? `<img src="${tarotImg(x.card, x.deck)}" alt="">` : '<i></i>'}<span>${d.toLocaleDateString(undefined, { weekday: 'narrow' })}<br>${d.getDate()}</span></a>`); } return `<div class="section-title"><h2>The last two weeks</h2></div><div class="st-strip">${out.join('')}</div>`; })() : '';
    v.innerHTML = `${tabs}
      <div class="frame sch-hero"><div class="sch-stats">
        <div><b>${n}</b><small>${daily ? 'daily cards' : 'cards drawn'}</small></div><div><b>${days.length}</b><small>days</small></div>
        ${daily ? `<div><b>${streak}</b><small>day streak</small></div><div><b>${best}</b><small>best streak</small></div>` : `<div><b>${Journal.list.length}</b><small>readings</small></div>`}</div>
        <p class="small" style="margin:4px 0 0">Lately your cards lean <b>${TONE_LABEL[Math.round(avgTone)].toLowerCase()}</b>${n > 1 ? ` (the last ${Math.min(30, n)})` : ''}.</p>
        ${daily && !has.has(dayKey(Date.now())) ? `<div class="actions" style="margin:10px 0 0"><a class="btn primary" href="#/reading/${DAILY_ID}">${ART.sun} Draw today’s card</a></div>` : ''}</div>
      ${strip}
      <div class="section-title"><h2>Cards that keep returning</h2></div>
      <div class="deck-grid">${top.map(([k, c]) => `<a class="deck-card" href="#/card/${encodeURIComponent(k)}"><img src="${tarotImg(k)}" alt="" loading="lazy"><b>${esc(cardShort(k))}</b><span>${c}× ${CardStore.isFav(k) ? '★' : ''}</span></a>`).join('')}</div>
      <div class="section-title"><h2>The balance of your cards</h2></div>
      <div class="block">${Object.keys(tally).map(k => `<div class="st-bar"><span>${k === 'Major' ? 'Major Arcana' : esc(suitLabel(k))} <small class="muted">${el[k]}</small></span><i><b style="width:${pct(k)}%"></b></i><em>${tally[k]} · ${pct(k)}%</em></div>`).join('')}
        <p class="small muted" style="margin:8px 0 0">In a full deck you’d expect about 28% Major Arcana and 18% of each suit. ${courts ? `${courts} court card${courts === 1 ? '' : 's'} (${Math.round(courts / n * 100)}%).` : ''} ${(() => { const lead = Object.keys(tally).filter(k => k !== 'Major').sort((x, y) => tally[y] - tally[x])[0]; return n >= 8 && pct(lead) >= 30 ? `<b>${esc(suitLabel(lead))}</b> is leading: ${{ Wands: 'drive, passion and action', Cups: 'feelings and relationships', Swords: 'thought, words and decisions', Pentacles: 'work, money and the body' }[lead]} are much on your mind.` : ''; })()}</p></div>
      ${CardStore.favsHTML()}
      <div class="section-title"><h2>Not drawn yet</h2></div>
      <p class="small">${never.length ? `${never.length} of 78 cards haven’t appeared${daily ? ' as your Card of the Day' : ''} yet.` : 'Every card in the deck has come to you at least once. ✶'}</p>
      ${never.length ? `<details class="sq-missed"><summary>Show them</summary><div class="chips">${never.map(c => `<a class="chip" href="#/card/${encodeURIComponent(c.name)}">${esc(cardShort(c.name))}</a>`).join('')}</div></details>` : ''}
      <p class="disclaimer">Worked out from your Journal on this phone. Cards drawn with any deck count as the same card.</p>`;
  }
  $('#stm', v).onclick = e => { const b = e.target.closest('[data-m]'); if (b) location.replace('#/stats?m=' + b.dataset.m); };
});

/* ---------- Flashcards, with your progress saved ---------- */
const FLASH_GAP = [0, 10 * 60e3, 864e5, 3 * 864e5, 7 * 864e5, 21 * 864e5];   // Leitner boxes 0-5: when a card comes back
const FLASH_CLIP = { rws: '0 0 13%', marseille: '0 0 9%', thoth: '13% 0 32%' };  // what to hide until revealed: the printed name (and the Thoth rank)
route('learn/flash', async (v, a, qs) => {
  setTitle('Flashcards');
  const d = baseDeck(deckId()); window.__deckOverride = d;   // a photographed deck is only for readings: flashcards use its deck type
  let arc = qs.a || '', card = null, shown = false, practice = false, sess = { k: 0, l: 0 };
  const key = n => `${d}|${n}`, rec = n => CardStore.flash[key(n)];
  const pool = () => TAROT_DECK.filter(c => !arc || c.arcana === arc);
  const stats = () => { const p = pool(), now = Date.now(); let m = 0, l = 0, nw = 0, due = 0; p.forEach(c => { const r = rec(c.name); if (!r) { nw++; due++; } else { if (r.box >= 4) m++; else l++; if (r.due <= now) due++; } }); return { m, l, nw, due, n: p.length }; };
  const next = () => {
    const p = pool(), now = Date.now();
    const dueL = p.filter(c => { const r = rec(c.name); return r && r.due <= now; }), fresh = p.filter(c => !rec(c.name));
    let cands = dueL.length ? dueL.sort((x, y) => rec(x.name).box - rec(y.name).box).slice(0, 6) : fresh.length ? fresh : practice ? p : [];
    if (cands.length > 1 && card) cands = cands.filter(c => c.name !== card.name);
    card = cands.length ? cands[Math.floor(Math.random() * cands.length)] : null; shown = false; draw();
  };
  const mark = async knew => {
    const r = rec(card.name) || { box: 0, k: 0, l: 0 };
    r.box = knew ? Math.min(5, r.box + 1) : 0; r.due = Date.now() + FLASH_GAP[r.box]; r.at = Date.now(); knew ? r.k++ : r.l++;
    CardStore.flash[key(card.name)] = r; knew ? sess.k++ : sess.l++; await CardStore.saveFlash(); next();
  };
  v.innerHTML = `<div class="chips scroll" id="fa"><button class="chip ${!arc ? 'on' : ''}" data-a="">All 78</button>${ARCANA.map(x => `<button class="chip ${arc === x ? 'on' : ''}" data-a="${x}">${x === 'Major' ? 'Major Arcana' : esc(suitLabel(x))}</button>`).join('')}</div>
    <div id="fs"></div><div id="fc"></div>`;
  const draw = () => {
    const st = stats();
    $('#fs', v).innerHTML = `<div class="fl-prog"><div class="sq-bar"><i style="width:${Math.round(st.m / st.n * 100)}%"></i></div>
      <p class="small center" style="margin:6px 0 2px"><b>${st.m}</b> mastered · <b>${st.l}</b> learning · <b>${st.nw}</b> new · <b>${st.due}</b> ready now</p>
      <p class="small muted center" style="margin:0">${esc(DECKS[d].name)} deck${sess.k + sess.l ? ` · this session: ${sess.k} knew, ${sess.l} still learning` : ''}</p></div>`;
    if (!card) {
      $('#fc', v).innerHTML = `<div class="empty">${ART.star}<p><b>All caught up.</b></p><p class="small">Every card here has been reviewed. Cards you know come back after a few days, so they stay fresh.</p><div class="actions"><button class="btn primary" id="fp">Keep practising anyway</button></div><p class="small"><a href="javascript:void 0" id="frs">Reset my progress for this deck</a></p></div>`;
      $('#fp', v).onclick = () => { practice = true; next(); };
      $('#frs', v).onclick = reset;
      return;
    }
    const m = deckMeaning(card.name) || {}, r = rec(card.name);
    $('#fc', v).innerHTML = `<div class="flash"><img src="${tarotImg(card.name)}" alt="" style="${shown ? '' : `clip-path:inset(${FLASH_CLIP[d]} 0 round 12px)`}" ${shown ? `data-card="${esc(card.name)}"` : ''}></div>
      ${r ? `<p class="center small muted" style="margin:6px 0 0">${r.box >= 4 ? 'Mastered' : r.box ? `Learning · level ${r.box} of 4` : 'Still learning'}${r.k + r.l ? ` · known ${r.k} of ${r.k + r.l} times` : ''}</p>` : '<p class="center small muted" style="margin:6px 0 0">A new card</p>'}
      ${shown ? `<div class="center fade-in"><h2 style="margin-top:10px">${esc(cardShort(card.name))}</h2>${cardTitle(card.name) ? `<div class="small muted">${esc(cardTitle(card.name))}</div>` : ''}
        <div class="chips" style="justify-content:center;margin:8px 0">${cardKeywords(card.name).slice(0, 6).map(k => `<span class="chip gold">${esc(k)}</span>`).join('')}</div>
        <p>${esc(m.meaning || card.up)}</p>
        <div class="actions"><button class="btn ghost" id="fl">Still learning</button><button class="btn primary" id="fk">I knew it ✶</button></div>
        <a class="small" href="#/card/${encodeURIComponent(card.name)}">Study this card ›</a></div>`
      : `<p class="center fell" style="margin-top:10px"><i>What is this card, and what does it mean to you?</i></p><div class="actions"><button class="btn primary" id="fr">Reveal</button><button class="btn ghost" id="fn">Skip</button></div>`}
      <p class="small center" style="margin-top:14px"><a href="javascript:void 0" id="frs">Reset my progress</a></p>`;
    const b = id => $('#' + id, v);
    if (b('fr')) b('fr').onclick = () => { shown = true; draw(); };
    if (b('fn')) b('fn').onclick = next;
    if (b('fk')) b('fk').onclick = () => mark(true);
    if (b('fl')) b('fl').onclick = () => mark(false);
    b('frs').onclick = reset;
  };
  const reset = async () => {
    if (!await confirmBox(`Forget your flashcard progress for the ${DECKS[d].name} deck?`, 'Reset')) return;
    Object.keys(CardStore.flash).filter(k => k.startsWith(d + '|')).forEach(k => delete CardStore.flash[k]);
    await CardStore.saveFlash(); practice = false; sess = { k: 0, l: 0 }; toast('Progress reset'); next();
  };
  $('#fa', v).onclick = e => { const x = e.target.closest('[data-a]'); if (!x) return; arc = x.dataset.a; $$('#fa .chip', v).forEach(y => y.classList.toggle('on', y === x)); practice = false; next(); };
  next();
});

/* ---------- Settings: which deck readings use ---------- */
function deckSettingsUI(box) {
  if (!box) return;
  const cur = Store.settings.deck || 'rws';
  box.innerHTML = `<div class="bg-pick"><b class="fell">Reading deck</b><div class="small muted">The deck your readings are drawn with. Tarot School always teaches the Rider–Waite–Smith deck; flashcards and card pages use the chosen deck’s type.</div>
    <div class="deck-pick" id="dkp">${[...DECK_ORDER, ...MyDecks.list.map(x => x.id)].map(k => `<button type="button" data-d="${k}" class="${k === cur ? 'on' : ''}"><img src="${tarotImg('XVII · The Star', k)}" alt=""><b>${esc(DECKS[k].name)}</b></button>`).join('')}</div>
    ${cur === 'thoth' ? `<p class="small muted" style="margin:6px 0 0">${DeckPhotos.count('thoth')} of 78 Thoth cards use your own photos. Add them from each card’s page.</p>` : ''}
    ${isMyDeck(cur) ? `<p class="small muted" style="margin:6px 0 0">Your own deck, read as ${esc(DECKS[baseDeck(cur)].name)} · ${MyDecks.done(cur)} of 78 photographed.</p>` : ''}
    <div class="actions" style="margin:8px 0 0"><a class="btn small" href="#/mydecks">${ART.image} ${MyDecks.list.length ? 'My Decks' : 'Photograph my own deck'}</a></div></div>`;
  $('#dkp', box).onclick = async e => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    await Store.setSetting('deck', b.dataset.d); if (baseDeck(b.dataset.d) === 'thoth') await ThothFaces.wait();
    toast(`Readings now use the ${DECKS[b.dataset.d].name} deck`); deckSettingsUI(box);
  };
}
