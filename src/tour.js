/* ============================================================
   GUIDED TOUR + LIGHT SIGNAL
   ============================================================ */
(function (O) {
const S = O.S, V3 = THREE.Vector3;
const $ = (s) => document.querySelector(s);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

/* ---------------- guided tour ---------------- */
const STEPS = [
  ['sun', 'Our star', 'Everything you are about to see orbits this ordinary yellow dwarf. It holds 99.86% of the Solar System\'s mass and has been fusing hydrogen for 4.6 billion years.'],
  ['mercury', 'The iron planet', 'Mostly metal core, wrapped in a thin rocky shell — scorched at 430 °C by day, −180 °C by night.'],
  ['venus', 'Earth\'s evil twin', 'Same size as Earth, but a runaway greenhouse made it the hottest planet. Try Radar view to see beneath the clouds.'],
  ['earth', 'Home, right now', 'The day–night line, the clouds\' circulation and city lights are where they are at this moment. Tap the globe anywhere to inspect a spot.'],
  ['iss', 'Following the ISS', 'Seven people live here, 420 km up, circling Earth every 93 minutes at 7.7 km/s. Its position is computed live from today\'s orbital data.'],
  ['moon', 'Our Moon', 'The dark plains are ancient lava floods. Apollo 11 landed on the plain at lower right; Chandrayaan-3 near the south pole.'],
  ['mars', 'The red desert', 'Home to the Solar System\'s tallest volcano and deepest canyon, and to rovers still exploring today.'],
  ['jupiter', 'King of planets', 'Its bands are jet streams racing east and west at hundreds of km/h. Zoom in and the scanner reads the wind under your crosshair.'],
  ['saturn', 'The ringed giant', 'The rings are 280,000 km wide but mostly only ten metres thick — ice fragments from dust grains to house-sized boulders.'],
  ['neptune', 'The windiest world', 'Winds reach 2,100 km/h here, driven by heat from deep inside, 4.5 billion km from the Sun.'],
  ['pluto', 'The heart of the Kuiper Belt', 'New Horizons revealed nitrogen glaciers, water-ice mountains and a blue sky on this tiny world in 2015.'],
  ['voyager1', 'Into interstellar space', 'Launched in 1977, now ≈ 170 AU away. Its radio signals take almost a full day to reach us.'],
  ['betelgeuse', 'A star near its end', 'A red supergiant that will one day explode. Press Run supernova sequence in the panel to see how.'],
  ['sgra', 'The heart of our galaxy', 'A black hole of 4.3 million Suns. The bright dot circling it is the star S2, following its measured orbit.'],
  ['andromeda', 'Our nearest big neighbour', 'A trillion stars, 2.5 million light-years away, approaching at 110 km/s. The light you see left it before humans existed.']
];
const T = O.TOUR = {on: false, i: 0, t: 0, paused: false};
function show() {
  const [id, title, text] = STEPS[T.i];
  $('#tourStep').textContent = `Guided tour · ${T.i + 1} / ${STEPS.length}`;
  $('#tourTitle').textContent = title; $('#tourText').textContent = text;
  $('#tourPause').textContent = T.paused ? 'Play' : 'Pause';
}
function go(i) {
  T.i = Math.max(0, Math.min(STEPS.length - 1, i)); T.t = 0;
  const id = STEPS[T.i][0];
  O.select(id, true);
  if (window.innerWidth <= 860) $('#panel').classList.add('off');
  show();
}
O.tourStart = function () {
  if (O.SKY.active) O.closeSky();
  T.on = true; T.paused = false; $('#tour').hidden = false; go(0);
};
O.tourStop = function () { T.on = false; const e = $('#tour'); if (e) e.hidden = true; };
O.tickTour = function (dt) {
  if (!T.on || T.paused) return;
  if (O.rig.fly) return;                 // dwell starts after arrival
  T.t += dt;
  if (T.t > 11) { if (T.i < STEPS.length - 1) go(T.i + 1); else O.tourStop(); }
  const bar = $('#tourBar'); if (bar) bar.style.width = Math.min(100, T.t / 11 * 100) + '%';
};
O.initTour = function () {
  $('#tourPrev').addEventListener('click', () => go(T.i - 1));
  $('#tourNext').addEventListener('click', () => go(T.i + 1));
  $('#tourPause').addEventListener('click', () => { T.paused = !T.paused; show(); });
  $('#tourExit').addEventListener('click', () => O.tourStop());
};

/* ---------------- light signal from Earth ---------------- */
const SIG = O.SIGNAL = {on: false};
function lightSeconds(id) {
  const p = S.objects[id], E = S.planets.earth.ecl;
  const kmFrom = (e) => Math.hypot(e[0] - E[0], e[1] - E[1], e[2] - E[2]) * O.AU_KM;
  if (!p) return 0;
  if (p.kind === 'planet') return kmFrom(p.planet.ecl) / 299792.458;
  if (p.kind === 'sun') return Math.hypot(...E) * O.AU_KM / 299792.458;
  if (p.kind === 'moon') { if (p.parent === 'earth') return Math.hypot(...O.moonEcl(S.jd)) / 299792.458; return kmFrom(S.planets[p.parent].ecl) / 299792.458; }
  if (p.kind === 'comet') return kmFrom(S.comet.ecl) / 299792.458;
  if (p.kind === 'probe') return p.probe.au * O.AU_KM / 299792.458;
  if (p.kind === 'deep') return p.deep.D.ly * 31557600;
  if (p.kind === 'dwarf') return p.dwarf.au * O.AU_KM / 299792.458;
  if (p.kind === 'sat') return p.sat.state ? (p.sat.state.alt) / 299792.458 : 0.002;
  if (p.kind === 'lpoint') return 1.5e6 / 299792.458;
  return 0;
}
O.lightSeconds = lightSeconds;
function fmtLT(sec) {
  if (sec < 1) return (sec * 1000).toFixed(1) + ' ms';
  if (sec < 120) return sec.toFixed(2) + ' s';
  if (sec < 7200) return (sec / 60).toFixed(1) + ' min';
  if (sec < 172800) return (sec / 3600).toFixed(2) + ' hours';
  const y = sec / 31557600; if (y < 2) return (sec / 86400).toFixed(1) + ' days';
  return y >= 1e6 ? (y / 1e6).toFixed(2) + ' million years' : Math.round(y).toLocaleString() + ' years';
}
O.fmtLT = fmtLT;
O.sendLight = function (id) {
  const p = S.objects[id]; if (!p || id === 'earth') return;
  const sec = lightSeconds(id);
  if (!SIG.spr) {
    SIG.spr = new THREE.Sprite(new THREE.SpriteMaterial({map: O.glowTexture('rgba(255,255,255,1)', 'rgba(140,200,255,0.35)', 64), color: 0xbfe6ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
    SIG.line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: 0x9fd6ff, transparent: true, opacity: 0.8}));
    SIG.trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({color: 0x9fd6ff, dashSize: 0.6, gapSize: 0.6, transparent: true, opacity: 0.35}));
    SIG.line.frustumCulled = SIG.trail.frustumCulled = false;
    S.scene.add(SIG.spr); S.scene.add(SIG.line); S.scene.add(SIG.trail);
  }
  SIG.on = true; SIG.id = id; SIG.sec = sec; SIG.t = 0;
  SIG.dur = Math.min(12, Math.max(3, 2.5 + Math.log10(sec + 1) * 1.1));
  SIG.spr.visible = SIG.line.visible = SIG.trail.visible = true;
  // frame both ends
  const a = S.planets.earth.sys.position.clone(), b = p.obj.getWorldPosition(new V3());
  const mid = a.clone().add(b).multiplyScalar(0.5), d = a.distanceTo(b);
  O.state.focus = null; O.rig.minDist = 0.01;
  O.rig.setFocus(() => { const A = S.planets.earth.sys.position, B = p.obj.getWorldPosition(new V3()); return A.clone().add(B).multiplyScalar(0.5); }, Math.max(d * 1.1, 2), {dur: 1.6});
  const box = $('#signal'); box.hidden = false;
  $('#sigTitle').textContent = `Light signal: Earth → ${p.label}`;
  $('#sigSub').textContent = `One-way light time: ${fmtLT(sec)}` + (p.kind === 'probe' ? ' — the delay mission controllers live with' : p.kind === 'planet' ? ' — the delay for commanding a spacecraft there' : '');
};
O.tickSignal = function (dt) {
  if (!SIG.on) return;
  if (O.rig.fly) return;
  SIG.t += dt;
  const p = S.objects[SIG.id], a = S.planets.earth.sys.position.clone(), b = p.obj.getWorldPosition(new V3());
  const f = Math.min(1, SIG.t / SIG.dur), pos = a.clone().lerp(b, f);
  SIG.spr.position.copy(pos); SIG.spr.scale.setScalar(S.camera.position.distanceTo(pos) * 0.04);
  SIG.line.geometry.dispose(); SIG.line.geometry = new THREE.BufferGeometry().setFromPoints([a, pos]);
  SIG.trail.geometry.dispose(); SIG.trail.geometry = new THREE.BufferGeometry().setFromPoints([pos, b]); SIG.trail.computeLineDistances();
  SIG.trail.material.dashSize = SIG.trail.material.gapSize = a.distanceTo(b) / 60;
  const speed = SIG.sec / SIG.dur;
  $('#sigProg').style.width = (f * 100).toFixed(1) + '%';
  $('#sigRead').textContent = f < 1 ? `${fmtLT(SIG.sec * f)} of ${fmtLT(SIG.sec)} · shown ${speed > 1.5 ? Math.round(speed).toLocaleString() + '× faster than light' : 'near real speed'}` : `Arrived after ${fmtLT(SIG.sec)} of travel at 299,792 km/s.`;
  if (f >= 1 && SIG.t > SIG.dur + 3) O.stopSignal();
};
O.stopSignal = function () { SIG.on = false; if (SIG.spr) SIG.spr.visible = SIG.line.visible = SIG.trail.visible = false; const b = $('#signal'); if (b) b.hidden = true; };
})(window.ORR);
