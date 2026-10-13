/* ---------- My Decks: photograph your own deck and draw with it ----------
   A deck you scan is read exactly like the deck type you choose for it (Rider–Waite–Smith, Marseille or Thoth):
   same names, meanings and positions. Only the pictures are yours, and they're used for drawing readings and in
   those readings' pages. Lessons, Tarot School, flashcards and the card pages keep the built-in decks.
   The list is kept in kv 'myDecks' and the photos in DeckPhotos under the deck's id; both go into backups. */
const CARD_RATIO = { rws: 7 / 12, marseille: 280 / 542, thoth: 5 / 8 };   // width ÷ height of each deck type
const MyDecks = {
  list: [],
  async load() { this.list = (await DB.get('myDecks', [])) || []; this.list.forEach(d => this.register(d)); },
  register(d) { const b = DECKS[d.base] ? d.base : 'rws'; DECKS[d.id] = { id: d.id, name: d.name, sub: `Your own deck · read as ${DECKS[b].name}`, base: b, custom: true, suits: DECKS[b].suits, credit: 'Pictures: your own photographs, kept on this phone.' }; },
  save() { return DB.set('myDecks', this.list); },
  get(id) { return this.list.find(d => d.id === id); },
  done(id) { return Object.keys(DeckPhotos.map[id] || {}).filter(k => TAROT_BY_NAME[k]).length; },
  async add(name, base) { const d = { id: 'my-' + Date.now().toString(36), name: name || 'My deck', base, created: Date.now() }; this.list.push(d); this.register(d); await this.save(); return d; },
  async update(id, patch) { const d = this.get(id); Object.assign(d, patch); this.register(d); await this.save(); },
  async remove(id) {
    this.list = this.list.filter(d => d.id !== id); delete DECKS[id]; await this.save(); await DeckPhotos.drop(id);
    if (Store.settings.deck === id) await Store.setSetting('deck', 'rws');
  },
  async merge(list) { for (const d of arr(list)) if (d && d.id && !this.get(d.id)) { this.list.push(d); this.register(d); } await this.save(); },
};

/* ---- the list of your decks ---- */
route('mydecks', async v => {
  setTitle('My Decks');
  const cur = Store.settings.deck || 'rws';
  v.innerHTML = `<p class="center small muted" style="margin:6px 4px 10px">Photograph your own deck, card by card, and draw your readings with it. Choose the kind of deck it is, so each card is read with the right meaning.</p>
    ${MyDecks.list.length ? `<div class="list">${MyDecks.list.map(d => { const n = MyDecks.done(d.id); return `<a class="row" href="#/mydecks/${d.id}"><div class="thumb sch-thumb"><img src="${tarotImg('XVII · The Star', d.id)}" alt=""></div><div class="txt"><div class="nm">${esc(d.name)}${cur === d.id ? ' <span class="chip gold" style="font-size:.7rem;padding:0 7px">in use</span>' : ''}</div><div class="sb">Read as ${esc(DECKS[DECKS[d.id].base].name)} · ${n} of 78 photographed</div><div class="sq-bar" style="margin-top:5px"><i style="width:${Math.round(n / 78 * 100)}%"></i></div></div></a>`; }).join('')}</div>` : `<div class="empty">${ART.image}<p>You haven’t added a deck of your own yet.</p></div>`}
    <div class="block frame" style="margin-top:14px"><h3>${ART.plus}Add a deck</h3>
      <div class="form"><label for="mdn">Name</label><input type="text" id="mdn" placeholder="e.g. My Wild Unknown, Grandma’s Marseille" maxlength="40">
      <label>What kind of deck is it?</label>
      <div class="md-types" id="mdt">${DECK_ORDER.map(k => `<button type="button" data-b="${k}" class="${k === 'rws' ? 'on' : ''}"><img src="${tarotImg('XVII · The Star', k)}" alt=""><b>${esc(DECKS[k].name)}</b><span>${{ rws: 'Most modern decks: scenes on every card, Strength is VIII', marseille: 'Patterned number cards, Justice is VIII, the Valet', thoth: 'Lust, Art, the Aeon; Princesses & Princes, Disks' }[k]}</span></button>`).join('')}</div>
      <p class="small muted">Not sure? If your deck’s little book follows Rider–Waite–Smith meanings (most do), choose that.</p></div>
      <div class="actions"><button class="btn primary" id="mdadd">${ART.image} Start photographing</button></div></div>`;
  let base = 'rws';
  $('#mdt', v).onclick = e => { const b = e.target.closest('[data-b]'); if (!b) return; base = b.dataset.b; $$('#mdt button', v).forEach(x => x.classList.toggle('on', x === b)); };
  $('#mdadd', v).onclick = async () => { const d = await MyDecks.add($('#mdn', v).value.trim(), base); location.hash = `#/mydecks/${d.id}`; };
});

