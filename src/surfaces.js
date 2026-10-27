/* ============================================================
   SURFACES — high-detail procedural maps built on real geography.
   Generators yield every few rows so the page stays responsive.
   Longitudes are planetocentric east, matching IAU prime meridians.
   ============================================================ */
(function (O) {
const {canvas, tex, hex, mix, clamp01} = O._tx;
const D2R = Math.PI / 180;
const ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const unit = (lat, lon) => [Math.cos(lat * D2R) * Math.cos(lon * D2R), Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R)];
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/* bilinear sample of a W×H float grid wrapping in x */
function bil(g, W, H, u, v) {
  const x = u * W - 0.5, y = clamp01(v) * (H - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const xa = ((x0 % W) + W) % W, xb = (xa + 1) % W, ya = y0, yb = Math.min(H - 1, y0 + 1);
  return (g[ya * W + xa] * (1 - fx) + g[ya * W + xb] * fx) * (1 - fy) + (g[yb * W + xa] * (1 - fx) + g[yb * W + xb] * fx) * fy;
}
/* distance (deg, lon scaled by cos lat) from point to polyline */
function polyDist(lat, lon, pts) {
  let best = 1e9; const cl = Math.cos(lat * D2R);
  for (let i = 0; i < pts.length - 1; i++) {
    let [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    let px = lon, py = lat;
    ax *= cl; bx *= cl; px *= cl;
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9;
    const t = clamp01(((px - ax) * dx + (py - ay) * dy) / L2);
    const qx = ax + t * dx - px, qy = ay + t * dy - py, d = qx * qx + qy * qy;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/* ---------------- EARTH ---------------- */
// Mountain systems: [polyline (lon,lat), half-width deg, relative height]
const RANGES = [
  [[[73, 35], [77, 33.5], [81, 30.5], [85, 28.3], [88, 27.8], [92, 27.8], [95, 28.5], [97, 28]], 1.5, 1.0],   // Himalaya
  [[[67, 35.5], [71, 36.2], [74.5, 36], [77, 35.5]], 1.3, 0.9],                                            // Hindu Kush–Karakoram
  [[[70, 41], [78, 42], [86, 43], [92, 43]], 1.4, 0.6],                                                   // Tian Shan
  [[[80, 36], [86, 35.6], [92, 35.5], [98, 34]], 1.0, 0.65],                                             // Kunlun
  [[[86, 49.5], [90, 49], [96, 47]], 1.2, 0.45], [[[45, 37.5], [49, 33], [54, 29], [57, 27]], 1.2, 0.5], // Altai, Zagros
  [[[40, 43.6], [44, 42.8], [48, 41.2]], 0.9, 0.6], [[[5.8, 44.3], [7.5, 45.9], [10.5, 46.8], [13.5, 47.1]], 0.9, 0.6], // Caucasus, Alps
  [[[-1.5, 43], [2.8, 42.6]], 0.6, 0.4], [[[-9, 30.6], [-5, 32.5], [0, 34], [5, 35.4], [9, 36]], 1.0, 0.45], // Pyrenees, Atlas
  [[[37, -3], [36.5, 0.5], [38, 8], [39.5, 12]], 1.4, 0.5], [[[28, -31], [30, -28]], 0.8, 0.35],            // E. African highlands, Drakensberg
  [[[59, 50], [60, 56], [59.5, 62], [63, 67]], 1.0, 0.3], [[[6, 59], [12, 63], [16, 67], [20, 69]], 1.2, 0.35], // Urals, Scandes
  [[[-150, 62], [-138, 60], [-127, 55], [-118, 50], [-112, 45], [-108, 40], [-106, 34]], 3.0, 0.55],        // Rockies
  [[[-122, 48.5], [-121.5, 44], [-119.4, 37], [-118, 35.5]], 1.0, 0.45], [[[-106, 28], [-103, 24], [-99, 19], [-96, 17]], 1.5, 0.45], // Cascades/Sierra, Sierra Madre
  [[[-79, 8], [-77.5, 1], [-78.5, -4], [-75.5, -12], [-71, -16], [-68.5, -22], [-69.5, -30], [-70.5, -36], [-71.5, -42], [-73, -50], [-72.5, -54]], 1.5, 0.95], // Andes
  [[[-84, 34], [-80, 37], [-77, 40], [-73, 43], [-69, 46]], 1.4, 0.25], [[[146, -37], [149, -33], [151, -28], [146, -19]], 1.2, 0.3], // Appalachians, Great Dividing
  [[[167, -46], [171, -43], [174, -41]], 0.7, 0.5], [[[136, -4], [142, -5.5], [147, -7]], 0.9, 0.5], [[[131, 32], [136, 35.5], [140, 38], [142, 43]], 0.7, 0.35], // NZ Alps, New Guinea, Japan
  [[[73.5, 20.5], [74.3, 15], [76.5, 10], [77.2, 8.5]], 0.7, 0.3],                                       // Western Ghats
  [[[-45, -22], [-42, -16], [-40, -12]], 2.5, 0.2], [[[100, 28], [104, 30], [108, 33]], 1.5, 0.35]        // Brazilian highlands, Hengduan
];
const PLATEAUS = [[33, 88, 5, 12, 0.72], [-17, -68, 4, 3, 0.6], [9, 39, 4, 4, 0.5], [73, -41, 9, 11, 0.55], [39, -112, 5, 9, 0.35], [-24, 135, 10, 15, 0.08]]; // Tibet, Altiplano, Ethiopia, Greenland dome, US Great Basin, Australia

O.earthGen = function* (done) {
  const W = 4096, H = 2048, GW = 1024, GH = 512, RW = 2048, RH = 1024;
  const N = O.makeNoise(7);
  const land = topojson.feature(window.LAND50, window.LAND50.objects.land);
  const countries = topojson.feature(window.COUNTRIES_TOPO, window.COUNTRIES_TOPO.objects.countries);
  O.countryFeatures = countries.features;
  const proj = (lon, lat, w, h) => [(lon + 180) / 360 * w, (90 - lat) / 180 * h];
  function drawGeom(ctx, geom, w, h, stroke) {
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
    for (const poly of polys) for (const ring of poly) {
      ctx.beginPath(); let prev = null, off = 0;
      for (let k = 0; k < ring.length; k++) {
        let [lon, lat] = ring[k];
        if (prev !== null && Math.abs(lon + off - prev) > 180) off += (lon + off) < prev ? 360 : -360;
        lon += off; prev = lon;
        const [x, y] = proj(lon, lat, w, h); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      if (stroke) ctx.stroke(); else { ctx.closePath(); ctx.fill('evenodd'); }
    }
  }
  const mask = canvas(W, H), mctx = mask.getContext('2d');
  mctx.fillStyle = '#000'; mctx.fillRect(0, 0, W, H); mctx.fillStyle = '#fff';
  for (const f of land.features) { drawGeom(mctx, f.geometry, W, H); mctx.save(); mctx.translate(W, 0); drawGeom(mctx, f.geometry, W, H); mctx.translate(-2 * W, 0); drawGeom(mctx, f.geometry, W, H); mctx.restore(); }
  mctx.fillRect(0, (90 + 78.5) / 180 * H, W, H);
  const md = mctx.getImageData(0, 0, W, H).data;
  // coast proximity: heavy downsample + upsample = cheap blur
  const sm = canvas(256, 128), sctx2 = sm.getContext('2d'); sctx2.imageSmoothingEnabled = true; sctx2.drawImage(mask, 0, 0, 256, 128);
  const blur = canvas(1024, 512), bctx = blur.getContext('2d'); bctx.imageSmoothingEnabled = true; bctx.drawImage(sm, 0, 0, 1024, 512);
  const bd = bctx.getImageData(0, 0, 1024, 512).data;
  yield;

  // coarse noise grids (sphere-sampled → seamless)
  const gN = new Float32Array(GW * GH), gA = new Float32Array(GW * GH), gR = new Float32Array(GW * GH);
  for (let y = 0; y < GH; y++) {
    const lat = (0.5 - (y + 0.5) / GH) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < GW; x++) {
      const lon = (x + 0.5) / GW * 2 * Math.PI - Math.PI, px = cl * Math.cos(lon), py = cl * Math.sin(lon), pz = sl;
      const i = y * GW + x;
      gN[i] = N.fbm(px * 3, py * 3, pz * 3, 5);
      gA[i] = N.fbm(px * 6 + 9, py * 6, pz * 6, 3);
      gR[i] = Math.abs(N.fbm(px * 9 + 3, py * 9, pz * 9, 3));
    }
    if (y % 24 === 0) yield;
  }
  // relief grid: ranges + plateaus + hills
  const gH = new Float32Array(RW * RH);
  const bbox = RANGES.map(([pts, w]) => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); } return [a - w * 3, b + w * 3, c - w * 3, d + w * 3]; });
  for (let y = 0; y < RH; y++) {
    const lat = 90 - (y + 0.5) / RH * 180;
    for (let x = 0; x < RW; x++) {
      const lon = (x + 0.5) / RW * 360 - 180;
      const mi = (Math.floor((y + 0.5) / RH * H) * W + Math.floor((x + 0.5) / RW * W)) * 4;
      if (md[mi] < 128) { gH[y * RW + x] = 0; continue; }
      const r = bil(gR, GW, GH, (x + 0.5) / RW, (y + 0.5) / RH);
      let h = 0.05 + r * 0.12;
      for (let k = 0; k < RANGES.length; k++) {
        const bb = bbox[k]; if (lon < bb[0] || lon > bb[1] || lat < bb[2] || lat > bb[3]) continue;
        const [pts, w, hh] = RANGES[k], d = polyDist(lat, lon, pts);
        const v = hh * Math.exp(-(d / w) * (d / w)) * (0.55 + r * 1.4);
        if (v > h) h = v;
      }
      for (const [la, lo, rla, rlo, hh] of PLATEAUS) { const q = Math.hypot((lat - la) / rla, (lon - lo) / rlo); if (q < 1.6) h = Math.max(h, hh * ss(1.6, 0.8, q) * (0.85 + r * 0.5)); }
      if (lat < -68) h = Math.max(h, 0.35 + (-68 - lat) * 0.02);
      gH[y * RW + x] = Math.min(1, h);
    }
    if (y % 24 === 0) yield;
  }

  const ocean1 = hex('#0a2850'), ocean2 = hex('#123f73'), shelf = hex('#1d6e96'), reef = hex('#2c9bb0');
  const forest = hex('#24502a'), jungle = hex('#1d4a22'), grass = hex('#6b7d3b'), savanna = hex('#94884a'), desert = hex('#cfa96b'), sand2 = hex('#b98b55'), tundra = hex('#7d7765'), ice = hex('#f1f5f8'), rock = hex('#6d5f4f'), snow = hex('#f4f6fa');
  const day = canvas(W, H), dctx = day.getContext('2d'), dimg = dctx.createImageData(W, H), dd = dimg.data;
  const spec = canvas(2048, 1024), sctx = spec.getContext('2d'), simg = sctx.createImageData(2048, 1024), sd = simg.data;
  for (let y = 0; y < H; y++) {
    const v = (y + 0.5) / H, lat = 90 - v * 180, la = Math.abs(lat);
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W, lon = u * 360 - 180;
      const i = (y * W + x) * 4, isLand = md[i] > 127;
      const n = bil(gN, GW, GH, u, v), grain = (hash(x, y) - 0.5) * 0.06;
      let c;
      if (isLand) {
        const a2 = bil(gA, GW, GH, u, v), h = bil(gH, RW, RH, u, v);
        const desertBand = Math.exp(-Math.pow((la - 23) / 8.5, 2));
        let arid = clamp01(desertBand * 1.15 + a2 * 0.7 - 0.15);
        // rain shadows & known arid cores
        if ((lon > -5 && lon < 35 && lat > 15 && lat < 30) || (lon > 40 && lon < 60 && lat > 15 && lat < 30) || (lon > 120 && lon < 145 && lat < -18 && lat > -32)) arid = Math.max(arid, 0.85);
        if (lon > 75 && lon < 110 && lat > 36 && lat < 46) arid = Math.max(arid, 0.6); // Taklamakan/Gobi
        if ((lon > -75 && lon < -69 && lat < -15 && lat > -28)) arid = Math.max(arid, 0.9); // Atacama
        if (la < 10) arid *= 0.25;
        let base = la < 12 ? mix(jungle, forest, clamp01(0.5 + n)) : mix(forest, grass, clamp01(0.45 + n * 0.9));
        base = mix(base, savanna, clamp01(arid * 1.4) * 0.6);
        base = mix(base, mix(desert, sand2, clamp01(0.5 + n * 1.5)), ss(0.45, 0.85, arid));
        if (la > 52) base = mix(base, tundra, clamp01((la - 52) / 14));
        base = mix(base, rock, ss(0.3, 0.7, h) * 0.75);
        const snowLine = 0.62 - Math.max(0, la - 30) * 0.012;
        base = mix(base, snow, ss(snowLine, snowLine + 0.12, h + n * 0.08));
        if (la > 72 || lat < -62 || (lat > 59.5 && lon > -74 && lon < -11)) base = mix(base, ice, clamp01((la - (lat < 0 ? 60 : 63)) / 5 + 0.5));
        const shade = 0.86 + n * 0.28 + grain;
        c = [base[0] * shade, base[1] * shade, base[2] * shade];
      } else {
        const near = bd[(Math.floor(v * 512) * 1024 + Math.floor(u * 1024)) * 4] / 255;
        let base = mix(ocean1, ocean2, clamp01(0.5 + n * 0.6));
        base = mix(base, shelf, ss(0.08, 0.5, near) * 0.75);
        if (la < 28 && near > 0.3 && near < 0.6) base = mix(base, reef, (near - 0.3) * 0.6);
        if (la > 70) base = mix(base, ice, clamp01((la - 70) / 9) * 0.9);
        const s2 = 1 + grain * 0.4;
        c = [base[0] * s2, base[1] * s2, base[2] * s2];
      }
      dd[i] = c[0]; dd[i + 1] = c[1]; dd[i + 2] = c[2]; dd[i + 3] = 255;
      if (!(x & 1) && !(y & 1)) { const j = ((y >> 1) * 2048 + (x >> 1)) * 4, val = isLand ? 0 : (la > 70 ? 40 : 255); sd[j] = sd[j + 1] = sd[j + 2] = val; sd[j + 3] = 255; }
    }
    if (y % 48 === 0) yield;
  }
  dctx.putImageData(dimg, 0, 0); sctx.putImageData(simg, 0, 0);
  dctx.strokeStyle = 'rgba(255,240,210,0.13)'; dctx.lineWidth = 1;
  for (const f of countries.features) if (f.geometry) drawGeom(dctx, f.geometry, W, H, true);
  yield;

  // height map texture (for relief shading)
  const hc = canvas(RW, RH), hctx = hc.getContext('2d'), himg = hctx.createImageData(RW, RH);
  for (let k = 0; k < RW * RH; k++) { const val = gH[k] * 255; himg.data[k * 4] = himg.data[k * 4 + 1] = himg.data[k * 4 + 2] = val; himg.data[k * 4 + 3] = 255; }
  hctx.putImageData(himg, 0, 0);
  yield;

  // night lights (modelled): population-weighted metros + settlement scatter
  const night = canvas(W, H), nctx = night.getContext('2d');
  nctx.fillStyle = '#000'; nctx.fillRect(0, 0, W, H); nctx.globalCompositeOperation = 'lighter';
  const R = O.makeNoise(11).rnd;
  for (let k = 0; k < 90000; k++) {
    const x = Math.floor(R() * W), y = Math.floor(H * (0.12 + R() * 0.62)), i = (y * W + x) * 4;
    if (md[i] < 128) continue;
    const lat = 90 - y / H * 180, la = Math.abs(lat), h = bil(gH, RW, RH, x / W, y / H);
    const desertBand = Math.exp(-Math.pow((la - 24) / 9, 2));
    const dens = clamp01(0.8 - desertBand * 0.6 - (la > 55 ? (la - 55) / 12 : 0) - h * 0.9) * (0.5 + 0.5 * Math.cos(lat * D2R));
    if (R() > dens) continue;
    nctx.fillStyle = `rgba(255,${185 + R() * 45 | 0},${105 + R() * 40 | 0},${0.12 + R() * 0.32})`;
    nctx.fillRect(x, y, 1 + (R() < 0.2), 1);
  }
  for (const [lat, lon, m] of O.METROS) {
    const [x, y] = proj(lon, lat, W, H), r = 3 + m * 4;
    const g = nctx.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, 'rgba(255,228,170,0.95)'); g.addColorStop(0.25, 'rgba(255,185,95,0.5)'); g.addColorStop(1, 'rgba(255,150,60,0)');
    nctx.fillStyle = g; nctx.beginPath(); nctx.arc(x, y, r * 3, 0, 7); nctx.fill();
    for (let k = 0; k < 40 * m; k++) { const a = R() * 6.28, d = Math.pow(R(), 0.6) * r * 4; nctx.fillStyle = `rgba(255,200,120,${0.25 + R() * 0.4})`; nctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1, 1); }
  }
  yield;

  // clouds (illustrative circulation: ITCZ, subtropical clear bands, storm tracks)
  const CN = O.makeNoise(23), CW = 2048, CH = 1024;
  const cl = canvas(CW, CH), cctx = cl.getContext('2d'), cimg = cctx.createImageData(CW, CH), cd = cimg.data;
  for (let y = 0; y < CH; y++) {
    const lat = (0.5 - (y + 0.5) / CH) * Math.PI, la = Math.abs(lat / D2R), c0 = Math.cos(lat), s0 = Math.sin(lat);
    const belt = 0.20 * Math.exp(-Math.pow(la / 7, 2)) - 0.24 * Math.exp(-Math.pow((la - 22) / 8, 2)) + 0.18 * Math.exp(-Math.pow((la - 52) / 12, 2));
    for (let x = 0; x < CW; x++) {
      const lon = (x + 0.5) / CW * 2 * Math.PI - Math.PI, px = c0 * Math.cos(lon), py = c0 * Math.sin(lon), pz = s0;
      const warp = CN.fbm(px * 2, py * 2, pz * 2, 2) * 0.7;
      let val = CN.fbm(px * 3.2 + warp, py * 3.2 - warp, pz * 6.5 + warp, 6, 2.1, 0.55);
      val = clamp01((val + belt + 0.02) * 2.2); val = val * val * (3 - 2 * val);
      const i = (y * CW + x) * 4; cd[i] = cd[i + 1] = cd[i + 2] = 255; cd[i + 3] = val * 235;
    }
    if (y % 24 === 0) yield;
  }
  cctx.putImageData(cimg, 0, 0);
  const T = {day: tex(day, true), night: tex(night, true), spec: tex(spec), clouds: tex(cl, true), height: tex(hc)};
  T.height.wrapS = THREE.RepeatWrapping;
  done(T);
};

