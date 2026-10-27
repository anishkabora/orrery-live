/* ============================================================
   UI — catalogue, dossier panel, live telemetry, labels, picking
   ============================================================ */
(function (O) {
const $ = (s) => document.querySelector(s);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const S = O.S, V3 = THREE.Vector3, F = O.fmt;
const GM_SUN = 1.32712440018e11; // km³/s²

O.state = {focus: null, selected: null, place: null, cut: null, hiLayer: -1, cutMode: 'wedge', radar: false};
O.layers = {orbits: true, labels: true, dist: true, sats: true, satOrbits: false, shell: false, belts: true, helio: true, deep: true, constel: true, features: true, scanner: true, magnet: false, lagrange: true};

/* ---------------- catalogue tree ---------------- */
function buildTree() {
  const tree = $('#tree'); tree.innerHTML = '';
  const add = (parent, id, name, cls, color, meta) => {
    const b = el('button', 'it ' + (cls || '')); b.dataset.id = id;
    const tw = el('span', 'tw', ''); b.appendChild(tw);
    if (color) { const d = el('span', 'dot'); d.style.background = color; b.appendChild(d); }
    b.appendChild(el('span', '', name));
    if (meta) b.appendChild(el('span', 'meta', meta));
    b.addEventListener('click', () => { O.select(id, true); if (window.innerWidth <= 860) $('#nav').classList.remove('open'); });
    parent.appendChild(b); return b;
  };
  const grp = (t) => tree.appendChild(el('div', 'grp', t));
  grp('Experiences');
  const xp = (label, meta, fn) => { const b = el('button', 'it'); b.appendChild(el('span', 'tw', '◆')); b.appendChild(el('span', '', label)); if (meta) b.appendChild(el('span', 'meta', meta)); b.addEventListener('click', () => { fn(); if (window.innerWidth <= 860) $('#nav').classList.remove('open'); }); tree.appendChild(b); };
  xp('Guided tour', '15 stops', () => O.tourStart());
  xp('Sky View — look up from Earth', 'live', () => O.openSkyDefault());
  grp('Star');
  add(tree, 'sun', 'Sun', '', '#ffcf6b');
  grp('Planets & moons');
  for (const id of O.PLANET_ORDER) {
    const B = O.BODIES[id], moons = O.MOONS[id] || [];
    const extra = id === 'earth' ? O.SATS.length + 2 : 0;
    const b = add(tree, id, B.name, '', B.color, moons.length + extra ? String(moons.length + extra) : '');
    if (moons.length || extra) {
      const box = el('div'); box.hidden = true;
      b.querySelector('.tw').textContent = '▸';
      b.querySelector('.tw').addEventListener('click', (e) => { e.stopPropagation(); box.hidden = !box.hidden; e.target.textContent = box.hidden ? '▸' : '▾'; });
      for (const m of moons) add(box, m.id, m.name, 'sub', m.color);
      if (id === 'earth') {
        const o = el('div', 'grp', 'Orbiters · live'); o.style.paddingLeft = '28px'; box.appendChild(o);
        for (const s of O.SATS) add(box, s.id, s.name, 'sub', s.c);
        add(box, 'jwst', 'James Webb (L2)', 'sub', '#ffd27a'); add(box, 'aditya', 'Aditya-L1 (L1)', 'sub', '#9fe0b0');
      }
      tree.appendChild(box); b._box = box;
    }
  }
  grp('Small bodies & frontier');
  add(tree, 'asteroidbelt', 'Asteroid Belt', '', '#a99a86');
  add(tree, 'halley', '1P/Halley', '', '#bfe0ff');
  add(tree, 'kuiperbelt', 'Kuiper Belt', '', '#8aa2c8');
  add(tree, 'heliopause', 'Heliopause', '', '#3f7fd8');
  add(tree, 'voyager1', 'Voyager 1', '', '#bfe0ff', 'probe');
  add(tree, 'voyager2', 'Voyager 2', '', '#bfe0ff', 'probe');
  add(tree, 'oort', 'Oort Cloud', '', '#71809e');
  const groups = {};
  for (const D of O.DEEP) (groups[D.group] = groups[D.group] || []).push(D);
  for (const g of ['Stars', 'Exoplanet systems', 'Black holes', 'Supernovae & remnants', 'Nebulae', 'Galaxies']) {
    if (!groups[g]) continue; grp(g);
    for (const D of groups[g]) add(tree, D.id, D.name, '', D.T ? '#' + new THREE.Color(...O.kelvinRGB(D.T)).getHexString() : (D.col || '#9aa9c4'), O.fmt.ly(D.ly).replace(' light-years', ''));
  }
  grp('Simulations');
  const sim = (label, fn) => { const b = el('button', 'it'); b.appendChild(el('span', 'tw', '▶')); b.appendChild(el('span', '', label)); b.addEventListener('click', fn); tree.appendChild(b); };
  sim('Milky Way × Andromeda merger', () => O.startSim('merger'));
  sim('Black-hole gravity sandbox', () => O.startSim('sandbox', 'Sagittarius A*'));
  sim('Betelgeuse goes supernova', () => O.runSupernova());
}
function markTree() {
  document.querySelectorAll('#tree .it').forEach((b) => b.classList.toggle('on', b.dataset.id === O.state.selected));
  const s = O.state.selected && S.objects[O.state.selected];
  if (s && (s.parent)) { const pb = document.querySelector(`#tree .it[data-id="${s.parent}"]`); if (pb && pb._box) { pb._box.hidden = false; pb.querySelector('.tw').textContent = '▾'; } }
}
function search(q) {
  q = q.trim().toLowerCase();
  document.querySelectorAll('#tree .it, #tree .grp').forEach((b) => {
    if (!q) { b.hidden = false; return; }
    if (b.classList.contains('grp')) { b.hidden = true; return; }
    b.hidden = !b.textContent.toLowerCase().includes(q);
  });
  document.querySelectorAll('#tree > div:not(.grp)').forEach((d) => { if (q) d.hidden = false; });
}

/* ---------------- selection & focus ---------------- */
O.select = function (id, fly) {
  const p = S.objects[id]; if (!p) return;
  if (O.SIM.active) O.stopSim(true);            // leaving a simulation: go where the user asked, not back
  if (O.activeSN && id !== 'betelgeuse') O.closeSN();
  if (O.SKY && O.SKY.active) { O.SKY.active = false; O.rig.enabled = true; $('#skyhud').hidden = true; $('#skyinfo').hidden = true; }
  if (O.SIGNAL && O.SIGNAL.on) O.stopSignal();
  if (O.state.cut && O.state.cut !== id) O.setCutaway(O.state.cut, false);
  O.state.selected = id; O.state.place = null;
  if (fly) O.flyTo(id);
  renderPanel(); markTree(); crumbs();
};
O.flyTo = function (id) {
  const p = S.objects[id]; if (!p) return;
  O.state.focus = id;
  const pos = () => p.obj.getWorldPosition(new V3());
  let dist = 10, minD = 0.001;
  const r = p.radiusFn ? p.radiusFn() : 1;
  if (p.kind === 'sun') { dist = r * 4.5; minD = r * 1.08; }
  else if (p.kind === 'planet') { dist = r * (p.id === 'saturn' ? 7 : 4.2); minD = r * 1.06; }
  else if (p.kind === 'moon') { dist = Math.max(r * 5, 0.02); minD = r * 1.1; }
  else if (p.kind === 'sat' || p.kind === 'lpoint') { const er = S.planets.earth.r; dist = er * 0.18; minD = er * 0.004; }
  else if (p.kind === 'deep') { dist = p.deep.D.size * 3.6; minD = p.deep.D.size * 0.2; }
  else if (p.kind === 'probe') { dist = 25; minD = 0.5; }
  else if (p.kind === 'comet') { dist = 14; minD = 0.2; }
  else if (p.kind === 'region') {
    const reg = p.region;
    O.state.focus = null;
    const view = {belt: [O.mapAU(3.2) * 2.6, 0.5], kuiper: [O.mapAU(48) * 2.4, 0.6], helio: [O.mapAU(120) * 2.6, 1.0], oort: [O.mapAU(100000) * 2.0, 1.0]}[reg];
    O.rig.minDist = 1; O.rig.setFocus(() => new V3(), view[0], {phi: view[1]});
    return;
  }
  O.rig.minDist = minD;
  // approach from the sunlit side for solar-system bodies
  const wp = pos(); let theta = O.rig.theta, phi = 1.15;
  if (p.kind === 'planet' || p.kind === 'moon') { const toSun = wp.clone().negate(); theta = Math.atan2(toSun.x, toSun.z) + 0.55; }
  if (p.kind === 'sat' || p.kind === 'lpoint') { // look back at Earth past the spacecraft
    const dir = wp.clone().sub(S.planets.earth.sys.position).normalize();
    theta = Math.atan2(dir.x, dir.z) + 0.35; phi = Math.max(0.25, Math.min(Math.PI - 0.25, Math.acos(dir.y) - 0.3));
  }
  if (p.kind === 'deep') {
    phi = 1.05;
    const D = p.deep.D;
    if (['smbh', 'xrb', 'galaxy', 'system', 'bhbinary', 'binary', 'rings'].includes(D.vis)) {
      const n = new V3(0, 1, 0).applyQuaternion(p.deep.g.quaternion);
      const toCam = new V3().subVectors(O.S.camera.position, wp).normalize();
      let perp = toCam.clone().sub(n.clone().multiplyScalar(toCam.dot(n))); if (perp.lengthSq() < 1e-6) perp.set(1, 0, 0); perp.normalize();
      const el = (D.vis === 'galaxy' ? 55 : 24) * O.D2R;
      const d = n.clone().multiplyScalar(Math.sin(el) * Math.sign(toCam.dot(n) || 1)).addScaledVector(perp, Math.cos(el)).normalize();
      phi = Math.acos(Math.max(-1, Math.min(1, d.y))); theta = Math.atan2(d.x, d.z);
    }
  }
  O.rig.setFocus(pos, dist, {theta, phi, dur: wp.distanceTo(O.rig.target) > 500 ? 2.6 : 1.7});
};
function crumbs() {
  const c = $('#crumbs'); c.innerHTML = '';
  const add = (id, name, cur) => { const b = el(cur ? 'span' : 'button', cur ? 'cur' : '', name); if (!cur) b.addEventListener('click', () => id ? O.select(id, true) : O.home()); c.appendChild(b); };
  const sep = () => c.appendChild(el('span', '', '›'));
  const s = O.state.selected && S.objects[O.state.selected];
  if (!s) { add(null, 'Solar System', true); return; }
  if (s.group === 'deep') { add(null, 'Solar System'); sep(); add(null, s.deep.D.group, false); c.lastChild.disabled = true; sep(); add(s.id, s.label, true); return; }
  add(null, 'Solar System');
  if (s.parent) { sep(); add(s.parent, S.objects[s.parent].label); }
  sep(); add(s.id, s.label, true);
  if (O.state.place) { sep(); add(null, O.state.place.name || 'Surface point', true); }
}
O.home = function () {
  if (O.SIM.active) O.stopSim(true);
  if (O.activeSN) O.closeSN();
  if (O.state.cut) O.setCutaway(O.state.cut, false);
  O.state.selected = null; O.state.focus = null; O.state.place = null;
  O.rig.minDist = 1; O.rig.setFocus(() => new V3(), O.scale.mode === 'true' ? 900 : 520, {phi: 0.9, theta: 0.4});
  $('#panel').classList.add('off'); markTree(); crumbs();
};

/* ---------------- dossier ---------------- */
let teleFns = [];
function sec(body, title, badge) { const s = el('div', 'sec'); const h = el('h3', '', title); if (badge) { const b = el('span', 'badge ' + badge[0], badge[1]); h.appendChild(b); } s.appendChild(h); body.appendChild(s); return s; }
function teleGrid(parent, rows) {
  const g = el('dl', 'tele');
  for (const [k, fn, wide] of rows) {
    const d = el('div', wide ? 'w2' : ''); d.appendChild(el('dt', '', k)); const dd = el('dd', '', '—'); d.appendChild(dd); g.appendChild(d);
    teleFns.push(() => { try { dd.textContent = fn(); } catch (e) { dd.textContent = '—'; } });
  }
  parent.appendChild(g);
}
function kv(parent, rows) { const t = el('table', 'kv'); for (const [k, v] of rows) { const tr = el('tr'); tr.appendChild(el('td', '', k)); tr.appendChild(el('td', '', v)); t.appendChild(tr); } parent.appendChild(t); }
function btn(parent, label, fn, cls) { const b = el('button', 'btn ' + (cls || ''), label); b.addEventListener('click', fn); parent.appendChild(b); return b; }

function renderPanel() {
  const panel = $('#panel'), body = $('#pBody');
  teleFns = [];
  const s = O.state.selected && S.objects[O.state.selected];
  if (!s) { panel.classList.add('off'); return; }
  panel.classList.remove('off');
  if (window.innerWidth <= 860) panel.classList.add('min');
  body.innerHTML = ''; body.scrollTop = 0;
  const E = $('#pEyebrow'), T = $('#pTitle');
  T.textContent = s.label;
  if (O.state.place) return renderPlace(body, E, T);
  if (s.kind === 'sun' || s.kind === 'planet') renderBody(body, E, s, O.BODIES[s.id]);
  else if (s.kind === 'moon') renderMoon(body, E, s);
  else if (s.kind === 'sat') renderSat(body, E, s);
  else if (s.kind === 'lpoint') { E.textContent = 'Space observatory · Lagrange point'; body.appendChild(el('p', 'lede', s.lp.desc)); O.infoForSat(body, s.lp.id); const t = sec(body, 'Now', ['live', 'LIVE']); teleGrid(t, [['Distance from Earth', () => '≈ 1.5 million km'], ['Light time to Earth', () => '≈ 5.0 light-seconds'], ['Direction', () => s.lp.side > 0 ? 'Anti-sunward (night side)' : 'Sunward (day side)', true]]); body.appendChild(el('p', 'note', 'Placed on the Sun–Earth line; the large halo orbit around the Lagrange point is not modelled.')); }
  else if (s.kind === 'deep') renderDeep(body, E, s);
  else if (s.kind === 'comet') renderComet(body, E, s);
  else if (s.kind === 'probe') renderProbe(body, E, s);
  else if (s.kind === 'region') renderRegion(body, E, s);
  else if (s.kind === 'poi') renderPoi(body, E, s);
  else if (s.kind === 'lagrange') { E.textContent = 'Lagrange point'; body.appendChild(el('p', 'lede', s.lag.desc)); body.appendChild(el('p', 'note', 'Lagrange points are where a small body can keep pace with a planet, balanced between its gravity and the Sun\'s. L4 and L5 (60° ahead and behind) are stable; L1, L2 and L3 are not.')); }
  else if (s.kind === 'dwarf') { const d = s.dwarf; E.textContent = 'Dwarf planet · trans-Neptunian'; body.appendChild(el('p', 'lede', d.desc)); kv(sec(body, 'Key facts'), d.facts); body.appendChild(el('p', 'note', 'Placed at its approximate 2026 sky position and distance.')); }
  else if (s.kind === 'probe2') { E.textContent = 'Solar probe · NASA'; body.appendChild(el('p', 'lede', 'The fastest object ever built and the closest to the Sun: on 24 Dec 2024 it passed 6.1 million km above the surface at ≈ 192 km/s, flying through the corona. It repeats that plunge every 88 days.')); const t = sec(body, 'Now', ['model', 'ORBIT MODEL']); teleGrid(t, [['Distance from Sun', () => F.km(Math.hypot(...S.psp.ecl) * O.AU_KM), true], ['Next close approach', () => { const P = 88.0, k = Math.ceil((S.jd - S.psp.Tp) / P); return new Date((S.psp.Tp + k * P - 2440587.5) * 86400000).toUTCString().slice(5, 16); }, true]]); body.appendChild(el('p', 'note', 'Orbit size and timing from mission data (perihelion 0.046 AU, aphelion ≈ 0.73 AU, period 88 days); the orbit\'s orientation is schematic.')); }
  updateTele();
}

function sunGeo() { // geocentric Sun ecliptic longitude, RA/Dec
  const e = S.planets.earth.ecl, lam = Math.atan2(-e[1], -e[0]), eps = 23.43928 * O.D2R;
  return {lam, ra: Math.atan2(Math.sin(lam) * Math.cos(eps), Math.cos(lam)), dec: Math.asin(Math.sin(eps) * Math.sin(lam))};
}
function elong(ecl) { // planet geocentric elongation from Sun (deg, +east)
  const e = S.planets.earth.ecl, gx = ecl[0] - e[0], gy = ecl[1] - e[1];
  let d = (Math.atan2(gy, gx) - sunGeo().lam) * O.R2D; d = ((d + 540) % 360) - 180; return d;
}
function subsolarLat(P) { const toSun = P.sys.position.clone().negate().normalize(); return 90 - Math.acos(Math.max(-1, Math.min(1, toSun.dot(P.pole)))) * O.R2D; }

function renderBody(body, E, s, B) {
  E.textContent = B.kind + (B.parent ? ' · ' + (B.parent === 'sun' ? 'orbits the Sun' : B.parent) : '');
  body.appendChild(el('p', 'lede', B.desc));
  const acts = el('div', 'acts'); body.appendChild(acts);
  if (B.layers) { const b = btn(acts, O.state.cut === s.id ? 'Close slice' : 'Slice open', () => { O.setCutaway(s.id, O.state.cut !== s.id); renderPanel(); }, 'pri' + (O.state.cut === s.id ? ' on' : '')); }
  if (O.state.focus !== s.id) btn(acts, 'Fly here', () => O.flyTo(s.id));
  if (s.id !== 'earth') btn(acts, 'Send light from Earth', () => O.sendLight(s.id));
  if (s.id === 'earth') btn(acts, 'Sky View: look up', () => O.openSkyDefault(), 'pri');
  if (s.id === 'earth') btn(acts, O.layers.satOrbits ? 'Hide satellite orbits' : 'Show satellite orbits', () => { setLayer('satOrbits', !O.layers.satOrbits); renderPanel(); });

  const t = sec(body, 'Now', ['live', 'LIVE']);
  if (s.id === 'sun') {
    teleGrid(t, [['Distance from Earth', () => F.km(Math.hypot(...S.planets.earth.ecl) * O.AU_KM)], ['Light travel time', () => F.lt(Math.hypot(...S.planets.earth.ecl) * O.AU_KM / 299792.458)],
      ['Sun sits over (subsolar point)', () => { const g = sunGeo(), lon = ((g.ra - O.gmst(S.jd)) * O.R2D + 540) % 360 - 180; return `${Math.abs(g.dec * O.R2D).toFixed(2)}° ${g.dec >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`; }, true]]);
    body.appendChild(el('p', 'note', B.now));
  } else {
    const P = S.planets[s.id];
    const rows = [
      ['Distance from Sun', () => { const r = Math.hypot(...P.ecl); return `${r.toFixed(3)} AU`; }],
      ['Distance from Earth', () => s.id === 'earth' ? '—' : F.km(Math.hypot(P.ecl[0] - S.planets.earth.ecl[0], P.ecl[1] - S.planets.earth.ecl[1], P.ecl[2] - S.planets.earth.ecl[2]) * O.AU_KM)],
      ['Orbital speed', () => { const r = Math.hypot(...P.ecl) * O.AU_KM, a = O.planetElements(s.id, S.jd).a * O.AU_KM; return `${Math.sqrt(GM_SUN * (2 / r - 1 / a)).toFixed(2)} km/s`; }],
      ['Signal delay from Earth', () => s.id === 'earth' ? '—' : F.lt(Math.hypot(P.ecl[0] - S.planets.earth.ecl[0], P.ecl[1] - S.planets.earth.ecl[1], P.ecl[2] - S.planets.earth.ecl[2]) * O.AU_KM / 299792.458)],
      ['Subsolar latitude (season)', () => { const l = subsolarLat(P); const hemi = Math.abs(l) < 1.5 ? 'near equinox' : (l > 0 ? 'northern summer' : 'southern summer'); return `${l.toFixed(1)}° · ${hemi}`; }, true]
    ];
    if (s.id !== 'earth') rows.push(['Seen from Earth', () => { const d = elong(P.ecl); const a = Math.abs(d); if (a < 12) return `${a.toFixed(0)}° from the Sun — lost in glare`; return `${a.toFixed(0)}° ${d > 0 ? 'east' : 'west'} of the Sun — ${d > 0 ? 'evening' : 'morning'} sky${a > 170 ? ' (near opposition: up all night)' : ''}`; }, true]);
    if (s.id === 'earth') {
      rows.splice(1, 1); rows.splice(2, 1);
      rows.push(['Sun overhead at', () => { const g = sunGeo(), lon = ((g.ra - O.gmst(S.jd)) * O.R2D + 540) % 360 - 180; return `${Math.abs(g.dec * O.R2D).toFixed(2)}° ${g.dec >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`; }, true]);
      rows.push(['Moon', () => { const m = O.moonEcl(S.jd), lm = Math.atan2(m[1], m[0]); let el2 = ((lm - sunGeo().lam) * O.R2D + 720) % 360; const k = (1 - Math.cos(el2 * O.D2R)) / 2; const nm = el2 < 10 || el2 > 350 ? 'New Moon' : el2 < 80 ? 'Waxing crescent' : el2 < 100 ? 'First quarter' : el2 < 170 ? 'Waxing gibbous' : el2 < 190 ? 'Full Moon' : el2 < 260 ? 'Waning gibbous' : el2 < 280 ? 'Last quarter' : 'Waning crescent'; return `${nm} · ${(k * 100).toFixed(0)}% lit · ${F.n(Math.hypot(...m), 0)} km`; }, true]);
      rows.push(['Satellites tracked', () => S.planets.earth.satsStale ? 'Hidden — sim date too far from TLE epoch' : `${S.planets.earth.sats.filter((x) => x.state).length} live (TLEs ${O.TLE_DATE})`, true]);
    }
    teleGrid(t, rows);
    if (s.id === 'earth') body.appendChild(el('p', 'note', 'Tap anywhere on the globe to inspect that location: local time, Sun elevation and which tracked satellites are overhead.'));
  }

  if (B.layers) {
    const L = sec(body, 'Interior', ['model', 'MODEL']);
    const box = el('div', 'layers'); L.appendChild(box);
    B.layers.slice().reverse().forEach((ly) => {
      const idx = B.layers.indexOf(ly);
      const b = el('button', 'ly' + (O.state.hiLayer === idx && O.state.cut === s.id ? ' on' : ''));
      const sw = el('span', 'sw'); sw.style.background = ly.color; b.appendChild(sw);
      b.appendChild(el('span', 'nm', ly.name)); b.appendChild(el('span', 'tp', ly.temp || ''));
      const dTop = (1 - ly.r1) * B.R, dBot = (1 - ly.r0) * B.R;
      b.appendChild(el('span', 'dp', `${F.n(dTop, 0)}–${F.n(dBot, 0)} km deep`));
      b.appendChild(el('span', 'ds', ly.desc || ''));
      b.addEventListener('click', () => { if (O.state.cut !== s.id) O.setCutaway(s.id, true); O.highlightLayer(idx); renderPanel(); });
      box.appendChild(b);
    });
    L.appendChild(el('p', 'note', 'Layer boundaries from seismology (Earth, Moon, Mars/InSight) and gravity-field models (Juno, Cassini, MESSENGER). Motion in convecting layers is illustrative.'));
  }
  if (B.winds) {
    const W = sec(body, B.winds.label, ['model', 'MODEL']);
    W.appendChild(el('p', '', B.winds.speed)).style.margin = '0 0 4px';
    if (B.winds.profile) W.appendChild(windChart(B.winds.profile));
    W.appendChild(el('p', 'note', B.winds.note + (S.planets[s.id] && S.planets[s.id].gas ? ' Cloud motion in the 3D view uses this profile, time-lapsed to at least 1 hour per second.' : '')));
  }
  if (O.MAG && O.MAG[s.id]) { const m = sec(body, 'Magnetic field', ['model', 'DIPOLE MODEL']); m.appendChild(el('p', '', O.MAG[s.id].field)).style.margin = '0'; const a2 = el('div', 'acts'); m.appendChild(a2); btn(a2, O.layers.magnet ? 'Hide field' : 'Show field' + (s.id === 'earth' ? ' & Van Allen belts' : s.id === 'jupiter' ? ' & Io torus' : ''), () => { O.layers.magnet = !O.layers.magnet; if (O.state.focus !== s.id) O.flyTo(s.id); renderPanel(); O.refreshFocusBar(); }); }
  if (O.POIS && O.POIS[s.id]) { const m = sec(body, 'Explore the surface'); const c = el('div', 'chips'); for (const f of O.POIS[s.id]) { const b = el('button', 'chip', f.name); b.addEventListener('click', () => O.select('poi:' + s.id + ':' + f.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase(), true)); c.appendChild(b); } m.appendChild(c); m.appendChild(el('p', 'note', 'Gold rings on the globe mark these features when you are close. Tap any spot on the surface for a live readout.')); }
  if (s.id === 'venus') { const a2 = el('div', 'acts'); body.appendChild(a2); btn(a2, O.state.radar ? 'Back to cloud view' : 'See the surface (radar view)', () => { O.toggleRadar(!O.state.radar); renderPanel(); }, 'pri'); }
  const ph = sec(body, 'Physical data'); kv(ph, B.facts);
  if (B.features) { const f = sec(body, 'Notable'); const ul = el('ul', 'feat'); for (const [a, b] of B.features) { const li = el('li'); li.appendChild(el('b', '', a + ' — ')); li.appendChild(document.createTextNode(b)); ul.appendChild(li); } f.appendChild(ul); }
  const moons = O.MOONS[s.id];
  if (moons && moons.length) { const m = sec(body, s.id === 'earth' ? 'Moon & orbiters' : 'Major moons shown'); const c = el('div', 'chips'); for (const mm of moons) { const b = el('button', 'chip', mm.name); b.addEventListener('click', () => O.select(mm.id, true)); c.appendChild(b); } if (s.id === 'earth') for (const sat of O.SATS) { const b = el('button', 'chip', sat.name); b.addEventListener('click', () => O.select(sat.id, true)); c.appendChild(b); } m.appendChild(c); }
  O.infoForBody(body, s.id, teleFns);
  body.appendChild(el('p', 'src', 'Positions: JPL approximate Keplerian elements (Standish, valid 1800–2050), IAU rotation models. Physical data: NASA Planetary Fact Sheet. Moon counts as of early 2026.'));
}

function windChart(prof) {
  const w = 320, h = 120, pad = 26;
  const vmax = Math.max(...prof.map((p) => Math.abs(p[1]))) * 1.1;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Zonal wind speed by latitude');
  const x = (v) => pad + (v + vmax) / (2 * vmax) * (w - pad - 8), y = (lat) => 8 + (90 - lat) / 180 * (h - 24);
  const line = (x1, y1, x2, y2, c, dash) => { const l = document.createElementNS(ns, 'line'); l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); l.setAttribute('stroke', c); l.setAttribute('stroke-width', 1); if (dash) l.setAttribute('stroke-dasharray', dash); svg.appendChild(l); };
  const text = (tx, ty, s, anchor) => { const t = document.createElementNS(ns, 'text'); t.setAttribute('x', tx); t.setAttribute('y', ty); t.setAttribute('fill', '#64738f'); t.setAttribute('font-size', '9'); t.setAttribute('font-family', 'IBM Plex Mono, monospace'); t.setAttribute('text-anchor', anchor || 'middle'); t.textContent = s; svg.appendChild(t); };
  for (const lat of [-60, -30, 0, 30, 60]) { line(pad, y(lat), w - 8, y(lat), '#1b2742'); text(pad - 4, y(lat) + 3, (lat > 0 ? lat + 'N' : lat < 0 ? -lat + 'S' : 'EQ'), 'end'); }
  line(x(0), 8, x(0), h - 16, '#2b3c60');
  const step = vmax > 300 ? 200 : vmax > 120 ? 100 : 50;
  for (let v = -Math.floor(vmax / step) * step; v <= vmax; v += step) text(x(v), h - 4, v + (v === 0 ? ' m/s' : ''));
  let d = ''; prof.forEach((p, i) => { d += (i ? 'L' : 'M') + x(p[1]).toFixed(1) + ' ' + y(p[0]).toFixed(1); });
  const area = document.createElementNS(ns, 'path'); area.setAttribute('d', d + `L${x(0)} ${y(prof[prof.length - 1][0])}L${x(0)} ${y(prof[0][0])}Z`); area.setAttribute('fill', 'rgba(255,181,71,0.10)'); svg.appendChild(area);
  const path = document.createElementNS(ns, 'path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#ffb547'); path.setAttribute('stroke-width', 1.5); svg.appendChild(path);
  const box = el('div', 'wind'); box.appendChild(svg);
  const cap = el('p', 'note', 'Eastward (+) / westward (−) wind speed vs latitude, approximate.'); box.appendChild(cap);
  return box;
}

function renderMoon(body, E, s) {
  const m = s.moon.m, P = S.planets[s.parent];
  E.textContent = 'Moon · ' + P.B.name;
  body.appendChild(el('p', 'lede', m.desc));
  const acts = el('div', 'acts'); body.appendChild(acts);
  if (m.layers) btn(acts, O.state.cut === s.id ? 'Close slice' : 'Slice open', () => { O.setCutaway(s.id, O.state.cut !== s.id); renderPanel(); }, 'pri' + (O.state.cut === s.id ? ' on' : ''));
  btn(acts, 'Back to ' + P.B.name, () => O.select(P.id, true));
  btn(acts, 'Send light from Earth', () => O.sendLight(s.id));
  const t = sec(body, 'Now', [m.id === 'moon' || m.galilean !== undefined ? 'live' : 'model', m.id === 'moon' || m.galilean !== undefined ? 'LIVE' : 'PHASE APPROX.']);
  const rows = [['Mean distance', () => F.km(m.a)], ['Orbital period', () => `${Math.abs(m.P).toFixed(3)} days${m.P < 0 ? ' (retrograde)' : ''}`], ['Diameter', () => F.n(m.R * 2, 0) + ' km'], ['Size vs Earth\'s Moon', () => (m.R / 1737.4).toFixed(2) + '×']];
  if (m.id === 'moon') rows.unshift(['Distance now', () => F.km(Math.hypot(...O.moonEcl(S.jd)))], ['Phase', () => { const mm = O.moonEcl(S.jd), lm = Math.atan2(mm[1], mm[0]); let e2 = ((lm - sunGeo().lam) * O.R2D + 720) % 360; return `${((1 - Math.cos(e2 * O.D2R)) / 2 * 100).toFixed(0)}% illuminated`; }]);
  teleGrid(t, rows);
  if (m.galilean !== undefined) body.appendChild(el('p', 'note', 'Position from Meeus\' Galilean-moon theory (low precision).'));
  else if (m.id !== 'moon') body.appendChild(el('p', 'note', 'Orbit size and period are real; the moon\'s current position along its orbit is approximate.'));
  if (m.facts) { const ph = sec(body, 'Physical data'); kv(ph, m.facts); }
  O._teleFns = teleFns; O.infoForMoon(body, m);
  if (O.POIS && O.POIS[m.id]) { const sx = sec(body, 'Explore the surface'); const c = el('div', 'chips'); for (const f of O.POIS[m.id]) { const b = el('button', 'chip', f.name); b.addEventListener('click', () => O.select('poi:' + m.id + ':' + f.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase(), true)); c.appendChild(b); } sx.appendChild(c); }
  if (m.layers) { const L = sec(body, 'Interior', ['model', 'MODEL']); const box = el('div', 'layers'); L.appendChild(box); m.layers.slice().reverse().forEach((ly) => { const idx = m.layers.indexOf(ly); const b = el('button', 'ly'); const sw = el('span', 'sw'); sw.style.background = ly.color; b.appendChild(sw); b.appendChild(el('span', 'nm', ly.name)); b.appendChild(el('span', 'tp', ly.temp || '')); b.appendChild(el('span', 'ds', ly.desc || '')); b.addEventListener('click', () => { if (O.state.cut !== s.id) O.setCutaway(s.id, true); O.highlightLayer(idx); b.classList.toggle('on'); }); box.appendChild(b); }); }
}

function renderSat(body, E, s) {
  const sat = s.sat, d = sat.s;
  E.textContent = d.type + ' · ' + d.op;
  body.appendChild(el('p', 'lede', d.desc));
  const acts = el('div', 'acts'); body.appendChild(acts);
  btn(acts, 'Follow', () => O.flyTo(s.id), 'pri'); btn(acts, 'Back to Earth', () => O.select('earth', true));
  btn(acts, 'When can I see it?', () => O.openSkyDefault());
  const t = sec(body, 'Now', ['live', 'LIVE · SGP4']);
  teleGrid(t, [
    ['Latitude', () => sat.state ? `${Math.abs(sat.state.lat).toFixed(3)}° ${sat.state.lat >= 0 ? 'N' : 'S'}` : '—'],
    ['Longitude', () => sat.state ? `${Math.abs(sat.state.lon).toFixed(3)}° ${sat.state.lon >= 0 ? 'E' : 'W'}` : '—'],
    ['Altitude', () => sat.state ? `${F.n(sat.state.alt, 1)} km` : '—'],
    ['Speed', () => sat.state ? `${sat.state.speed.toFixed(3)} km/s · ${F.n(sat.state.speed * 3600, 0)} km/h` : '—'],
    ['Orbital period', () => sat.state ? `${sat.state.periodMin.toFixed(1)} min` : '—'],
    ['Inclination', () => (sat.rec.inclo * O.R2D).toFixed(2) + '°'],
    ['Over', () => sat.state ? (countryAt(sat.state.lat, sat.state.lon) || oceanName(sat.state.lat, sat.state.lon)) : '—', true],
    ['Illumination', () => sat.state ? (inShadow(sat) ? 'In Earth\'s shadow (eclipse)' : 'Sunlit') : '—'],
    ['Orbit class', () => { const a = sat.state ? sat.state.alt : 0; return a < 2000 ? 'LEO' : a < 35000 ? 'MEO' : 'GEO'; }]
  ]);
  body.appendChild(el('p', 'note', `Propagated live with SGP4 from NORAD two-line elements dated ${O.TLE_DATE}. Accuracy degrades by a few km per day from that date; positions are hidden if the simulated date drifts more than 45 days away. The dashed line on the globe is the ground track (−1 to +2 orbits).`));
  O.infoForSat(body, d.id);
  const tle = sec(body, 'Two-line element set'); const pre = el('pre', 'mono'); pre.style.cssText = 'font-size:10.5px;color:#9dabc4;white-space:pre;overflow-x:auto;margin:0;padding:8px;background:rgba(0,0,0,.25);border:1px solid #1b2742'; pre.textContent = d.l1 + '\n' + d.l2; tle.appendChild(pre);
}
function inShadow(sat) {
  const g = sunGeo(); const s = [Math.cos(g.dec) * Math.cos(g.ra), Math.cos(g.dec) * Math.sin(g.ra), Math.sin(g.dec)];
  const p = satellite.propagate(sat.rec, new Date((S.jd - 2440587.5) * 86400000)).position; if (!p) return false;
  const dp = p.x * s[0] + p.y * s[1] + p.z * s[2]; if (dp > 0) return false;
  const perp = Math.hypot(p.x - dp * s[0], p.y - dp * s[1], p.z - dp * s[2]); return perp < 6371;
}
function pip(pt, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) c = !c; } return c; }
function countryAt(lat, lon) {
  if (!O.countryFeatures) return null;
  for (const f of O.countryFeatures) {
    const g = f.geometry; if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) { if (pip([lon, lat], poly[0]) && !poly.slice(1).some((h) => pip([lon, lat], h))) return f.properties.name; }
  }
  return null;
}
O.countryAt = countryAt;
O.oceanName = (a, b) => oceanName(a, b);
function oceanName(lat, lon) {
  if (lat < -60) return 'Southern Ocean'; if (lat > 66) return 'Arctic Ocean';
  if (lon > 20 && lon < 120 && lat < 30) return 'Indian Ocean';
  if ((lon > -70 && lon < 20) || (lon > -100 && lon < -70 && lat > 10)) return 'Atlantic Ocean';
  return 'Pacific Ocean';
}

