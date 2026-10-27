/* ============================================================
   DEEP SPACE — stars, black holes, remnants, nebulae, galaxies.
   Placed in their true sky direction; distance on a log scale.
   Visual sizes are NOT to scale (each is magnified to be seen).
   ============================================================ */
(function (O) {
const S = O.S, V3 = THREE.Vector3;

function pts(n, gen, opts) {
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3), s = new Float32Array(n);
  for (let i = 0; i < n; i++) { const o = gen(i); p[i * 3] = o[0]; p[i * 3 + 1] = o[1]; p[i * 3 + 2] = o[2]; c[i * 3] = o[3]; c[i * 3 + 1] = o[4]; c[i * 3 + 2] = o[5]; s[i] = o[6]; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('size', new THREE.BufferAttribute(s, 1));
  const m = new THREE.Points(g, O.pointsMaterial(Object.assign({scale: 300, max: 40}, opts || {}))); m.frustumCulled = false;
  return m;
}
function glow(color, scale, k) {
  const t = O.glowTexture(`rgba(255,255,255,${k || 0.95})`, 'rgba(255,255,255,0.12)');
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map: t, color: new THREE.Color(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
  s.scale.setScalar(scale); return s;
}
function starBall(K, r, opts) {
  const rgb = O.kelvinRGB(K);
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), O.starMaterial(rgb, opts));
  m.add(glow(new THREE.Color(rgb[0], rgb[1], rgb[2]), r * 5, 0.7));
  return m;
}

O.buildDeep = function () {
  S.deep = [];
  const R = O.makeNoise(1234).rnd;
  for (const D of O.DEEP) {
    const g = new THREE.Group(); S.scene.add(g);
    const dir = O.radecToScene(D.ra, D.dec, new V3()).normalize();
    const au = D.ly * O.LY_AU;
    const Dn = {D, g, dir, au, anim: [], mats: []};
    const sz = D.size;
    // orient each object's local "up" randomly-but-stably so disks aren't all parallel
    g.quaternion.setFromEuler(new THREE.Euler(R() * Math.PI, R() * Math.PI, R() * Math.PI));
    const v = D.vis;
    if (v === 'star' || v === 'giant') {
      const ball = starBall(D.T, sz * 0.3, {boil: v === 'giant' ? 0.55 : 0.25}); g.add(ball);
      Dn.mats.push(ball.material);
      if (D.pulse || v === 'giant') Dn.anim.push((t) => { const k = 1 + Math.sin(t * (D.pulse ? 1.2 : 0.35)) * (v === 'giant' ? 0.04 : 0.03); ball.scale.setScalar(k); ball.material.uniforms.uPulse.value = (k - 1) * 3; });
      Dn.core = ball;
      if (D.planets) addPlanets(Dn, D, sz * 0.3, R);
    } else if (v === 'binary') {
      const a = starBall(D.T, sz * 0.25), b = starBall(D.T2, D.small2 ? sz * 0.05 : sz * 0.2);
      g.add(a); g.add(b); Dn.mats.push(a.material, b.material);
      const ring = new THREE.LineLoop(O.circleGeom(128), new THREE.LineBasicMaterial({color: 0x7f93bd, transparent: true, opacity: 0.3})); g.add(ring);
      const A = sz * 1.3;
      Dn.anim.push((t) => { const ang = t * 2 * Math.PI / 14; const q = D.small2 ? 0.33 : 0.46; a.position.set(-Math.cos(ang) * A * q, 0, -Math.sin(ang) * A * q); b.position.set(Math.cos(ang) * A * (1 - q), 0, Math.sin(ang) * A * (1 - q)); ring.scale.setScalar(A * (1 - q)); });
      Dn.timelapse = `Orbit animated at ≈ ${O.fmt.n(D.period * 365.25 * 86400 / 14 / 1e6, 0)} million × real speed`;
    } else if (v === 'system') {
      const ball = starBall(D.T, sz * 0.3); g.add(ball); Dn.mats.push(ball.material);
      addPlanets(Dn, D, sz * 0.3, R);
    } else if (v === 'bhbinary') {
      const bh = new THREE.Mesh(new THREE.SphereGeometry(sz * 0.12, 32, 24), new THREE.MeshBasicMaterial({color: 0x000000})); g.add(bh);
      const bb = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), O.bhBillboardMaterial()); bb.scale.setScalar(sz * 0.8); g.add(bb); Dn.mats.push(bb.material);
      const star = starBall(5850, sz * 0.18); g.add(star); Dn.mats.push(star.material);
      const ring = new THREE.LineLoop(O.circleGeom(128), new THREE.LineBasicMaterial({color: 0x7f93bd, transparent: true, opacity: 0.3})); ring.scale.setScalar(sz * 1.6); g.add(ring);
      Dn.anim.push((t) => { const ang = t * 2 * Math.PI / 10; star.position.set(Math.cos(ang) * sz * 1.6, 0, Math.sin(ang) * sz * 1.6); bh.position.set(-Math.cos(ang) * sz * 0.16, 0, -Math.sin(ang) * sz * 0.16); bb.position.copy(bh.position); });
      Dn.timelapse = '185.6-day orbit animated in 10 s';
    } else if (v === 'xrb') buildXRB(Dn, sz, R);
    else if (v === 'smbh') buildSMBH(Dn, sz, D, R);
    else if (v === 'crab') buildCrab(Dn, sz, R);
    else if (v === 'remnant') {
      const sh = new THREE.Mesh(new THREE.SphereGeometry(sz * 0.5, 64, 48), O.shellMaterial(D.col)); g.add(sh); Dn.mats.push(sh.material);
      g.add(pts(2500, () => { const u = new V3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize().multiplyScalar(sz * (0.42 + R() * 0.12)); const c = new THREE.Color(D.col).lerp(new THREE.Color(R() < 0.3 ? '#7fd0ff' : '#ffe0a0'), R() * 0.5); return [u.x, u.y, u.z, c.r, c.g, c.b, 0.2 + R() * 0.5]; }, {scale: 400 * sz / 20}));
      const ns = glow('#bfe0ff', sz * 0.12); g.add(ns);
    } else if (v === 'rings') {
      g.add(glow('#ffd8a0', sz * 0.5));
      const ringPts = (rad, tiltX, offY, n, col, hot) => pts(n, (i) => { const a = i / n * Math.PI * 2; const p = new V3(Math.cos(a) * rad, offY, Math.sin(a) * rad).applyAxisAngle(new V3(1, 0, 0), tiltX); const bright = hot && i % 8 === 0 ? 1.4 : 0.5; const c = new THREE.Color(col); return [p.x, p.y, p.z, c.r * bright, c.g * bright, c.b * bright, hot ? 0.5 : 0.25]; }, {scale: 300 * sz / 20});
      g.add(ringPts(sz * 0.35, 0.75, 0, 120, '#ffe7c0', true));
      g.add(ringPts(sz * 0.8, 0.75, sz * 0.35, 260, '#ff8a9a'));
      g.add(ringPts(sz * 0.8, 0.75, -sz * 0.35, 260, '#ff8a9a'));
    } else if (v === 'magnetar') buildMagnetar(Dn, sz);
    else if (v === 'nebula') buildNebula(Dn, D, sz, R);
    else if (v === 'pillars') buildPillars(Dn, sz, R);
    else if (v === 'etacar') {
      const ball = starBall(D.T, sz * 0.12, {boil: 0.4}); g.add(ball); Dn.mats.push(ball.material);
      g.add(pts(5000, (i) => { const side = i % 2 ? 1 : -1; const th = R() * Math.PI * 2, ph = Math.acos(R()); const r = sz * (0.9 + R() * 0.1); const p = new V3(Math.sin(ph) * Math.cos(th) * r * 0.55, side * (0.1 + Math.cos(ph)) * r, Math.sin(ph) * Math.sin(th) * r * 0.55); const c = new THREE.Color('#d9a070').lerp(new THREE.Color('#ffe8d0'), R()); return [p.x, p.y, p.z, c.r * 0.7, c.g * 0.6, c.b * 0.5, 0.4 + R() * 0.6]; }, {scale: 300 * sz / 20, opacity: 0.5}));
    } else if (v === 'galaxy') buildGalaxy(Dn, D, sz, R);

    S.deep.push(Dn);
    O.addPick(D.id, g, () => sz * 0.6, {kind: 'deep', label: D.name, group: 'deep', deep: Dn});
  }
};

