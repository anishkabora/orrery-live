/* ============================================================
   SCENE — renderer, Sun, planets, moons, Earth + satellites,
   belts, comet, probes, heliosphere, sky
   ============================================================ */
(function (O) {
const S = O.S = {objects: {}, picks: [], labels: [], tick: [], jd: 0, atmo: 0};
const V3 = THREE.Vector3;
const tmp = new V3(), tmp2 = new V3();

O.initScene = function (canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x02040a, 1);
  S.renderer = renderer;
  S.scene = new THREE.Scene();
  S.camera = new THREE.PerspectiveCamera(45, 1, 0.00001, 2e6);
  S.camera.position.set(0, 160, 260);
  S.scene.add(S.camera);
  S.sunLight = new THREE.PointLight(0xfff4e6, 1.7, 0, 0);
  S.scene.add(S.sunLight);
  S.scene.add(new THREE.AmbientLight(0x223044, 0.10));
  buildSky(); buildSun(); buildPlanets(); buildBelts(); buildComet(); buildProbes(); buildHeliosphere();
};

/* ---------------- pick & label registry ---------------- */
O.addPick = function (id, obj, radiusFn, opts) {
  const p = Object.assign({id, obj, radiusFn, group: 'solar', label: null}, opts || {});
  S.picks.push(p); S.objects[id] = p;
  return p;
};

/* ---------------- SKY ---------------- */
function buildSky() {
  const N = O.makeNoise(99), R = N.rnd;
  const n1 = 9000, n2 = 26000, pos = new Float32Array((n1 + n2) * 3), col = new Float32Array((n1 + n2) * 3), siz = new Float32Array(n1 + n2);
  const Rsky = 60000;
  const gp = O.radecToScene(192.859508, 27.128336, new V3()).normalize(); // galactic north pole
  const gc = O.radecToScene(266.405, -28.936, new V3()).normalize();     // galactic centre
  const gy = new V3().crossVectors(gp, gc).normalize();
  for (let i = 0; i < n1 + n2; i++) {
    let v;
    if (i < n1) { v = new V3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); if (v.lengthSq() > 1) { i--; continue; } v.normalize(); }
    else { // Milky Way band: concentrated near galactic plane, brighter towards centre
      const L = (R() < 0.45 ? (R() - 0.5) * 1.6 : (R() * 2 - 1) * Math.PI);
      const thick = 0.05 + 0.10 * Math.exp(-L * L * 2.0);
      const b = (R() + R() + R() - 1.5) * thick;
      v = gc.clone().multiplyScalar(Math.cos(L) * Math.cos(b)).addScaledVector(gy, Math.sin(L) * Math.cos(b)).addScaledVector(gp, Math.sin(b)).normalize();
    }
    v.multiplyScalar(Rsky);
    pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    const K = 2800 + Math.pow(R(), 1.6) * 12000, rgb = O.kelvinRGB(K);
    const m = i < n1 ? Math.pow(R(), 6) : Math.pow(R(), 3) * 0.55;
    const b = i < n1 ? 0.35 + m * 1.2 : 0.18 + m * 0.6;
    col[i * 3] = rgb[0] * b; col[i * 3 + 1] = rgb[1] * b; col[i * 3 + 2] = rgb[2] * b;
    siz[i] = i < n1 ? 1.2 + m * 3.2 : 0.9 + m * 1.6;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  const mat = O.pointsMaterial({scale: 1, max: 6, min: 0});
  mat.vertexShader = mat.vertexShader.replace('float s = size * uScale / max(-mv.z, 0.0001);', 'float s = size * uScale;');
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = -10;
  S.sky = pts; S.scene.add(pts);

  // named bright stars + constellation lines
  const named = {};
  const bpos = [], bcol = [], bsz = [];
  const add = (name, ra, dec, mag, bv) => {
    const v = O.radecToScene(ra, dec, new V3()).normalize().multiplyScalar(Rsky * 0.98);
    named[name] = v; bpos.push(v.x, v.y, v.z);
    const rgb = O.kelvinRGB(O.bvToK(bv)); bcol.push(rgb[0], rgb[1], rgb[2]);
    bsz.push(Math.max(2, 7 - mag * 1.6));
  };
  for (const b of O.BRIGHT) add(b[0], b[1], b[2], b[3], b[4]);
  named.Betelgeuse = O.radecToScene(88.793, 7.407, new V3()).normalize().multiplyScalar(Rsky * 0.98);
  named.Rigel = O.radecToScene(78.634, -8.202, new V3()).normalize().multiplyScalar(Rsky * 0.98);
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3));
  bg.setAttribute('color', new THREE.Float32BufferAttribute(bcol, 3));
  bg.setAttribute('size', new THREE.Float32BufferAttribute(bsz, 1));
  const bm = O.pointsMaterial({scale: 1, max: 12, min: 0, twinkle: 1});
  bm.vertexShader = bm.vertexShader.replace('float s = size * uScale / max(-mv.z, 0.0001);', 'float s = size * uScale;');
  S.bright = new THREE.Points(bg, bm); S.bright.frustumCulled = false; S.scene.add(S.bright);
  const lp = [];
  for (const [, segs] of O.CONSTELLATIONS) for (const [a, b] of segs) if (named[a] && named[b]) lp.push(named[a].x, named[a].y, named[a].z, named[b].x, named[b].y, named[b].z);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  S.constLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color: 0x5d7bb0, transparent: true, opacity: 0.35}));
  S.constLines.frustumCulled = false; S.scene.add(S.constLines);
  S.skyAnchor = new THREE.Group(); S.scene.add(S.skyAnchor);
  S.skyNamed = named;
}