function renderPlace(body, E, T) {
  const pl = O.state.place, B = S.objects[pl.body];
  E.textContent = 'Surface point · ' + B.label;
  T.textContent = pl.name;
  const t = sec(body, 'Now at this spot', ['live', 'LIVE']);
  const rows = O.placeRows(pl.body, pl.lat, pl.lon);
  if (pl.body === 'earth') rows.push(['Satellites above horizon', () => overhead(pl.lat, pl.lon), true]);
  teleGrid(t, rows);
  body.appendChild(el('p', 'note', 'Local solar time is apparent solar time at this longitude (where the Sun actually is), not a civil time zone.' + (pl.body === 'earth' ? ' "Above horizon" checks only the satellites tracked here.' : '')));
  const n = O.nearestPOI(pl.body, pl.lat, pl.lon);
  if (n && n.km < 1500) { const f = sec(body, n.f.name); f.appendChild(el('p', 'lede', n.f.desc)).style.marginTop = '0'; }
  const acts = el('div', 'acts'); body.appendChild(acts);
  if (pl.body === 'earth') btn(acts, 'Look up from here', () => O.openSky(pl.lat, pl.lon, pl.name), 'pri');
  btn(acts, 'Back to ' + B.label, () => O.select(pl.body, false));
}
function renderPoi(body, E, s) {
  const q = s.poi, f = q.f, B = S.objects[q.body];
  E.textContent = f.type + ' · ' + B.label;
  body.appendChild(el('p', 'lede', f.desc));
  const t = sec(body, 'Now at this spot', ['live', 'LIVE']);
  teleGrid(t, O.placeRows(q.body, f.lat, f.lon).filter((r) => r[0] !== 'Nearest named feature'));
  if (f.facts.length) kv(sec(body, 'Key facts'), f.facts);
  const others = (O.POIS[q.body] || []).filter((x) => x !== f);
  if (others.length) { const m = sec(body, 'More on ' + B.label); const c = el('div', 'chips'); for (const o of others) { const b = el('button', 'chip', o.name); b.addEventListener('click', () => O.select('poi:' + q.body + ':' + o.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase(), true)); c.appendChild(b); } m.appendChild(c); }
  const acts = el('div', 'acts'); body.appendChild(acts);
  if (q.body === 'earth') btn(acts, 'Look up from here', () => O.openSky(f.lat, f.lon, f.name), 'pri');
  btn(acts, 'Back to ' + B.label, () => O.select(q.body, true));
}
function overhead(lat, lon) {
  const P = S.planets.earth; if (P.satsStale) return '—';
  const obs = {latitude: lat * O.D2R, longitude: lon * O.D2R, height: 0};
  const date = new Date((S.jd - 2440587.5) * 86400000), gm = satellite.gstime(date), out = [];
  for (const q of P.sats) { if (!q.rec) continue; const pv = satellite.propagate(q.rec, date); if (!pv.position) continue; const ecf = satellite.eciToEcf(pv.position, gm); const la = satellite.ecfToLookAngles(obs, ecf); if (la.elevation > 0) out.push(`${q.s.name} ${(la.elevation * O.R2D).toFixed(0)}°`); }
  return out.length ? out.join(' · ') : 'None of the tracked satellites right now';
}

