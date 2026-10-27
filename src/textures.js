/* ============================================================
   TEXTURES — procedural canvas textures (no external images)
   ============================================================ */
(function (O) {

/* --- seeded simplex 3D noise --- */
function makeNoise(seed) {
  let s = seed >>> 0 || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const p = new Uint8Array(512), perm = [];
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const g = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  const F3 = 1 / 3, G3 = 1 / 6;
  function n3(x, y, z) {
    const t = (x + y + z) * F3, i = Math.floor(x + t), j = Math.floor(y + t), k = Math.floor(z + t);
    const t0 = (i + j + k) * G3, x0 = x - i + t0, y0 = y - j + t0, z0 = z - k + t0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) { if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; } else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; } else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; } }
    else { if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; } else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; } else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; } }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3, x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3, x3 = x0 - 1 + 0.5, y3 = y0 - 1 + 0.5, z3 = z0 - 1 + 0.5;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let n = 0, tt, gi;
    tt = 0.6 - x0*x0 - y0*y0 - z0*z0; if (tt > 0) { gi = g[p[ii + p[jj + p[kk]]] % 12]; tt *= tt; n += tt * tt * (gi[0]*x0 + gi[1]*y0 + gi[2]*z0); }
    tt = 0.6 - x1*x1 - y1*y1 - z1*z1; if (tt > 0) { gi = g[p[ii + i1 + p[jj + j1 + p[kk + k1]]] % 12]; tt *= tt; n += tt * tt * (gi[0]*x1 + gi[1]*y1 + gi[2]*z1); }
    tt = 0.6 - x2*x2 - y2*y2 - z2*z2; if (tt > 0) { gi = g[p[ii + i2 + p[jj + j2 + p[kk + k2]]] % 12]; tt *= tt; n += tt * tt * (gi[0]*x2 + gi[1]*y2 + gi[2]*z2); }
    tt = 0.6 - x3*x3 - y3*y3 - z3*z3; if (tt > 0) { gi = g[p[ii + 1 + p[jj + 1 + p[kk + 1]]] % 12]; tt *= tt; n += tt * tt * (gi[0]*x3 + gi[1]*y3 + gi[2]*z3); }
    return 32 * n;
  }
  function fbm(x, y, z, oct, lac, gain) {
    let a = 0.5, f = 1, v = 0;
    for (let o = 0; o < oct; o++) { v += a * n3(x * f, y * f, z * f); f *= lac || 2; a *= gain || 0.5; }
    return v;
  }
  return {n3, fbm, rnd};
}
O.makeNoise = makeNoise;
O._tx = {};

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, srgb) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  if (srgb) t.encoding = THREE.sRGBEncoding;
  return t;
}
const hex = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
Object.assign(O._tx, {canvas, tex, hex, mix, clamp01});