/* ---------------- SUN ---------------- */
function buildSun() {
  const g = new THREE.Group(); S.scene.add(g);
  const mat = O.sunMaterial();
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mat);
  g.add(mesh);
  const glow1 = new THREE.Sprite(new THREE.SpriteMaterial({map: O.glowTexture('rgba(255,236,190,0.9)', 'rgba(255,150,40,0.25)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
  const glow2 = new THREE.Sprite(new THREE.SpriteMaterial({map: O.glowTexture('rgba(255,200,120,0.16)', 'rgba(255,110,20,0.03)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
  g.add(glow1); g.add(glow2);
  // prominences: arcs of particles that loop on the limb
  const np = 1400, pp = new Float32Array(np * 3), pc = new Float32Array(np * 3), ps = new Float32Array(np), pseed = new Float32Array(np * 4);
  const R = O.makeNoise(5).rnd;
  for (let i = 0; i < np; i++) { pseed.set([R() * Math.PI * 2, (R() - 0.5) * 1.2, R(), R()], i * 4); pc.set([1, 0.45 + R() * 0.3, 0.15], i * 3); ps[i] = 0.05 + R() * 0.06; }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3)); pg.setAttribute('size', new THREE.BufferAttribute(ps, 1));
  const prom = new THREE.Points(pg, O.pointsMaterial({scale: 300, max: 18}));
  g.add(prom);
  const sun = {group: g, mesh, mat, glow1, glow2, prom, pseed};
  S.sun = sun;
  O.addPick('sun', g, () => mesh.scale.x, {kind: 'sun', label: 'Sun'});
  S.tick.push((t, jd) => {
    const r = O.bodyRadius(695700, true);
    mesh.scale.setScalar(r);
    glow1.scale.setScalar(r * 5.0); glow2.scale.setScalar(r * 16);
    mat.uniforms.uTime.value = t;
    const W = (84.176 + 14.1844 * (jd - 2451545)) * O.D2R;
    mesh.rotation.y = W;
    // prominence loops
    const a = pg.attributes.position.array;
    for (let i = 0; i < np; i++) {
      const s0 = pseed[i * 4], lat = pseed[i * 4 + 1], ph = (pseed[i * 4 + 2] + t * 0.03 * (0.5 + pseed[i * 4 + 3])) % 1;
      const loop = Math.sin(ph * Math.PI);
      const lon = s0 + (ph - 0.5) * 0.25;
      const rr = r * (1.0 + loop * 0.18 * (0.4 + pseed[i * 4 + 3]));
      a[i * 3] = rr * Math.cos(lat) * Math.cos(lon); a[i * 3 + 1] = rr * Math.sin(lat); a[i * 3 + 2] = rr * Math.cos(lat) * Math.sin(lon);
    }
    pg.attributes.position.needsUpdate = true;
    prom.material.uniforms.uScale.value = 300 * r / 7.5;
  });
}

/* ---------------- PLANETS ---------------- */
const GAS = {
  venus: {pal: [[-90, '#c9a86a'], [-60, '#dcc08a'], [-30, '#ead2a0'], [0, '#f1ddb0'], [30, '#ead2a0'], [60, '#dcc08a'], [90, '#c9a86a']], prof: [[-90, 0], [-60, 60], [-30, 100], [0, 100], [30, 100], [60, 60], [90, 0]], vmax: 120, turb: 1.8, rim: '#ffe7a8', rimK: 0.5},
  jupiter: {lightning: 1, pal: [[-90, '#6f6050'], [-62, '#968069'], [-46, '#c2a988'], [-36, '#e6d3b2'], [-29, '#b3865a'], [-22, '#dcb98f'], [-15, '#a0643b'], [-9, '#e8d6b8'], [0, '#e9d2ab'], [7, '#efdfc3'], [11, '#9c603a'], [17, '#ae7448'], [21, '#efe2c8'], [26, '#b98d68'], [32, '#e4d0b0'], [44, '#bba285'], [62, '#97826c'], [90, '#6d5d4e']], vmax: 200, turb: 1.0, spot: [-22.3, 1.2, 0.0006, 0.085], spotCol: '#c4573a', rim: '#ffe3b8', rimK: 0.18},
  saturn: {lightning: 0.7, pal: [[-90, '#8a7a5f'], [-70, '#b8a57e'], [-50, '#d8c393'], [-35, '#e7d3a2'], [-20, '#efdcac'], [-8, '#f3e2b5'], [0, '#f6e7bd'], [8, '#f1dfb0'], [20, '#e9d3a0'], [35, '#dcc490'], [55, '#c7b080'], [72, '#a99a7d'], [90, '#6f7a88']], vmax: 500, turb: 0.55, hex: true, rim: '#fff0c8', rimK: 0.18},
  uranus: {pal: [[-90, '#8fd6dc'], [-40, '#a3e2e6'], [0, '#a8e4e8'], [40, '#9edfe3'], [90, '#c3eef0']], vmax: 260, turb: 0.25, rim: '#d8fbff', rimK: 0.35},
  neptune: {pal: [[-90, '#22348f'], [-60, '#2c47b8'], [-35, '#3b5fd6'], [-20, '#4a6fe0'], [0, '#3f63d8'], [20, '#4a70e2'], [40, '#3557c8'], [70, '#2a43a8'], [90, '#22358f']], vmax: 420, turb: 0.8, spot: [-20, 2.0, -0.0009, 0.075], spotCol: '#18245e', rim: '#a8c2ff', rimK: 0.35}
};
const RINGS = {
  saturn: {inner: 66900, outer: 140500},
  uranus: {inner: 38000, outer: 51200, bands: [[0.12, 0.01, 0.25], [0.32, 0.01, 0.25], [0.55, 0.01, 0.2], [0.98, 0.012, 0.7]], col: '#6f6f6f', op: 0.6},
  neptune: {inner: 41900, outer: 63000, bands: [[0.0, 0.01, 0.3], [0.45, 0.02, 0.15], [1.0, 0.01, 0.5]], col: '#555a66', op: 0.5},
  jupiter: {inner: 92000, outer: 226000, bands: [[0.25, 0.08, 0.15], [0.20, 0.02, 0.25]], col: '#8a7764', op: 0.35}
};
const ATMO = {venus: ['#ffe3a0', 2.0, 1.1], earth: ['#5aa0ff', 2.6, 1.2], mars: ['#ff9a6a', 4.0, 0.45], jupiter: ['#ffe2b8', 3.0, 0.5], saturn: ['#ffedc0', 3.0, 0.45], uranus: ['#bff6ff', 2.6, 0.7], neptune: ['#7fa2ff', 2.6, 0.8], pluto: ['#a8c8ff', 5.0, 0.25], titan: ['#ffb24a', 2.2, 1.0]};

function buildPlanets() {
  S.planets = {};
  for (const id of O.PLANET_ORDER) buildPlanet(id);
}

function buildPlanet(id) {
  const B = O.BODIES[id];
  const sys = new THREE.Group(); S.scene.add(sys);         // translates with planet
  const tilt = new THREE.Group(); sys.add(tilt);            // body orientation (spins)
  const geo = new THREE.SphereGeometry(1, 192, 128);
  let mat, mesh, clouds = null, gas = null;
  const P = {id, B, sys, tilt, moons: [], extras: []};
  if (GAS[id]) {
    const g = GAS[id];
    gas = {k: g.vmax / (B.R * 1000)};
    mat = O.gasMaterial({palette: O.bandPalette(g.pal, id.length * 7, 0.1), wind: O.windTexture(B.winds && B.winds.profile || g.prof, g.vmax), turb: g.turb,
      spot: g.spot ? new THREE.Vector4(g.spot[0] * O.D2R, g.spot[1], g.spot[2], g.spot[3]) : null, spotCol: g.spotCol, hex: g.hex, rim: g.rim, rimK: g.rimK, lightning: g.lightning});
    P.gas = gas;
  } else if (id === 'earth') {
    mat = new THREE.MeshStandardMaterial({color: 0x2a5a9a, roughness: 0.9});
  } else {
    mat = O.rockyMaterial(null, B.color);
    const texId = id;
    O.queueJob(function* () { yield* O.rockyGen(texId, null, (map, bump) => { mat.map = map; mat.bumpMap = bump; mat.bumpScale = id === 'mars' ? 0.018 : 0.012; mat.color.set(0xffffff); mat.needsUpdate = true; }); });
  }
  mesh = new THREE.Mesh(geo, mat); tilt.add(mesh);
  P.mesh = mesh; P.mat = mat;
  if (id === 'earth') {
    const cm = O.cloudMaterial();
    clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 64), cm); tilt.add(clouds); P.clouds = clouds;
    O.queueJob(function* () {
      yield* O.earthGen((T) => {
        P.mat = mesh.material = O.earthMaterial(T);
        cm.uniforms.uMap.value = T.clouds; cm.uniforms.uOp.value = 0.9;
        O.emit && O.emit('earth-ready');
      });
    }, true);
  }
  if (ATMO[id]) { const a = ATMO[id]; const am = new THREE.Mesh(new THREE.SphereGeometry(id === 'earth' ? 1.06 : id === 'venus' ? 1.05 : 1.035, 64, 48), O.atmoMaterial(a[0], a[1], a[2])); tilt.add(am); P.atmo = am; }
  if (RINGS[id]) {
    const r = RINGS[id], rin = r.inner / B.R, rout = r.outer / B.R;
    const tex = id === 'saturn' ? O.saturnRingTexture() : O.simpleRingTexture(r.bands, r.col);
    const rm = O.ringMaterial(tex, rin, rout, r.op || 1);
    const ring = new THREE.Mesh(new THREE.RingGeometry(rin, rout, 256, 1), rm);
    ring.rotation.x = -Math.PI / 2; // ring plane = body equator (local XZ)
    tilt.add(ring); P.ring = ring;
  }
  // pole & orientation
  if (id === 'earth') P.pole = O.eqToScene(0, 0, 1, new V3()).normalize();
  else P.pole = O.poleScene(B.poleRA, B.poleDec);
  P.baseQ = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), P.pole);
  if (id !== 'earth') { const a = B.poleRA * O.D2R; P.node = O.eqToScene(-Math.sin(a), Math.cos(a), 0, new V3()).normalize(); P.nodeX = new V3().crossVectors(P.pole, P.node).normalize(); }
  // equatorial basis for moons
  P.e1 = new V3().crossVectors(new V3(0, 1, 0), P.pole); if (P.e1.lengthSq() < 1e-6) P.e1.set(1, 0, 0); P.e1.normalize();
  P.e2 = new V3().crossVectors(P.pole, P.e1).normalize();

  // orbit line (rebuilt on scale change)
  P.orbit = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: new THREE.Color(B.color).lerp(new THREE.Color('#6d86b8'), 0.55), transparent: true, opacity: 0.38}));
  P.orbit.frustumCulled = false;
  S.scene.add(P.orbit);

  // moons
  for (const m of (O.MOONS[id] || [])) buildMoon(P, m);
  if (id === 'earth') O.buildEarthOrbiters(P);

  S.planets[id] = P;
  O.addPick(id, sys, () => P.r, {kind: 'planet', label: B.name, planet: P});
}

