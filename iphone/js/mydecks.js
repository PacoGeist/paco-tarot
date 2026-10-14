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
      <div class="actions"><button class="btn primary" id="mdadd">${ART.image} Start photographing</button></div></div>
    <div class="block frame"><h3>${ART.book}Import a deck</h3><p class="small" style="margin-top:0">Someone shared a deck with you? Choose the deck file they sent (it ends in <b>.tarotdeck.json</b>) and it’s added here, ready to draw with.</p>
      <div class="actions" style="margin:6px 0 0"><button class="btn" id="mdimp">Import a deck file</button></div></div>`;
  let base = 'rws';
  $('#mdt', v).onclick = e => { const b = e.target.closest('[data-b]'); if (!b) return; base = b.dataset.b; $$('#mdt button', v).forEach(x => x.classList.toggle('on', x === b)); };
  $('#mdadd', v).onclick = async () => { const d = await MyDecks.add($('#mdn', v).value.trim(), base); location.hash = `#/mydecks/${d.id}`; };
  $('#mdimp', v).onclick = async () => { const d = await importDeckFromFile(); if (d) location.hash = `#/mydecks/${d.id}`; };
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
    <p class="small muted center" style="margin:10px 4px">Tap any card to photograph it again or adjust its photo. Lessons, Tarot School and flashcards keep the built-in decks; this one is for your readings.</p>
    <div class="chips scroll" id="mda"><button class="chip on" data-a="">All</button>${ARCANA.map(x => `<button class="chip" data-a="${x}">${x === 'Major' ? 'Major Arcana' : esc(suitLabel(x, id))}</button>`).join('')}</div>
    <div class="deck-grid" id="mdg"></div>
    <div class="block frame"><h3>${ART.book}Share this deck</h3><p class="small" style="margin-top:0">Save the deck as one file to send to a friend or keep as a copy. They can add it with <b>My Decks → Import a deck</b>. Please share only decks you have the right to share, such as your own artwork. Photos of a published deck are best kept for your own readings.</p>
      <div class="actions" style="margin:6px 0 0"><button class="btn" id="mdexp" ${n ? '' : 'disabled'}>Share or export this deck</button></div></div>
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
  $('#mdexp', v).onclick = () => exportDeck(id);
  $('#mdname', v).onchange = async e => { await MyDecks.update(id, { name: e.target.value.trim() || 'My deck' }); setTitle(MyDecks.get(id).name); };
  $('#mdbase', v).onchange = async e => { await MyDecks.update(id, { base: e.target.value }); toast(`Now read as ${DECKS[e.target.value].name}`); render(); };
  $('#mddel', v).onclick = async () => { if (!await confirmBox(`Delete “${d.name}” and its ${n} photos from this phone? Readings drawn with it are kept and will show the ${DECKS[base].name} pictures.`, 'Delete')) return; await MyDecks.remove(id); toast('Deck deleted'); location.replace('#/mydecks'); };
});

/* ---- the scanner: a live camera with a card-shaped frame, or a photo you already have.
   Every picture then goes to the positioning screen: drag to move, pinch to zoom, twist to rotate
   (or use the sliders and buttons), and Save crops exactly what's inside the frame. ---- */