/* ---- one deck: progress, every card, and the scanner ---- */
route('mydecks/:id', async (v, [id]) => {
  const d = MyDecks.get(id); if (!d) return (location.hash = '#/mydecks');
  setTitle(d.name);
  window.__deckOverride = id;
  const base = DECKS[id].base, n = MyDecks.done(id), inUse = Store.settings.deck === id;
  const missing = TAROT_DECK.filter(c => !DeckPhotos.get(id, c.name));
  v.innerHTML = `<div class="frame sch-hero">
      <div class="sch-stats"><div><b>${n}/78</b><small>photographed</small></div><div><b style="font-size:.95rem">${esc(DECKS[base].name)}</b><small>read as</small></div></div>
      <div class="sq-bar"><i style="width:${Math.round(n / 78 * 100)}%"></i></div>
      <div class="actions" style="margin:12px 0 2px">${missing.length ? `<button class="btn primary" id="mdgo">${ART.image} ${n ? 'Carry on photographing' : 'Photograph the cards'}</button>` : '<b>Every card is photographed ✶</b>'}
        ${inUse ? '' : `<button class="btn ${missing.length ? 'ghost' : 'primary'}" id="mduse">Draw readings with this deck</button>`}</div>
      ${inUse ? `<p class="small" style="margin:6px 0 0">Your readings use this deck.${missing.length ? ` The ${missing.length} cards not photographed yet show their ${esc(DECKS[base].name)} picture.` : ''}</p>` : ''}</div>
    <p class="small muted center" style="margin:10px 4px">Tap any card to photograph it again. Lessons, Tarot School and flashcards keep the built-in decks; this one is for your readings.</p>
    <div class="chips scroll" id="mda"><button class="chip on" data-a="">All</button>${ARCANA.map(x => `<button class="chip" data-a="${x}">${x === 'Major' ? 'Major Arcana' : esc(suitLabel(x, id))}</button>`).join('')}</div>
    <div class="deck-grid" id="mdg"></div>
    <div class="block frame"><h3>${ART.gear}This deck</h3><div class="form">
      <label for="mdname">Name</label><input type="text" id="mdname" value="${esc(d.name)}" maxlength="40">
      <label for="mdbase">Read as</label><select id="mdbase">${DECK_ORDER.map(k => `<option value="${k}" ${k === base ? 'selected' : ''}>${esc(DECKS[k].name)}</option>`).join('')}</select></div>
      <div class="actions"><button class="btn small danger" id="mddel">${ART.trash} Delete this deck</button></div></div>`;
  let arc = '';
  const grid = () => { $('#mdg', v).innerHTML = TAROT_DECK.filter(c => !arc || c.arcana === arc).map(c => { const ph = DeckPhotos.get(id, c.name); return `<button type="button" class="deck-card md-card ${ph ? '' : 'todo'}" data-k="${esc(c.name)}"><img src="${tarotImg(c.name, id)}" alt="" loading="lazy"><b>${esc(cardShort(c.name, id))}</b><span>${ph ? '✓ photographed' : 'not yet'}</span></button>`; }).join(''); };
  grid();
  $('#mda', v).onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; arc = b.dataset.a; $$('#mda .chip', v).forEach(x => x.classList.toggle('on', x === b)); grid(); };
  $('#mdg', v).onclick = e => { const b = e.target.closest('[data-k]'); if (b) scanCards(id, [b.dataset.k]).then(render); };
  if ($('#mdgo', v)) $('#mdgo', v).onclick = () => scanCards(id, missing.map(c => c.name)).then(render);
  if ($('#mduse', v)) $('#mduse', v).onclick = async () => { await Store.setSetting('deck', id); toast(`Readings now use ${d.name} ✶`); render(); };
  $('#mdname', v).onchange = async e => { await MyDecks.update(id, { name: e.target.value.trim() || 'My deck' }); setTitle(MyDecks.get(id).name); };
  $('#mdbase', v).onchange = async e => { await MyDecks.update(id, { base: e.target.value }); toast(`Now read as ${DECKS[e.target.value].name}`); render(); };
  $('#mddel', v).onclick = async () => { if (!await confirmBox(`Delete “${d.name}” and its ${n} photos from this phone? Readings drawn with it are kept and will show the ${DECKS[base].name} pictures.`, 'Delete')) return; await MyDecks.remove(id); toast('Deck deleted'); location.replace('#/mydecks'); };
});

