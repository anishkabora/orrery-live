/* ============================================================
   SKY VIEW — stand anywhere on Earth and look up. Real-time sky:
   Sun, Moon (with phase), planets, stars, constellations, deep-sky
   objects and every tracked satellite above your horizon, plus
   predicted ISS / Tiangong / Hubble passes.
   ============================================================ */
(function (O) {
const S = O.S, V3 = THREE.Vector3, D2R = Math.PI / 180, R2D = 180 / Math.PI;
const SKY = O.SKY = {active: false};
const $ = (s) => document.querySelector(s);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

O.CITIES = [['New Delhi', 28.61, 77.21], ['Mumbai', 19.08, 72.88], ['Bengaluru', 12.97, 77.59], ['Hyderabad', 17.39, 78.49], ['Chennai', 13.08, 80.27], ['Kolkata', 22.57, 88.36], ['Sriharikota (SDSC)', 13.72, 80.23], ['London', 51.51, -0.13], ['Paris', 48.86, 2.35], ['New York', 40.71, -74.01], ['San Francisco', 37.77, -122.42], ['Cape Canaveral', 28.39, -80.6], ['Tokyo', 35.68, 139.69], ['Beijing', 39.9, 116.4], ['Singapore', 1.35, 103.82], ['Dubai', 25.2, 55.27], ['Sydney', -33.87, 151.21], ['Nairobi', -1.29, 36.82], ['Cape Town', -33.92, 18.42], ['São Paulo', -23.55, -46.63], ['Reykjavík', 64.15, -21.94], ['Atacama (ALMA)', -23.03, -67.75], ['Mauna Kea', 19.82, -155.47], ['McMurdo Station', -77.85, 166.67]];
O.defaultCity = function () {
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  const map = {'Asia/Kolkata': 'New Delhi', 'Asia/Calcutta': 'New Delhi', 'Europe/London': 'London', 'Europe/Paris': 'Paris', 'America/New_York': 'New York', 'America/Los_Angeles': 'San Francisco', 'Asia/Tokyo': 'Tokyo', 'Asia/Shanghai': 'Beijing', 'Asia/Singapore': 'Singapore', 'Asia/Dubai': 'Dubai', 'Australia/Sydney': 'Sydney', 'Africa/Nairobi': 'Nairobi', 'America/Sao_Paulo': 'São Paulo'};
  const n = map[tz] || 'London'; return O.CITIES.find((c) => c[0] === n);
};

/* ---------- astronomy helpers ---------- */
function sunEq(jd) { // geocentric Sun RA/Dec (rad) + unit equatorial vector
  const e = O.planetEcl('earth', jd), x = -e[0], y = -e[1], z = -e[2], eps = 23.43928 * D2R;
  const xe = x, ye = y * Math.cos(eps) - z * Math.sin(eps), ze = y * Math.sin(eps) + z * Math.cos(eps), r = Math.hypot(xe, ye, ze);
  return {ra: Math.atan2(ye, xe), dec: Math.asin(ze / r), u: [xe / r, ye / r, ze / r]};
}
function altOf(ra, dec, lat, lst) { return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(lst - ra)); }
O.sunAltAt = (jd, latDeg, lonDeg) => { const s = sunEq(jd); return altOf(s.ra, s.dec, latDeg * D2R, O.gmst(jd) + lonDeg * D2R) * R2D; };
function sunlit(posEci, su) { const d = posEci.x * su[0] + posEci.y * su[1] + posEci.z * su[2]; if (d > 0) return true; return Math.hypot(posEci.x - d * su[0], posEci.y - d * su[1], posEci.z - d * su[2]) > 6371; }

/* Pass prediction: SGP4 every 30 s over the next `hours`; a pass is visible to the eye when the
   satellite is sunlit while the observer's sky is dark (Sun below −6°). */
O.predictPasses = function (rec, latDeg, lonDeg, startMs, hours) {
  const obs = {latitude: latDeg * D2R, longitude: lonDeg * D2R, height: 0.1}, out = []; let cur = null;
  const end = startMs + (hours || 24) * 3600e3;
  for (let t = startMs; t < end; t += 30e3) {
    const d = new Date(t), pv = satellite.propagate(rec, d); if (!pv.position) continue;
    const la = satellite.ecfToLookAngles(obs, satellite.eciToEcf(pv.position, satellite.gstime(d))), elv = la.elevation * R2D;
    if (elv > 0) {
      if (!cur) cur = {rise: t, max: t, maxEl: elv, azRise: la.azimuth * R2D, vis: false};
      if (elv > cur.maxEl) { cur.maxEl = elv; cur.max = t; cur.azMax = la.azimuth * R2D; const jd = O.jd(t); cur.vis = sunlit(pv.position, sunEq(jd).u) && O.sunAltAt(jd, latDeg, lonDeg) < -6; }
    } else if (cur) { cur.set = t; cur.azSet = la.azimuth * R2D; if (cur.maxEl >= 10) out.push(cur); cur = null; if (out.length >= 4) break; }
  }
  return out;
};
const compass = (az) => ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(((az % 360) + 360) % 360 / 22.5) % 16];
O.compass = compass;