function addPlanets(Dn, D, rStar, R) {
  const maxA = Math.max(...D.planets.map((p) => p.a));
  for (const p of D.planets) {
    const rad = rStar * 1.8 + (p.a / maxA) * D.size * 1.8;
    const m = new THREE.Mesh(new THREE.SphereGeometry(D.size * 0.05, 16, 12), new THREE.MeshBasicMaterial({color: new THREE.Color().setHSL(0.05 + R() * 0.55, 0.35, 0.55)}));
    const ring = new THREE.LineLoop(O.circleGeom(96), new THREE.LineBasicMaterial({color: 0x7f93bd, transparent: true, opacity: 0.25})); ring.scale.setScalar(rad);
    Dn.g.add(m); Dn.g.add(ring);
    const ph = R() * 6.28;
    Dn.anim.push((t) => { const a = ph + t * 2 * Math.PI / (p.P * 2.0); m.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); });
  }
  Dn.timelapse = 'Planet orbits animated: 1 day = 2 s, true relative periods';
}

function buildXRB(Dn, sz, R) {
  const g = Dn.g;
  const bhPos = new V3(sz * 0.5, 0, 0), starPos = new V3(-sz * 0.9, 0, 0);
  const disk = new THREE.Mesh(new THREE.RingGeometry(sz * 0.05, sz * 0.45, 128, 4), O.diskMaterial(sz * 0.05, sz * 0.45, {hot: '#e8f0ff', cool: '#6f8cff'}));
  disk.rotation.x = -Math.PI / 2; disk.position.copy(bhPos); g.add(disk); Dn.mats.push(disk.material);
  const bb = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), O.bhBillboardMaterial()); bb.material.uniforms.uColor.value.set('#b8ccff'); bb.scale.setScalar(sz * 0.25); bb.position.copy(bhPos); g.add(bb); Dn.mats.push(bb.material);
  const star = starBall(30000, sz * 0.42, {boil: 0.35}); star.scale.set(1.15, 1, 1); star.position.copy(starPos); g.add(star); Dn.mats.push(star.material);
  // stream from the star's L1 point spiralling into the disk
  const n = 1400, seeds = [];
  const stream = pts(n, (i) => { seeds.push(R(), R() - 0.5, R() - 0.5); return [0, 0, 0, 0.7, 0.8, 1.0, 0.35 + R() * 0.3]; }, {scale: 300 * sz / 14, opacity: 0.85});
  g.add(stream);
  const jet = (dir) => pts(600, () => { const f = R(); return [bhPos.x + (R() - 0.5) * sz * 0.03 * (1 + f * 3), dir * f * sz * 2.2, (R() - 0.5) * sz * 0.03 * (1 + f * 3), 0.6, 0.75, 1.0, 0.3 * (1 - f) + 0.1]; }, {scale: 300 * sz / 14, opacity: 0.55});
  const j1 = jet(1), j2 = jet(-1); g.add(j1); g.add(j2);
  Dn.anim.push((t) => {
    const a = stream.geometry.attributes.position.array;
    const L1 = new V3(-sz * 0.47, 0, 0);
    for (let i = 0; i < n; i++) {
      const f = (seeds[i * 3] + t * 0.08) % 1;
      // bezier from L1 → disk edge, then spiral inward
      let x, y, z;
      if (f < 0.55) { const u = f / 0.55; const c = new V3(-sz * 0.05, 0, sz * 0.45); const e = new V3(bhPos.x - sz * 0.05, 0, sz * 0.42); x = (1 - u) * (1 - u) * L1.x + 2 * (1 - u) * u * c.x + u * u * e.x; z = (1 - u) * (1 - u) * L1.z + 2 * (1 - u) * u * c.z + u * u * e.z; y = seeds[i * 3 + 1] * sz * 0.02 * (1 - u); }
      else { const u = (f - 0.55) / 0.45; const rad = sz * 0.42 * (1 - u * 0.9); const ang = Math.PI / 2 + u * Math.PI * 5; x = bhPos.x + Math.cos(ang) * rad; z = Math.sin(ang) * rad; y = seeds[i * 3 + 2] * sz * 0.008; }
      a[i * 3] = x + seeds[i * 3 + 1] * sz * 0.01; a[i * 3 + 1] = y; a[i * 3 + 2] = z + seeds[i * 3 + 2] * sz * 0.01;
    }
    stream.geometry.attributes.position.needsUpdate = true;
    for (const J of [j1, j2]) { const ja = J.geometry.attributes.position.array; for (let i = 1; i < ja.length; i += 3) { ja[i] *= 1.012; if (Math.abs(ja[i]) > sz * 2.4) ja[i] = Math.sign(ja[i]) * sz * 0.05; } J.geometry.attributes.position.needsUpdate = true; }
  });
  Dn.edgeBB = [bb, disk];
}