function renderDeep(body, E, s) {
  const Dn = s.deep, D = Dn.D;
  E.textContent = D.kind;
  body.appendChild(el('p', 'lede', D.desc));
  const acts = el('div', 'acts'); body.appendChild(acts);
  if (D.sim === 'supernova') btn(acts, 'Run supernova sequence', () => O.runSupernova(), 'pri');
  if (D.sim === 'merger') btn(acts, 'Run merger simulation', () => O.startSim('merger'), 'pri');
  if (D.sim === 'sandbox') btn(acts, 'Open gravity sandbox', () => O.startSim('sandbox', D.name), 'pri');
  if (O.state.focus !== s.id) btn(acts, 'Fly here', () => O.flyTo(s.id));
  btn(acts, 'Send light from Earth', () => O.sendLight(s.id));
  const t = sec(body, 'Distance');
  const lyTxt = D.lyText || F.ly(D.ly);
  teleGrid(t, [['From the Sun', () => lyTxt, true], ['Light we see left it', () => { if (D.lyText) return '≈ 10.8 billion years ago — before the Sun formed'; const yr = new Date((S.jd - 2440587.5) * 86400000).getUTCFullYear() - D.ly; return yr > -10000 ? (yr > 0 ? `around ${Math.round(yr)} CE` : `around ${Math.round(-yr)} BCE`) : `${F.ly(D.ly).replace(' ly', '')} years ago`; }, true], ['Sky position (J2000)', () => `RA ${(D.ra / 15).toFixed(2)} h · Dec ${D.dec >= 0 ? '+' : ''}${D.dec.toFixed(2)}°`, true]]);
  const f = sec(body, 'Key facts'); kv(f, D.facts);
  if (Dn.timelapse) body.appendChild(el('p', 'note', Dn.timelapse + '.'));
  if (Dn.note) body.appendChild(el('p', 'note', Dn.note));
  O.infoForDeep(body, D.id);
  body.appendChild(el('p', 'src', 'Shown in its true direction on the sky. Distance is plotted on a logarithmic scale and the object is magnified so it can be seen; shapes are artistic models built from published measurements.'));
}
function renderComet(body, E, s) {
  E.textContent = 'Periodic comet · Halley-type';
  body.appendChild(el('p', 'lede', 'The most famous comet: a 15 km nucleus of ice and dust on a 75–76-year retrograde orbit. It reached aphelion, beyond Neptune\'s orbit, in December 2023 and is now falling back toward its next perihelion on 28 July 2061.'));
  const t = sec(body, 'Now', ['live', 'LIVE']);
  teleGrid(t, [['Distance from Sun', () => Math.hypot(...S.comet.ecl).toFixed(2) + ' AU'], ['Distance from Earth', () => (Math.hypot(S.comet.ecl[0] - S.planets.earth.ecl[0], S.comet.ecl[1] - S.planets.earth.ecl[1], S.comet.ecl[2] - S.planets.earth.ecl[2])).toFixed(2) + ' AU'], ['Last perihelion', () => '9 Feb 1986'], ['Next perihelion', () => '28 Jul 2061']]);
  kv(sec(body, 'Orbit'), [['Period', '≈ 75.3 years'], ['Eccentricity', '0.967'], ['Inclination', '162° (retrograde)'], ['Perihelion', '0.586 AU'], ['Aphelion', '≈ 35 AU'], ['Meteor showers', 'Eta Aquariids (May) and Orionids (October)']]);
  body.appendChild(el('p', 'note', 'Orbit from osculating elements at the 1986 perihelion; planetary perturbations shift the real position somewhat.'));
}
function renderProbe(body, E, s) {
  const P = s.probe, p = P.p;
  E.textContent = 'Interstellar spacecraft · NASA';
  body.appendChild(el('p', 'lede', p.desc));
  const t = sec(body, 'Now', ['model', 'ESTIMATED']);
  const pa = el('div', 'acts'); body.insertBefore(pa, t); btn(pa, 'Send light from Earth', () => O.sendLight(s.id));
  teleGrid(t, [['Distance from Sun', () => `${P.au.toFixed(1)} AU · ${F.km(P.au * O.AU_KM)}`, true], ['One-way radio delay', () => F.lt(P.au * O.AU_KM / 299792.458), true], ['Launched', () => p.launch], ['Speed (vs Sun)', () => `≈ ${(p.v * O.AU_KM / 31557600).toFixed(1)} km/s`]]);
  body.appendChild(el('p', 'note', 'Distance extrapolated from published 2024 values; direction from its outbound asymptote.'));
}
const REGIONS = {
  belt: ['Asteroid Belt', 'Region · 2.1–3.3 AU', 'Over a million asteroids larger than 1 km orbit between Mars and Jupiter — but their combined mass is only ≈ 3% of the Moon\'s, a third of it in the dwarf planet Ceres. The gaps in the particle field are the Kirkwood gaps, cleared by orbital resonances with Jupiter. The two clumps riding Jupiter\'s orbit 60° ahead and behind are the Trojans.'],
  kuiper: ['Kuiper Belt', 'Region · ≈ 30–50 AU', 'A disk of icy bodies beyond Neptune, home to Pluto, Eris, Haumea, Makemake and Arrokoth (visited by New Horizons in 2019). The denser ring near 39.4 AU are the plutinos, locked in a 3:2 resonance with Neptune.'],
  helio: ['Heliopause', 'Boundary · ≈ 120 AU', 'Where the solar wind meets the interstellar medium — the edge of the Sun\'s bubble. The inner shell is the termination shock (≈ 90 AU), where the solar wind drops below sound speed. Voyager 1 crossed the heliopause in 2012 and Voyager 2 in 2018.'],
  oort: ['Oort Cloud', 'Hypothesised · ≈ 2,000–100,000+ AU', 'A vast spherical reservoir of trillions of icy bodies thought to be the source of long-period comets. It has never been directly observed. Its outer edge may reach a third of the way to Proxima Centauri. Drawn here schematically.']
};
function renderRegion(body, E, s) { const r = REGIONS[s.region]; E.textContent = r[1]; $('#pTitle').textContent = r[0]; body.appendChild(el('p', 'lede', r[2])); }

