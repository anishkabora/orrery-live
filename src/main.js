/* ============================================================
   MAIN — boot & frame loop
   ============================================================ */
(function (O) {
const S = O.S, V3 = THREE.Vector3;

function boot() {
  const canvas = document.getElementById('stage');
  try { O.initScene(canvas); } catch (e) { fail(e); return; }
  O.buildDeep();
  O.initExplore();
  O.time.simMs = Date.now();
  S.jd = O.jd(O.time.simMs);
  O.rebuildOrbits(); S.lastOrbitJD = S.jd;
  O.rig = O.makeRig(S.camera, canvas, {
    tap: (x, y) => { if (O.SIM.active) simTap(x, y); else O.onTap(x, y); },
    dbl: (x, y) => { if (!O.SIM.active) O.onDbl(x, y); },
    hover: (x, y) => O.onHover(x, y),
    interact: () => { O._userActed = true; canvas.classList.add('grabbing'); clearTimeout(boot._g); boot._g = setTimeout(() => canvas.classList.remove('grabbing'), 200); }
  });
  O.rig.dist = 900; O.rig.phi = 0.8; O.rig.theta = 0.5; O.rig.minDist = 1;
  O.rig.setFocus(() => new V3(), 420, {phi: 0.95, theta: 0.35, dur: 2.2});
  O.initUI(); O.initTour(); O.initFeatures();
  O.refreshTLE();
  resize(); window.addEventListener('resize', resize);
  let seen = false; try { seen = localStorage.getItem('orr-help') === '1'; } catch (e) {}
  if (!seen) { document.getElementById('help').hidden = false; try { localStorage.setItem('orr-help', '1'); } catch (e) {} }
  O._loadingBusy = true;
  O.emit = (ev) => { if (ev === 'earth-ready') setTimeout(() => { if (!O.state.selected && !O._userActed && !O.SIM.active) O.select('earth', true); }, 400); };
  requestAnimationFrame(frame);
}

/* When hosted as a website, a daily job publishes fresh orbital elements to data/tle.json.
   If it is reachable, swap them in; otherwise keep the elements built into the page. */
O.refreshTLE = function () {
  if (!window.fetch) return;
  fetch('data/tle.json', {cache: 'no-store'}).then((r) => r.ok ? r.json() : null).then((j) => {
    if (!j || !j.sats) return;
    const P = S.planets.earth; let n = 0;
    for (const t of j.sats) {
      const q = P.sats.find((x) => x.s.id === t.id); if (!q) continue;
      try { const rec = satellite.twoline2satrec(t.l1, t.l2); if (rec.error) continue; q.rec = rec; q.s.l1 = t.l1; q.s.l2 = t.l2; q.lastOrbit = -1e9; n++; } catch (e) {}
    }
    if (n && j.date) { O.TLE_DATE = j.date; if (O.rerender && O.state.selected) O.rerender(); }
  }).catch(() => {});
};

function fail(e) {
  console.error(e);
  const L = document.getElementById('loading');
  L.textContent = 'WebGL could not start in this browser (' + (e && e.message || e) + ').'; L.hidden = false;
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  S.W = w; S.H = h;
  S.renderer.setSize(w, h, false);
  S.camera.aspect = w / h; S.camera.updateProjectionMatrix();
}

const plane = new THREE.Plane(new V3(0, 1, 0), 0), ray = new THREE.Raycaster();
function simTap(x, y) {
  const sim = O.SIM.active; if (!sim.pointer) return;
  ray.setFromCamera({x: x / S.W * 2 - 1, y: -(y / S.H) * 2 + 1}, S.camera);
  const p = new V3(); if (!ray.ray.intersectPlane(plane, p)) return;
  sim.pointer.down(p); sim.pointer.up(p);
}

let last = performance.now(), t = 0, frameN = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt; frameN++;
  const T = O.time;
  if (!T.paused && T.rate === 1) T.simMs = Date.now() + (T.offset || 0);
  else { if (!T.paused) T.simMs += dt * 1000 * T.rate; T.offset = T.simMs - Date.now(); }
  // keep inside the ephemeris validity window
  const lo = Date.UTC(1800, 0, 1), hi = Date.UTC(2050, 0, 1);
  if (T.simMs < lo || T.simMs > hi) { T.simMs = Math.min(hi, Math.max(lo, T.simMs)); T.paused = true; O.toast('Planet positions are valid 1800–2050; time stopped at the edge.'); }
  S.jd = O.jd(T.simMs);
  if (!T.paused) S.atmo += dt * Math.max(Math.abs(T.rate), 3600) * Math.sign(T.rate || 1);

  if (O.SKY.active) {
    for (const f of S.tick) f(t, S.jd);
    O.updatePlanets(S.jd, dt);
    O.renderSky(dt);
    O.updateLabels();
    O.runJobs(12);
    return;
  }
  if (O.SIM.active) {
    const sim = O.SIM.active, res = sim.update(dt);
    O.rig.update(dt);
    S.renderer.render(sim.scene, S.camera);
    if (res) { document.getElementById('simStage').textContent = res.stage; document.getElementById('simRead').textContent = res.readout; }
    O.updateLabels(); O.updateExplore(dt);
    return;
  }

  for (const f of S.tick) f(t, S.jd);
  O.updatePlanets(S.jd, dt);
  O.updateBelts(S.jd);
  O.updateDeep(t, S.jd);
  if (Math.abs(S.jd - S.lastOrbitJD) > 200) { O.rebuildOrbits(); S.lastOrbitJD = S.jd; }

  // interiors animate in real time
  for (const h of [S.sun, ...O.PLANET_ORDER.map((id) => S.planets[id]), ...S.planets.earth.moons]) if (h && h._im) h._im.uniforms.uTime.value = t;
  O.tickSN(dt); O.tickTour(dt); O.tickSignal(dt);

  O.rig.update(dt);
  O.updateCutOrientation();

  // keep planets visible as at least a few pixels when far away (does not move moons/labels)
  const cam = S.camera.position;
  for (const id of O.PLANET_ORDER) {
    const P = S.planets[id]; if (P.cutaway) continue;
    const d = cam.distanceTo(P.sys.position);
    P.tilt.scale.setScalar(Math.max(P.r, d * 0.0028));
    if (P.ring) P.ring.material.uniforms.uPR.value = P.tilt.scale.x;
  }
  const sr = O.bodyRadius(695700, true), sd = cam.length();
  S.sun.mesh.scale.setScalar(Math.max(sr, sd * 0.004));
  S.sun.glow1.scale.setScalar(Math.max(sr * 5, sd * 0.03)); S.sun.glow2.scale.setScalar(Math.max(sr * 16, sd * 0.07));
  // sky dome follows the camera (stars at infinity)
  S.sky.position.copy(cam); S.bright.position.copy(cam); S.constLines.position.copy(cam);
  S.bright.material.uniforms.uTime.value = t;
  // fade orbit lines as you approach their planet so they don't slice through it
  if (O.layers.orbits) for (const id of O.PLANET_ORDER) { const P = S.planets[id]; const d = cam.distanceTo(P.sys.position); P.orbit.material.opacity = Math.min(0.38, Math.max(0.05, (d / (P.r * 40)) * 0.38)); }

  S.renderer.render(S.scene, S.camera);
  S.frameN = frameN;
  O.updateLabels();
  O.updateExplore(dt);

  const left = O.runJobs(frameN < 3 ? 0 : (O._budget || (dt > 0.05 ? 30 : 18)));
  if (O._loadingBusy && left === 0) { O._loadingBusy = false; document.getElementById('loading').hidden = true; }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.ORR);