function buildSMBH(Dn, sz, D, R) {
  const g = Dn.g;
  const disk = new THREE.Mesh(new THREE.RingGeometry(sz * 0.18, sz * 0.75, 192, 6), O.diskMaterial(sz * 0.18, sz * 0.75));
  disk.rotation.x = -Math.PI / 2; g.add(disk); Dn.mats.push(disk.material);
  const bb = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), O.bhBillboardMaterial()); bb.scale.setScalar(sz * 0.5); g.add(bb); Dn.mats.push(bb.material);
  Dn.edgeBB = [bb, disk];
  if (D.jet) {
    const jet = (dir) => pts(1500, () => { const f = Math.pow(R(), 0.7); const w = sz * 0.02 * (1 + f * 4); return [(R() - 0.5) * w, dir * (sz * 0.1 + f * sz * 4), (R() - 0.5) * w, 0.55, 0.7, 1.0, 0.25 + (1 - f) * 0.5]; }, {scale: 300 * sz / 40, opacity: 0.6});
    const j1 = jet(1), j2 = jet(-1); g.add(j1); g.add(j2);
    Dn.anim.push(() => { for (const J of [j1, j2]) { const a = J.geometry.attributes.position.array; for (let i = 1; i < a.length; i += 3) { a[i] += Math.sign(a[i]) * sz * 0.012; if (Math.abs(a[i]) > sz * 4.2) a[i] = Math.sign(a[i]) * sz * 0.1; } J.geometry.attributes.position.needsUpdate = true; } });
  }
  if (D.id === 'sgra') {
    // S-stars around Sgr A*: S2 real orbital elements (a = 1031 AU, e = 0.8847, P = 16.05 yr, periapsis 2018.38)
    const Sst = [{n: 'S2', a: 1.0, e: 0.8847, P: 16.05, Tp: 2018.38, inc: 2.35, w: 1.16, node: 3.98},
      {n: 'S29', a: 2.6, e: 0.97, P: 90, Tp: 2021.4, inc: 2.52, w: 3.4, node: 2.3},
      {n: 'S55', a: 0.8, e: 0.72, P: 12.8, Tp: 2009.3, inc: 2.6, w: 2.3, node: 2.0},
      {n: 'S4711', a: 0.75, e: 0.77, P: 7.6, Tp: 2019.1, inc: 2.0, w: 0.8, node: 1.1}];
    Dn.sstars = [];
    for (const s of Sst) {
      const A = sz * 1.4 * s.a;
      const path = [];
      for (let i = 0; i <= 256; i++) { const E = i / 256 * Math.PI * 2; path.push(kep(A, s, E)); }
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(path), new THREE.LineBasicMaterial({color: s.n === 'S2' ? 0xffc061 : 0x7f93bd, transparent: true, opacity: s.n === 'S2' ? 0.7 : 0.3}));
      g.add(line);
      const st = glow(s.n === 'S2' ? '#cfe0ff' : '#ffffff', sz * 0.12); g.add(st);
      Dn.sstars.push({s, st, A});
    }
    Dn.anim.push(() => {
      const yr = 1970 + (O.S.jd - 2440587.5) / 365.25;
      for (const q of Dn.sstars) {
        let M = 2 * Math.PI * (yr - q.s.Tp) / q.s.P; M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        let E = M; for (let k = 0; k < 20; k++) E -= (E - q.s.e * Math.sin(E) - M) / (1 - q.s.e * Math.cos(E));
        q.st.position.copy(kep(q.A, q.s, E));
      }
    });
    Dn.note = 'S-star positions follow sim time — speed time up to watch S2 whip past the black hole.';
  }
  function kep(A, s, E) {
    const xp = A * (Math.cos(E) - s.e), yp = A * Math.sqrt(1 - s.e * s.e) * Math.sin(E);
    return new V3(xp, 0, yp).applyAxisAngle(new V3(0, 1, 0), s.w).applyAxisAngle(new V3(1, 0, 0), s.inc - Math.PI / 2).applyAxisAngle(new V3(0, 1, 0), s.node);
  }
}