const SCAN_W = 480;   // saved card width in pixels; the height follows the deck type's shape
function scanCards(id, keys, opts = {}) {
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
    const frameBox = view => { const W = view.clientWidth, H = view.clientHeight; const fh = Math.min(H * .8, W * .8 / ratio); return { fw: fh * ratio, fh }; };
    const wire = () => { $('#scx', el).onclick = close; };
    const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });

    // the live camera
    const camera = async () => {
      const had = DeckPhotos.get(id, keys[i]);
      el.innerHTML = `${head()}<div class="sc-view"><video id="scv" playsinline muted autoplay></video><div class="sc-frame"></div><p class="sc-hint" id="sch">Lay the card flat in good light and fit it inside the frame. You can fine-tune it next.</p></div>
        <div class="sc-bar"><button class="btn ghost small" id="scf">${ART.image} From photos</button><button class="sc-shutter" id="scs" aria-label="Take the photo"></button><button class="btn ghost small" id="scn">${keys.length > 1 ? 'Skip' : 'Cancel'}</button></div>
        ${had ? '<div class="sc-bar" style="padding-top:0"><button class="btn ghost small" id="sca">Adjust the saved photo</button></div>' : ''}`;
      wire();
      const view = $('.sc-view', el), { fw, fh } = frameBox(view), frame = $('.sc-frame', el);
      frame.style.width = fw + 'px'; frame.style.height = fh + 'px';
      $('#scn', el).onclick = () => keys.length > 1 ? next() : close();
      $('#scf', el).onclick = fromFile;
      if ($('#sca', el)) $('#sca', el).onclick = async () => { stop(); editor(await loadImg(had), 'fit'); };
      const video = $('#scv', el);
      try {
        if (!stream) stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false });
        video.srcObject = stream; await video.play().catch(() => { });
      } catch (e) {
        $('#sch', el).innerHTML = 'The camera isn’t available here. Choose a photo of the card instead.'; $('#scs', el).disabled = true; return;
      }
      $('#scs', el).onclick = () => {
        const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return;
        // keep the whole camera picture (up to 1600 px) so it can still be moved and zoomed
        const k = Math.min(1, 1600 / Math.max(vw, vh)), c = document.createElement('canvas'); c.width = Math.round(vw * k); c.height = Math.round(vh * k);
        c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
        stop(); editor(c, 'cover');   // starts exactly as the camera showed it
      };
    };
    // a photo from the library
    const fromFile = async () => {
      const f = await pickFile('image/*'); if (!f) return;
      const url = URL.createObjectURL(f);
      try { const im = await loadImg(url); stop(); editor(im, 'fit'); } catch (e) { toast('That picture could not be read'); }
      finally { setTimeout(() => URL.revokeObjectURL(url), 60000); }
    };

    // the positioning screen
    const editor = (img, start) => {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      el.innerHTML = `${head()}<div class="sc-view"><canvas id="scc"></canvas><div class="sc-frame sc-grid"></div><p class="sc-hint">Drag to move · pinch to zoom · twist to rotate</p></div>
        <div class="sc-tools">
          <label><span>Zoom</span><input type="range" id="scz" min="-2.3" max="2.3" step="0.005" aria-label="Zoom"></label>
          <label><span>Rotate</span><input type="range" id="scr" min="-45" max="45" step="0.25" aria-label="Rotate"><em id="scrv">0°</em></label>
          <div class="sc-row"><button class="btn ghost small" id="sc90">↻ 90°</button><button class="btn ghost small" id="sccn">Center</button><button class="btn ghost small" id="scft">Fit card</button><button class="btn ghost small" id="scrs">Reset</button></div>
        </div>
        <div class="sc-bar"><button class="btn ghost small" id="scrt">${ART.back} Retake</button><button class="btn primary" id="scok">${keys.length > 1 && i < keys.length - 1 ? 'Save & next ›' : 'Save'}</button></div>`;
      wire();
      const view = $('.sc-view', el), cv = $('#scc', el), ctx = cv.getContext('2d');
      const VW = view.clientWidth, VH = view.clientHeight, dpr = window.devicePixelRatio || 1, { fw, fh } = frameBox(view);
      cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr); cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
      const frame = $('.sc-frame', el); frame.style.width = fw + 'px'; frame.style.height = fh + 'px';
      // the picture's state: its centre's offset from the view centre, its scale and its rotation (degrees)
      let px = 0, py = 0, s = 1, quarter = 0, fine = 0;
      const deg = () => quarter * 90 + fine;
      const coverS = () => { const a = deg() * Math.PI / 180, c = Math.abs(Math.cos(a)), n = Math.abs(Math.sin(a)); return Math.max((fw * c + fh * n) / iw, (fw * n + fh * c) / ih); };
      const s0 = start === 'cover' ? Math.max(VW / iw, VH / ih) : coverS();
      const initial = () => { px = py = 0; quarter = 0; fine = 0; s = s0; };
      const paint = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.translate(VW / 2 + px, VH / 2 + py); ctx.rotate(deg() * Math.PI / 180); ctx.scale(s, s);
        ctx.drawImage(img, -iw / 2, -ih / 2);
        $('#scz', el).value = Math.log(s / s0); $('#scr', el).value = fine; $('#scrv', el).textContent = `${Math.round(deg() * 10) / 10}°`;
      };
      // zoom or turn around a point of the view (so pinching zooms where your fingers are)
      const around = (mx, my, f, dDeg) => {
        const a = dDeg * Math.PI / 180, dx = px - mx, dy = py - my;
        px = mx + f * (dx * Math.cos(a) - dy * Math.sin(a)); py = my + f * (dx * Math.sin(a) + dy * Math.cos(a));
        s = Math.min(s0 * 10, Math.max(s0 * .1, s * f)); fine += dDeg;
        while (fine > 45) { fine -= 90; quarter = (quarter + 1) % 4; } while (fine < -45) { fine += 90; quarter = (quarter + 3) % 4; }
      };
      initial(); paint();
      const pts = new Map(); let last = null;
      const rel = e => { const r = view.getBoundingClientRect(); return [e.clientX - r.left - VW / 2, e.clientY - r.top - VH / 2]; };
      const pair = () => { const [a, b] = [...pts.values()]; return { mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, d: Math.hypot(b[0] - a[0], b[1] - a[1]), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; };
      view.onpointerdown = e => { try { view.setPointerCapture(e.pointerId); } catch (err) { } pts.set(e.pointerId, rel(e)); last = pts.size === 2 ? pair() : null; };
      view.onpointermove = e => {
        if (!pts.has(e.pointerId)) return;
        const prev = pts.get(e.pointerId), cur = rel(e); pts.set(e.pointerId, cur);
        if (pts.size === 1) { px += cur[0] - prev[0]; py += cur[1] - prev[1]; }
        else if (pts.size === 2 && last) { const p = pair(); px += p.mx - last.mx; py += p.my - last.my; around(p.mx, p.my, p.d / (last.d || p.d), (p.ang - last.ang) * 180 / Math.PI); last = p; }
        paint();
      };
      view.onpointerup = view.onpointercancel = e => { pts.delete(e.pointerId); last = pts.size === 2 ? pair() : null; };
      view.onwheel = e => { e.preventDefault(); const [mx, my] = rel(e); around(mx, my, Math.exp(-e.deltaY * .0015), 0); paint(); };
      $('#scz', el).oninput = e => { around(0, 0, s0 * Math.exp(+e.target.value) / s, 0); paint(); };
      $('#scr', el).oninput = e => { around(0, 0, 1, +e.target.value - fine); paint(); };
      $('#sc90', el).onclick = () => { around(0, 0, 1, 90); paint(); };
      $('#sccn', el).onclick = () => { px = py = 0; paint(); };
      $('#scft', el).onclick = () => { px = py = 0; s = coverS(); paint(); };
      $('#scrs', el).onclick = () => { initial(); paint(); };
      $('#scrt', el).onclick = camera;
      $('#scok', el).onclick = async () => {
        // draw exactly what's inside the frame
        const W = SCAN_W, H = Math.round(SCAN_W / ratio), k = W / fw, out = document.createElement('canvas'); out.width = W; out.height = H;
        const o = out.getContext('2d'); o.fillStyle = '#000'; o.fillRect(0, 0, W, H);
        o.translate(W / 2 + px * k, H / 2 + py * k); o.rotate(deg() * Math.PI / 180); o.scale(s * k, s * k); o.drawImage(img, -iw / 2, -ih / 2);
        await DeckPhotos.set(id, keys[i], out.toDataURL('image/jpeg', .86)); saved++; next();
      };
    };
    const next = () => { i++; if (i >= keys.length) close(); else camera(); };
    if (opts.adjust && DeckPhotos.get(id, keys[0])) loadImg(DeckPhotos.get(id, keys[0])).then(im => editor(im, 'fit')); else camera();
  });
}