/* ---------------- ROCKY / ICY BODIES ----------------
   feature kinds: mare (dark lowland), bright, dark, shield (volcano), basin (impact basin),
   rays (bright rayed crater), canyon (polyline trench), ellipse plateau */
const F = (kind, lat, lon, r, k, extra) => Object.assign({kind, lat, lon, r, k}, extra || {});
const BODY_TEX = {
  moon: {seed: 5, w: 2048, c1: '#8a867f', c2: '#d8d4cc', craters: 1400, mare: '#3e3d3b',
    feats: [F('mare', 32.8, -15.6, 16, 1), F('mare', 28, 17.5, 10, 1), F('mare', 8.5, 31.4, 12, 1), F('mare', 17, 59.1, 7.5, 1), F('mare', -7.8, 51.3, 9, 1), F('mare', -15.2, 35.5, 6, 1),
      F('mare', -21.3, -16.6, 10, 1), F('mare', -24.4, -38.6, 6, 1), F('mare', 56, -5, 5, 1, {rlon: 35}), F('mare', 15, -55, 22, 0.95, {rlon: 25}), F('mare', -10, -23, 6, 1), F('mare', 13.3, 3.6, 4.5, 1),
      F('mare', 27.3, 147.9, 4, 1), F('basin', -19.4, -92.8, 9, 0.6), F('basin', -53, -169, 32, 0.35), F('mare', -20, 175, 5, 0.6),
      F('rays', -43.3, -11.2, 0.8, 1, {len: 12}), F('rays', 9.6, -20.1, 0.9, 1, {len: 7}), F('rays', 8.1, -38, 0.6, 0.8, {len: 5}), F('bright', 23.7, -47.4, 0.8, 1)]},
  mars: {seed: 9, w: 2048, c1: '#6e2a12', c2: '#d27a42', craters: 420, mars: true,
    feats: [F('shield', 18.65, -133.8, 5.5, 1.0), F('shield', -8.3, -120.1, 3.2, 0.6), F('shield', 1.5, -112.8, 3.2, 0.6), F('shield', 11.8, -104.5, 3.2, 0.6), F('shield', 40.5, -109.6, 7, 0.3), F('shield', 24.8, 146.9, 3.5, 0.4),
      F('bright', 3, -108, 22, 0.25), F('canyon', 0, 0, 2.4, 1, {pts: [[-98, -5], [-88, -7], [-78, -9], [-68, -10.5], [-58, -13], [-48, -12]]}), F('basin', -42.4, 70.5, 16, 1, {floor: '#d9a070'}), F('basin', -49.7, -42.8, 8, 0.7, {floor: '#c98a5a'}),
      F('basin', 12.9, 87, 6, 0.5), F('dark', 8.4, 69.5, 12, 1, {rlon: 8}), F('dark', 46.7, -22, 14, 0.8, {rlon: 25}), F('dark', -2, -3, 7, 0.8, {rlon: 20}), F('dark', -20, 20, 7, 0.75, {rlon: 40}), F('bright', 23, 5, 14, 0.25), F('dark', 47, 117.5, 18, 0.25)]},
  mercury: {seed: 3, w: 2048, c1: '#5e5955', c2: '#b8b1a8', craters: 2200,
    feats: [F('basin', 30.5, 170.2, 8, 0.8, {floor: '#c2b29a'}), F('rays', 57.8, 16.8, 0.6, 1, {len: 8}), F('rays', -58.5, -19.5, 0.5, 0.8, {len: 5}), F('dark', -27.6, 57.6, 2.5, 0.6)]},
  pluto: {seed: 13, w: 1024, c1: '#6e4a34', c2: '#e8d6bf', craters: 140, pluto: true,
    feats: [F('bright', 20, 175, 16, 1, {rlat: 18, rlon: 15, smooth: true}), F('bright', 5, 205, 14, 0.8), F('dark', -5, 105, 20, 0.85, {rlat: 14, rlon: 45, col: '#3a2216'}), F('shield', -21, 173, 2.5, 0.5)]},
  venus_radar: {seed: 21, w: 1024, c1: '#4a3a22', c2: '#c9a46a', craters: 60,
    feats: [F('bright', 70, 27.5, 10, 0.6, {rlon: 32}), F('shield', 65.2, 3.3, 4, 1.0), F('bright', -5.8, 104.8, 9, 0.6, {rlon: 45}), F('shield', 25.3, -77.2, 6, 0.6), F('bright', -22, 4.8, 6, 0.5), F('bright', -60, 20, 12, 0.35), F('shield', 8, 98, 3, 0.5)]}
};

