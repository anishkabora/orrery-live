/* ============================================================
   CONTROLS — orbit camera with focus-follow, fly-to, touch
   ============================================================ */
(function (O) {
const V3 = THREE.Vector3;

O.makeRig = function (camera, dom, cbs) {
  const rig = {
    target: new V3(), pan: new V3(), dist: 300, theta: 0.6, phi: 1.05,
    vTheta: 0, vPhi: 0, minDist: 0.0005, maxDist: 60000,
    focusFn: null, fly: null, autoRotate: 0, enabled: true
  };
  const ptrs = new Map();
  let downInfo = null, lastTap = 0, pinch0 = null;

  function onDown(e) {
    if (!rig.enabled) return;
    dom.setPointerCapture && dom.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY, b: e.button, shift: e.shiftKey});
    if (ptrs.size === 1) downInfo = {x: e.clientX, y: e.clientY, t: performance.now(), moved: 0};
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = {d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, dist: rig.dist}; }
    rig.vTheta = rig.vPhi = 0;
    cbs.interact && cbs.interact();
  }
  function onMove(e) {
    const p = ptrs.get(e.pointerId);
    if (!p) { cbs.hover && cbs.hover(e.clientX, e.clientY); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (downInfo) downInfo.moved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 1) {
      if (p.b === 2 || p.shift) panBy(dx, dy);
      else { rig.theta -= dx * 0.0055; rig.phi = clampPhi(rig.phi - dy * 0.0055); rig.vTheta = -dx * 0.0055; rig.vPhi = -dy * 0.0055; }
    }
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2 && pinch0) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      setDist(pinch0.dist * pinch0.d / Math.max(d, 1));
      panBy(mx - pinch0.mx, my - pinch0.my); pinch0.mx = mx; pinch0.my = my;
      if (downInfo) downInfo.moved += 100;
    }
  }
  function onUp(e) {
    const had = ptrs.has(e.pointerId);
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = null;
    if (had && ptrs.size === 0 && downInfo) {
      const dt = performance.now() - downInfo.t;
      if (downInfo.moved < 8 && dt < 400) {
        const now = performance.now();
        if (now - lastTap < 320) { cbs.dbl && cbs.dbl(e.clientX, e.clientY); lastTap = 0; }
        else { lastTap = now; cbs.tap && cbs.tap(e.clientX, e.clientY); }
      }
      downInfo = null;
    }
  }
  function panBy(dx, dy) {
    const cam = camera, k = rig.dist * 0.0018;
    const right = new V3().setFromMatrixColumn(cam.matrixWorld, 0), up = new V3().setFromMatrixColumn(cam.matrixWorld, 1);
    rig.pan.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
  }
  const clampPhi = (p) => Math.max(0.03, Math.min(Math.PI - 0.03, p));
  function setDist(d) { rig.dist = Math.max(rig.minDist, Math.min(rig.maxDist, d)); }
  dom.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  dom.addEventListener('contextmenu', (e) => e.preventDefault());
  dom.addEventListener('wheel', (e) => { e.preventDefault(); if (!rig.enabled) return; setDist(rig.dist * Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0012))); rig.fly && (rig.fly.d1 = rig.dist); cbs.interact && cbs.interact(); }, {passive: false});
  dom.addEventListener('pointerleave', () => cbs.hover && cbs.hover(-1, -1));

  rig.zoom = (k) => setDist(rig.dist * k);
  rig.setFocus = function (fn, dist, opts) {
    const from = rig.target.clone().add(rig.pan);
    rig.focusFn = fn; rig.pan.set(0, 0, 0);
    rig.fly = {t: 0, dur: (opts && opts.dur) || 1.6, from, d0: rig.dist, d1: dist, th0: rig.theta, th1: opts && opts.theta !== undefined ? opts.theta : rig.theta, ph0: rig.phi, ph1: opts && opts.phi !== undefined ? opts.phi : rig.phi};
  };
  rig.update = function (dt) {
    const fpos = rig.focusFn ? rig.focusFn() : new V3();
    if (rig.fly) {
      const F = rig.fly; F.t += dt / F.dur;
      const u = Math.min(1, F.t), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      rig.target.lerpVectors(F.from, fpos, e);
      // log-interpolate distance so long flights feel continuous
      rig.dist = Math.exp(Math.log(F.d0) + (Math.log(F.d1) - Math.log(F.d0)) * e);
      let dth = F.th1 - F.th0; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
      rig.theta = F.th0 + dth * e; rig.phi = F.ph0 + (F.ph1 - F.ph0) * e;
      if (u >= 1) rig.fly = null;
    } else {
      rig.target.copy(fpos);
      if (!ptrs.size) { rig.theta += rig.vTheta; rig.phi = clampPhi(rig.phi + rig.vPhi); rig.vTheta *= 0.92; rig.vPhi *= 0.92; }
      rig.theta += rig.autoRotate * dt;
    }
    if (rig.dist < rig.minDist) rig.dist += (rig.minDist - rig.dist) * 0.2;
    const t = rig.target.clone().add(rig.pan);
    const sp = Math.sin(rig.phi);
    camera.position.set(t.x + rig.dist * sp * Math.sin(rig.theta), t.y + rig.dist * Math.cos(rig.phi), t.z + rig.dist * sp * Math.cos(rig.theta));
    camera.up.set(0, 1, 0);
    camera.lookAt(t);
    camera.updateMatrixWorld();
  };
  return rig;
};

})(window.ORR);
