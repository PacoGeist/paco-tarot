/* Paco Morningstar's Tarot: offline support for the web (iPhone) version.
   The first visit saves every file listed in files.json into a cache, and from then on the app runs
   entirely from that cache, even with no connection. Nothing updates by itself: new versions are
   only fetched when the user taps Settings → Check for updates → Update now, which sends 'update'.
   Keep this file unchanged between releases (changes to the app go in files.json, made by tools/build_web.py). */
const META = 'paco-meta', PREFIX = 'paco-v';
const scopeUrl = p => new URL(p, self.registration.scope).href;
let current = null;

async function getCurrent() {
  if (current) return current;
  const m = await caches.open(META), r = await m.match(scopeUrl('__current'));
  return (current = r ? await r.text() : null);
}
async function setCurrent(name) {
  const m = await caches.open(META);
  await m.put(scopeUrl('__current'), new Response(name));
  current = name;
}
// download every file of the newest version into a fresh cache, then switch to it
async function download() {
  const list = await (await fetch(scopeUrl('files.json'), { cache: 'no-store' })).json();
  const name = PREFIX + list.version + '-' + list.hash;
  if (name === await getCurrent()) return { version: list.version, unchanged: true };
  const c = await caches.open(name);
  const files = ['./', ...list.files];
  for (let i = 0; i < files.length; i += 12) {
    await Promise.all(files.slice(i, i + 12).map(async f => {
      const res = await fetch(scopeUrl(f), { cache: 'reload' });
      if (!res.ok) throw new Error('Could not download ' + f);
      await c.put(scopeUrl(f), res);
    }));
  }
  await setCurrent(name);
  for (const k of await caches.keys()) if (k.startsWith(PREFIX) && k !== name) await caches.delete(k);
  return { version: list.version };
}

self.addEventListener('install', e => {
  // only the very first install downloads the app; later versions of this file never change the content
  e.waitUntil(getCurrent().then(cur => cur ? null : download()).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', e => {
  const port = e.ports && e.ports[0];
  if (!e.data || e.data.type !== 'update' || !port) return;
  e.waitUntil(download().then(r => port.postMessage({ ok: true, ...r }), err => port.postMessage({ ok: false, error: String(err && err.message || err) })));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (/\/(version|files)\.json$/.test(url.pathname)) return;   // always asked of the network
  e.respondWith((async () => {
    const name = await getCurrent();
    if (name) {
      const c = await caches.open(name);
      const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match(scopeUrl('./')) : null);
      if (hit) return hit;
    }
    return fetch(req);
  })());
});
