/* ---------- Updates: only ever when asked (Settings → Check for updates) ----------
   iPhone / web: compares version.json on the site with this copy's APP_VERSION; "Update now" asks the
   service worker (sw.js) to download the new files, then reloads. Nothing changes until then.
   Android: the app asks its native side to read version.json from the GitHub site (the web view itself
   stays offline). From 1.0 (new app) the app downloads PacoTarot.apk itself and hands it to Android's installer
   (AndroidBridge.installUpdate). With "Automatic updates" on (the default), it checks at most once a day
   when the app opens and installs a new version by itself. Older Android builds fall back to the browser. */
const Updates = (() => {
  const cfg = () => window.APP_CONFIG || {};
  const isAndroid = () => !!(window.AndroidBridge && AndroidBridge.checkUpdate);
  const inApp = () => isAndroid() && !!AndroidBridge.installUpdate;   // this build can install updates itself
  const autoOn = () => inApp() && Store.settings.autoUpdate !== false;
  const isPreview = () => !!window.claude;   // the claude.ai preview page: no installing or updating there
  const canSW = () => 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !isAndroid() && !isPreview();
  const mode = () => isAndroid() ? 'android' : canSW() ? 'web' : 'preview';
  function site() {
    const c = cfg(); if (c.site) return c.site.replace(/\/?$/, '/');
    const [u, n] = String(c.repo || '').split('/'); if (!u || !n) return null;
    const user = u.toLowerCase();
    return n.toLowerCase() === user + '.github.io' ? `https://${user}.github.io/` : `https://${user}.github.io/${n}/`;
  }
  const configured = () => !!site() && !/^your-username\//i.test(cfg().repo || '');
  const apkUrl = () => `https://github.com/${cfg().repo}/raw/${cfg().branch || 'main'}/android/releases/PacoTarot.apk`;
  function installed() {
    if (isAndroid()) { try { const i = JSON.parse(AndroidBridge.appInfo()); return { version: i.name || '?', code: +i.code || 0 }; } catch (e) { } }
    const v = window.APP_VERSION || {}; return { version: v.version || '?', code: +v.code || 0 };
  }
  const newer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };

  function fetchRemote() {
    if (isAndroid()) return new Promise((res, rej) => {
      const t = setTimeout(() => { window.onAppUpdate = null; rej(new Error('No answer from the update site')); }, 20000);
      window.onAppUpdate = (body, err) => { clearTimeout(t); window.onAppUpdate = null; if (err || !body) rej(new Error(err || 'No answer')); else { try { res(JSON.parse(body)); } catch (e) { rej(new Error('The update file could not be read')); } } };
      AndroidBridge.checkUpdateAt ? AndroidBridge.checkUpdateAt(site()) : AndroidBridge.checkUpdate();
    });
    return fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('The update site answered ' + r.status); return r.json(); });
  }
  function swCall(msg, ms = 180000) {
    return new Promise((res, rej) => {
      const c = navigator.serviceWorker.controller; if (!c) return rej(new Error('offline support is not ready'));
      const ch = new MessageChannel(), t = setTimeout(() => rej(new Error('The download took too long')), ms);
      ch.port1.onmessage = e => { clearTimeout(t); e.data && e.data.ok ? res(e.data) : rej(new Error((e.data && e.data.error) || 'Update failed')); };
      c.postMessage(msg, [ch.port2]);
    });
  }

  // progress and results from Android's installer
  let statusBox = null;
  window.onUpdateStatus = (state, detail) => {
    const msg = { downloading: detail && +detail >= 0 ? `Downloading… ${detail}%` : 'Downloading…', installing: 'Installing… the app restarts by itself when it’s done.',
      confirm: 'Tap <b>Update</b> (or <b>Install</b>) on the screen Android shows.', done: 'Updated ✶', cancelled: 'The update was cancelled. You can try again any time.',
      failed: `The update couldn’t be installed${detail ? ` (${esc(detail)})` : ''}. Make sure the phone is online, then try again.` }[state];
    if (statusBox && document.body.contains(statusBox)) statusBox.innerHTML = `<p class="small center">${msg || ''}</p>`;
    else if (state === 'failed' || state === 'confirm') toast(msg.replace(/<[^>]+>/g, ''));
  };
  function startInstall(r, out) {
    statusBox = out;
    AndroidBridge.installUpdate(r.apk || apkUrl());
  }

  function settingsUI(box) {
    if (!box) return;
    const m = mode(), me = installed(), last = Store.settings.lastUpdateCheck;
    const intro = m === 'android' && inApp()
      ? `You have version <b>${esc(me.version)}</b> for Android. ${autoOn() ? 'With automatic updates on, the app looks for a new version once a day when you open it, and installs it by itself.' : 'Tap below to look for a new version. The app installs it for you.'} This is the only time it uses the internet.`
      : `You have version <b>${esc(me.version)}</b>${m === 'android' ? ' for Android' : m === 'web' ? ' (web app)' : ''}. The app never updates by itself: tap below to look for a new version. This is the only time it uses the internet${m === 'web' ? ' after it has been installed' : ''}.`;
    box.innerHTML = `<div class="section-title"><h2>Updates</h2></div>
      <p class="small">${intro}</p>
      ${inApp() ? `<label class="check" style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" id="upauto" ${autoOn() ? 'checked' : ''}> Automatic updates</label>` : ''}
      ${inApp() && !AndroidBridge.canInstall() ? `<div class="sq-fb ok" id="upallow"><p class="small">To install updates, Android needs your OK once: tap below, turn on <b>Allow from this source</b>, then come back.</p><div class="actions"><button class="btn" id="upallowb">Allow updates from this app</button></div></div>` : ''}
      ${m === 'preview' ? '<p class="small muted">Updates are checked from the installed app on your phone.</p>'
        : m === 'android' && !configured() ? '<p class="small muted">The update address hasn’t been set up yet (js/config.js).</p>'
        : `<div class="actions"><button class="btn" id="upchk">${ART.shuffle} Check for updates</button></div>${last ? `<p class="small muted center" style="margin:0">Last checked ${esc(fmtDate(new Date(last), { month: 'short', day: 'numeric', year: 'numeric' }))}</p>` : ''}`}
      <div id="upres"></div>`;
    const au = $('#upauto', box); if (au) au.onchange = async () => { await Store.setSetting('autoUpdate', au.checked); settingsUI(box); };
    const ab = $('#upallowb', box); if (ab) ab.onclick = () => { window.onAppResume = () => { window.onAppResume = null; settingsUI(box); }; AndroidBridge.allowInstalls(); };
    const btn = $('#upchk', box), out = $('#upres', box); if (!btn) return;
    btn.onclick = async () => {
      btn.disabled = true; out.innerHTML = '<p class="small center">Looking for a new version…</p>';
      try {
        const r = await fetchRemote();
        Store.setSetting('lastUpdateCheck', Date.now());
        const avail = m === 'android' ? +r.androidVersionCode > me.code : newer(r.version, me.version);
        if (!avail) { out.innerHTML = `<div class="sq-fb ok"><b>You’re up to date.</b><p>Version ${esc(me.version)} is the newest.</p></div>`; return; }
        const how = m !== 'android' ? '<p class="small">The new version downloads now and the app restarts. Your readings, journal and progress stay just as they are.</p>'
          : inApp() ? '<p class="small">The app downloads the new version and installs it for you. Your readings, journal and progress stay just as they are.</p>'
          : '<p class="small">Your browser will download <b>PacoTarot.apk</b>. Open it and tap <b>Update</b>. Your readings, journal and progress stay just as they are.</p>';
        out.innerHTML = `<div class="sq-fb ok"><b>Version ${esc(r.version)} is ready${r.date ? ` <span class="small muted">(${esc(r.date)})</span>` : ''}</b>
          ${(r.notes || []).length ? `<ul class="small">${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
          ${how}
          <div class="actions"><button class="btn primary" id="upgo">${m === 'android' && !inApp() ? 'Download the update' : 'Update now'}</button></div><div id="upst"></div></div>`;
        $('#upgo', box).onclick = async e => {
          if (m === 'android' && !inApp()) { AndroidBridge.openUrl(r.apk || apkUrl()); return; }
          if (m === 'android') {
            if (!AndroidBridge.canInstall()) { toast('First allow updates from this app (just above)'); settingsUI(box); return; }
            e.target.disabled = true; startInstall(r, $('#upst', box)); return;
          }
          e.target.disabled = true; e.target.textContent = 'Downloading…';
          try {
            const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update().catch(() => { });
            if (navigator.serviceWorker.controller) await swCall({ type: 'update' });
            toast(`Updated to ${r.version} ✶`); setTimeout(() => location.reload(), 600);
          } catch (err) { e.target.disabled = false; e.target.textContent = 'Try again'; toast('Update failed: ' + err.message); }
        };
      } catch (err) {
        out.innerHTML = `<div class="sq-fb no"><b>Couldn’t check right now.</b><p class="small">${esc(err.message || '')}. Make sure the phone is online, then try again.</p></div>`;
      } finally { btn.disabled = false; }
    };
  }

  // Android with automatic updates: look once a day when the app opens, and install a new version by itself
  async function autoCheck() {
    if (!autoOn() || !configured()) return;
    const lastAuto = +Store.settings.lastAutoUpdate || 0;
    if (Date.now() - lastAuto < 20 * 3600e3) return;
    await Store.setSetting('lastAutoUpdate', Date.now());
    try {
      const r = await fetchRemote(), me = installed();
      Store.setSetting('lastUpdateCheck', Date.now());
      if (!(+r.androidVersionCode > me.code)) return;
      if (!AndroidBridge.canInstall()) { toast(`Version ${r.version} is ready: see Settings & Backup → Updates`); return; }
      toast(`Updating to version ${r.version}… the app restarts by itself`);
      startInstall(r, null);
    } catch (e) { /* offline: try again next time */ }
  }

  function boot() {
    if (mode() === 'android') { setTimeout(autoCheck, 4000); return; }
    if (mode() !== 'web') return;
    navigator.serviceWorker.register('sw.js').catch(() => { });
    // ask Safari to keep this app's data even when the phone is short of space
    if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => { });
  }
  return { settingsUI, boot, mode, site, apkUrl, configured, installed };
})();