function buildCrab(Dn, sz, R) {
  const g = Dn.g;
  g.add(pts(7000, () => {
    const u = new V3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); if (u.length() > 1) u.normalize();
    u.multiply(new V3(1.0, 0.7, 0.75)).multiplyScalar(sz * 0.55 * (0.4 + Math.pow(R(), 0.4) * 0.6));
    const fil = R() < 0.55; const c = fil ? new THREE.Color('#ff7a3a').lerp(new THREE.Color('#ffd080'), R() * 0.5) : new THREE.Color('#6fa8ff').lerp(new THREE.Color('#d0e8ff'), R() * 0.4);
    const k = fil ? 0.8 : 0.35; return [u.x, u.y, u.z, c.r * k, c.g * k, c.b * k, fil ? 0.25 + R() * 0.3 : 0.6 + R() * 0.8];
  }, {scale: 300 * sz / 30, opacity: 0.55}));
  const ns = glow('#dff0ff', sz * 0.12); g.add(ns);
  const beamGeo = new THREE.ConeGeometry(sz * 0.08, sz * 0.7, 24, 1, true); beamGeo.translate(0, -sz * 0.35, 0);
  const bm = new THREE.MeshBasicMaterial({color: 0x9fd0ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide});
  const piv = new THREE.Group(); g.add(piv);
  const b1 = new THREE.Mesh(beamGeo, bm), b2 = new THREE.Mesh(beamGeo, bm); b2.rotation.z = Math.PI; piv.add(b1); piv.add(b2);
  piv.rotation.z = 0.5;
  Dn.anim.push((t) => { piv.rotation.y = t * 2 * Math.PI * 0.5; });
  Dn.timelapse = 'Pulsar beams slowed 60× (real: 30.2 rotations per second)';
}