function buildMoon(P, m) {
  const big = m.R > 1000;
  const opts = m.id === 'moon' ? null : {seed: (m.id.length * 13 + m.a % 97) | 0, c1: shade(m.color, 0.55), c2: shade(m.color, 1.15), craters: m.id === 'europa' || m.id === 'enceladus' || m.id === 'titan' || m.id === 'io' ? 0 : 260, w: big ? 1024 : 512,
    io: m.id === 'io', europa: m.id === 'europa', titan: m.id === 'titan', feats: []};
  const mat = O.rockyMaterial(null, m.color);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, m.id === 'moon' ? 160 : 64, m.id === 'moon' ? 110 : 44), mat);
  O.queueJob(function* () { yield* O.rockyGen(m.id, opts, (map, bump) => { mat.map = map; mat.bumpMap = bump; mat.bumpScale = 0.012; mat.color.set(0xffffff); mat.needsUpdate = true; }); });
  P.sys.add(mesh);
  if (m.id === 'titan') { const a = ATMO.titan; const am = new THREE.Mesh(new THREE.SphereGeometry(1.08, 48, 32), O.atmoMaterial(a[0], a[1], a[2])); mesh.add(am); }
  const orbit = new THREE.LineLoop(circleGeom(128), new THREE.LineBasicMaterial({color: 0x7f93bd, transparent: true, opacity: 0.22}));
  P.sys.add(orbit);
  const M = {m, mesh, orbit, P, phase0: (m.a * 0.0137) % (Math.PI * 2)};
  P.moons.push(M);
  O.addPick(m.id, mesh, () => mesh.scale.x, {kind: 'moon', label: m.name, parent: P.id, moon: M});
}
function shade(h, k) { const c = new THREE.Color(h); c.r = Math.min(1, c.r * k); c.g = Math.min(1, c.g * k); c.b = Math.min(1, c.b * k); return '#' + c.getHexString(); }
function circleGeom(n) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; p.push(Math.cos(a), 0, Math.sin(a)); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g; }
O.circleGeom = circleGeom;