/* ---------- scene ---------- */
function build() {
  if (SKY.scene) return;
  const sc = SKY.scene = new THREE.Scene();
  SKY.cam = new THREE.PerspectiveCamera(70, 1, 1, 200000);
  const R = 90000;
  SKY.dome = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.ShaderMaterial({
    uniforms: {uSun: {value: new V3(0, 1, 0)}},
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uSun; varying vec3 vP;
    void main(){
      vec3 d = normalize(vP); float h = max(d.y, 0.0); float sa = uSun.y;
      float day = smoothstep(-0.12, 0.15, sa), tw = smoothstep(-0.32, -0.02, sa) * (1.0 - smoothstep(0.0, 0.25, sa));
      vec3 night = mix(vec3(0.020,0.030,0.060), vec3(0.003,0.006,0.016), pow(h, 0.5));
      vec3 dayc = mix(vec3(0.62,0.78,0.95), vec3(0.16,0.40,0.80), pow(h, 0.55));
      float sd = max(dot(d, normalize(uSun)), 0.0);
      vec3 c = mix(night, dayc, day);
      c += vec3(1.0,0.45,0.15) * tw * pow(1.0 - h, 6.0) * (0.35 + 0.65 * pow(sd, 3.0));
      c += vec3(1.0,0.9,0.7) * pow(sd, 400.0) * 2.0 * step(0.0, sa + 0.02) + vec3(1.0,0.85,0.6) * pow(sd, 12.0) * 0.25 * day;
      gl_FragColor = vec4(c, 1.0);
    }`, side: THREE.BackSide, depthWrite: false, depthTest: false}));
  SKY.dome.renderOrder = 0; sc.add(SKY.dome);
  const pm = (src, maxPx) => { const m = O.pointsMaterial({scale: 1, max: maxPx, min: 0}); m.vertexShader = m.vertexShader.replace('float s = size * uScale / max(-mv.z, 0.0001);', 'float s = size * uScale;'); m.depthTest = false; return m; };
  SKY.stars = new THREE.Points(S.sky.geometry, pm(null, 6)); SKY.bright = new THREE.Points(S.bright.geometry, pm(null, 12));
  SKY.lines = new THREE.LineSegments(S.constLines.geometry, new THREE.LineBasicMaterial({color: 0x6a8cc8, transparent: true, opacity: 0.45, depthTest: false}));
  for (const o of [SKY.stars, SKY.bright, SKY.lines]) { o.matrixAutoUpdate = false; o.frustumCulled = false; o.renderOrder = 1; sc.add(o); }
  // ground: opaque lower hemisphere drawn after the sky so nothing shows below the horizon
  SKY.ground = new THREE.Mesh(new THREE.SphereGeometry(R * 0.8, 48, 16, 0, Math.PI * 2, Math.PI / 2 + 0.002, Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: {uDay: {value: 0}},
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float uDay; varying vec3 vP; void main(){ vec3 d = normalize(vP); float k = smoothstep(-0.25, 0.0, d.y); vec3 c = mix(vec3(0.012,0.016,0.020), vec3(0.06,0.075,0.06), uDay); c += vec3(0.10,0.12,0.16) * k * 0.35 * (0.3 + uDay); gl_FragColor = vec4(c, 1.0); }',
    side: THREE.BackSide, depthTest: false, depthWrite: false}));
  SKY.ground.renderOrder = 10; sc.add(SKY.ground);
  const ring = []; for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; ring.push(new V3(Math.sin(a) * R * 0.75, 0, -Math.cos(a) * R * 0.75)); }
  const hz = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), new THREE.LineBasicMaterial({color: 0x3a4a68, transparent: true, opacity: 0.8, depthTest: false})); hz.renderOrder = 11; sc.add(hz);
  const glow = (c, k) => new THREE.Sprite(new THREE.SpriteMaterial({map: O.glowTexture(`rgba(255,255,255,${k || 1})`, 'rgba(255,255,255,0.15)', 64), color: new THREE.Color(c), depthTest: false, transparent: true, blending: THREE.AdditiveBlending}));
  SKY.sun = glow('#fff1cf'); SKY.sun.renderOrder = 3; sc.add(SKY.sun);
  const mc = document.createElement('canvas'); mc.width = mc.height = 128; SKY.moonCanvas = mc;
  SKY.moon = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(mc), depthTest: false, transparent: true})); SKY.moon.renderOrder = 4; sc.add(SKY.moon);
  SKY.planets = {};
  for (const [id, c, sz] of [['mercury', '#d8cfc4', 0.7], ['venus', '#fff6dc', 1.4], ['mars', '#ff9d6b', 1.0], ['jupiter', '#ffe9c4', 1.25], ['saturn', '#f3e2b5', 1.0], ['uranus', '#bff2f4', 0.55], ['neptune', '#9fb6ff', 0.5]]) { const g = glow(c); g.renderOrder = 4; g.userData.sz = sz; sc.add(g); SKY.planets[id] = g; }
  SKY.sats = [];
  for (const q of S.planets.earth.sats) {
    const g = glow('#ffffff'); g.renderOrder = 5; sc.add(g);
    const tr = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({color: 0xffc061, dashSize: 600, gapSize: 500, transparent: true, opacity: 0.55, depthTest: false})); tr.renderOrder = 5; tr.frustumCulled = false; sc.add(tr);
    SKY.sats.push({q, g, tr, lastTrail: 0});
  }
  SKY.yaw = Math.PI; SKY.pitch = 0.45; // look south, up 26°
  SKY.labels = new Map();
  // input
  const cv = $('#stage'); let drag = null, pinch = null; const ptr = new Map();
  cv.addEventListener('pointerdown', (e) => { if (!SKY.active) return; ptr.set(e.pointerId, {x: e.clientX, y: e.clientY}); drag = {x: e.clientX, y: e.clientY, moved: 0, t: performance.now()}; if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = {d: Math.hypot(a.x - b.x, a.y - b.y), fov: SKY.cam.fov}; } });
  window.addEventListener('pointermove', (e) => {
    if (!SKY.active || !ptr.has(e.pointerId)) return;
    const p = ptr.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptr.size === 2 && pinch) { const [a, b] = [...ptr.values()]; SKY.cam.fov = Math.max(10, Math.min(110, pinch.fov * pinch.d / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)))); SKY.cam.updateProjectionMatrix(); if (drag) drag.moved += 99; return; }
    const k = SKY.cam.fov / S.H * D2R; SKY.yaw += dx * k; SKY.pitch = Math.max(-0.2, Math.min(1.55, SKY.pitch + dy * k));
    if (drag) drag.moved += Math.abs(dx) + Math.abs(dy);
  });
  const up = (e) => { if (!SKY.active) return; const had = ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null; if (had && drag && drag.moved < 8 && performance.now() - drag.t < 400) skyTap(e.clientX, e.clientY); if (!ptr.size) drag = null; };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', (e) => { if (!SKY.active) return; SKY.cam.fov = Math.max(10, Math.min(110, SKY.cam.fov * Math.exp(e.deltaY * 0.001))); SKY.cam.updateProjectionMatrix(); }, {passive: true});
}

function drawMoon(illum, waxing) {
  const c = SKY.moonCanvas, x = c.getContext('2d'), r = 54;
  x.clearRect(0, 0, 128, 128);
  const g = x.createRadialGradient(64, 64, r * 0.9, 64, 64, 64); g.addColorStop(0, 'rgba(255,250,235,0.35)'); g.addColorStop(1, 'rgba(255,250,235,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.fillStyle = 'rgba(40,40,46,0.9)'; x.beginPath(); x.arc(64, 64, r, 0, 7); x.fill();
  // lit part: right half (bright limb toward +x) combined with a terminator ellipse
  const k = illum * 2 - 1; x.fillStyle = '#efeadf';
  x.beginPath(); x.arc(64, 64, r, -Math.PI / 2, Math.PI / 2, false); x.ellipse(64, 64, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0); x.fill();
  x.fillStyle = 'rgba(90,90,96,0.25)'; for (const [a, b, rr] of [[52, 50, 12], [70, 44, 9], [62, 74, 10], [80, 66, 7]]) { x.beginPath(); x.arc(a, b, rr, 0, 7); x.fill(); }
  SKY.moon.material.map.needsUpdate = true; SKY.moonIllum = illum;
}

/* scene-frame direction → horizon frame (x east, y up, z south) */
function horizonMatrix(lat, lst) {
  const U = O.eqToScene(Math.cos(lat) * Math.cos(lst), Math.cos(lat) * Math.sin(lst), Math.sin(lat), new V3()).normalize();
  const P = O.eqToScene(0, 0, 1, new V3()).normalize();
  const N = P.clone().sub(U.clone().multiplyScalar(P.dot(U))).normalize(), E = new V3().crossVectors(N, U).normalize();
  return new THREE.Matrix4().set(E.x, E.y, E.z, 0, U.x, U.y, U.z, 0, -N.x, -N.y, -N.z, 0, 0, 0, 0, 1);
}
const fromAzEl = (az, elv, r) => new V3(Math.sin(az) * Math.cos(elv) * r, Math.sin(elv) * r, -Math.cos(az) * Math.cos(elv) * r);
const toAzEl = (v) => { const n = v.clone().normalize(); return {az: (Math.atan2(n.x, -n.z) * R2D + 360) % 360, el: Math.asin(n.y) * R2D}; };

/* ---------- open / close ---------- */
O.openSky = function (lat, lon, name) {
  if (O.SIM.active) O.stopSim(true);
  if (O.activeSN) O.closeSN();
  if (O.tourStop) O.tourStop();
  build();
  SKY.active = true; document.getElementById('orr').classList.add('skymode'); SKY.lat = lat; SKY.lon = lon; SKY.name = name || O.fmtLatLon(lat, lon);
  O.rig.enabled = false;
  $('#skyhud').hidden = false; $('#panel').classList.add('off'); $('#nav').classList.remove('open'); $('#focusbar').hidden = true;
  $('#skyLoc').textContent = SKY.name;
  const sel = $('#skyCity'); if (sel && !sel.options.length) { for (const c of O.CITIES) { const o = el('option', '', c[0]); o.value = c[0]; sel.appendChild(o); } sel.addEventListener('change', () => { const c = O.CITIES.find((x) => x[0] === sel.value); if (c) O.openSky(c[1], c[2], c[0]); }); }
  if (sel) { const c = O.CITIES.find((x) => x[0] === name); sel.value = c ? c[0] : ''; }
  SKY.passes = null; SKY.passT = 0; computePasses();
  O.toast('Sky View: drag to look around, pinch or scroll to zoom. Speed up time to watch the sky turn.');
};
O.closeSky = function () {
  if (!SKY.active) return;
  SKY.active = false; document.getElementById('orr').classList.remove('skymode'); O.rig.enabled = true; $('#skyhud').hidden = true; $('#skyinfo').hidden = true;
  for (const e of SKY.labels.values()) e.style.display = 'none';
  O.select('earth', true);
};
function computePasses() {
  const list = [['iss', 'ISS'], ['css', 'Tiangong'], ['hst', 'Hubble']], out = [];
  for (const [id, nm] of list) { const q = S.planets.earth.sats.find((x) => x.s.id === id); if (!q || !q.rec) continue; for (const p of O.predictPasses(q.rec, SKY.lat, SKY.lon, O.time.simMs, 36)) out.push(Object.assign({name: nm}, p)); }
  out.sort((a, b) => a.rise - b.rise); SKY.passes = out.slice(0, 6); SKY.passAt = O.time.simMs;
  renderPasses();
}
function renderPasses() {
  const box = $('#skyPasses'); if (!box) return; box.innerHTML = '';
  if (S.planets.earth.satsStale) { box.appendChild(el('p', 'note', 'Pass predictions need the simulated date within 45 days of today.')); return; }
  if (!SKY.passes || !SKY.passes.length) { box.appendChild(el('p', 'note', 'No passes above 10° in the next 36 hours.')); return; }
  const off = SKY.lon / 15 * 3600e3;
  for (const p of SKY.passes) {
    const r = el('div', 'pass' + (p.vis ? ' vis' : ''));
    const t = new Date(p.rise + off); const hh = String(t.getUTCHours()).padStart(2, '0') + ':' + String(t.getUTCMinutes()).padStart(2, '0');
    const mine = new Date(p.rise).toLocaleString([], {weekday: 'short', hour: '2-digit', minute: '2-digit'});
    r.appendChild(el('b', '', p.name)); r.appendChild(el('span', 'mono', mine));
    r.appendChild(el('span', 'pt', `your clock · ${hh} local solar time there`));
    r.appendChild(el('span', '', `max ${p.maxEl.toFixed(0)}° ${compass(p.azMax || p.azRise)} · ${Math.round((p.set - p.rise) / 60000)} min`));
    r.appendChild(el('span', 'pv', p.vis ? 'Visible to the eye' : 'Not visible (daylight or in shadow)'));
    box.appendChild(r);
  }
}

/* ---------- per-frame ---------- */
const labelOf = (key, text, cls) => { let e = SKY.labels.get(key); if (!e) { e = el('div', 'lb skyl ' + (cls || ''), text); $('#labels').appendChild(e); SKY.labels.set(key, e); } return e; };
let hudT = 0;
O.renderSky = function (dt) {
  const jd = S.jd, lat = SKY.lat * D2R, lst = O.gmst(jd) + SKY.lon * D2R;
  const H = horizonMatrix(lat, lst);
  for (const o of [SKY.stars, SKY.bright, SKY.lines]) o.matrix.copy(H), o.matrixWorldNeedsUpdate = true;
  const R = 50000, items = [];
  const place = (obj, sceneDir, r) => { const v = sceneDir.clone().normalize().applyMatrix4(H).normalize(); obj.position.copy(v).multiplyScalar(r || R); return v; };
  const E = S.planets.earth.ecl;
  const sunV = place(SKY.sun, O.eclToScene(-E[0], -E[1], -E[2], new V3()));
  SKY.sun.scale.setScalar(R * 0.09);
  SKY.dome.material.uniforms.uSun.value.copy(sunV);
  const day = Math.max(0, Math.min(1, (sunV.y + 0.1) / 0.25));
  const starK = Math.max(0, Math.min(1, (-sunV.y - 0.02) / 0.22));
  SKY.stars.material.uniforms.uOp.value = starK; SKY.bright.material.uniforms.uOp.value = Math.max(starK, 0.15 * (1 - day)); SKY.lines.material.opacity = 0.45 * starK * (O.layers.constel ? 1 : 0);
  SKY.ground.material.uniforms.uDay.value = day;
  items.push({key: 'sun', name: 'Sun', v: sunV, cls: 'planet'});
  // Moon (topocentric)
  const m = O.moonEcl(jd), eps = 23.43928 * D2R;
  const ox = 6371 * Math.cos(lat) * Math.cos(lst), oy = 6371 * Math.cos(lat) * Math.sin(lst), oz = 6371 * Math.sin(lat);
  const oe = O.eqToEcl(ox, oy, oz);
  const moonV = place(SKY.moon, O.eclToScene(m[0] - oe[0], m[1] - oe[1], m[2] - oe[2], new V3()));
  const sunLam = Math.atan2(-E[1], -E[0]), mLam = Math.atan2(m[1], m[0]); let elong = ((mLam - sunLam) * R2D + 720) % 360;
  const illum = (1 - Math.cos(elong * D2R)) / 2;
  if (SKY.moonIllum === undefined || Math.abs(illum - SKY.moonIllum) > 0.01) drawMoon(illum, elong < 180);
  SKY.moon.scale.setScalar(R * 0.035);
  items.push({key: 'moon', name: `Moon · ${(illum * 100).toFixed(0)}% lit`, v: moonV, cls: 'planet'});
  // planets
  for (const id in SKY.planets) {
    const p = S.planets[id].ecl, v = place(SKY.planets[id], O.eclToScene(p[0] - E[0], p[1] - E[1], p[2] - E[2], new V3()));
    SKY.planets[id].scale.setScalar(R * 0.012 * SKY.planets[id].userData.sz); SKY.planets[id].material.opacity = Math.max(0.25, 1 - day * 0.8);
    items.push({key: id, name: O.BODIES[id].name, v, cls: 'planet'});
  }
  // named bright stars + deep-sky objects
  for (const b of O.BRIGHT) if (b[3] < 1.3) items.push({key: 'st-' + b[0], name: b[0], v: O.radecToScene(b[1], b[2], new V3()).applyMatrix4(H).normalize(), cls: 'deep', star: true});
  for (const D of O.DEEP) if (['betelgeuse', 'sirius', 'vega', 'polaris', 'rigel', 'antares', 'andromeda', 'orion', 'lmc', 'sgra', 'proxima'].includes(D.id)) items.push({key: 'dp-' + D.id, name: D.id === 'sgra' ? 'Galactic centre (Sgr A*)' : D.name, v: O.radecToScene(D.ra, D.dec, new V3()).applyMatrix4(H).normalize(), cls: 'deep', star: true, id: D.id});
  // satellites
  const P = S.planets.earth, date = new Date(O.time.simMs), gm = satellite.gstime(date), obs = {latitude: lat, longitude: SKY.lon * D2R, height: 0.1}, su = sunEq(jd).u;
  SKY.overhead = [];
  for (const k of SKY.sats) {
    const q = k.q; k.g.visible = false; k.tr.visible = false;
    if (!q.rec || P.satsStale) continue;
    const pv = satellite.propagate(q.rec, date); if (!pv.position) continue;
    const la = satellite.ecfToLookAngles(obs, satellite.eciToEcf(pv.position, gm));
    if (la.elevation <= 0) continue;
    const lit = sunlit(pv.position, su), v = fromAzEl(la.azimuth, la.elevation, 1);
    k.g.position.copy(v).multiplyScalar(R * 0.98); k.g.visible = true;
    k.g.scale.setScalar(R * (lit ? 0.012 : 0.008)); k.g.material.color.set(lit ? '#ffffff' : '#7d6a6a'); k.g.material.opacity = lit ? 1 : 0.6;
    if (O.time.simMs - k.lastTrail > 20000 || Math.abs(O.time.simMs - k.lastTrail) > 600000) {
      const pts = [];
      for (let s2 = -240; s2 <= 240; s2 += 10) { const d2 = new Date(O.time.simMs + s2 * 1000), p2 = satellite.propagate(q.rec, d2); if (!p2.position) continue; const l2 = satellite.ecfToLookAngles(obs, satellite.eciToEcf(p2.position, satellite.gstime(d2))); if (l2.elevation > -0.02) pts.push(fromAzEl(l2.azimuth, l2.elevation, R * 0.98)); }
      k.tr.geometry.dispose(); k.tr.geometry = new THREE.BufferGeometry().setFromPoints(pts); k.tr.computeLineDistances(); k.lastTrail = O.time.simMs;
    }
    k.tr.visible = true;
    const altKm = Math.hypot(pv.position.x, pv.position.y, pv.position.z) - 6371;
    items.push({key: 'sat-' + q.s.id, name: q.s.name, v, cls: 'sat', sat: q, info: `${(la.elevation * R2D).toFixed(0)}° up · ${compass(la.azimuth * R2D)} · ${lit ? 'sunlit' : 'in shadow'}`});
    SKY.overhead.push({name: q.s.name, el: la.elevation * R2D, az: la.azimuth * R2D, lit, alt: altKm});
  }
  // compass points
  for (const [n, az] of [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SW', 225], ['W', 270], ['NW', 315]]) items.push({key: 'c-' + n, name: n, v: fromAzEl(az * D2R, 0.012, 1), cls: 'cmp', always: true});
  // camera
  const cam = SKY.cam; cam.aspect = S.W / S.H; cam.updateProjectionMatrix();
  const look = fromAzEl(SKY.yaw, SKY.pitch, 1);
  cam.position.set(0, 0, 0); cam.up.set(0, 1, 0); cam.lookAt(look); cam.updateMatrixWorld();
  { // turn the Moon's lit limb toward the Sun on screen
    const mp = SKY.moon.position.clone().project(cam), sp = SKY.sun.position.clone().project(cam);
    SKY.moon.material.rotation = Math.atan2(sp.y - mp.y, sp.x - mp.x);
  }
  S.renderer.render(SKY.scene, cam);
  // labels
  const used = new Set(); SKY.items = [];
  for (const it of items) {
    const e = labelOf(it.key, it.name, it.cls); if (it.name !== e._t) { e.textContent = it.name; e._t = it.name; }
    const above = it.v.y > (it.always ? -0.5 : -0.005);
    const pr = it.v.clone().multiplyScalar(1000).project(cam);
    if (!above || pr.z > 1 || Math.abs(pr.x) > 1.05 || Math.abs(pr.y) > 1.05 || (it.star && starK < 0.3)) { e.style.display = 'none'; continue; }
    const x = (pr.x * 0.5 + 0.5) * S.W, y = (-pr.y * 0.5 + 0.5) * S.H;
    e.style.display = 'block'; e.style.transform = `translate(${x.toFixed(1)}px,${(y + 6).toFixed(1)}px) translate(-50%,0)`;
    SKY.items.push(Object.assign({x, y}, it));
  }
  // HUD text
  hudT += dt; if (hudT > 0.25) {
    hudT = 0;
    const off = SKY.lon / 15 * 3600e3, lt = new Date(O.time.simMs + off);
    const sa = Math.asin(sunV.y) * R2D;
    $('#skyTime').textContent = `${String(lt.getUTCHours()).padStart(2, '0')}:${String(lt.getUTCMinutes()).padStart(2, '0')} local solar time · Sun ${sa.toFixed(0)}° ${sa > 0 ? '(day)' : sa > -6 ? '(civil twilight)' : sa > -12 ? '(nautical twilight)' : sa > -18 ? '(astronomical twilight)' : '(dark sky)'}`;
    const up = $('#skyUp'); up.innerHTML = '';
    const rows = [];
    for (const it of items) if ((it.cls === 'planet') && it.v.y > 0) { const a = toAzEl(it.v); rows.push([it.name, `${a.el.toFixed(0)}° ${compass(a.az)}`]); }
    for (const o of SKY.overhead) rows.push([o.name, `${o.el.toFixed(0)}° ${compass(o.az)} · ${o.lit ? 'sunlit' : 'shadow'}`]);
    if (!rows.length) rows.push(['Nothing bright above the horizon', '']);
    for (const [a, b] of rows) { const r = el('div', 'sr'); r.appendChild(el('span', '', a)); r.appendChild(el('b', '', b)); up.appendChild(r); }
    $('#skyLook').textContent = `Looking ${compass(SKY.yaw * R2D)} · ${(SKY.pitch * R2D).toFixed(0)}° up · field ${SKY.cam.fov.toFixed(0)}°`;
    if (Math.abs(O.time.simMs - (SKY.passAt || 0)) > 3 * 3600e3) computePasses();
  }
};
function skyTap(x, y) {
  let best = null, bd = 28;
  for (const it of SKY.items || []) { if (it.cls === 'cmp') continue; const d = Math.hypot(it.x - x, it.y - y); if (d < bd) { bd = d; best = it; } }
  const box = $('#skyinfo'); if (!best) { box.hidden = true; return; }
  const a = toAzEl(best.v);
  box.hidden = false; box.innerHTML = '';
  box.appendChild(el('div', 'eyebrow', best.cls === 'sat' ? 'Satellite' : best.star ? 'Star / deep sky' : 'Solar System'));
  box.appendChild(el('h4', '', best.name.split(' · ')[0]));
  box.appendChild(el('p', '', `Altitude ${a.el.toFixed(1)}° · azimuth ${a.az.toFixed(0)}° (${compass(a.az)})` + (best.info ? ' · ' + best.info.split(' · ').slice(2).join(' ') : '')));
  const id = best.sat ? best.sat.s.id : best.id || (best.key === 'sun' ? 'sun' : best.key === 'moon' ? 'moon' : O.BODIES[best.key] ? best.key : null);
  if (id && S.objects[id]) { const b = el('button', 'btn pri', 'Go there'); b.addEventListener('click', () => { O.closeSky(); O.select(id, true); }); box.appendChild(b); }
}
O.skyHUD = function () {
  return `<div id="skyhud" hidden>
    <div class="skc">
      <div class="eyebrow">Sky view · live</div>
      <h4 id="skyLoc"></h4>
      <div id="skyTime" class="mono"></div>
      <div class="skrow"><label for="skyCity" class="note">Location</label><select id="skyCity"></select><button class="btn" id="skyExit">Back to space</button></div>
      <div id="skyLook" class="note"></div>
    </div>
    <div class="skc skr">
      <div class="eyebrow">Above your horizon now</div><div id="skyUp"></div>
      <div class="eyebrow" style="margin-top:10px">Next passes (≥ 10°)</div><div id="skyPasses"></div>
    </div>
  </div><div id="skyinfo" hidden></div>`;
};
})(window.ORR);