function buildMagnetar(Dn, sz) {
  const g = Dn.g;
  const ns = glow('#e0ecff', sz * 0.4); g.add(ns);
  const core = new THREE.Mesh(new THREE.SphereGeometry(sz * 0.05, 24, 16), new THREE.MeshBasicMaterial({color: 0xffffff})); g.add(core);
  const piv = new THREE.Group(); g.add(piv); piv.rotation.z = 0.3;
  for (let k = 0; k < 10; k++) {
    const L = 0.3 + k * 0.12, path = [];
    for (let i = 0; i <= 64; i++) { const th = 0.02 + i / 64 * (Math.PI - 0.04); const r = sz * L * Math.pow(Math.sin(th), 2); path.push(new V3(r * Math.sin(th), r * Math.cos(th), 0)); }
    const geo = new THREE.BufferGeometry().setFromPoints(path);
    for (const ang of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { const l = new THREE.Line(geo, new THREE.LineBasicMaterial({color: 0x8fb4ff, transparent: true, opacity: 0.25})); l.rotation.y = ang + k * 0.2; piv.add(l); }
  }
  Dn.anim.push((t) => { piv.rotation.y = t * 0.4; const f = Math.pow(Math.max(0, Math.sin(t * 0.21)), 40); ns.scale.setScalar(sz * (0.4 + f * 2.5)); });
}

function buildNebula(Dn, D, sz, R) {
  const g = Dn.g, N = O.makeNoise(17);
  const c1 = new THREE.Color(D.col), c2 = new THREE.Color(D.col2);
  g.add(pts(12000, () => {
    let p; do { p = new V3(R() * 2 - 1, (R() * 2 - 1) * 0.6, R() * 2 - 1); } while (p.length() > 1);
    const d = N.fbm(p.x * 2, p.y * 2, p.z * 2, 4);
    if (d < -0.05 && R() < 0.7) { p.multiplyScalar(0.3); }
    p.multiplyScalar(sz * 0.7);
    const c = c1.clone().lerp(c2, Math.max(0, Math.min(1, 0.5 + d * 2 + p.y / sz))); const k = 0.25 + Math.max(0, d) * 0.6;
    return [p.x, p.y, p.z, c.r * k, c.g * k, c.b * k, 0.8 + R() * 1.6];
  }, {scale: 300 * sz / 40, opacity: 0.5}));
  for (let i = 0; i < 4; i++) { const s = glow('#e6f0ff', sz * 0.08); s.position.set((R() - 0.5) * sz * 0.06, (R() - 0.5) * sz * 0.06, (R() - 0.5) * sz * 0.06); g.add(s); }
  g.add(pts(300, () => { const p = new V3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).multiplyScalar(sz * 0.4); return [p.x, p.y, p.z, 1, 0.95, 0.9, 0.3]; }, {scale: 300 * sz / 40}));
}