O.rebuildOrbits = function () {
  for (const id of O.PLANET_ORDER) {
    const P = S.planets[id], pts = O.orbitPath(id, S.jd, 360).map((e) => O.mapVec(e));
    P.orbit.geometry.dispose(); P.orbit.geometry = new THREE.BufferGeometry().setFromPoints(pts);
  }
  if (S.comet) { const pts = O.cometPath(O.COMETS.halley, 400).map((e) => O.mapVec(e)); S.comet.orbit.geometry.dispose(); S.comet.orbit.geometry = new THREE.BufferGeometry().setFromPoints(pts); }
};

/* per-frame planet update */
O.updatePlanets = function (jd, dtSim) {
  const d = jd - 2451545.0;
  for (const id of O.PLANET_ORDER) {
    const P = S.planets[id], B = P.B;
    const e = O.planetEcl(id, jd); P.ecl = e;
    O.mapVec(e, P.sys.position);
    const r = P.r = O.bodyRadius(B.R);
    P.tilt.scale.setScalar(r);
    if (!P.cutaway) {
      if (id === 'earth') {
        const th = O.gmst(jd);
        const ex = O.eqToScene(Math.cos(th), Math.sin(th), 0, new V3());
        const ey = O.eqToScene(-Math.sin(th), Math.cos(th), 0, new V3());
        const ez = O.eqToScene(0, 0, 1, new V3());
        const m = new THREE.Matrix4().makeBasis(ex, ez, ey.clone().negate());
        P.tilt.quaternion.setFromRotationMatrix(m);
        if (P.clouds) P.clouds.rotation.y = (S.atmo * 2.0e-6) % (Math.PI * 2);
      } else {
        // IAU: prime meridian is W east of the equator's ascending node on the ICRF equator
        const W = ((B.W0 + B.Wd * d) % 360) * O.D2R;
        const pm = P.node.clone().multiplyScalar(Math.cos(W)).addScaledVector(P.nodeX, Math.sin(W));
        P.tilt.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(pm, P.pole, new V3().crossVectors(pm, P.pole)));
      }
    }
    if (P.gas) { P.mat.uniforms.uTime.value = (S.atmo * P.gas.k) % 1200; }
    if (P.ring) { const u = P.ring.material.uniforms; P.sys.getWorldPosition(u.uPlanet.value); u.uPR.value = r; }
    // moons
    for (const M of P.moons) {
      const m = M.m;
      const rf = O.moonDistFactor(m.a, B.R), dist = rf * r;
      M.mesh.scale.setScalar(O.moonRadiusFactor(m.R, B.R) * r);
      if (m.id === 'moon') {
        const me = O.moonEcl(jd), len = Math.hypot(me[0], me[1], me[2]);
        O.eclToScene(me[0] / len * dist, me[1] / len * dist, me[2] / len * dist, M.mesh.position);
        M.orbit.visible = true;
        // orbit circle in the Moon's plane (approx: plane through current pos and ecliptic tilt 5.1°)
        M.orbit.quaternion.setFromUnitVectors(new V3(0, 1, 0), O.eclToScene(0, 0, 1, new V3()));
        M.orbit.scale.setScalar(dist);
      } else {
        let ang;
        if (m.galilean !== undefined) ang = O.galilean(jd)[m.galilean] * O.D2R;
        else ang = M.phase0 + (2 * Math.PI) * d / m.P;
        const pos = tmp.copy(P.e1).multiplyScalar(Math.cos(ang) * dist).addScaledVector(P.e2, Math.sin(ang) * dist);
        M.mesh.position.copy(pos);
        M.orbit.quaternion.copy(P.baseQ);
        M.orbit.scale.setScalar(dist);
      }
      if (!M.cutaway) {
        const ex = tmp2.copy(M.mesh.position).negate().normalize();
        const up = m.id === 'moon' ? new V3(0, 1, 0) : P.pole.clone();
        const ey = up.sub(ex.clone().multiplyScalar(up.dot(ex))).normalize();
        M.mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(ex.clone(), ey, new V3().crossVectors(ex, ey)));
      }
    }
    if (P.update) P.update(jd, dtSim);
  }
};