function updateTele() { for (const f of teleFns) f(); }
O.rerender = () => renderPanel();
O.updateTele = updateTele;

/* ---------------- cutaway ---------------- */
O.setCutaway = function (id, on) {
  const p = S.objects[id]; if (!p) return;
  let mesh, layers, holder, P = null;
  if (p.kind === 'planet') { P = p.planet; mesh = P.mesh; layers = P.B.layers; holder = P; }
  else if (p.kind === 'sun') { mesh = S.sun.mesh; layers = O.BODIES.sun.layers; holder = S.sun; }
  else if (p.kind === 'moon') { mesh = p.moon.mesh; layers = p.moon.m.layers; holder = p.moon; }
  if (!mesh || !layers) return;
  if (on) {
    if (O.state.cut && O.state.cut !== id) O.setCutaway(O.state.cut, false);
    holder._geo = mesh.geometry;
    const seg = mesh.geometry.parameters ? mesh.geometry.parameters.widthSegments : 96;
    const half = O.state.cutMode === 'half';
    mesh.geometry = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.62), 0, half ? Math.PI : Math.PI * 1.5);
    const im = O.interiorMaterial(layers);
    let faces;
    if (half) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.999, 160), im); faces = [f]; holder._gapDir = new V3(0, 0, -1); }
    else {
      const f1 = new THREE.Mesh(new THREE.CircleGeometry(0.999, 96, Math.PI / 2, Math.PI), im);
      const f2 = new THREE.Mesh(new THREE.CircleGeometry(0.999, 96, Math.PI / 2, Math.PI), im); f2.rotation.y = -Math.PI / 2;
      faces = [f1, f2]; holder._gapDir = new V3(-1, 0, -1).normalize();
    }
    for (const f of faces) mesh.add(f);
    holder._faces = faces; holder._im = im; holder.cutaway = true;
    if (mesh.material.side !== undefined) { holder._side = mesh.material.side; mesh.material.side = THREE.DoubleSide; }
    if (P) { if (P.clouds) P.clouds.visible = false; if (P.atmo) P.atmo.visible = false; }
    if (p.kind === 'sun') { S.sun.glow1.visible = false; S.sun.prom.visible = false; }
    // turn the opening toward the camera (rotate around the body's spin axis)
    const container = p.kind === 'planet' ? P.tilt : mesh;
    container.updateMatrixWorld();
    const wpos = container.getWorldPosition(new V3());
    const axis = new V3(0, 1, 0).applyQuaternion(container.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const gap = holder._gapDir.clone().applyQuaternion(container.getWorldQuaternion(new THREE.Quaternion()));
    const toCam = new V3().subVectors(S.camera.position, wpos);
    const proj = (v) => v.clone().sub(axis.clone().multiplyScalar(v.dot(axis))).normalize();
    const a = proj(gap), b = proj(toCam);
    let ang = Math.acos(Math.max(-1, Math.min(1, a.dot(b)))); if (new V3().crossVectors(a, b).dot(axis) < 0) ang = -ang;
    const rot = new THREE.Quaternion().setFromAxisAngle(axis, ang);
    container.quaternion.premultiply(rot);
    holder._container = container;
    O.state.cut = id; O.state.hiLayer = -1;
    O.toast && O.toast('Sliced open: tap a layer, or switch between Wedge and Half in the toolbar');
  } else {
    if (holder._geo) { mesh.geometry.dispose(); mesh.geometry = holder._geo; }
    for (const f of holder._faces || []) mesh.remove(f);
    if (holder._side !== undefined) mesh.material.side = holder._side;
    holder.cutaway = false; holder._faces = null; holder._container = null;
    if (P) { if (P.clouds) P.clouds.visible = true; if (P.atmo) P.atmo.visible = true; }
    if (p.kind === 'sun') { S.sun.glow1.visible = true; S.sun.prom.visible = true; }
    if (O.state.cut === id) O.state.cut = null;
    O.state.hiLayer = -1;
  }
};
O.highlightLayer = function (idx) {
  O.state.hiLayer = idx;
  const p = S.objects[O.state.cut]; if (!p) return;
  const h = p.kind === 'planet' ? p.planet : p.kind === 'sun' ? S.sun : p.moon;
  if (h && h._im) h._im.uniforms.uHi.value = idx;
};

