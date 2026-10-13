/* Full-screen picture viewer with pinch, double-tap, wheel and button zoom */
function openLightbox({ src, html, caption = '' }) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lb-stage"><div class="lb-content">${src ? `<img src="${esc(src)}" alt="" draggable="false">` : `<div class="lb-svg">${html}</div>`}</div></div>
    <div class="lb-bar">
      <button class="iconbtn" data-z="out" aria-label="Zoom out"><svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"><line x1="22" y1="50" x2="78" y2="50"/></svg></button>
      <button class="iconbtn" data-z="reset" aria-label="Fit to screen"><svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 38V20h18M62 20h18v18M80 62v18H62M38 80H20V62"/></svg></button>
      <button class="iconbtn" data-z="in" aria-label="Zoom in">${ART.plus}</button>
    </div>
    <button class="iconbtn lb-close" aria-label="Close">${ART.close}</button>
    ${caption ? `<div class="lb-cap">${esc(caption)}</div>` : ''}
    <div class="lb-hint">Pinch or double-tap to zoom</div>`;
  document.body.appendChild(lb);
  document.body.style.overflow = 'hidden';
  const stage = $('.lb-stage', lb), content = $('.lb-content', lb);
  let s = 1, tx = 0, ty = 0;
  const MAX = 8;
  const pts = new Map();
  let pinch = null, pan = null, lastTap = 0, moved = false, swipe = 0;

  const clamp = () => {
    s = Math.min(MAX, Math.max(1, s));
    const r = stage.getBoundingClientRect();
    const mx = (r.width * (s - 1)) / 2, my = (r.height * (s - 1)) / 2;
    tx = Math.min(mx, Math.max(-mx, tx)); ty = Math.min(my, Math.max(-my, ty));
    if (s === 1) { tx = 0; }
  };
  const apply = (anim) => {
    content.style.transition = anim ? 'transform .25s ease' : 'none';
    content.style.transform = `translate(${tx}px, ${ty + (s === 1 ? swipe : 0)}px) scale(${s})`;
    lb.style.background = `rgba(5,3,10,${s === 1 ? Math.max(0.35, 0.99 - Math.abs(swipe) / 500) : 0.99})`;
  };
  // zoom keeping the screen point (cx, cy) fixed
  const zoomAt = (ns, cx, cy, anim) => {
    const r = stage.getBoundingClientRect();
    const ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2);
    ns = Math.min(MAX, Math.max(1, ns));
    tx = ox - (ox - tx) * (ns / s); ty = oy - (oy - ty) * (ns / s); s = ns;
    clamp(); apply(anim);
  };
  const center = () => { const r = stage.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    moved = false;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], tx, ty };
      pan = null;
    } else if (pts.size === 1) pan = { x: e.clientX, y: e.clientY, tx, ty };
  });
  stage.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      // restore start state, then zoom about the starting midpoint and follow the fingers
      s = pinch.s; tx = pinch.tx; ty = pinch.ty;
      zoomAt(pinch.s * d / pinch.d, pinch.mid[0], pinch.mid[1]);
      tx += mid[0] - pinch.mid[0]; ty += mid[1] - pinch.mid[1]; clamp(); apply();
      moved = true;
    } else if (pan) {
      const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (s > 1) { tx = pan.tx + dx; ty = pan.ty + dy; clamp(); apply(); }
      else { swipe = dy; apply(); }
    }
  });
  const up = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size === 1) { const [p] = [...pts.values()]; pan = { x: p[0], y: p[1], tx, ty }; return; }
    pan = null;
    if (s === 1 && Math.abs(swipe) > 120) { close(); return; }
    if (swipe) { swipe = 0; apply(true); }
    if (!moved && e.type === 'pointerup') {
      const now = Date.now();
      if (now - lastTap < 300) { zoomAt(s > 1.05 ? 1 : 3, e.clientX, e.clientY, true); lastTap = 0; }
      else lastTap = now;
    }
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', e => { e.preventDefault(); zoomAt(s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY); }, { passive: false });
  $('.lb-bar', lb).addEventListener('click', e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    const [cx, cy] = center();
    if (b.dataset.z === 'in') zoomAt(s * 1.6, cx, cy, true);
    if (b.dataset.z === 'out') zoomAt(s / 1.6, cx, cy, true);
    if (b.dataset.z === 'reset') { s = 1; tx = ty = 0; apply(true); }
  });
  function close() {
    lb.remove(); document.body.style.overflow = '';
    window.removeEventListener('hashchange', close); document.removeEventListener('keydown', key);
  }
  const key = e => { if (e.key === 'Escape') close(); if (e.key === '+' || e.key === '=') zoomAt(s * 1.4, ...center(), true); if (e.key === '-') zoomAt(s / 1.4, ...center(), true); };
  document.addEventListener('keydown', key);
  window.addEventListener('hashchange', close);
  $('.lb-close', lb).onclick = close;
  lb._close = close;
  setTimeout(() => { const h = $('.lb-hint', lb); if (h) h.classList.add('gone'); }, 2200);
  apply();
  return close;
}

// Make any element open its picture full screen when tapped
function makeZoomable(el, caption) {
  if (!el) return;
  el.classList.add('zoomable');
  el.addEventListener('click', e => {
    if (e.target.closest('a,button')) return;
    const img = el.querySelector('img');
    if (img) return openLightbox({ src: img.getAttribute('src'), caption });
    const svg = el.querySelector('svg');
    if (svg) openLightbox({ html: svg.outerHTML, caption });
  });
}