/* ---------------- EARTH ORBITERS ---------------- */
O.buildEarthOrbiters = function (P) {
  P.sats = [];
  const satGeo = new THREE.OctahedronGeometry(1, 0);
  const glowTex = O.glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.15)', 64);
  for (const s of O.SATS) {
    let rec = null;
    try { rec = satellite.twoline2satrec(s.l1, s.l2); } catch (e) { rec = null; }
    const g = new THREE.Group();
    const mesh = O.buildSatModel(O.SAT_TYPES[s.id] || 'eo');
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, color: new THREE.Color(s.c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
    g.add(mesh); g.add(spr);
    P.sys.add(g);
    const orbit = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: new THREE.Color(s.c), transparent: true, opacity: 0.35}));
    orbit.frustumCulled = false; P.sys.add(orbit);
    const S1 = {s, rec, g, mesh, spr, orbit, lastOrbit: -1e9, state: null, disp: 0.01};
    P.sats.push(S1);
    O.addPick(s.id, g, () => Math.max(P.r * 0.02, S1.disp * 0.5), {kind: 'sat', label: s.name, parent: 'earth', sat: S1});
  }
  // ground track for selected sat (on spinning Earth)
  P.track = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({color: 0xffc061, dashSize: 0.02, gapSize: 0.015, transparent: true, opacity: 0.85}));
  P.track.frustumCulled = false; P.tilt.add(P.track);

  // Starlink shell — ILLUSTRATIVE distribution (53°, 550 km), not real positions
  const n = 1600, sp = new Float32Array(n * 3), sc = new Float32Array(n * 3), ss = new Float32Array(n), sd = new Float32Array(n * 2);
  const R = O.makeNoise(77).rnd;
  for (let i = 0; i < n; i++) { sd[i * 2] = Math.floor(R() * 72) / 72 * Math.PI * 2; sd[i * 2 + 1] = R() * Math.PI * 2; sc.set([0.75, 0.8, 0.9], i * 3); ss[i] = 0.6; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(sp, 3)); g.setAttribute('color', new THREE.BufferAttribute(sc, 3)); g.setAttribute('size', new THREE.BufferAttribute(ss, 1));
  P.shell = new THREE.Points(g, O.pointsMaterial({scale: 6, max: 3, opacity: 0.6})); P.shell.visible = false; P.shell.frustumCulled = false;
  P.sys.add(P.shell); P.shellSeed = sd;

  // L1 / L2 observatories (positions along Sun line; halo orbits not modelled)
  P.lpts = [];
  for (const L of [{id: 'jwst', name: 'James Webb Space Telescope', side: 1, c: '#ffd27a', desc: 'Orbits the Sun–Earth L2 point ≈ 1.5 million km beyond Earth (on the night side), in a large halo orbit. 6.5 m gold-coated beryllium mirror; observes in infrared since 2022.'},
    {id: 'aditya', name: 'Aditya-L1', side: -1, c: '#9fe0b0', desc: 'ISRO\'s first solar observatory, in a halo orbit around the Sun–Earth L1 point ≈ 1.5 million km sunward since January 2024. Seven instruments study the corona, CMEs and solar wind.'}]) {
    const gg = new THREE.Group();
    const model = O.buildSatModel(L.id); gg.add(model);
    const s2 = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, color: new THREE.Color(L.c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true})); gg.add(s2);
    P.sys.add(gg); const LP = {L, g: gg, model, spr: s2, disp: 0.01}; P.lpts.push(LP);
    O.addPick(L.id, gg, () => Math.max(P.r * 0.03, LP.disp * 0.5), {kind: 'lpoint', label: L.name, parent: 'earth', lp: L});
  }

  P.update = function (jd) {
    const r = P.r, k = r / 6371;
    const date = new Date((jd - 2440587.5) * 86400000);
    const tooFar = Math.abs(jd - O.realJD()) > 45;
    P.satsStale = tooFar;
    const gmst = satellite.gstime(date);
    for (const S1 of P.sats) {
      if (!S1.rec || tooFar) { S1.g.visible = false; S1.orbit.visible = false; S1.state = null; continue; }
      const pv = satellite.propagate(S1.rec, date);
      if (!pv || !pv.position || isNaN(pv.position.x)) { S1.g.visible = false; S1.state = null; continue; }
      S1.g.visible = O.layers.sats;
      const p = pv.position;
      const q0 = Math.hypot(p.x, p.y, p.z) / 6371, kk = k * O.moonDistFactor(q0 * 6371, 6371) / q0;
      O.eqToScene(p.x * kk, p.y * kk, p.z * kk, S1.g.position);
      const wpos = tmp2.copy(S1.g.position).add(P.sys.position), vs = O.S.camera.position.distanceTo(wpos);
      const focused = O.state.focus === S1.s.id;
      const disp = focused ? vs * 0.16 : Math.max(r * 0.004, vs * 0.022);  // not to scale: magnified to be visible
      S1.disp = disp;
      S1.mesh.scale.setScalar(disp / S1.mesh.userData.size);
      S1.spr.scale.setScalar(vs * 0.03); S1.spr.material.opacity = focused ? 0 : Math.min(0.9, Math.max(0.15, (vs - r * 0.6) / (r * 3)));
      O.orientSatModel(S1.mesh, S1.g.position, O.eqToScene(pv.velocity.x, pv.velocity.y, pv.velocity.z, new V3()), wpos.clone().negate());
      const gd = satellite.eciToGeodetic(p, gmst);
      const v = pv.velocity;
      S1.state = {lat: satellite.degreesLat(gd.latitude), lon: satellite.degreesLong(gd.longitude), alt: gd.height, speed: Math.hypot(v.x, v.y, v.z), periodMin: 2 * Math.PI / S1.rec.no};
      // orbit path, refreshed every few sim minutes or on demand
      if (Math.abs(jd - S1.lastOrbit) > 0.004 || S1.dirty) {
        const pts = [], per = S1.state.periodMin;
        for (let i = 0; i <= 160; i++) {
          const dd = new Date(date.getTime() + (i / 160) * per * 60000);
          const q = satellite.propagate(S1.rec, dd).position; if (!q) continue;
          const q1 = Math.hypot(q.x, q.y, q.z) / 6371, k1 = k * O.moonDistFactor(q1 * 6371, 6371) / q1;
          pts.push(O.eqToScene(q.x * k1, q.y * k1, q.z * k1, new V3()));
        }
        S1.orbit.geometry.dispose(); S1.orbit.geometry = new THREE.BufferGeometry().setFromPoints(pts);
        S1.lastOrbit = jd; S1.dirty = false;
      }
      S1.orbit.visible = O.layers.sats && (O.layers.satOrbits || O.state.selected === S1.s.id);
      S1.orbit.material.opacity = O.state.selected === S1.s.id ? 0.9 : 0.22;
    }
    // ground track
    const sel = O.state.selected && O.S.objects[O.state.selected];
    if (sel && sel.kind === 'sat' && sel.sat.rec && !tooFar) {
      if (Math.abs(jd - (P.trackJD || 0)) > 0.002 || P.trackId !== sel.id) {
        const pts = [], per = sel.sat.state ? sel.sat.state.periodMin : 95;
        let prevLon = null;
        for (let i = -60; i <= 120; i++) {
          const dd = new Date(date.getTime() + i / 60 * per * 60000);
          const pv2 = satellite.propagate(sel.sat.rec, dd); if (!pv2.position) continue;
          const gd2 = satellite.eciToGeodetic(pv2.position, satellite.gstime(dd));
          const la = gd2.latitude, lo = gd2.longitude;
          pts.push(new V3(Math.cos(la) * Math.cos(lo) * 1.003, Math.sin(la) * 1.003, -Math.cos(la) * Math.sin(lo) * 1.003));
          prevLon = lo;
        }
        P.track.geometry.dispose(); P.track.geometry = new THREE.BufferGeometry().setFromPoints(pts); P.track.computeLineDistances();
        P.trackJD = jd; P.trackId = sel.id;
      }
      P.track.visible = true;
    } else P.track.visible = false;
    // Starlink shell (illustrative)
    P.shell.visible = O.layers.shell && !tooFar;
    if (P.shell.visible) {
      const a = P.shell.geometry.attributes.position.array, rr = O.moonDistFactor(6371 + 550, 6371) * r, inc = 53 * O.D2R;
      const n0 = 2 * Math.PI / (95.6 * 60) * 86400; // rad/day
      for (let i = 0; i < a.length / 3; i++) {
        const raan = P.shellSeed[i * 2], u = P.shellSeed[i * 2 + 1] + n0 * (jd - 2461000);
        const x = Math.cos(raan) * Math.cos(u) - Math.sin(raan) * Math.sin(u) * Math.cos(inc);
        const y = Math.sin(raan) * Math.cos(u) + Math.cos(raan) * Math.sin(u) * Math.cos(inc);
        const z = Math.sin(u) * Math.sin(inc);
        O.eqToScene(x * rr, y * rr, z * rr, tmp); a[i * 3] = tmp.x; a[i * 3 + 1] = tmp.y; a[i * 3 + 2] = tmp.z;
      }
      P.shell.geometry.attributes.position.needsUpdate = true;
      P.shell.material.uniforms.uScale.value = 6 * r;
    }
    // L1/L2 along Sun line
    const sunDir = tmp.copy(P.sys.position).negate().normalize();
    const lf = O.moonDistFactor(1.5e6, 6371) * r;
    for (const q of P.lpts) {
      q.g.position.copy(sunDir).multiplyScalar(-q.L.side * lf);
      q.g.visible = O.layers.sats;
      const wpos = tmp2.copy(q.g.position).add(P.sys.position), vs = O.S.camera.position.distanceTo(wpos);
      const focused = O.state.focus === q.L.id, disp = focused ? vs * 0.16 : Math.max(r * 0.01, vs * 0.025);
      q.disp = disp; q.model.scale.setScalar(disp / q.model.userData.size);
      q.spr.scale.setScalar(vs * 0.03); q.spr.material.opacity = focused ? 0 : 0.7;
      O.orientSatModel(q.model, q.g.position, null, wpos.clone().negate());
    }
  };
};