/* ---------------- labels ---------------- */
const labelEls = new Map();
function labelFor(p) {
  let e = labelEls.get(p.id);
  if (!e) {
    e = el('div', 'lb ' + (p.kind === 'planet' || p.kind === 'sun' ? 'planet' : p.kind === 'moon' || p.kind === 'dwarf' ? 'moon' : p.kind === 'sat' || p.kind === 'lpoint' ? 'sat' : p.kind === 'deep' ? 'deep' : p.kind === 'poi' ? 'poi' : p.kind === 'lagrange' ? 'lag' : ''), p.label);
    if (p.kind === 'planet') { const sub = el('span', 'sub', ''); e.appendChild(sub); e._sub = sub; }
    $('#labels').appendChild(e); labelEls.set(p.id, e);
  }
  return e;
}
const proj = new V3(), wp = new V3();
O.screenInfo = function (p, W, H) {
  p.obj.getWorldPosition(wp);
  proj.copy(wp).project(S.camera);
  if (proj.z > 1 || proj.z < -1) return null;
  const x = (proj.x * 0.5 + 0.5) * W, y = (-proj.y * 0.5 + 0.5) * H;
  const dist = S.camera.position.distanceTo(wp);
  const r = p.radiusFn ? p.radiusFn() : 0;
  const rPx = r / (dist * Math.tan(S.camera.fov * Math.PI / 360)) * H / 2;
  return {x, y, rPx, dist, wp: wp.clone()};
};
function occluded(p, info) {
  const par = p.parent && S.objects[p.parent];
  if (!par || (!par.planet && !par.moon)) return false;
  const c = par.planet ? par.planet.sys.position : par.moon.mesh.getWorldPosition(new V3()), R = par.planet ? par.planet.tilt.scale.x : par.moon.mesh.scale.x;
  const cam = S.camera.position, d = new V3().subVectors(info.wp, cam), L = d.length(); d.normalize();
  const oc = new V3().subVectors(cam, c), b = oc.dot(d), cc = oc.lengthSq() - R * R, disc = b * b - cc;
  if (disc < 0) return false;
  const t = -b - Math.sqrt(disc); return t > 0 && t < L;
}
function behindFocus(p, info) {
  const f = O.state.focus && O.bodyHolder && O.bodyHolder(O.state.focus);
  if (!f || p.id === O.state.focus || p.parent === O.state.focus && p.kind === 'poi') return false;
  const c = f.center(), R = f.renderR(), cam = S.camera.position, d = new V3().subVectors(info.wp, cam), L = d.length(); d.normalize();
  const oc = new V3().subVectors(cam, c), b = oc.dot(d), cc = oc.lengthSq() - R * R, disc = b * b - cc;
  if (disc < 0) return false; const t = -b - Math.sqrt(disc); return t > 0 && t < L;
}
function labelVisible(p, info) {
  if (behindFocus(p, info)) return false;
  if (!O.layers.labels && p.id !== O.state.selected) return false;
  if (p.nolabel) return false;
  const cam = S.camera.position, camR = cam.length();
  if (p.kind === 'planet' || p.kind === 'sun') return camR < 3500 || p.id === O.state.selected;
  if (p.kind === 'moon') { const P = S.planets[p.parent]; const dd = cam.distanceTo(P.sys.position); return dd < P.r * 120 && info.rPx < 2000; }
  if (p.kind === 'sat' || p.kind === 'lpoint') { const P = S.planets.earth; return O.layers.sats && p.obj.visible && cam.distanceTo(P.sys.position) < P.r * 45; }
  if (p.kind === 'deep') return O.layers.deep && (info.dist < 2400 || camR > 700 || p.id === O.state.selected);
  if (p.kind === 'probe' || p.kind === 'comet' || p.kind === 'probe2' || p.kind === 'dwarf') return camR < 3500;
  if (p.kind === 'poi') return O.poiActive(p.poi);
  if (p.kind === 'lagrange') return O.layers.lagrange && (info.dist < 160 || p.id === O.state.selected);
  return true;
}
O.updateLabels = function () {
  const W = S.W, H = S.H, sel = O.state.selected;
  if (O.SKY && O.SKY.active) { for (const e of labelEls.values()) e.style.display = 'none'; $('#reticle').style.display = 'none'; return; }
  const used = [];
  for (const p of S.picks) {
    const info = O.screenInfo(p, W, H);
    let show = info && labelVisible(p, info) && !occluded(p, info) && info.x > -50 && info.x < W + 50 && info.y > -20 && info.y < H + 20;
    if (O.SIM.active) show = false;
    const e = show ? labelFor(p) : labelEls.get(p.id);
    if (!e) continue;
    if (!show) { e.style.display = 'none'; continue; }
    // de-clutter: skip if colliding with a higher-priority label already placed
    const ly = info.y + Math.max(4, Math.min(info.rPx, H * 0.4));
    const pri = p.id === sel ? 0 : p.kind === 'planet' || p.kind === 'sun' ? 1 : 2;
    const w = p.label.length * 6.5;
    if (pri > 0 && used.some((u) => Math.abs(u.x - info.x) < (u.w + w) / 2 && Math.abs(u.y - ly) < 14)) { e.style.display = 'none'; continue; }
    used.push({x: info.x, y: ly, w});
    e.style.display = 'block';
    e.style.transform = `translate(${info.x.toFixed(1)}px,${ly.toFixed(1)}px) translate(-50%,0)`;
    e.classList.toggle('sel', p.id === sel);
    if (e._sub) { if (O.layers.dist && p.id !== 'earth' && info.rPx < 40) { if ((S.frameN || 0) % 20 === 0 || !e._sub.textContent) e._sub.textContent = O.quickStats(p).split(' · ')[1] || ''; e._sub.style.display = 'block'; } else e._sub.style.display = 'none'; }
  }
  // reticle
  const r = $('#reticle'), sp = sel && S.objects[sel];
  if (sp && !O.SIM.active) {
    const info = O.screenInfo(sp, W, H);
    if (info) { const sz = Math.max(26, Math.min(info.rPx * 2.3, Math.min(W, H) * 0.9)); r.style.display = 'block'; r.style.width = r.style.height = sz + 'px'; r.style.transform = `translate(${(info.x - sz / 2).toFixed(1)}px,${(info.y - sz / 2).toFixed(1)}px)`; }
    else r.style.display = 'none';
  } else r.style.display = 'none';
};