function buildPillars(Dn, sz, R) {
  const g = Dn.g, N = O.makeNoise(29);
  const cols = [[-0.35, 1.0, 0.13], [0.05, 0.62, 0.10], [0.35, 0.45, 0.09]];
  g.add(pts(14000, () => {
    if (R() < 0.35) { const p = new V3(R() * 2 - 1, R() * 2 - 1, (R() * 2 - 1) * 0.4).multiplyScalar(sz * 0.6); const c = new THREE.Color('#4fb3a8').lerp(new THREE.Color('#d0a070'), R()); return [p.x, p.y, p.z, c.r * 0.2, c.g * 0.2, c.b * 0.2, 1 + R() * 1.5]; }
    const k = cols[Math.floor(R() * 3)], h = R();
    const w = k[2] * (1.2 - h * 0.6) * (0.8 + N.n3(h * 8, k[0] * 3, 0) * 0.4);
    const ang = R() * Math.PI * 2, rr = Math.sqrt(R()) * w;
    const p = new V3(k[0] + Math.cos(ang) * rr + Math.sin(h * 3) * 0.04, -0.5 + h * k[1], Math.sin(ang) * rr * 0.6).multiplyScalar(sz);
    const edge = rr / w; const c = new THREE.Color('#5b3a24').lerp(new THREE.Color('#ffb070'), edge * edge * (h > k[1] * 0.9 ? 1 : 0.8));
    return [p.x, p.y, p.z, c.r * 0.6, c.g * 0.5, c.b * 0.4, 0.4 + R() * 0.8];
  }, {scale: 300 * sz / 34, opacity: 0.75, normal: false}));
}