/* ---------------- BELTS (GPU-animated Keplerian particles) ---------------- */
function beltMaterial(color, size) {
  return new THREE.ShaderMaterial({
    uniforms: {uD: {value: 0}, uTrue: {value: 0}, uK: {value: O.TRUE_K}, uC: {value: new THREE.Color(color)}, uSize: {value: size}, uOp: {value: 0.7}},
    vertexShader: `${O.SH.VHEAD}
    attribute vec4 el; attribute float bright; // a, e, inc, node ; phase in position.x
    uniform float uD, uTrue, uK, uSize; varying float vB;
    float mapAU(float r){ if (uTrue > 0.5) return r*uK; return 14.0 + 40.0*pow(r, 0.6); }
    void main(){
      float a = el.x, e = el.y, inc = el.z, node = el.w;
      float n = 0.01720209895 / pow(a, 1.5);
      float M = position.x + n*uD; float E = M + e*sin(M); E = M + e*sin(E);
      float xp = a*(cos(E)-e), yp = a*sqrt(1.0-e*e)*sin(E);
      float w = position.y;
      float cw = cos(w), sw = sin(w), cN = cos(node), sN = sin(node), cI = cos(inc), sI = sin(inc);
      vec3 ecl = vec3((cw*cN - sw*sN*cI)*xp + (-sw*cN - cw*sN*cI)*yp, (cw*sN + sw*cN*cI)*xp + (-sw*sN + cw*cN*cI)*yp, (sw*sI)*xp + (cw*sI)*yp);
      float r = length(ecl);
      vec3 p = ecl / r * mapAU(r);
      vec3 sp = vec3(p.x, p.z, -p.y);
      vec4 mv = modelViewMatrix * vec4(sp, 1.0);
      gl_PointSize = clamp(uSize * bright * 300.0 / -mv.z, 0.8, 4.0);
      vB = bright;
      gl_Position = projectionMatrix * mv;
      ${O.SH.VTAIL}
    }`,
    fragmentShader: `${O.SH.FHEAD}
    uniform vec3 uC; uniform float uOp; varying float vB;
    void main(){ vec2 d = gl_PointCoord-0.5; float r = length(d); if (r>0.5) discard; gl_FragColor = vec4(uC*(0.6+vB*0.6), smoothstep(0.5,0.1,r)*uOp); ${O.SH.FTAIL} }`,
    transparent: true, depthWrite: false
  });
}
function makeBelt(n, gen, color, size) {
  const pos = new Float32Array(n * 3), el = new Float32Array(n * 4), br = new Float32Array(n);
  for (let i = 0; i < n; i++) { const o = gen(i); pos[i * 3] = o.M; pos[i * 3 + 1] = o.w; el.set([o.a, o.e, o.i, o.node], i * 4); br[i] = o.b; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('el', new THREE.BufferAttribute(el, 4)); g.setAttribute('bright', new THREE.BufferAttribute(br, 1));
  const p = new THREE.Points(g, beltMaterial(color, size)); p.frustumCulled = false; S.scene.add(p);
  return p;
}
function buildBelts() {
  const R = O.makeNoise(42).rnd;
  const gaps = [2.50, 2.82, 2.95, 3.27];
  S.belt = makeBelt(7000, () => {
    let a; do { a = 2.1 + Math.pow(R(), 0.9) * 1.25; } while (gaps.some((g) => Math.abs(a - g) < 0.025 * (0.4 + R())));
    return {a, e: R() * 0.18, i: (R() * R()) * 0.30, node: R() * 6.283, w: R() * 6.283, M: R() * 6.283, b: 0.3 + R() * 0.7};
  }, '#a99a86', 0.010);
  S.kuiper = makeBelt(5000, () => {
    const plutino = R() < 0.25;
    const a = plutino ? 39.4 + (R() - 0.5) * 0.6 : 42 + R() * 6;
    return {a, e: plutino ? 0.1 + R() * 0.2 : R() * 0.1, i: R() * R() * 0.5, node: R() * 6.283, w: R() * 6.283, M: R() * 6.283, b: 0.2 + R() * 0.7};
  }, '#8aa2c8', 0.06);
  // Trojans (L4/L5 of Jupiter): approximated as Jupiter's orbit ±60°
  const J = O.ELEMENTS.jupiter;
  S.trojans = makeBelt(1600, (i) => {
    const L0 = (J[3] - J[4]) * O.D2R + (i % 2 ? 1 : -1) * Math.PI / 3;
    return {a: 5.2 + (R() - 0.5) * 0.2, e: R() * 0.1, i: R() * 0.25, node: J[5] * O.D2R + (R() - 0.5) * 0.3, w: (J[4] - J[5]) * O.D2R, M: L0 + (R() - 0.5) * 0.5, b: 0.3 + R() * 0.5};
  }, '#b9a27a', 0.012);
  O.addPick('asteroidbelt', makeAnchor(2.7, 30), () => 1, {kind: 'region', label: 'Asteroid Belt', region: 'belt', nolabel: true});
  O.addPick('kuiperbelt', makeAnchor(44, 200), () => 1, {kind: 'region', label: 'Kuiper Belt', region: 'kuiper', nolabel: true});
}
function makeAnchor(au, deg) { const g = new THREE.Group(); g.userData.au = au; g.userData.deg = deg; S.scene.add(g); S.tick.push(() => { O.eclToScene(0, 0, 0, g.position); const r = O.mapAU(au); const a = deg * O.D2R; g.position.set(r * Math.cos(a), 0, -r * Math.sin(a)); }); return g; }

O.updateBelts = function (jd) {
  for (const b of [S.belt, S.kuiper, S.trojans]) {
    const u = b.material.uniforms; u.uD.value = jd - 2451545.0; u.uTrue.value = O.scale.mode === 'true' ? 1 : 0;
  }
};

/* ---------------- COMET HALLEY ---------------- */
function buildComet() {
  const g = new THREE.Group(); S.scene.add(g);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({color: 0xdfe8ff}));
  g.add(nuc);
  const n = 900, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), siz = new Float32Array(n), seed = new Float32Array(n * 3);
  const R = O.makeNoise(3).rnd;
  for (let i = 0; i < n; i++) { seed.set([R(), (R() - 0.5), (R() - 0.5)], i * 3); col.set(i % 3 ? [0.55, 0.75, 1.0] : [1.0, 0.95, 0.85], i * 3); siz[i] = 0.4 + R() * 0.8; }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  const tail = new THREE.Points(tg, O.pointsMaterial({scale: 120, max: 6, opacity: 0.6})); tail.frustumCulled = false;
  S.scene.add(tail);
  const orbit = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: 0x6fa0c8, transparent: true, opacity: 0.25}));
  orbit.frustumCulled = false; S.scene.add(orbit);
  S.comet = {g, nuc, tail, orbit, seed};
  O.addPick('halley', g, () => 0.3, {kind: 'comet', label: '1P/Halley'});
  S.tick.push((t, jd) => {
    const e = O.cometEcl(O.COMETS.halley, jd); S.comet.ecl = e;
    O.mapVec(e, g.position);
    const rAU = Math.hypot(e[0], e[1], e[2]);
    nuc.scale.setScalar(Math.max(0.015, O.S.camera.position.distanceTo(g.position) * 0.004));
    const away = tmp.copy(g.position).normalize();
    const L = Math.min(40, 6 / (rAU * rAU)) * (O.scale.mode === 'true' ? 2 : 1);
    const a = tg.attributes.position.array;
    for (let i = 0; i < n; i++) {
      const f = (seed[i * 3] + t * 0.05) % 1;
      const spread = f * L * 0.18;
      a[i * 3] = g.position.x + away.x * f * L + seed[i * 3 + 1] * spread;
      a[i * 3 + 1] = g.position.y + away.y * f * L + seed[i * 3 + 2] * spread;
      a[i * 3 + 2] = g.position.z + away.z * f * L + (seed[i * 3 + 1] - seed[i * 3 + 2]) * spread;
    }
    tg.attributes.position.needsUpdate = true;
    tail.visible = L > 0.05;
  });
}