/* ---------------- picking ---------------- */
O.pickAt = function (x, y) {
  const W = S.W, H = S.H; let best = null, bestScore = 1e9;
  for (const p of S.picks) {
    if (p.nolabel) continue;
    if (p.kind === 'deep' && !O.layers.deep) continue;
    if ((p.kind === 'sat' || p.kind === 'lpoint') && (!O.layers.sats || !p.obj.visible)) continue;
    if (p.kind === 'poi' && !O.poiActive(p.poi)) continue;
    if (p.kind === 'lagrange' && !O.layers.lagrange) continue;
    const info = O.screenInfo(p, W, H); if (!info) continue;
    if (occluded(p, info)) continue;
    const d = Math.hypot(info.x - x, info.y - y), thr = Math.max(16, info.rPx);
    if (d > thr) continue;
    const score = d / thr + (info.rPx > 40 ? 0.6 : 0) - (p.kind === 'sat' || p.kind === 'poi' ? 0.25 : 0);
    if (score < bestScore) { bestScore = score; best = p; }
  }
  return best;
};
const ray = new THREE.Raycaster();
O.raycastMesh = function (mesh, x, y) {
  ray.setFromCamera({x: x / S.W * 2 - 1, y: -(y / S.H) * 2 + 1}, S.camera);
  const hit = ray.intersectObject(mesh, true); return hit[0] || null;
};