function buildGalaxy(Dn, D, sz, R) {
  const g = Dn.g, n = D.shape === 'spiral' ? 42000 : 12000;
  g.add(pts(n, (i) => {
    let x, y, z, c;
    if (D.shape === 'spiral') {
      if (R() < 0.18) { const r = Math.pow(R(), 2) * sz * 0.18; const v = new V3(R() * 2 - 1, (R() * 2 - 1) * 0.6, R() * 2 - 1).normalize().multiplyScalar(r); x = v.x; y = v.y; z = v.z; c = new THREE.Color('#ffe2b0'); }
      else if (R() < 0.35) { const r = sz * (0.1 + -Math.log(1 - R() * 0.97) * 0.28); const th = R() * Math.PI * 2; x = Math.cos(th) * r; z = Math.sin(th) * r; y = (R() - 0.5) * sz * 0.03; c = new THREE.Color('#c9c4d8'); }
      else { const arm = i % 2, r = sz * (0.08 + Math.pow(R(), 0.8) * 0.85); const th = Math.log(r / (sz * 0.05)) / 0.3 + arm * Math.PI + (R() + R() - 1) * 0.55; const sp = (R() - 0.5) * r * 0.12; x = Math.cos(th) * r + sp; z = Math.sin(th) * r + sp; y = (R() - 0.5) * sz * 0.02; c = R() < 0.35 ? new THREE.Color('#9fc4ff') : new THREE.Color('#dfe2f2'); if (R() < 0.05) c = new THREE.Color('#ff7fa0'); if (R() < 0.08) c = new THREE.Color('#3a2a22'); }
    } else { const v = new V3((R() + R() - 1) * 1.2, (R() + R() - 1) * 0.35, (R() + R() - 1) * 0.8).multiplyScalar(sz * 0.5); x = v.x; y = v.y; z = v.z; c = R() < 0.4 ? new THREE.Color('#a8c8ff') : new THREE.Color('#e0d8f0'); if (R() < 0.03) c = new THREE.Color('#ff8aa8'); }
    return [x, y, z, c.r * 0.5, c.g * 0.5, c.b * 0.5, 0.6 + R() * 1.2];
  }, {scale: 300 * sz / 150, opacity: 0.55}));
  g.add(glow('#ffe8c8', sz * (D.shape === 'spiral' ? 0.35 : 0.2), 0.5));
  if (D.shape === 'spiral') Dn.anim.push((t) => { g.children[0].rotation.y = t * 0.01; });
}

O.updateDeep = function (t, jd) {
  const cam = O.S.camera;
  for (const Dn of S.deep) {
    Dn.g.position.copy(Dn.dir).multiplyScalar(O.mapAU(Dn.au));
    const vis = O.layers.deep; Dn.g.visible = vis;
    if (!vis) continue;
    const d = cam.position.distanceTo(Dn.g.position);
    if (d > 4000 && O.state.focus !== Dn.D.id) continue; // skip animating far-away
    for (const a of Dn.anim) a(t);
    for (const m of Dn.mats) if (m.uniforms && m.uniforms.uTime) m.uniforms.uTime.value = t;
    if (Dn.edgeBB) {
      const n = new V3(0, 1, 0).applyQuaternion(Dn.g.quaternion);
      const view = new V3().subVectors(cam.position, Dn.g.position).normalize();
      Dn.edgeBB[0].material.uniforms.uEdge.value = 1 - Math.abs(n.dot(view));
    }
  }
};

})(window.ORR);