/* ---------------- VOYAGERS ---------------- */
function buildProbes() {
  S.probes = [];
  const tex = O.glowTexture('rgba(255,255,255,1)', 'rgba(150,200,255,0.2)', 64);
  for (const p of O.PROBES) {
    const g = new THREE.Group(); S.scene.add(g);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, color: 0xbfe0ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
    g.add(spr);
    const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({color: 0x7fa6d8, dashSize: 4, gapSize: 4, transparent: true, opacity: 0.4}));
    line.frustumCulled = false; S.scene.add(line);
    const dir = O.radecToScene(p.ra, p.dec, new V3()).normalize();
    const P = {p, g, spr, line, dir};
    S.probes.push(P);
    O.addPick(p.id, g, () => 2, {kind: 'probe', label: p.name, probe: P});
    S.tick.push((t, jd) => {
      const yrs = (jd - 2460310.5) / 365.25; // since 2024-01-01
      const au = p.d0 + p.v * yrs; P.au = au;
      g.position.copy(dir).multiplyScalar(O.mapAU(au));
      const cd = O.S.camera.position.distanceTo(g.position);
      spr.scale.setScalar(Math.max(1.5, cd * 0.012));
      line.geometry.dispose(); line.geometry = new THREE.BufferGeometry().setFromPoints([dir.clone().multiplyScalar(O.mapAU(5)), g.position.clone()]);
      line.computeLineDistances();
    });
  }
}