O.onTap = function (x, y) {
  if (O.SIM.active) return;
  // cutaway layer pick
  if (O.state.cut) {
    const p = S.objects[O.state.cut], h = p.kind === 'planet' ? p.planet : p.kind === 'sun' ? S.sun : p.moon;
    if (h && h._faces) {
      ray.setFromCamera({x: x / S.W * 2 - 1, y: -(y / S.H) * 2 + 1}, S.camera);
      const hit = ray.intersectObjects(h._faces, false)[0];
      if (hit && hit.uv) {
        const r = Math.hypot(hit.uv.x - 0.5, hit.uv.y - 0.5) * 2;
        const layers = p.kind === 'moon' ? p.moon.m.layers : O.BODIES[p.id].layers;
        const idx = layers.findIndex((L) => r >= L.r0 && r <= L.r1);
        if (idx >= 0) { O.highlightLayer(idx); renderPanel(); const ly = document.querySelectorAll('#pBody .ly'); ly.forEach((b) => b.classList.remove('on')); const target = ly[layers.length - 1 - idx]; if (target) { target.classList.add('on'); target.scrollIntoView({block: 'nearest', behavior: 'smooth'}); } return; }
      }
    }
  }
  const p = O.pickAt(x, y);
  // surface inspect on the focused world (any planet or moon)
  const fid = O.state.focus, h = fid && O.bodyHolder && O.bodyHolder(fid);
  if (h && (!p || p.id === fid) && !O.state.cut) {
    const info = O.screenInfo(S.objects[fid], S.W, S.H);
    if (info && h.renderR() / (info.dist * Math.tan(S.camera.fov * Math.PI / 360)) * S.H / 2 > 50) {
      const hit = O.raycastMesh(h.mesh, x, y);
      if (hit) {
        const lp = h.container.worldToLocal(hit.point.clone()).normalize();
        const lat = Math.asin(lp.y) * O.R2D, lon = Math.atan2(-lp.z, lp.x) * O.R2D;
        const n = O.nearestPOI(fid, lat, lon);
        let name = fid === 'earth' ? (countryAt(lat, lon) || oceanName(lat, lon)) : (n && n.km < 600 ? 'Near ' + n.f.name : (O.bandAt(fid, lat) || S.objects[fid].label + ' surface'));
        O.state.selected = fid;
        O.state.place = {body: fid, lat, lon, name};
        renderPanel(); crumbs(); markTree();
        dropPin(h, lp);
        return;
      }
    }
  }
  if (p) O.select(p.id, true);
};
O.onDbl = function (x, y) { const p = O.pickAt(x, y); if (p) O.select(p.id, true); };
function dropPin(h, loc) {
  if (!S.pin) { S.pin = new THREE.Sprite(new THREE.SpriteMaterial({map: O.glowTexture('rgba(255,210,140,1)', 'rgba(255,170,60,0.35)', 64), sizeAttenuation: false, depthWrite: false, transparent: true})); S.pin.scale.setScalar(0.03); }
  h.container.add(S.pin); S.pin.position.copy(loc).multiplyScalar(1.006); S.pin.visible = true;
}

O.onHover = function (x, y) {
  const tip = $('#tip'), cv = $('#stage');
  if (x < 0 || O.SIM.active) { tip.style.display = 'none'; return; }
  const p = O.pickAt(x, y);
  if (p) { tip.innerHTML = ''; tip.appendChild(el('small', '', p.kind === 'deep' ? p.deep.D.group : p.kind === 'poi' ? 'surface feature' : p.kind === 'probe2' ? 'spacecraft' : p.kind === 'dwarf' ? 'dwarf planet' : p.kind)); tip.appendChild(document.createTextNode(p.label)); const qs = O.quickStats(p); if (qs) tip.appendChild(el('span', 'st', qs)); tip.style.display = 'block'; tip.style.left = Math.min(x, S.W - 260) + 'px'; tip.style.top = y + 'px'; cv.classList.add('pointer'); }
  else { tip.style.display = 'none'; cv.classList.remove('pointer'); }
};

/* ---------------- time controls ---------------- */
const RATES = [-31557600, -2592000, -604800, -86400, -3600, -60, 1, 60, 600, 3600, 86400, 604800, 2592000, 31557600];
const RATE_LABEL = {'-31557600': '−1 yr/s', '-2592000': '−30 d/s', '-604800': '−1 wk/s', '-86400': '−1 day/s', '-3600': '−1 h/s', '-60': '−1 min/s', '1': 'Real time', '60': '1 min/s', '600': '10 min/s', '3600': '1 h/s', '86400': '1 day/s', '604800': '1 wk/s', '2592000': '30 d/s', '31557600': '1 yr/s'};
O.time = {rate: 1, paused: false, simMs: Date.now()};
O.realJD = () => O.jd(Date.now());
function setRate(i) { O.time.rate = RATES[i]; O.time.paused = false; $('#tRate').textContent = RATE_LABEL[RATES[i]]; playIcon(); }
function playIcon() { $('#tPlay').innerHTML = O.time.paused ? '<svg width="11" height="12" viewBox="0 0 11 12"><path d="M0 0l11 6-11 6z" fill="currentColor"/></svg>' : '<svg width="10" height="12" viewBox="0 0 10 12"><rect width="3.4" height="12" fill="currentColor"/><rect x="6.6" width="3.4" height="12" fill="currentColor"/></svg>'; if (O.time.paused) $('#tRate').textContent = 'Paused'; else $('#tRate').textContent = RATE_LABEL[O.time.rate]; }
function liveTag() {
  const t = $('#liveTag'), off = (O.time.simMs - Date.now()) / 1000;
  const live = Math.abs(off) < 5 && O.time.rate === 1 && !O.time.paused;
  t.classList.toggle('sim', !live);
  if (live) t.textContent = 'LIVE';
  else { const a = Math.abs(off); const s = a < 120 ? `${a.toFixed(0)} s` : a < 7200 ? `${(a / 60).toFixed(0)} min` : a < 172800 ? `${(a / 3600).toFixed(1)} h` : a < 63072000 ? `${(a / 86400).toFixed(0)} d` : `${(a / 31557600).toFixed(1)} yr`; t.textContent = (off >= 0 ? '+' : '−') + s; }
}
function clocks() {
  const d = new Date(O.time.simMs);
  $('#clkUTC').textContent = d.toISOString().slice(0, 10) + ' ' + d.toISOString().slice(11, 19);
  let tz = 'local'; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace('_', ' '); } catch (e) {}
  $('#clkLocal').textContent = d.toLocaleString('en-GB', {hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short', year: 'numeric'}) + ' · ' + tz;
}

/* ---------------- layers ---------------- */
const LAYER_DEF = [['orbits', 'Orbits'], ['labels', 'Labels'], ['dist', 'Distances'], ['features', 'Surface features'], ['magnet', 'Magnetic fields'], ['lagrange', 'Lagrange pts'], ['sats', 'Satellites'], ['satOrbits', 'Sat orbits'], ['shell', 'Starlink shell'], ['belts', 'Belts'], ['helio', 'Heliosphere'], ['deep', 'Deep sky'], ['constel', 'Constellations']];
function setLayer(k, v) { O.layers[k] = v; O.refreshFocusBar && O.refreshFocusBar(); document.querySelectorAll('#layerSeg button').forEach((b) => b.classList.toggle('on', O.layers[b.dataset.k])); applyLayers(); if (k === 'shell' && v) O.toast('Starlink shell: an illustrative 53°/550 km distribution, not real positions'); }
function applyLayers() {
  for (const id of O.PLANET_ORDER) { const P = S.planets[id]; P.orbit.visible = O.layers.orbits; for (const M of P.moons) M.orbit.visible = O.layers.orbits; }
  S.comet.orbit.visible = O.layers.orbits;
  for (const b of [S.belt, S.kuiper, S.trojans]) b.visible = O.layers.belts;
  S.constLines.visible = O.layers.constel; S.bright.visible = true;
  for (const pr of S.probes) pr.line.visible = O.layers.orbits;
}
O.applyLayers = applyLayers;

/* ---------------- toast ---------------- */
let toastT = 0;
O.toast = function (msg) { const L = $('#loading'); L.textContent = msg; L.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { if (!O._loadingBusy) L.hidden = true; }, 3200); };

