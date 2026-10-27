/* ============================================================
   SATELLITE MODELS — procedural spacecraft built from real layouts.
   Model units: 1 = 100 m. Local frame: +Z = nadir (toward Earth),
   +Y = velocity, +X = array axis. Arrays rotate about X to face the Sun.
   ============================================================ */
(function (O) {
const V3 = THREE.Vector3;
let M = null;
function mats() {
  if (M) return M;
  const cnv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
  const cells = (base, line, cols, rows) => cnv(256, 128, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const g = x.createLinearGradient(0, 0, w / cols, h / rows); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.10)'); x.fillStyle = g; x.fillRect(i * w / cols + 1, j * h / rows + 1, w / cols - 2, h / rows - 2); }
    x.strokeStyle = line; x.lineWidth = 1.2; for (let i = 0; i <= cols; i++) { x.beginPath(); x.moveTo(i * w / cols, 0); x.lineTo(i * w / cols, h); x.stroke(); } for (let j = 0; j <= rows; j++) { x.beginPath(); x.moveTo(0, j * h / rows); x.lineTo(w, j * h / rows); x.stroke(); }
  });
  const foil = cnv(128, 128, (x, w, h) => { x.fillStyle = '#c99a2e'; x.fillRect(0, 0, w, h); for (let k = 0; k < 260; k++) { x.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,235,170' : '90,60,10'},${0.15 + Math.random() * 0.25})`; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); const a = Math.random() * w, b = Math.random() * h; x.moveTo(a, b); x.lineTo(a + (Math.random() - 0.5) * 40, b + (Math.random() - 0.5) * 40); x.stroke(); } });
  const silverFoil = cnv(128, 128, (x, w, h) => { x.fillStyle = '#b9bec6'; x.fillRect(0, 0, w, h); for (let k = 0; k < 200; k++) { x.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '60,66,76'},${0.12 + Math.random() * 0.2})`; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); const a = Math.random() * w, b = Math.random() * h; x.moveTo(a, b); x.lineTo(a + (Math.random() - 0.5) * 30, b + (Math.random() - 0.5) * 30); x.stroke(); } });
  M = {
    solarBlue: new THREE.MeshStandardMaterial({map: cells('#16244a', '#8fa6c9', 8, 4), metalness: 0.4, roughness: 0.35, side: THREE.DoubleSide}),
    solarCopper: new THREE.MeshStandardMaterial({map: cells('#6b3d1d', '#d9a36a', 12, 3), metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide}),
    solarDark: new THREE.MeshStandardMaterial({map: cells('#0d1320', '#3c4a63', 10, 2), metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide}),
    gold: new THREE.MeshStandardMaterial({map: foil, metalness: 0.8, roughness: 0.42, color: 0x9a8150}),
    silver: new THREE.MeshStandardMaterial({map: silverFoil, metalness: 0.8, roughness: 0.3}),
    white: new THREE.MeshStandardMaterial({color: 0xe8ebef, metalness: 0.1, roughness: 0.6}),
    grey: new THREE.MeshStandardMaterial({color: 0x8a9099, metalness: 0.6, roughness: 0.45}),
    dark: new THREE.MeshStandardMaterial({color: 0x23272e, metalness: 0.5, roughness: 0.5}),
    mirror: new THREE.MeshStandardMaterial({color: 0xf2c14e, metalness: 1.0, roughness: 0.15, side: THREE.DoubleSide}),
    shield: new THREE.MeshStandardMaterial({color: 0xb7a9c9, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.95})
  };
  return M;
}
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const cyl = (r, l, m, seg) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg || 20), m);
/* a solar wing: pivot at root, extends along +X (or -X), panel normal ±Z before tracking */
function wing(len, wid, mat, dir) {
  const piv = new THREE.Group();
  const p = new THREE.Mesh(new THREE.PlaneGeometry(len, wid), mat); p.position.x = dir * (len / 2 + 0.002); piv.add(p);
  const boom = box(len, 0.002, 0.002, M.grey); boom.position.x = dir * len / 2; piv.add(boom);
  piv.userData.track = true; return piv;
}

O.buildSatModel = function (type) {
  mats();
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const arrays = [];
  const addWing = (parent, x, y, z, len, wid, mat, dir) => { const w = wing(len, wid, mat, dir); w.position.set(x, y, z); parent.add(w); arrays.push(w); return w; };
  if (type === 'iss') {
    body.add(box(1.09, 0.05, 0.05, M.grey));                               // integrated truss (109 m)
    for (const sx of [-1, 1]) for (const k of [0.36, 0.48]) for (const sy of [-1, 1]) {
      const piv = new THREE.Group(); piv.position.set(sx * k, 0, 0); body.add(piv); arrays.push(piv); piv.userData.track = true;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.115, 0.345), M.solarCopper); p.position.y = sy * 0.2; piv.add(p);
      const roll = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.2), M.solarDark); roll.position.set(0, sy * 0.13, 0.004); piv.add(roll); // iROSA overlay
    }
    const mods = [[0, 0.06, 0.09, 0.022], [0, -0.06, 0.09, 0.022], [0, 0.17, 0.12, 0.021], [0, -0.17, 0.11, 0.021], [0, 0.26, 0.07, 0.02], [0, -0.27, 0.13, 0.021]];
    for (const [x, y, l, r] of mods) { const c = cyl(r, l, M.white); c.position.set(x, y, 0.045); body.add(c); }
    const node = cyl(0.023, 0.06, M.white); node.rotation.z = Math.PI / 2; node.position.set(0, 0.17, 0.045); body.add(node);
    const lab = cyl(0.022, 0.09, M.white); lab.rotation.z = Math.PI / 2; lab.position.set(0.07, 0.17, 0.045); body.add(lab);
    const lab2 = cyl(0.022, 0.08, M.white); lab2.rotation.z = Math.PI / 2; lab2.position.set(-0.07, 0.17, 0.045); body.add(lab2);
    for (const sx of [-1, 1]) { const rad = box(0.0015, 0.16, 0.1, M.white); rad.position.set(sx * 0.15, 0, -0.07); body.add(rad); const rad2 = box(0.0015, 0.16, 0.1, M.white); rad2.position.set(sx * 0.22, 0, -0.07); body.add(rad2); }
    for (const sy of [-1, 1]) { const pv = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.14), M.solarBlue); pv.position.set(0, -0.27 + sy * 0.0, 0.045); pv.rotation.y = Math.PI / 2; pv.position.x = sy * 0.09; body.add(pv); }
  } else if (type === 'tiangong') {
    const core = cyl(0.021, 0.167, M.white); core.position.set(0, 0, 0); body.add(core);
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 12), M.white); hub.position.y = 0.09; body.add(hub);
    for (const sx of [-1, 1]) {
      const m = cyl(0.021, 0.178, M.white); m.rotation.z = Math.PI / 2; m.position.set(sx * 0.11, 0.09, 0); body.add(m);
      addWing(body, sx * 0.2, 0.09, 0, 0.27, 0.042, M.solarBlue, sx);
    }
    for (const sx of [-1, 1]) addWing(body, sx * 0.022, -0.04, 0, 0.12, 0.035, M.solarBlue, sx);
  } else if (type === 'hubble') {
    const tube = cyl(0.021, 0.095, M.silver, 28); body.add(tube);
    const aft = cyl(0.021, 0.035, M.grey, 28); aft.position.y = -0.065; body.add(aft);
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.021, 28), M.silver); door.position.set(0, 0.048, 0.016); door.rotation.x = -1.0; body.add(door);
    for (const sx of [-1, 1]) addWing(body, sx * 0.023, -0.02, 0, 0.071, 0.026, M.solarBlue, sx);
    const ant = cyl(0.002, 0.03, M.grey); ant.rotation.x = Math.PI / 2; ant.position.set(0, 0.02, 0.03); body.add(ant);
  } else if (type === 'geo') {
    body.add(box(0.03, 0.03, 0.035, M.gold));
    addWing(body, 0.016, 0, 0, 0.13, 0.026, M.solarBlue, 1);
    const boom = box(0.06, 0.0015, 0.0015, M.grey); boom.position.x = -0.045; body.add(boom);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.02), M.white); sail.position.x = -0.075; body.add(sail);
    const imager = box(0.014, 0.014, 0.012, M.white); imager.position.z = 0.023; body.add(imager);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 8, 0, Math.PI * 2, 0, 1.0), M.white); dish.position.set(0.009, 0.012, 0.022); dish.rotation.x = Math.PI / 2; body.add(dish);
  } else if (type === 'nav') {
    body.add(box(0.022, 0.02, 0.025, M.gold));
    for (const sx of [-1, 1]) addWing(body, sx * 0.012, 0, 0, 0.055, 0.022, M.solarBlue, sx);
    const arr = box(0.018, 0.016, 0.002, M.white); arr.position.z = 0.0135; body.add(arr);
    for (let i = 0; i < 12; i++) { const h = cyl(0.0012, 0.004, M.grey, 6); h.rotation.x = Math.PI / 2; h.position.set(-0.006 + (i % 4) * 0.004, -0.005 + Math.floor(i / 4) * 0.005, 0.016); body.add(h); }
  } else if (type === 'eo') {
    body.add(box(0.025, 0.035, 0.03, M.silver));
    const ins = box(0.016, 0.018, 0.014, M.gold); ins.position.z = 0.021; body.add(ins);
    const lens = cyl(0.005, 0.006, M.dark); lens.rotation.x = Math.PI / 2; lens.position.z = 0.03; body.add(lens);
    addWing(body, 0.013, 0, 0, 0.07, 0.024, M.solarBlue, 1);
  } else if (type === 'starlink' || type === 'starlink2') {
    const v2 = type === 'starlink2';
    body.add(box(v2 ? 0.041 : 0.028, v2 ? 0.027 : 0.014, 0.003, M.grey));
    const ant = box(v2 ? 0.035 : 0.024, v2 ? 0.022 : 0.012, 0.001, M.white); ant.position.z = 0.002; body.add(ant);
    if (v2) { addWing(body, 0.021, 0, 0, 0.13, 0.04, M.solarDark, 1); addWing(body, -0.021, 0, 0, 0.13, 0.04, M.solarDark, -1); }
    else addWing(body, 0.014, 0, 0, 0.09, 0.028, M.solarDark, 1);
  } else if (type === 'jwst') {
    // five-layer kite-shaped sunshield (21 × 14 m) with gold 18-segment primary mirror above
    const shape = new THREE.Shape(); shape.moveTo(-0.105, 0); shape.lineTo(0, 0.07); shape.lineTo(0.105, 0); shape.lineTo(0, -0.07); shape.closePath();
    const sg = new THREE.ShapeGeometry(shape);
    for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(sg, M.shield); s.rotation.x = -Math.PI / 2; s.position.y = -0.004 * i; s.scale.setScalar(1 - i * 0.02); body.add(s); }
    const hexR = 0.0078, mg = new THREE.CircleGeometry(hexR * 0.96, 6);
    const mirror = new THREE.Group(); mirror.position.set(0, 0.045, 0.0); mirror.rotation.x = -Math.PI / 2 + 0.25;
    for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {      // 18 segments: hex rings 1 and 2
      if (Math.abs(q + r) > 2 || (q === 0 && r === 0)) continue;
      const m = new THREE.Mesh(mg, M.mirror); m.position.set(hexR * 1.5 * q, hexR * Math.sqrt(3) * (r + q / 2), 0); mirror.add(m);
    }
    body.add(mirror);
    const tower = box(0.006, 0.04, 0.006, M.dark); tower.position.set(0, 0.022, 0); body.add(tower);
    for (let k = 0; k < 3; k++) { const a = k * 2 * Math.PI / 3; const st = cyl(0.0007, 0.075, M.dark, 6); st.rotation.x = Math.PI / 2; st.position.set(Math.cos(a) * 0.01, Math.sin(a) * 0.01, 0.037); mirror.add(st); }
    const sec = new THREE.Mesh(new THREE.CircleGeometry(0.004, 6), M.mirror); sec.position.set(0, 0, 0.074); sec.rotation.x = Math.PI; mirror.add(sec);
    const bus = box(0.03, 0.012, 0.03, M.dark); bus.position.y = -0.03; body.add(bus);
    const pan = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.025), M.solarBlue); pan.position.set(0, -0.037, -0.03); pan.rotation.x = Math.PI / 2; body.add(pan);
    g.userData.jwst = true;
  } else if (type === 'aditya') {
    body.add(box(0.024, 0.024, 0.024, M.gold));
    for (const sx of [-1, 1]) addWing(body, sx * 0.013, 0, 0, 0.05, 0.022, M.solarBlue, sx);
    const tel = cyl(0.005, 0.02, M.white); tel.rotation.x = Math.PI / 2; tel.position.set(0, 0, -0.02); body.add(tel);
  }
  const bb = new THREE.Box3().setFromObject(g); const sz = bb.getSize(new V3());
  g.userData.size = Math.max(sz.x, sz.y, sz.z) || 0.05;
  g.userData.arrays = arrays;
  return g;
};

/* orient: +Z toward Earth centre, +Y along velocity; arrays turn about X to face the Sun */
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
O.orientSatModel = function (model, posLocal, velLocal, sunDirWorld) {
  const z = posLocal.clone().negate().normalize();
  let y = velLocal ? velLocal.clone().sub(z.clone().multiplyScalar(velLocal.dot(z))).normalize() : new V3(0, 1, 0);
  if (!isFinite(y.x) || y.lengthSq() < 1e-6) y = new V3(0, 1, 0).sub(z.clone().multiplyScalar(z.y)).normalize();
  const x = new V3().crossVectors(y, z);
  _m.makeBasis(x, y, z); model.quaternion.setFromRotationMatrix(_m);
  if (model.userData.jwst) { // sunshield faces the Sun
    model.quaternion.setFromUnitVectors(new V3(0, -1, 0), sunDirWorld.clone().normalize()); return;
  }
  const sLocal = sunDirWorld.clone().applyQuaternion(_q.copy(model.quaternion).invert());
  const ang = Math.atan2(-sLocal.y, sLocal.z);
  for (const a of model.userData.arrays) a.rotation.x = ang;
};

O.SAT_TYPES = {iss: 'iss', css: 'tiangong', hst: 'hubble', insat3dr: 'geo', irnss1i: 'nav', cartosat3: 'eo', goes16: 'geo', goes18: 'geo', gps72: 'nav', sentinel2a: 'eo', aqua: 'eo', sl32298: 'starlink2', sl1063: 'starlink', jwst: 'jwst', aditya: 'aditya'};
})(window.ORR);