/* ---- sharing a deck: one file with its name, deck type and photos ---- */
const DECK_FILE = 'paco-tarot-deck';
async function exportDeck(id) {
  const d = MyDecks.get(id); if (!d) return;
  const cards = {}; TAROT_DECK.forEach(c => { const ph = DeckPhotos.get(id, c.name); if (ph) cards[c.name] = ph; });
  const n = Object.keys(cards).length;
  if (!n) { toast('Photograph some cards first'); return; }
  const data = { format: DECK_FILE, version: 1, name: d.name, base: DECKS[id].base, count: n, exported: new Date().toISOString(), app: (window.APP_VERSION || {}).version || '', cards };
  const text = JSON.stringify(data), mb = (text.length / 1048576).toFixed(1);
  const slug = d.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'my-deck';
  const ok = await saveFile(`${slug}.tarotdeck.json`, 'application/json', text);
  if (ok) toast(`${d.name}: ${n} cards, ${mb} MB ✶`);
}
// check a picture really is an image, and store it as a fresh JPEG of the right size
function cleanPhoto(src, ratio) {
  return new Promise(res => {
    if (typeof src !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src) || src.length > 4e6) return res(null);
    const im = new Image();
    im.onload = () => { const W = Math.min(SCAN_W, im.naturalWidth), H = Math.round(W / ratio), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); const s = Math.max(W / im.naturalWidth, H / im.naturalHeight); x.drawImage(im, (W - im.naturalWidth * s) / 2, (H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s); res(c.toDataURL('image/jpeg', .86)); };
    im.onerror = () => res(null); im.src = src;
  });
}
const isDeckFile = data => data && data.format === DECK_FILE && data.cards && typeof data.cards === 'object';
async function importDeck(data) {
  if (!isDeckFile(data)) { toast('That file is not a tarot deck'); return null; }
  const base = DECK_ORDER.includes(data.base) ? data.base : 'rws';
  const keys = Object.keys(data.cards).filter(k => TAROT_BY_NAME[k]);
  if (!keys.length) { toast('That deck file has no cards in it'); return null; }
  let name = String(data.name || 'Imported deck').replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, 40) || 'Imported deck';
  if (MyDecks.list.some(x => x.name === name)) { let k = 2; while (MyDecks.list.some(x => x.name === `${name} (${k})`)) k++; name = `${name} (${k})`; }
  if (!await confirmBox(`Add “${name}” to My Decks? ${keys.length} of 78 cards, read as ${DECKS[base].name}.`, 'Add deck')) return null;
  toast('Adding the deck…');
  // check every picture first; nothing is added unless at least one card is a real image
  const ratio = CARD_RATIO[base], good = {};
  for (const k of keys) { const ph = await cleanPhoto(data.cards[k], ratio); if (ph) good[k] = ph; }
  const n = Object.keys(good).length;
  if (!n) { toast('None of the pictures in that file could be used'); return null; }
  const d = await MyDecks.add(name, base);
  DeckPhotos.map[d.id] = good; await DB.set('deckPhotos', DeckPhotos.map);
  toast(`${name}: ${n} cards added ✶`);
  return d;
}
async function importDeckFromFile() {
  const f = await pickFile('application/json,.json,text/plain,*/*'); if (!f) return null;
  let data; try { data = JSON.parse(await f.text()); } catch (e) { toast('That file could not be read'); return null; }
  return importDeck(data);
}