/* ---------------- sims UI ---------------- */
O.startSim = function (name, opt) {
  if (O.SIM.active) O.stopSim();
  if (O.tourStop) O.tourStop();
  if (O.SKY && O.SKY.active) O.closeSky();
  if (O.activeSN) O.closeSN();
  if (O.state.cut) O.setCutaway(O.state.cut, false);
  const sim = O.SIM.make(name, opt);
  O.SIM.active = sim;
  O._savedRig = {theta: O.rig.theta, phi: O.rig.phi, dist: O.rig.dist, focus: O.state.focus, minDist: O.rig.minDist};
  O.rig.minDist = 0.5; O.rig.focusFn = () => new V3(); O.rig.target.set(0, 0, 0); O.rig.pan.set(0, 0, 0); O.rig.fly = null;
  O.rig.dist = sim.cam.dist; O.rig.phi = sim.cam.phi; O.rig.theta = sim.cam.theta;
  const bar = $('#simbar'); bar.hidden = false;
  $('#simTitle').textContent = sim.title; $('#simBlurb').textContent = sim.blurb;
  const ctl = $('#simCtl'); ctl.innerHTML = '';
  const pp = btn(ctl, 'Pause', () => { sim.state.playing = !sim.state.playing; pp.textContent = sim.state.playing ? 'Pause' : 'Play'; });
  const lab = el('label', 'note', 'Speed '); lab.style.margin = '0 4px'; const rg = el('input'); rg.type = 'range'; rg.min = '0.25'; rg.max = '4'; rg.step = '0.25'; rg.value = '1'; rg.id = 'simSpeed'; rg.addEventListener('input', () => sim.state.speed = +rg.value); lab.appendChild(rg); ctl.appendChild(lab);
  for (const c of sim.controls) {
    const b = btn(ctl, c.label, () => { if (c.toggle) { sim.state[c.toggle] = c.id; ctl.querySelectorAll('[data-tg]').forEach((x) => x.classList.toggle('on', x.dataset.id === c.id)); } else c.fn(); }, c.toggle ? 'pri' : '');
    if (c.toggle) { b.dataset.tg = 1; b.dataset.id = c.id; if (sim.state[c.toggle] === c.id) b.classList.add('on'); }
  }
  btn(ctl, 'Exit', () => O.stopSim());
  $('#panel').classList.add('off'); $('#nav').classList.remove('open');
};
O.stopSim = function (keepCurrent) {
  if (!O.SIM.active) return;
  O.SIM.active = null; $('#simbar').hidden = true; $('#tip').style.display = 'none';
  const s = O._savedRig;
  O.rig.fly = null; O.rig.pan.set(0, 0, 0); O.rig.vTheta = O.rig.vPhi = 0;
  O.rig.theta = s.theta; O.rig.phi = s.phi; O.rig.dist = s.dist; O.rig.minDist = s.minDist;
  if (!keepCurrent) {
    const p = s.focus && S.objects[s.focus];
    O.state.focus = p ? s.focus : null;
    O.rig.focusFn = p ? () => p.obj.getWorldPosition(new V3()) : () => new V3();
    O.rig.target.copy(O.rig.focusFn());
    if (O.state.selected) renderPanel();
  }
};
O.closeSN = function () {
  if (O.activeSN) O.activeSN.cancel();
  O.activeSN = null; O.pendingSN = false;
  if (!O.SIM.active) $('#simbar').hidden = true;
};
O.runSupernova = function () {
  const p = S.objects.betelgeuse; if (!p) return;
  if (O.SIM.active) O.stopSim(true);
  if (!O.layers.deep) setLayer('deep', true);
  if (O.state.focus !== 'betelgeuse') O.select('betelgeuse', true);
  const sn = O.SIM.supernova(p.deep); sn.cancel();
  O.activeSN = sn; O.pendingSN = true; O._snT0 = performance.now();   // starts once the camera has arrived
  const bar = $('#simbar'); bar.hidden = false;
  $('#simTitle').textContent = 'Betelgeuse core collapse'; $('#simBlurb').textContent = 'A sequence, not a prediction of timing: Betelgeuse could explode tomorrow or in 100,000 years. At ≈ 550 ly it poses no danger to Earth.';
  $('#simStage').textContent = 'Flying to Betelgeuse…'; $('#simRead').textContent = '';
  const ctl = $('#simCtl'); ctl.innerHTML = '';
  btn(ctl, 'Replay', () => { if (O.state.focus !== 'betelgeuse') O.flyTo('betelgeuse'); sn.cancel(); O.pendingSN = true; O._snT0 = performance.now(); });
  btn(ctl, 'Close', () => O.closeSN());
};
O.tickSN = function (dt) {
  if (!O.activeSN) return;
  if (O.pendingSN) {
    if (!O.rig.fly || performance.now() - O._snT0 > 4000) {
      O.pendingSN = false; O.activeSN.reset();
      const p = S.objects.betelgeuse; // ease back so the blast wave stays in frame
      O.rig.minDist = 1; O.rig.setFocus(() => p.obj.getWorldPosition(new V3()), p.deep.D.size * 9, {dur: 4.5, theta: O.rig.theta, phi: O.rig.phi});
    }
    return;
  }
  const r = O.activeSN.update(dt);
  if (r) { $('#simStage').textContent = r.stage; $('#simRead').textContent = r.readout || ''; }
};

/* ---------------- wire up ---------------- */
O.initUI = function () {
  buildTree(); crumbs();
  $('#q').addEventListener('input', (e) => search(e.target.value));
  $('#q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const b = [...document.querySelectorAll('#tree .it')].find((x) => !x.hidden && x.dataset.id); if (b) b.click(); } });
  $('#pX').addEventListener('click', () => { O.state.selected = null; O.state.place = null; if (O.state.cut) O.setCutaway(O.state.cut, false); renderPanel(); markTree(); crumbs(); });
  $('#pHandle').addEventListener('click', () => $('#panel').classList.toggle('min'));
  $('#navBtn').addEventListener('click', () => $('#nav').classList.toggle('open'));
  $('#helpBtn').addEventListener('click', () => $('#help').hidden = false);
  $('#helpClose').addEventListener('click', () => $('#help').hidden = true);
  $('#help').addEventListener('click', (e) => { if (e.target.id === 'help') $('#help').hidden = true; });

  const seg = $('#layerSeg');
  for (const [k, n] of LAYER_DEF) { const b = el('button', O.layers[k] ? 'on' : '', n); b.dataset.k = k; b.addEventListener('click', () => setLayer(k, !O.layers[k])); seg.appendChild(b); }
  document.querySelectorAll('#scaleSeg button').forEach((b) => b.addEventListener('click', () => {
    O.scale.mode = b.dataset.scale; document.querySelectorAll('#scaleSeg button').forEach((x) => x.classList.toggle('on', x === b));
    O.rebuildOrbits(); O.toast(O.scale.mode === 'true' ? 'True scale: sizes and distances share one scale — planets become specks. Labels help you find them.' : 'Viewable scale: distances compressed, planets enlarged');
    if (O.state.focus) O.flyTo(O.state.focus); else O.home();
  }));
  $('#tPlay').addEventListener('click', () => { O.time.paused = !O.time.paused; playIcon(); });
  $('#tFwd').addEventListener('click', () => { const i = RATES.indexOf(O.time.rate); setRate(Math.min(RATES.length - 1, i + 1)); });
  $('#tRev').addEventListener('click', () => { const i = RATES.indexOf(O.time.rate); setRate(Math.max(0, i - 1)); });
  $('#tNow').addEventListener('click', () => { O.time.simMs = Date.now(); O.time.offset = 0; setRate(RATES.indexOf(1)); O.rebuildOrbits(); });
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Escape') { if (O.SKY && O.SKY.active) O.closeSky(); else if (O.SIM.active) O.stopSim(); else if (!$('#help').hidden) $('#help').hidden = true; else O.home(); }
    if (e.key === ' ') { O.time.paused = !O.time.paused; playIcon(); e.preventDefault(); }
    if (e.key === '+' || e.key === '=') O.rig.zoom(0.75);
    if (e.key === '-') O.rig.zoom(1.33);
    if ((e.key === 'i' || e.key === 'I') && O.state.focus) { O.setCutaway(O.state.focus, O.state.cut !== O.state.focus); renderPanel(); }
  });
  applyLayers();
  setInterval(() => { updateTele(); liveTag(); clocks(); }, 250);
};

})(window.ORR);

/* keep the cut opening turned toward the viewer (eased) */
(function (O) {
  const V3 = THREE.Vector3;
  O.updateCutOrientation = function () {
    const id = O.state.cut; if (!id) return;
    const p = O.S.objects[id]; const h = p.kind === 'planet' ? p.planet : p.kind === 'sun' ? O.S.sun : p.moon;
    const c = h && h._container; if (!c) return;
    const q = c.getWorldQuaternion(new THREE.Quaternion()), wpos = c.getWorldPosition(new V3());
    const axis = new V3(0, 1, 0).applyQuaternion(q).normalize();
    const gap = (h._gapDir || new V3(-1, 0, -1).normalize()).clone().applyQuaternion(q);
    const toCam = new V3().subVectors(O.S.camera.position, wpos);
    const pr = (v) => v.clone().sub(axis.clone().multiplyScalar(v.dot(axis))).normalize();
    const a = pr(gap), b = pr(toCam);
    let ang = Math.acos(Math.max(-1, Math.min(1, a.dot(b)))); if (new V3().crossVectors(a, b).dot(axis) < 0) ang = -ang;
    c.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, ang * 0.08));
  };
})(window.ORR);

(function (O) {
  const $ = (s) => document.querySelector(s);
  O.openSkyDefault = function () {
    const pl = O.state.place && O.state.place.body === 'earth' ? O.state.place : null;
    if (pl) return O.openSky(pl.lat, pl.lon, pl.name);
    const c = O.defaultCity(); O.openSky(c[1], c[2], c[0]);
  };
  O.initFeatures = function () {
    $('#skyExit').addEventListener('click', () => O.closeSky());
    $('#sigClose').addEventListener('click', () => O.stopSignal());
    $('#tourBtn').addEventListener('click', () => O.TOUR.on ? O.tourStop() : O.tourStart());
    $('#skyBtn').addEventListener('click', () => O.SKY.active ? O.closeSky() : O.openSkyDefault());
    document.addEventListener('pointerdown', () => {}, {passive: true});
  };
})(window.ORR);