/* ---- the scanner: a live camera with a card-shaped frame, or a photo you already have ---- */
function scanCards(id, keys) {
  return new Promise(done => {
    const base = DECKS[id].base, ratio = CARD_RATIO[base] || CARD_RATIO.rws;
    let i = 0, stream = null, saved = 0;
    const el = document.createElement('div'); el.className = 'scanner'; document.body.appendChild(el);
    const stop = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
    const close = () => { stop(); el.remove(); window.removeEventListener('hashchange', close); if (saved) toast(`${saved} card${saved === 1 ? '' : 's'} saved ✶`); done(saved); };
    window.addEventListener('hashchange', close);
    const head = () => { const k = keys[i]; return `<div class="sc-head"><button class="iconbtn" id="scx" aria-label="Close">${ART.close}</button>
      <div class="sc-title"><small>${keys.length > 1 ? `Card ${i + 1} of ${keys.length}` : 'Photograph this card'}</small><b>${esc(cardLabel(k, id))}</b>${cardTitle(k, id) ? `<small>${esc(cardTitle(k, id))}</small>` : ''}</div>
      <img class="sc-ref" src="${tarotImg(k, base)}" alt="" title="What this card looks like in the ${esc(DECKS[base].name)} deck"></div>`; };
    const frameBox = () => { const W = el.clientWidth, H = el.clientHeight - 210; let fh = Math.min(H * .86, W * .8 / ratio), fw = fh * ratio; return { fw, fh }; };
    // camera view
    const camera = async () => {
      const { fw, fh } = frameBox();
      el.innerHTML = `${head()}<div class="sc-view"><video id="scv" playsinline muted autoplay></video><div class="sc-frame" style="width:${fw}px;height:${fh}px"></div><p class="sc-hint" id="sch">Lay the card flat in good light and fit it inside the frame.</p></div>
        <div class="sc-bar"><button class="btn ghost small" id="scf">${ART.image} From photos</button><button class="sc-shutter" id="scs" aria-label="Take the photo"></button><button class="btn ghost small" id="scn">${keys.length > 1 ? 'Skip' : 'Cancel'}</button></div>`;
      wire();
      $('#scn', el).onclick = () => keys.length > 1 ? next() : close();
      $('#scf', el).onclick = fromFile;
      const video = $('#scv', el);
      try {
        if (!stream) stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false });
        video.srcObject = stream; await video.play().catch(() => { });
      } catch (e) {
        $('#sch', el).innerHTML = 'The camera isn’t available here. Choose a photo of the card instead.'; $('#scs', el).disabled = true; return;
      }
      $('#scs', el).onclick = () => {
        // the part of the video that's inside the frame (the video fills the view like object-fit: cover)
        const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return;
        const box = video.getBoundingClientRect(), fr = $('.sc-frame', el).getBoundingClientRect();
        const sc = Math.max(box.width / vw, box.height / vh), ox = (box.width - vw * sc) / 2, oy = (box.height - vh * sc) / 2;
        const sx = (fr.left - box.left - ox) / sc, sy = (fr.top - box.top - oy) / sc, sw = fr.width / sc, sh = fr.height / sc;
        review(crop(video, sx, sy, sw, sh, 0));
      };
    };
    // a photo from the library: drag to place it, pinch-free zoom with the slider, turn it if needed
    const fromFile = async () => {
      const f = await pickFile('image/*'); if (!f) return;
      const img = new Image(); img.src = URL.createObjectURL(f); await img.decode().catch(() => { });
      if (!img.naturalWidth) { toast('That picture could not be read'); return; }
      stop();
      const { fw, fh } = frameBox();
      let rot = 0, zoom = 1, px = 0, py = 0;
      el.innerHTML = `${head()}<div class="sc-view"><canvas id="scc"></canvas><div class="sc-frame" style="width:${fw}px;height:${fh}px"></div><p class="sc-hint">Drag the photo so the card fills the frame.</p></div>
        <div class="sc-bar sc-bar2"><input type="range" id="scz" min="0.3" max="4" step="0.01" value="1" aria-label="Zoom"><button class="btn ghost small" id="scr">↻ Turn</button><button class="btn primary small" id="scu">Use this</button></div>
        <div class="sc-bar"><button class="btn ghost small" id="scb">${ART.back} Camera</button></div>`;
      wire();
      const cv = $('#scc', el), view = $('.sc-view', el), ctx = cv.getContext('2d');
      cv.width = view.clientWidth * devicePixelRatio; cv.height = view.clientHeight * devicePixelRatio; cv.style.width = view.clientWidth + 'px'; cv.style.height = view.clientHeight + 'px';
      const iw = () => rot % 2 ? img.naturalHeight : img.naturalWidth, ih = () => rot % 2 ? img.naturalWidth : img.naturalHeight;
      const fit = () => Math.max(fw / iw(), fh / ih());   // at zoom 1 the photo just covers the frame
      const paint = () => {
        const d = devicePixelRatio, s = fit() * zoom; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.setTransform(d, 0, 0, d, 0, 0); ctx.translate(view.clientWidth / 2 + px, view.clientHeight / 2 + py); ctx.rotate(rot * Math.PI / 2); ctx.scale(s, s);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      };
      paint();
      let drag = null;
      view.onpointerdown = e => { drag = [e.clientX - px, e.clientY - py]; view.setPointerCapture(e.pointerId); };
      view.onpointermove = e => { if (!drag) return; px = e.clientX - drag[0]; py = e.clientY - drag[1]; paint(); };
      view.onpointerup = view.onpointercancel = () => { drag = null; };
      $('#scz', el).oninput = e => { zoom = +e.target.value; paint(); };
      $('#scr', el).onclick = () => { rot = (rot + 1) % 4; paint(); };
      $('#scb', el).onclick = camera;
      $('#scu', el).onclick = () => {
        // draw exactly what's inside the frame
        const out = document.createElement('canvas'), W = 420, H = Math.round(420 / ratio); out.width = W; out.height = H;
        const o = out.getContext('2d'), k = W / fw, s = fit() * zoom * k;
        o.translate(W / 2 + px * k, H / 2 + py * k); o.rotate(rot * Math.PI / 2); o.scale(s, s); o.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        URL.revokeObjectURL(img.src); review(out.toDataURL('image/jpeg', .84));
      };
    };
    const crop = (src, sx, sy, sw, sh) => { const W = 420, H = Math.round(420 / ratio), c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, W, H); return c.toDataURL('image/jpeg', .84); };
    const review = url => {
      let cur = url;
      el.innerHTML = `${head()}<div class="sc-view sc-review"><img id="scp" src="${cur}" alt=""></div>
        <div class="sc-bar"><button class="btn ghost small" id="scrt">Retake</button><button class="btn ghost small" id="scfl">↻ Turn upside down</button><button class="btn primary" id="scok">${keys.length > 1 && i < keys.length - 1 ? 'Save & next ›' : 'Save'}</button></div>`;
      wire();
      $('#scrt', el).onclick = camera;
      $('#scfl', el).onclick = () => { const im = $('#scp', el), c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.translate(c.width, c.height); x.rotate(Math.PI); x.drawImage(im, 0, 0); cur = c.toDataURL('image/jpeg', .84); im.src = cur; };
      $('#scok', el).onclick = async () => { await DeckPhotos.set(id, keys[i], cur); saved++; next(); };
    };
    const next = () => { i++; if (i >= keys.length) close(); else camera(); };
    const wire = () => { $('#scx', el).onclick = close; };
    camera();
  });
}
