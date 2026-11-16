/* ---------- Moon alerts ----------
   One list of upcoming events (full and new moons, quarters, sabbats), worked out on the device with the
   same Meeus calculations as the Moon Tracker, used two ways:
   Android: handed to the app's native side, which schedules real notifications (they survive a restart).
   iPhone / web: web apps can't schedule notifications, so the events go into a calendar file (.ics) with
   alerts, which the iPhone Calendar app then delivers. It covers about 13 months; the app reminds you to add more. */
const MoonAlerts = (() => {
  const DEF = { on: false, full: true, new: true, quarter: false, sabbat: true, time: '09:00', when: 'day' };
  const prefs = () => ({ ...DEF, ...(Store.settings.moonAlerts || {}) });
  const save = p => Store.setSetting('moonAlerts', p);
  const isAndroid = () => !!(window.AndroidBridge && AndroidBridge.setMoonAlerts);
  const DAYS = 400;
  const SABBAT_INFO = {
    Imbolc: 'The first stirrings of spring: candles, hearth-fire, purification and new intentions.',
    Ostara: 'The spring equinox: balance of light and dark, seeds, eggs and fresh starts.',
    Beltane: 'Fire festival of fertility and joy: blossoms, love magic and abundance.',
    Litha: 'Midsummer, the longest day: the sun at its height, success and celebration.',
    Lughnasadh: 'The first harvest: gratitude, bread, skill and the fruits of your work.',
    Mabon: 'The autumn equinox: balance, thanksgiving and the second harvest.',
    Samhain: 'The witches’ new year: the veil is thin, honour the ancestors and divine.',
    Yule: 'The winter solstice: the sun is reborn, light candles and welcome hope.',
  };
  const KIND = { 'Full Moon': 'full', 'New Moon': 'new', 'First Quarter': 'quarter', 'Last Quarter': 'quarter' };

  // the occasions themselves (one per moon phase or sabbat)
  function occasions(p, from = new Date(), days = DAYS) {
    const to = new Date(from.getTime() + days * 864e5), start = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1), out = [];
    MOON.phasesBetween(start, to).forEach(ph => {
      const k = KIND[ph.phase]; if (!k || !p[k]) return;
      const name = ph.phase + (ph.moonName ? ` · ${ph.moonName}` : '');
      out.push({ kind: k, date: ph.date, exact: true, name, info: MOON.PHASE_INFO[ph.phase] || '', uid: `${k}-${ph.date.toISOString().slice(0, 13)}` });
    });
    if (p.sabbat) for (let y = from.getFullYear(); y <= to.getFullYear(); y++) MOON.sabbats(y).forEach(s => {
      if (s.date >= start && s.date <= to) out.push({ kind: 'sabbat', date: s.date, exact: false, name: s.name, info: SABBAT_INFO[s.name] || '', uid: `sabbat-${s.name}-${y}` });
    });
    return out.sort((a, b) => a.date - b.date);
  }
  const clock = d => fmtTime(d);
  // the actual alerts: on the day and/or the day before, at the chosen time
  function alerts(p, from = new Date()) {
    const [hh, mm] = String(p.time || '09:00').split(':').map(Number), leads = p.when === 'both' ? [1, 0] : p.when === 'before' ? [1] : [0], out = [];
    occasions(p, from).forEach(o => leads.forEach(b => {
      const d = o.date, at = new Date(d.getFullYear(), d.getMonth(), d.getDate() - b, hh || 0, mm || 0);
      if (at <= from) return;
      const when = b ? 'tomorrow' : 'today';
      const title = o.kind === 'sabbat' ? `${o.name} is ${when}` : `${o.name.split(' · ')[0]} ${when}${o.name.includes(' · ') ? ' · ' + o.name.split(' · ')[1] : ''}`;
      const text = (o.exact ? `${o.name.split(' · ')[0]} at ${clock(d)}${b ? ' tomorrow' : ''}. ` : '') + o.info;
      out.push({ at: at.getTime(), title, text });
    }));
    return out.sort((a, b) => a.at - b.at);
  }

  /* ---- Android: real notifications ---- */
  function schedule(p = prefs()) {
    if (!isAndroid()) return 0;
    return AndroidBridge.setMoonAlerts(JSON.stringify(p.on ? alerts(p) : []));
  }
  function askPermission() {
    return new Promise(res => {
      const st = AndroidBridge.notifState();
      if (st !== 'ask') return res(st);
      window.onNotifPermission = s => { window.onNotifPermission = null; res(s); };
      AndroidBridge.requestNotif();
    });
  }

  /* ---- iPhone / web: a calendar file with alerts ---- */
  const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const fold = l => { const out = []; let s = l; while (s.length > 60) { out.push(s.slice(0, 60)); s = ' ' + s.slice(60); } out.push(s); return out.join('\r\n'); };  // stays under 75 bytes even with curly quotes
  const ymd = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const dur = min => `${min < 0 ? '-' : ''}PT${Math.floor(Math.abs(min) / 60)}H${Math.abs(min) % 60}M`;
  function ics(p, from = new Date()) {
    const [hh, mm] = String(p.time || '09:00').split(':').map(Number), mins = (hh || 0) * 60 + (mm || 0);
    const leads = p.when === 'both' ? [1, 0] : p.when === 'before' ? [1] : [0];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Paco Morningstar//Tarot//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    occasions(p, from).forEach(o => {
      const d = o.date, end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      L.push('BEGIN:VEVENT', `UID:${o.uid}@paco-tarot`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(end)}`,
        fold(`SUMMARY:${icsEsc(o.name)}`), fold(`DESCRIPTION:${icsEsc((o.exact ? `${o.name.split(' · ')[0]} at ${clock(d)}. ` : '') + o.info)}`), 'TRANSP:TRANSPARENT');
      leads.forEach(b => L.push('BEGIN:VALARM', 'ACTION:DISPLAY', fold(`DESCRIPTION:${icsEsc(o.name)}`), `TRIGGER:${dur(b ? mins - 1440 : mins)}`, 'END:VALARM'));
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n') + '\r\n';
  }
  async function addToCalendar(p) {
    const from = new Date(), until = new Date(from.getTime() + DAYS * 864e5);
    const name = `moon-alerts-${from.getFullYear()}-${until.getFullYear()}.ics`;
    const text = ics(p, from), file = new File([text], name, { type: 'text/calendar' });
    let done = false;
    if (window.claude) done = await saveFile(name, 'text/calendar', text);   // the claude.ai preview page
    if (!done && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Moon alerts' }); done = true; }
      catch (e) { if (e && e.name === 'AbortError') return false; }
    }
    if (!done) {  // computers and browsers without sharing: a normal download
      const u = URL.createObjectURL(file), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 60000);
    }
    await save({ ...p, calUntil: until.getTime(), calAt: from.getTime() });
    return true;
  }

  /* ---- Settings ---- */
  function settingsUI(box) {
    if (!box) return;
    const p = prefs(), A = isAndroid();
    const chip = (k, label) => `<button type="button" class="chip ${p[k] ? 'on' : ''}" data-k="${k}">${label}</button>`;
    box.innerHTML = `<div class="section-title"><h2>Moon Alerts</h2></div>
      <p class="small">${A ? 'Get a notification for the moments you care about. They’re worked out on this phone, so they arrive even with no connection.' : 'iPhone web apps can’t send their own reminders, so these go into your Calendar as events with alerts, and the Calendar app reminds you.'}</p>
      ${A ? `<div class="switch"><div><b class="fell">Moon notifications</b><div class="small muted" id="maSt"></div></div><div class="seg" id="maOn"><button data-v="1">On</button><button data-v="0">Off</button></div></div>` : ''}
      <label>Remind me about</label><div class="chips" id="maK">${chip('full', 'Full moons')}${chip('new', 'New moons')}${chip('quarter', 'First & last quarters')}${chip('sabbat', 'Sabbats')}</div>
      <div class="ma-row"><div><label>When</label><select id="maW"><option value="day">On the day</option><option value="before">The day before</option><option value="both">Both</option></select></div>
        <div><label>At</label><input type="time" id="maT" value="${esc(p.time)}"></div></div>
      ${A ? `<div class="actions"><button class="btn ghost" id="maTest">Send a test notification</button></div>`
        : `<div class="actions"><button class="btn" id="maCal">${ART.moon} Add moon alerts to my Calendar</button></div>
           <p class="small muted" id="maCalSt"></p>`}
      <p class="small muted" id="maNext"></p>`;
    $('#maW', box).value = p.when;
    const cur = () => prefs();
    const paint = () => {
      const q = cur(), nx = alerts(q)[0];
      if (A) {
        $$('#maOn button', box).forEach(b => b.classList.toggle('on', (b.dataset.v === '1') === !!q.on));
        const st = AndroidBridge.notifState();
        $('#maSt', box).innerHTML = !q.on ? 'Off' : st === 'granted' ? 'On · set for the next 13 months' : 'Notifications are blocked for this app. <a href="javascript:void 0" id="maSet">Open settings</a>';
        if ($('#maSet', box)) $('#maSet', box).onclick = () => AndroidBridge.openNotifSettings();
      } else {
        $('#maCalSt', box).innerHTML = q.calUntil ? `Last added ${esc(fmtDate(new Date(q.calAt || Date.now()), { month: 'short', day: 'numeric', year: 'numeric' }))}, covering up to ${esc(fmtDate(new Date(q.calUntil), { month: 'short', day: 'numeric', year: 'numeric' }))}. If you change the choices above, add them again (and delete the old events in Calendar if you like).` :
          'Tap the button, then choose <b>Calendar</b> in the share sheet if it’s offered. Otherwise choose <b>Save to Files</b>, open the file from the Files app and tap <b>Add All</b>.';
      }
      $('#maNext', box).textContent = (!A || q.on) && nx ? `Next: ${nx.title}, ${fmtDate(new Date(nx.at))} at ${fmtTime(new Date(nx.at))}` : '';
    };
    const update = async patch => { await save({ ...cur(), ...patch }); if (A && cur().on) schedule(); paint(); };
    $('#maK', box).onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k, v = !cur()[k]; b.classList.toggle('on', v); update({ [k]: v }); };
    $('#maW', box).onchange = e => update({ when: e.target.value });
    $('#maT', box).onchange = e => update({ time: e.target.value || '09:00' });
    if (A) {
      $('#maOn', box).onclick = async e => {
        const b = e.target.closest('[data-v]'); if (!b) return;
        const on = b.dataset.v === '1';
        if (on) { const st = await askPermission(); if (st !== 'granted') toast('Allow notifications for this app to get moon alerts'); }
        await save({ ...cur(), on }); const n = schedule(); paint();
        toast(on ? `${n} moon alert${n === 1 ? '' : 's'} set ✶` : 'Moon notifications off');
      };
      $('#maTest', box).onclick = async () => {
        const st = await askPermission();
        if (st !== 'granted') { toast('Notifications are turned off for this app'); paint(); return; }
        const nx = alerts({ ...cur(), full: true })[0];
        AndroidBridge.testNotification(nx ? nx.title : 'Moon alerts are working', nx ? nx.text : 'You’ll be told about the moon’s turning points.');
      };
    } else {
      $('#maCal', box).onclick = async () => { const q = cur(); if (!q.full && !q.new && !q.quarter && !q.sabbat) return toast('Choose at least one kind of alert'); if (await addToCalendar(q)) { toast('Moon alerts ready ✶'); paint(); } };
    }
    paint();
  }

  function boot() {
    const p = prefs();
    if (isAndroid()) { if (p.on) schedule(p); return; }   // keeps the next 13 months scheduled
    if (p.calUntil && p.calUntil - Date.now() < 30 * 864e5) {
      const k = 'maNag'; let last = 0; try { last = +localStorage.getItem(k) || 0; } catch (e) { }
      if (Date.now() - last > 7 * 864e5) { try { localStorage.setItem(k, Date.now()); } catch (e) { } setTimeout(() => toast('Your moon alerts in Calendar run out soon: add more in Settings'), 2500); }
    }
  }
  return { settingsUI, boot, alerts, occasions, ics, schedule };
})();
