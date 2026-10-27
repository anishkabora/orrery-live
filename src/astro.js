/* ============================================================
   ASTRO — ephemerides, frames, scale mapping
   Scene frame: three.js Y = ecliptic north, X = vernal equinox,
   Z = −(ecliptic Y).  eclToScene(x,y,z) = (x, z, −y)
   ============================================================ */
(function (O) {
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const EPS = 23.43928 * D2R;
O.D2R = D2R; O.R2D = R2D;

O.jd = (ms) => ms / 86400000 + 2440587.5;

function solveKepler(M, e) {
  // safeguarded Newton–bisection on [-π, π]; robust for e → 1
  M = ((M + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  let lo = -Math.PI, hi = Math.PI, E = e < 0.8 ? M : M + 0.85 * e * Math.sign(M || 1);
  for (let i = 0; i < 60; i++) {
    const f = E - e * Math.sin(E) - M;
    if (Math.abs(f) < 1e-12) break;
    if (f > 0) hi = E; else lo = E;
    let En = E - f / (1 - e * Math.cos(E));
    if (!(En > lo && En < hi)) En = 0.5 * (lo + hi);
    E = En;
  }
  return E;
}
function orbitToEcl(a, e, I, w, N, E) {
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cN = Math.cos(N), sN = Math.sin(N), cI = Math.cos(I), sI = Math.sin(I);
  return [
    (cw * cN - sw * sN * cI) * xp + (-sw * cN - cw * sN * cI) * yp,
    (cw * sN + sw * cN * cI) * xp + (-sw * sN + cw * cN * cI) * yp,
    (sw * sI) * xp + (cw * sI) * yp
  ];
}

/* Heliocentric ecliptic J2000 position (AU) */
O.planetEcl = function (id, jd) {
  const el = O.ELEMENTS[id], T = (jd - 2451545.0) / 36525;
  const a = el[0] + el[6] * T, e = el[1] + el[7] * T, I = (el[2] + el[8] * T) * D2R;
  const Lm = el[3] + el[9] * T, wb = el[4] + el[10] * T, N = el[5] + el[11] * T;
  const E = solveKepler((Lm - wb) * D2R, e);
  return orbitToEcl(a, e, I, (wb - N) * D2R, N * D2R, E);
};
O.planetElements = function (id, jd) {
  const el = O.ELEMENTS[id], T = (jd - 2451545.0) / 36525;
  return {a: el[0] + el[6] * T, e: el[1] + el[7] * T, I: (el[2] + el[8] * T) * D2R, wb: el[4] + el[10] * T, N: el[5] + el[11] * T};
};
O.orbitPath = function (id, jd, n) {
  const k = O.planetElements(id, jd), pts = [];
  for (let i = 0; i <= n; i++) pts.push(orbitToEcl(k.a, k.e, k.I, (k.wb - k.N) * D2R, k.N * D2R, i / n * Math.PI * 2));
  return pts;
};
O.cometEcl = function (c, jd) {
  const E = solveKepler(2 * Math.PI / c.P * (jd - c.Tp), c.e);
  return orbitToEcl(c.a, c.e, c.i * D2R, c.peri * D2R, c.node * D2R, E);
};
O.cometPath = function (c, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const E = (i / n - 0.5) * 2 * Math.PI; pts.push(orbitToEcl(c.a, c.e, c.i * D2R, c.peri * D2R, c.node * D2R, E)); }
  return pts;
};

/* Geocentric Moon, ecliptic of date (low precision, ~0.3°) → [x,y,z] km */
O.moonEcl = function (jd) {
  const T = (jd - 2451545.0) / 36525, s = (d) => Math.sin(d * D2R), c = (d) => Math.cos(d * D2R);
  const lam = 218.32 + 481267.881 * T + 6.29 * s(135.0 + 477198.87 * T) - 1.27 * s(259.3 - 413335.36 * T)
    + 0.66 * s(235.7 + 890534.22 * T) + 0.21 * s(269.9 + 954397.74 * T) - 0.19 * s(357.5 + 35999.05 * T) - 0.11 * s(186.5 + 966404.03 * T);
  const bet = 5.13 * s(93.3 + 483202.02 * T) + 0.28 * s(228.2 + 960400.89 * T) - 0.28 * s(318.3 + 6003.15 * T) - 0.17 * s(217.6 - 407332.21 * T);
  const par = 0.9508 + 0.0518 * c(135.0 + 477198.87 * T) + 0.0095 * c(259.3 - 413335.36 * T) + 0.0078 * c(235.7 + 890534.22 * T) + 0.0028 * c(269.9 + 954397.74 * T);
  const r = 6378.14 / Math.sin(par * D2R);
  return [r * c(bet) * c(lam), r * c(bet) * s(lam), r * s(bet)];
};

/* Galilean moon mean longitudes (Meeus ch.44, low precision), deg */
O.galilean = function (jd) {
  const t = jd - 2443000.5;
  return [106.07719 + 203.488955790 * t, 175.73161 + 101.374724735 * t, 120.55883 + 50.317609207 * t, 84.44459 + 21.571071177 * t];
};

O.gmst = function (jd) { // radians
  const T = (jd - 2451545.0) / 36525;
  let g = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
  return ((g % 360) + 360) % 360 * D2R;
};

/* Frame conversions */
O.eclToScene = (x, y, z, out) => { out = out || new THREE.Vector3(); return out.set(x, z, -y); };
O.eqToEcl = (x, y, z) => [x, y * Math.cos(EPS) + z * Math.sin(EPS), -y * Math.sin(EPS) + z * Math.cos(EPS)];
O.eqToScene = (x, y, z, out) => { const e = O.eqToEcl(x, y, z); return O.eclToScene(e[0], e[1], e[2], out); };
O.radecToScene = (ra, dec, out) => {
  const r = ra * D2R, d = dec * D2R;
  return O.eqToScene(Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d), out);
};

/* ---------- Scale mapping ----------
   compressed: r ≤ 50 AU → 14 + 40 r^0.6 ; beyond → logarithmic
   true: 13.3 scene units per AU (Neptune ≈ 400) */
O.scale = {mode: 'compressed'};
O.TRUE_K = 13.3;
O.mapAU = function (r) {
  if (O.scale.mode === 'true' && r < 60) return r * O.TRUE_K;
  if (O.scale.mode === 'true') return 60 * O.TRUE_K + 160 * Math.log10(r / 60);
  if (r <= 50) return 14 + 40 * Math.pow(r, 0.6);
  return 432.6 + 160 * Math.log10(r / 50);
};
O.mapVec = function (ecl, out) { // heliocentric ecliptic AU vector → scene
  const r = Math.hypot(ecl[0], ecl[1], ecl[2]) || 1e-9, k = O.mapAU(r) / r;
  return O.eclToScene(ecl[0] * k, ecl[1] * k, ecl[2] * k, out);
};
O.bodyRadius = function (Rkm, isSun) {
  if (O.scale.mode === 'true') return Rkm / O.AU_KM * O.TRUE_K;
  if (isSun) return 7.5;
  return 0.62 * Math.pow(Rkm / 6371, 0.45);
};
/* Moon distance around a planet, in units of the planet's visual radius */
O.moonDistFactor = function (aKm, Rkm) {
  const q = aKm / Rkm;
  if (O.scale.mode === 'true') return q;
  return q <= 1 ? q : 1 + 1.6 * Math.log(q);   // logarithmic beyond one radius
};
O.moonRadiusFactor = function (rKm, Rkm) {
  const q = rKm / Rkm;
  if (O.scale.mode === 'true') return q;
  return Math.max(0.035, q);
};

/* Pole unit vector (scene) from IAU RA/Dec */
O.poleScene = (ra, dec) => O.radecToScene(ra, dec, new THREE.Vector3()).normalize();

/* Blackbody → RGB (Tanner Helland approximation) */
O.kelvinRGB = function (K) {
  const t = K / 100; let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; }
  else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); }
  if (t >= 66) b = 255; else if (t <= 19) b = 0; else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (v) => Math.max(0, Math.min(255, v)) / 255;
  return [c(r), c(g), c(b)];
};
O.bvToK = (bv) => 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

O.fmt = {
  n(v, d = 0) { return v.toLocaleString('en-US', {maximumFractionDigits: d, minimumFractionDigits: d}); },
  km(v) { return v >= 1e9 ? (v / 1e9).toFixed(2) + ' billion km' : v >= 1e6 ? (v / 1e6).toFixed(1) + ' million km' : Math.round(v).toLocaleString('en-US') + ' km'; },
  lt(sec) { if (sec < 60) return sec.toFixed(1) + ' light-seconds'; if (sec < 3600) return (sec / 60).toFixed(1) + ' light-minutes'; return (sec / 3600).toFixed(2) + ' light-hours'; },
  ly(v) { return v >= 1e9 ? (v / 1e9).toFixed(1) + ' billion ly' : v >= 1e6 ? (v / 1e6).toFixed(1) + ' million ly' : v.toLocaleString('en-US', {maximumFractionDigits: v < 100 ? 2 : 0}) + ' ly'; }
};

})(window.ORR);