/* Sample a spherical field into an equirectangular image */
function sphereMap(w, h, fn) {
  const c = canvas(w, h), ctx = c.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) {
    const lat = (0.5 - (y + 0.5) / h) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < w; x++) {
      const lon = ((x + 0.5) / w) * 2 * Math.PI - Math.PI;
      const col = fn(cl * Math.cos(lon), cl * Math.sin(lon), sl, lat, lon);
      const i = (y * w + x) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = col.length > 3 ? col[3] : 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/* Major metropolitan areas (lat, lon, relative size 0–3) — for night-lights model */
O.METROS = [[35.68,139.69,3],[28.61,77.21,3],[31.23,121.47,3],[19.08,72.88,3],[-23.55,-46.63,3],[19.43,-99.13,3],[30.04,31.24,2.5],[23.81,90.41,2.5],[39.90,116.40,3],[34.69,135.50,2.5],[40.71,-74.01,3],[24.86,67.01,2.5],[22.57,88.36,2.5],[41.01,28.98,2.5],[-34.60,-58.38,2.5],[6.52,3.38,2.5],[14.60,120.98,2.5],[-22.91,-43.17,2],[23.13,113.26,3],[22.54,114.06,2.5],[34.05,-118.24,3],[55.76,37.62,2.5],[51.51,-0.13,2.5],[48.86,2.35,2.5],[13.08,80.27,2.2],[12.97,77.59,2.4],[17.39,78.49,2.4],[18.52,73.86,2],[23.02,72.57,2],[26.85,80.95,1.8],[26.91,75.79,1.6],[21.17,72.83,1.6],[-6.21,106.85,2.6],[13.76,100.50,2.4],[37.57,126.98,2.6],[41.88,-87.63,2.4],[29.76,-95.37,2.1],[32.78,-96.80,2],[25.76,-80.19,2],[33.75,-84.39,1.8],[38.91,-77.04,2],[42.36,-71.06,1.8],[37.77,-122.42,2],[47.61,-122.33,1.6],[43.65,-79.38,2],[45.50,-73.57,1.6],[52.52,13.40,1.8],[40.42,-3.70,2],[41.39,2.17,1.6],[45.46,9.19,1.8],[50.11,8.68,1.4],[52.37,4.90,1.4],[50.85,4.35,1.4],[59.33,18.07,1.2],[35.69,51.39,2.2],[33.31,44.37,1.8],[24.71,46.68,2],[25.20,55.27,2],[-26.20,28.05,2],[-33.92,18.42,1.5],[-1.29,36.82,1.5],[9.03,38.74,1.5],[33.57,-7.59,1.5],[36.75,3.06,1.4],[-33.87,151.21,2],[-37.81,144.96,2],[-27.47,153.03,1.4],[-31.95,115.86,1.3],[-36.85,174.76,1.3],[1.35,103.82,2],[3.14,101.69,1.8],[10.82,106.63,2.2],[21.03,105.85,2],[25.03,121.56,2.2],[30.57,104.07,2.2],[29.56,106.55,2.2],[34.27,108.94,2],[30.59,114.31,2.2],[36.07,120.38,1.8],[45.80,126.53,1.6],[43.82,87.62,1.2],[39.03,125.75,1],[4.71,-74.07,2],[-12.05,-77.04,2.2],[-33.45,-70.67,2],[10.49,-66.88,1.6],[-15.79,-47.88,1.5],[-19.92,-43.94,1.8],[-30.03,-51.23,1.5],[59.94,30.31,1.8],[50.45,30.52,1.6],[52.23,21.01,1.5],[47.50,19.04,1.3],[44.43,26.10,1.3],[37.98,23.73,1.4],[31.77,35.21,1.3],[33.89,35.50,1.2],[31.52,74.36,2.2],[33.68,73.05,1.4],[34.53,69.17,1.4],[27.72,85.32,1.3],[6.93,79.86,1.3],[16.87,96.20,1.6],[43.24,76.89,1.3],[41.30,69.24,1.5],[40.41,49.87,1.3],[56.84,60.61,1.3],[55.03,82.92,1.3],[43.12,131.89,1],[61.22,-149.90,0.6],[64.15,-21.94,0.6],[21.31,-157.86,0.9],[18.47,-69.90,1.4],[23.11,-82.37,1.4],[9.93,-84.08,1],[14.63,-90.51,1.3],[20.67,-103.35,1.8],[25.69,-100.32,1.8],[32.72,-117.16,1.6],[33.45,-112.07,1.6],[39.74,-104.99,1.4],[44.98,-93.27,1.4],[39.95,-75.17,1.8],[42.33,-83.05,1.6],[36.17,-115.14,1.3],[19.90,-75.82,0.8],[-4.32,15.31,1.8],[5.60,-0.19,1.5],[12.00,8.52,1.6],[14.69,-17.44,1.3],[-8.84,13.23,1.6],[0.35,32.58,1.3],[-6.79,39.21,1.6],[15.59,32.53,1.5],[11.59,43.15,0.8],[2.04,45.34,1.2]];

/* ---------------- GAS / CLOUD PALETTES (lat → color strip, 512×1) ---------------- */
O.bandPalette = function (stops, seed, contrast) {
  const W = 512, c = canvas(W, 1), ctx = c.getContext('2d'), img = ctx.createImageData(W, 1), N = makeNoise(seed);
  const cols = stops.map((s) => [s[0], hex(s[1])]);
  for (let i = 0; i < W; i++) {
    const lat = -90 + i / (W - 1) * 180;
    let k = 0; while (k < cols.length - 2 && lat > cols[k + 1][0]) k++;
    const t = clamp01((lat - cols[k][0]) / (cols[k + 1][0] - cols[k][0]));
    let col = mix(cols[k][1], cols[k + 1][1], t * t * (3 - 2 * t));
    const v = 1 + N.n3(lat * 0.35, 1.3, 2.7) * (contrast || 0.08);
    img.data[i * 4] = Math.min(255, col[0] * v); img.data[i * 4 + 1] = Math.min(255, col[1] * v); img.data[i * 4 + 2] = Math.min(255, col[2] * v); img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
};
/* wind profile → texture: R channel = speed mapped from [-1,1] */
O.windTexture = function (profile, vmax) {
  const W = 256, c = canvas(W, 1), ctx = c.getContext('2d'), img = ctx.createImageData(W, 1);
  for (let i = 0; i < W; i++) {
    const lat = -90 + i / (W - 1) * 180;
    let v = 0;
    if (lat <= profile[0][0]) v = profile[0][1]; else if (lat >= profile[profile.length - 1][0]) v = profile[profile.length - 1][1];
    else for (let k = 0; k < profile.length - 1; k++) if (lat >= profile[k][0] && lat <= profile[k + 1][0]) { const t = (lat - profile[k][0]) / (profile[k + 1][0] - profile[k][0]); v = profile[k][1] + (profile[k + 1][1] - profile[k][1]) * (t * t * (3 - 2 * t)); break; }
    const e = clamp01(v / vmax * 0.5 + 0.5) * 255;
    img.data[i * 4] = e; img.data[i * 4 + 1] = e; img.data[i * 4 + 2] = e; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = THREE.LinearFilter;
  return t;
};

/* Saturn ring radial texture; u: 0 = 66,900 km → 1 = 140,500 km */
O.saturnRingTexture = function () {
  const W = 1024, c = canvas(W, 1), ctx = c.getContext('2d'), img = ctx.createImageData(W, 1), N = makeNoise(31);
  const r0 = 66900, r1 = 140500;
  for (let i = 0; i < W; i++) {
    const r = r0 + (r1 - r0) * i / (W - 1);
    let a = 0, col = [200, 180, 150];
    if (r < 74658) { a = 0.05; col = [120, 110, 100]; }                  // D ring
    else if (r < 92000) { a = 0.25 + 0.15 * N.n3(r * 0.001, 0, 0); col = [150, 135, 115]; } // C ring
    else if (r < 117580) { a = 0.85 + 0.15 * N.n3(r * 0.0007, 3, 0); col = [226, 205, 170]; } // B ring
    else if (r < 122170) { a = 0.06; col = [90, 80, 70]; }               // Cassini Division
    else if (r < 136775) { a = 0.55 + 0.15 * N.n3(r * 0.001, 7, 0); col = [205, 188, 160];   // A ring
      if (r > 133400 && r < 133740) a = 0.05; }                           // Encke Gap
    else if (r > 140100 && r < 140300) { a = 0.5; col = [220, 210, 190]; } // F ring
    const fine = 0.85 + 0.15 * Math.sin(r * 0.02) * Math.sin(r * 0.0031);
    img.data[i * 4] = col[0] * fine; img.data[i * 4 + 1] = col[1] * fine; img.data[i * 4 + 2] = col[2] * fine; img.data[i * 4 + 3] = clamp01(a) * 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
};
O.simpleRingTexture = function (bands, col) {
  const W = 512, c = canvas(W, 1), ctx = c.getContext('2d'), img = ctx.createImageData(W, 1);
  const rgb = hex(col);
  for (let i = 0; i < W; i++) {
    const u = i / (W - 1); let a = 0.02;
    for (const [p, w, s] of bands) a += s * Math.exp(-Math.pow((u - p) / w, 2));
    img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = clamp01(a) * 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
};

/* Radial glow sprite */
O.glowTexture = function (inner, outer, size) {
  const s = size || 256, c = canvas(s, s), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, inner); g.addColorStop(0.18, inner); g.addColorStop(0.45, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
};

})(window.ORR);