/* ---------------- HELIOSPHERE ---------------- */
function buildHeliosphere() {
  const mk = (color, k) => new THREE.ShaderMaterial({
    uniforms: {uC: {value: new THREE.Color(color)}, uK: {value: k}},
    vertexShader: `${O.SH.VHEAD} varying vec3 vN; varying vec3 vWP; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 wp = modelMatrix*vec4(position,1.0); vWP = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; ${O.SH.VTAIL} }`,
    fragmentShader: `${O.SH.FHEAD} uniform vec3 uC; uniform float uK; varying vec3 vN; varying vec3 vWP; void main(){ vec3 V = normalize(cameraPosition - vWP); float f = pow(1.0-abs(dot(normalize(vN),V)), 3.0); gl_FragColor = vec4(uC, f*uK); ${O.SH.FTAIL} }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const hp = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mk('#3f7fd8', 0.55));
  const ts = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mk('#7a5fd0', 0.25));
  S.scene.add(hp); S.scene.add(ts);
  // heliosphere is elongated downwind (tail roughly toward RA≈75°, Dec≈+17° opposite the interstellar inflow from ≈ RA 255°, Dec −17°)
  const nose = O.radecToScene(255.7, -17.0, new V3()).normalize();
  S.helio = {hp, ts, nose};
  const anchor = new THREE.Group(); S.scene.add(anchor);
  O.addPick('heliopause', anchor, () => 1, {kind: 'region', label: 'Heliopause', region: 'helio', nolabel: true});
  S.tick.push(() => {
    const r = O.mapAU(120), r2 = O.mapAU(90);
    hp.scale.setScalar(r); ts.scale.setScalar(r2);
    hp.visible = ts.visible = O.layers.helio;
    const cd = O.S.camera.position.length(), fade = Math.max(0.12, Math.min(1, 1.6 - cd / (r * 2.2)));
    hp.material.uniforms.uK.value = 0.55 * fade; ts.material.uniforms.uK.value = 0.25 * fade;
    anchor.position.copy(nose).multiplyScalar(r);
  });
  // Oort cloud — schematic shell
  const n = 6000, p = new Float32Array(n * 3), c = new Float32Array(n * 3), s = new Float32Array(n), R = O.makeNoise(8).rnd;
  for (let i = 0; i < n; i++) { const v = new V3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize(); const au = Math.pow(10, 3.3 + R() * 1.7); p.set([v.x, v.y, v.z, au].slice(0, 3), i * 3); s[i] = au; c.set([0.45, 0.55, 0.75], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p.slice(), 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n).fill(1.2), 1));
  const oort = new THREE.Points(g, O.pointsMaterial({scale: 250, max: 3, opacity: 0.35})); oort.frustumCulled = false; S.scene.add(oort);
  S.oort = {pts: oort, dir: p, au: s};
  const oa = new THREE.Group(); S.scene.add(oa);
  O.addPick('oort', oa, () => 1, {kind: 'region', label: 'Oort Cloud', region: 'oort', nolabel: true});
  S.tick.push(() => {
    const a = g.attributes.position.array;
    for (let i = 0; i < n; i++) { const m = O.mapAU(s[i]); a[i * 3] = p[i * 3] * m; a[i * 3 + 1] = p[i * 3 + 1] * m; a[i * 3 + 2] = p[i * 3 + 2] * m; }
    g.attributes.position.needsUpdate = true;
    oort.visible = O.layers.helio;
    oa.position.set(0, O.mapAU(20000), 0);
  });
}

/* ---------------- deferred job queue ---------------- */
const jobs = [];
O.queueJob = (fn, front) => { front ? jobs.unshift(fn) : jobs.push(fn); };
O.runJobs = function (budgetMs) {
  const t0 = performance.now();
  while (jobs.length && performance.now() - t0 < budgetMs) {
    const j = jobs[0];
    try {
      if (j._it) { const r = j._it.next(); if (r.done) jobs.shift(); }
      else { const r = j(); if (r && typeof r.next === 'function') j._it = r; else jobs.shift(); }
    } catch (e) { console.error(e); jobs.shift(); }
  }
  return jobs.length;
};

})(window.ORR);
