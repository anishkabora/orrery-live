/* ============================================================
   SIMULATIONS — interactions you can run
   merger:  Milky Way × Andromeda, restricted N-body + dynamical friction
   sandbox: black-hole gravity sandbox (tidal disruption, capture)
   supernova: Betelgeuse core-collapse sequence (in place)
   ============================================================ */
(function (O) {
const V3 = THREE.Vector3;
const SIM = O.SIM = {active: null};

/* ---------------- MERGER ---------------- */
function makeMerger() {
  const scene = new THREE.Scene();
  const N1 = 5200, N2 = 6400, N = N1 + N2;
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N);
  const cores = [{m: 1.0, p: new V3(), v: new V3(), eps: 0.35}, {m: 1.4, p: new V3(), v: new V3(), eps: 0.4}];
  const R = O.makeNoise(2025).rnd;
  function disk(off, startIdx, n, core, normal, colA, colB, scale) {
    const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), normal.clone().normalize());
    for (let i = 0; i < n; i++) {
      const bulge = R() < 0.15;
      const r = bulge ? Math.pow(R(), 2) * 0.6 * scale : scale * (0.4 + -Math.log(1 - R() * 0.95) * 0.9);
      const a = R() * Math.PI * 2;
      const p = new V3(Math.cos(a) * r, (R() - 0.5) * (bulge ? 0.4 : 0.06) * scale, Math.sin(a) * r);
      const vc = Math.sqrt(core.m * r * r / Math.pow(r * r + core.eps * core.eps, 1.5));
      const v = new V3(-Math.sin(a) * vc, 0, Math.cos(a) * vc);
      if (bulge) v.multiplyScalar(0.6).add(new V3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.3));
      p.applyQuaternion(q).add(core.p); v.applyQuaternion(q).add(core.v);
      const k = startIdx + i;
      pos.set([p.x, p.y, p.z], k * 3); vel.set([v.x, v.y, v.z], k * 3);
      const c = new THREE.Color(colA).lerp(new THREE.Color(colB), bulge ? 0 : Math.min(1, r / (scale * 2.5)));
      col.set([c.r * 0.55, c.g * 0.55, c.b * 0.55], k * 3); siz[k] = bulge ? 1.6 : 1.1 + R() * 0.8;
    }
  }
  function reset() {
    cores[0].p.set(-9, 0, -1.6); cores[0].v.set(0.155, 0, 0.0);
    cores[1].p.set(9 * 0.714, 0.6, 1.6 * 0.714); cores[1].v.set(-0.155 / 1.4, 0, 0.0);
    disk(0, 0, N1, cores[0], new V3(0.25, 1, 0.1), '#ffe2b0', '#9cc0ff', 1.0);
    disk(0, N1, N2, cores[1], new V3(-0.6, 0.8, 0.5), '#ffd29a', '#ffb3c8', 1.15);
    st.t = 0; geo.attributes.position.needsUpdate = true;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  const ptsM = new THREE.Points(geo, O.pointsMaterial({scale: 75, max: 8, opacity: 0.9})); ptsM.frustumCulled = false; scene.add(ptsM);
  const g1 = new THREE.Sprite(new THREE.SpriteMaterial({map: O.glowTexture('rgba(255,240,210,1)', 'rgba(255,200,140,0.2)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true})); g1.scale.setScalar(1.3);
  const g2 = g1.clone(); scene.add(g1); scene.add(g2);
  const sky = O.S.sky.clone(); scene.add(sky);
  const st = {t: 0, speed: 1, playing: true};
  reset();
  const TG = 0.11; // Gyr per sim time unit (calibrated so first passage ≈ 4–5 Gyr)
  function acc(px, py, pz, out) {
    out.set(0, 0, 0);
    for (const c of cores) { const dx = c.p.x - px, dy = c.p.y - py, dz = c.p.z - pz; const r2 = dx * dx + dy * dy + dz * dz + c.eps * c.eps; const f = c.m / (r2 * Math.sqrt(r2)); out.x += dx * f; out.y += dy * f; out.z += dz * f; }
    return out;
  }
  const a = new V3();
  function step(dt) {
    // cores: mutual gravity + approximate dynamical friction from overlapping dark-matter halos
    const d = new V3().subVectors(cores[1].p, cores[0].p), r = d.length();
    const f = 1 / Math.pow(r * r + 0.5, 1.5);
    const vrel = new V3().subVectors(cores[1].v, cores[0].v);
    const fric = 0.06 / (1 + r * r * 0.05);
    cores[0].v.addScaledVector(d, cores[1].m * f * dt).addScaledVector(vrel, fric * dt * cores[1].m / 2.4);
    cores[1].v.addScaledVector(d, -cores[0].m * f * dt).addScaledVector(vrel, -fric * dt * cores[0].m / 2.4);
    cores[0].p.addScaledVector(cores[0].v, dt); cores[1].p.addScaledVector(cores[1].v, dt);
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      acc(pos[k], pos[k + 1], pos[k + 2], a);
      vel[k] += a.x * dt; vel[k + 1] += a.y * dt; vel[k + 2] += a.z * dt;
      pos[k] += vel[k] * dt; pos[k + 1] += vel[k + 1] * dt; pos[k + 2] += vel[k + 2] * dt;
    }
    st.t += dt;
  }
  return {
    scene, title: 'Milky Way × Andromeda', cam: {dist: 34, phi: 0.75, theta: 0.4},
    blurb: 'Restricted N-body model: each galaxy is a disk of test stars around a massive core; halo dynamical friction lets the cores sink together. Stars almost never collide — the galaxies pass through each other.',
    controls: [{id: 'restart', label: 'Restart', fn: reset}],
    update(dt) {
      if (st.playing) { const n = Math.ceil(3 * st.speed); for (let i = 0; i < n; i++) step(0.03); geo.attributes.position.needsUpdate = true; }
      g1.position.copy(cores[0].p); g2.position.copy(cores[1].p);
      ptsM.material.uniforms.uTime.value += dt;
      const sep = cores[0].p.distanceTo(cores[1].p), gyr = st.t * TG;
      let stage = 'Approach: Andromeda closes in at ≈ 110 km/s';
      if (sep < 6) stage = 'First passage — tidal forces fling out long tails of stars';
      if (st.t * TG > 6 && sep > 4) stage = 'Galaxies swing apart, then fall back together';
      if (st.t * TG > 7.5 && sep < 2.5) stage = 'Cores coalesce — a single elliptical galaxy ("Milkomeda") forms';
      return {readout: `t = +${gyr.toFixed(2)} billion years from now · ${(N1 + N2).toLocaleString()} test stars`, stage};
    },
    state: st
  };
}

/* ---------------- BLACK-HOLE SANDBOX ---------------- */
function makeSandbox(bhName) {
  const scene = new THREE.Scene();
  const MAX = 24000, pos = new Float32Array(MAX * 3), vel = new Float32Array(MAX * 3), col = new Float32Array(MAX * 3), siz = new Float32Array(MAX), alive = new Uint8Array(MAX);
  let cursor = 0;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  const ptsM = new THREE.Points(geo, O.pointsMaterial({scale: 60, max: 10, opacity: 0.95})); ptsM.frustumCulled = false; scene.add(ptsM);
  const GM = 4, rCap = 0.5;
  const disk = new THREE.Mesh(new THREE.RingGeometry(0.75, 4.0, 160, 4), O.diskMaterial(0.75, 4.0)); disk.rotation.x = -Math.PI / 2; scene.add(disk);
  disk.material.uniforms.uTime.value = 0;
  const bb = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), O.bhBillboardMaterial()); bb.scale.setScalar(rCap * 3.3); scene.add(bb);
  const grid = new THREE.PolarGridHelper(12, 16, 12, 64, 0x2a3a5c, 0x1a2640); grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);
  const sky = O.S.sky.clone(); scene.add(sky);
  const aim = new THREE.ArrowHelper(new V3(1, 0, 0), new V3(), 1, 0xffc061, 0.3, 0.15); aim.visible = false; scene.add(aim);
  const st = {mode: 'star', captured: 0, flares: 0, playing: true, speed: 1, flash: 0};
  const R = O.makeNoise(4).rnd;
  function spawn(p, v, kind) {
    const n = kind === 'star' ? 700 : kind === 'cloud' ? 1600 : 1, spread = kind === 'star' ? 0.12 : kind === 'cloud' ? 0.7 : 0;
    const base = kind === 'star' ? new THREE.Color('#ffe0b0') : kind === 'cloud' ? new THREE.Color('#ff8ab0') : new THREE.Color('#9fd0ff');
    for (let i = 0; i < n; i++) {
      const k = cursor; cursor = (cursor + 1) % MAX;
      const o = new V3(R() - 0.5, (R() - 0.5) * 0.6, R() - 0.5).multiplyScalar(spread * 2);
      pos.set([p.x + o.x, p.y + o.y, p.z + o.z], k * 3);
      vel.set([v.x + (R() - 0.5) * spread * 0.08, v.y, v.z + (R() - 0.5) * spread * 0.08], k * 3);
      col.set([base.r, base.g, base.b], k * 3); siz[k] = kind === 'orbit' ? 3 : kind === 'star' ? 1.4 : 1.1; alive[k] = 1;
    }
    if (kind === 'star') st.flares++;
  }
  function seed() { spawn(new V3(7, 0, 0), new V3(0, 0, -Math.sqrt(GM / 7)), 'orbit'); spawn(new V3(-5, 0, 3), new V3(0.25, 0, -0.5), 'star'); }
  seed();
  const sbox = {
    scene, title: `Gravity sandbox · ${bhName}`, cam: {dist: 22, phi: 0.95, theta: 0.3},
    blurb: 'Tap the grid to drop matter on a sub-orbital path. A star that dives too close is stretched into a stream (tidal disruption) — part is swallowed, part flung away. Drag to orbit the view. Newtonian gravity with a capture radius standing in for the event horizon.',
    controls: [{id: 'star', label: 'Star', toggle: 'mode'}, {id: 'cloud', label: 'Gas cloud', toggle: 'mode'}, {id: 'orbit', label: 'Probe in orbit', toggle: 'mode'}, {id: 'clear', label: 'Clear', fn: () => { alive.fill(0); for (let i = 0; i < MAX; i++) pos[i * 3 + 1] = 1e6; st.captured = 0; geo.attributes.position.needsUpdate = true; }}],
    state: st,
    pointer: {
      down(p) { st.start = p.clone(); aim.position.copy(p); aim.visible = true; aim.setLength(0.001); },
      move(p) { if (!st.start) return; const d = new V3().subVectors(p, st.start); if (d.length() > 0.05) { aim.setDirection(d.clone().normalize()); aim.setLength(d.length(), 0.3, 0.15); } },
      up(p) {
        if (!st.start) return; aim.visible = false;
        const d = new V3().subVectors(p, st.start); let v;
        const r = Math.max(0.8, st.start.length()), vc = Math.sqrt(GM / r);
        if (d.length() > 0.15) v = d.multiplyScalar(0.25);
        else { const t = new V3(-st.start.z, 0, st.start.x).normalize(); v = t.multiplyScalar(vc * (st.mode === 'orbit' ? 1 : 0.45)); }
        spawn(st.start, v, st.mode); st.start = null;
      }
    },
    update(dt) {
      const sub = st.playing ? Math.ceil(4 * st.speed) : 0, h = 0.012;
      for (let s = 0; s < sub; s++) {
        for (let i = 0; i < MAX; i++) {
          if (!alive[i]) continue;
          const k = i * 3, x = pos[k], y = pos[k + 1], z = pos[k + 2];
          const r2 = x * x + y * y + z * z, r = Math.sqrt(r2);
          if (r < rCap) { alive[i] = 0; pos[k + 1] = 1e6; st.captured++; st.flash = Math.min(1.5, st.flash + 0.01); continue; }
          if (r > 60) { alive[i] = 0; pos[k + 1] = 1e6; continue; }
          const f = -GM / (r2 * r);
          vel[k] += x * f * h; vel[k + 1] += y * f * h; vel[k + 2] += z * f * h;
          pos[k] += vel[k] * h; pos[k + 1] += vel[k + 1] * h; pos[k + 2] += vel[k + 2] * h;
        }
      }
      // colour by speed (heating near the hole)
      for (let i = 0; i < MAX; i++) {
        if (!alive[i] || siz[i] > 2.5) continue;
        const k = i * 3, sp = Math.hypot(vel[k], vel[k + 1], vel[k + 2]);
        const hot = Math.min(1, sp / 3.5);
        col[k] = 1.0; col[k + 1] = 0.55 + hot * 0.4; col[k + 2] = 0.3 + hot * 0.7;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      st.flash *= 0.96;
      disk.material.uniforms.uTime.value += dt;
      bb.material.uniforms.uTime.value += dt; bb.material.uniforms.uEdge.value = Math.abs(Math.cos(O.rig.phi));
      bb.material.uniforms.uColor.value.setRGB(1, 0.69 + st.flash * 0.2, 0.44 + st.flash * 0.4);
      let alive_n = 0; for (let i = 0; i < MAX; i += 7) alive_n += alive[i];
      return {readout: `Swallowed ${st.captured.toLocaleString()} particles · in flight ≈ ${(alive_n * 7).toLocaleString()}`, stage: st.mode === 'star' ? 'Mode: drop a star — tap near the hole for a tidal disruption event' : st.mode === 'cloud' ? 'Mode: gas cloud — watch it shear into an accretion stream' : 'Mode: probe — tap to place a test body on a circular orbit'};
    }
  };
  return sbox;
}

/* ---------------- SUPERNOVA (in place on Betelgeuse) ---------------- */
SIM.supernova = function (Dn) {
  if (Dn.sn) { Dn.sn.reset(); return Dn.sn; }
  const g = Dn.g, sz = Dn.D.size, core = Dn.core;
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), O.shellMaterial('#ff9a5a')); shell.visible = false; g.add(shell);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({map: O.glowTexture('rgba(255,255,255,1)', 'rgba(170,200,255,0.35)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true})); flash.visible = false; g.add(flash);
  const ns = new THREE.Sprite(new THREE.SpriteMaterial({map: O.glowTexture('rgba(220,235,255,1)', 'rgba(120,170,255,0.25)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true})); ns.visible = false; g.add(ns);
  const SN = {t: -1, stage: ''};
  const stages = [
    [0, 'Silicon burning ends. The iron core — ≈ 1.4 Suns of mass, about Earth\'s size — can no longer support itself.'],
    [2.5, 'Core collapse: the core implodes at up to ≈ 25% of light speed in under a second, forming a neutron star.'],
    [3.5, 'Neutrino burst: ≈ 10⁵⁸ neutrinos carry off 99% of the energy — they would reach Earth hours before the light.'],
    [5.0, 'Shock breakout: the rebounding shock reaches the surface (hours to a day after collapse) and the star flares.'],
    [7.0, 'Peak: from Earth it would shine at about magnitude −12 — near the half Moon — visible in daylight for weeks.'],
    [11, 'Remnant: an expanding nebula of star-made elements, with a neutron star (or possibly a black hole) at its centre.']
  ];
  SN.cancel = () => { SN.t = -1; shell.visible = false; flash.visible = false; ns.visible = false; core.visible = true; core.scale.setScalar(1); core.material.uniforms.uPulse.value = 0; };
  SN.reset = () => { SN.cancel(); SN.t = 0; };
  SN.update = (dt) => {
    if (SN.t < 0) return null;
    SN.t += dt; const t = SN.t;
    let s = stages[0][1]; for (const q of stages) if (t >= q[0]) s = q[1];
    if (t < 2.5) { core.scale.setScalar(1 - t * 0.02 + Math.sin(t * 30) * 0.004); core.material.uniforms.uPulse.value = Math.sin(t * 12) * 0.08; core.visible = true; }
    else if (t < 5) { core.scale.setScalar(0.95); core.material.uniforms.uPulse.value = (t - 2.5) * 0.2; }
    if (t >= 5 && t < 7.5) { flash.visible = true; const k = Math.sin((t - 5) / 2.5 * Math.PI); flash.scale.setScalar(sz * (1 + k * 9)); flash.material.opacity = 0.4 + k * 0.6; core.material.uniforms.uPulse.value = 1 + k * 2; }
    if (t >= 6) { shell.visible = true; const e = (t - 6); shell.scale.setScalar(sz * (0.35 + e * 0.45)); shell.material.uniforms.uTime.value = t; shell.material.uniforms.uOp.value = Math.max(0, 1 - e / 14); core.visible = t < 7.5; }
    if (t >= 7.5) { flash.visible = false; ns.visible = true; ns.scale.setScalar(sz * (0.15 + Math.sin(t * 6) * 0.01)); }
    if (t > 20) { SN.cancel(); return {done: true, stage: 'Sequence complete. Press Replay to watch again.', readout: 'Remnant shown: expanding nebula + neutron star'}; }
    return {stage: s, readout: `Sequence ${(Math.min(t, 20)).toFixed(1)} / 20 s · timescales compressed`};
  };
  Dn.sn = SN; SN.reset();
  return SN;
};

SIM.make = function (name, opt) { return name === 'merger' ? makeMerger() : makeSandbox(opt || 'black hole'); };

})(window.ORR);