O.rockyGen = function* (id, opts, done) {
  const o = Object.assign({}, BODY_TEX[id] || {seed: (id.length * 17) | 0, w: 512, c1: '#555', c2: '#bbb', craters: 160, feats: []}, opts || {});
  const W = o.w, H = W / 2, N = O.makeNoise(o.seed), c1 = hex(o.c1), c2 = hex(o.c2);
  const feats = (o.feats || []).map((f) => Object.assign({u: unit(f.lat, f.lon), rr: f.r * D2R}, f));
  const col = canvas(W, H), ctx = col.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
  const hgt = canvas(W, H), hctx = hgt.getContext('2d'), himg = hctx.createImageData(W, H), hd = himg.data;
  for (let y = 0; y < H; y++) {
    const lat = (0.5 - (y + 0.5) / H) * Math.PI, latd = lat / D2R, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < W; x++) {
      const lon = (x + 0.5) / W * 2 * Math.PI - Math.PI, lond = lon / D2R;
      const px = cl * Math.cos(lon), py = cl * Math.sin(lon), pz = sl;
      const n = N.fbm(px * 2.5, py * 2.5, pz * 2.5, 6, 2.2, 0.55), nf = N.n3(px * 30, py * 30, pz * 30);
      let t = clamp01(0.55 + n * (o.mars ? 0.55 : 0.95)), h = 0.5 + n * 0.35 + nf * 0.04;
      let c = mix(c1, c2, t);
      if (o.mars) { // southern highlands vs northern lowlands
        const dich = ss(-0.1, 0.25, -latd / 40 + N.fbm(px * 1.2, py * 1.2, pz * 1.2, 3) * 0.6);
        h += dich * 0.18; c = mix(c, hex('#a85a32'), (1 - dich) * 0.18);
      }
      if (o.io) { const v = N.fbm(px * 5, py * 5, pz * 5, 4); c = mix(c, v > 0.25 ? hex('#3a2a1a') : hex('#f0e070'), Math.abs(v) * 0.9); if (N.n3(px * 20, py * 20, pz * 20) > 0.72) c = hex('#c0392b'); }
      if (o.europa) { const v = Math.abs(N.n3(px * 7, py * 7, pz * 7)), v2 = Math.abs(N.n3(px * 13 + 5, py * 13, pz * 13)); if (v < 0.035 || v2 < 0.02) c = mix(c, hex('#8a5a3a'), 0.7); }
      if (o.titan) c = mix(c, hex('#d9a54a'), 0.7);
      for (const f of feats) {
        const dot = px * f.u[0] + py * f.u[1] + pz * f.u[2];
        if (f.kind !== 'canyon' && f.kind !== 'rays' && dot < Math.cos(Math.min(Math.PI, (f.rlon ? Math.max(f.r, f.rlon) : f.r) * D2R * 2.2))) continue;
        let q;
        if (f.rlon || f.rlat) { let dl = lond - f.lon; dl = ((dl + 540) % 360) - 180; q = Math.hypot((latd - f.lat) / (f.rlat || f.r), dl * Math.cos(lat) / f.rlon); }
        else q = Math.acos(Math.max(-1, Math.min(1, dot))) / f.rr;
        const wob = N.n3(px * 8 + f.lat, py * 8, pz * 8) * 0.22;
        if (f.kind === 'mare') { const m = ss(1.05, 0.72, q + wob) * f.k; c = mix(c, mix(hex(o.mare || '#3b3a38'), c, 0.18), m * 0.92); h -= m * 0.12; }
        else if (f.kind === 'dark') { const m = ss(1.0, 0.35, q + wob * 1.6) * f.k; c = mix(c, f.col ? hex(f.col) : mix(c, [52, 26, 16], 0.85), m * 0.85); }
        else if (f.kind === 'bright') { const m = ss(1.0, 0.45, q + wob) * f.k; c = mix(c, [Math.min(255, c[0] * 1.35 + 30), Math.min(255, c[1] * 1.35 + 28), Math.min(255, c[2] * 1.3 + 25)], m); if (f.smooth) h = h * (1 - m) + 0.5 * m; else h += m * 0.08; }
        else if (f.kind === 'shield') { if (q < 1.3) { const m = Math.pow(clamp01(1 - q), 1.3) * f.k; h += m * 0.55; c = mix(c, [Math.min(255, c[0] * 1.15), c[1] * 0.92, c[2] * 0.85], m * 0.6); const ring = Math.exp(-Math.pow((q - 1.0) / 0.1, 2)) * f.k; c = mix(c, [c[0] * 0.6, c[1] * 0.55, c[2] * 0.5], ring * 0.55); if (q < 0.13) { h -= 0.12 * f.k; c = mix(c, [60, 32, 22], 0.6); } } }
        else if (f.kind === 'basin') { const m = ss(1.0, 0.7, q + wob * 0.3) * f.k; h -= m * 0.35; if (f.floor) c = mix(c, hex(f.floor), m * 0.6); h += Math.exp(-Math.pow((q - 1.0) / 0.08, 2)) * 0.18 * f.k; }
        else if (f.kind === 'rays') { const qq = Math.acos(Math.max(-1, Math.min(1, dot))) / f.rr; if (qq < f.len) { const ang = Math.atan2(pz - f.u[2] * dot, (px - f.u[0] * dot) * 0.7 + (py - f.u[1] * dot)); const ray = Math.pow(Math.abs(Math.sin(ang * 9 + N.n3(ang * 3, f.lat, 0) * 2)), 30) * Math.exp(-qq / (f.len * 0.35)); const core = ss(1.2, 0.2, qq); c = mix(c, [235, 232, 225], clamp01(ray * 0.55 + core * 0.8) * f.k); if (qq < 1) h += (qq > 0.8 ? 0.15 : -0.12); } }
        else if (f.kind === 'canyon') { const dd = polyDist(latd, lond, f.pts); if (dd < f.r * 3) { const m = Math.exp(-Math.pow(dd / (f.r * (0.6 + wob)), 2)); h -= m * 0.45; c = mix(c, [70, 30, 18], m * 0.55); } }
      }
      if (o.mars) { const la = Math.abs(latd), cap = latd > 0 ? 81 : 84; if (la > cap - 5) c = mix(c, hex('#f4ece2'), clamp01((la - cap + 5) / 4 + N.n3(px * 9, py * 9, pz * 9) * 0.5)); }
      const i = (y * W + x) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      const hv = clamp01(h) * 255; hd[i] = hd[i + 1] = hd[i + 2] = hv; hd[i + 3] = 255;
    }
    if (y % 16 === 0) yield;
  }
  ctx.putImageData(img, 0, 0); hctx.putImageData(himg, 0, 0);
  // craters: bowl + soft raised rim, size-frequency follows a steep power law
  if (o.craters) {
    const R = N.rnd;
    for (let k = 0; k < o.craters; k++) {
      const x = R() * W, y = H * (0.03 + R() * 0.94), r = Math.pow(R(), 4.2) * W * 0.02 + 0.7;
      const sx = 1 / Math.max(0.15, Math.cos((0.5 - y / H) * Math.PI)), fresh = R() < 0.18;
      const layers = [[ctx, fresh ? 0.10 : 0.14, fresh ? 0.16 : 0.06], [hctx, 0.42, 0.22]];
      for (const [c2x, dk, rim] of layers) {
        c2x.save(); c2x.translate(x, y); c2x.scale(sx, 1);
        const g = c2x.createRadialGradient(0, 0, 0, 0, 0, r * 1.35);
        g.addColorStop(0, `rgba(0,0,0,${dk})`); g.addColorStop(0.55, `rgba(0,0,0,${dk * 0.6})`);
        g.addColorStop(0.72, 'rgba(0,0,0,0)'); g.addColorStop(0.8, `rgba(255,255,255,${rim})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        c2x.fillStyle = g; c2x.beginPath(); c2x.arc(0, 0, r * 1.35, 0, 7); c2x.fill(); c2x.restore();
      }
      if (k % 200 === 0) yield;
    }
  }
  const map = tex(col, true), bump = tex(hgt);
  done(map, bump);
};

})(window.ORR);
