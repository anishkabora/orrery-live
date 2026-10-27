/* ============================================================
   EXPLORE — surface features, scanner, magnetic fields, auroras,
   plumes, Lagrange points, extra spacecraft, dwarf planets,
   focus toolbar, cut-face labels, quick stats.
   ============================================================ */
(function (O) {
const S = O.S, V3 = THREE.Vector3, D2R = Math.PI / 180, R2D = 180 / Math.PI;
const $ = (s) => document.querySelector(s);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const loc = (lat, lon, r) => new V3(Math.cos(lat * D2R) * Math.cos(lon * D2R), Math.sin(lat * D2R), -Math.cos(lat * D2R) * Math.sin(lon * D2R)).multiplyScalar(r || 1);

/* ---------------- surface & atmosphere features (lat, east lon) ---------------- */
const P_ = (name, lat, lon, type, desc, facts) => ({name, lat, lon, type, desc, facts: facts || []});
O.POIS = {
  earth: [
    P_('Mount Everest', 27.99, 86.93, 'Highest mountain', 'Summit 8,849 m above sea level on the Nepal–China border, pushed up as the Indian plate drives into Asia at ≈ 5 cm per year.', [['Height', '8,849 m'], ['Range', 'Himalaya']]),
    P_('Tibetan Plateau', 33, 88, 'Plateau', 'The "Roof of the World": ≈ 2.5 million km² averaging 4,500 m. Its heating drives the South Asian monsoon and its glaciers feed rivers for ≈ 2 billion people.'),
    P_('Mariana Trench', 11.35, 142.2, 'Deepest ocean', 'The Challenger Deep reaches ≈ 10,935 m below sea level, where the Pacific plate dives beneath the Mariana plate.', [['Depth', '≈ 10.9 km'], ['Pressure', '≈ 1,086 bar']]),
    P_('Amazon Rainforest', -3.4, -62, 'Biome', 'The largest tropical rainforest (≈ 5.5 million km²), recycling much of its own rainfall; parts of the south-east now emit more carbon than they absorb.'),
    P_('Sahara', 23, 13, 'Desert', 'The largest hot desert, ≈ 9.2 million km². It was green with lakes and grassland as recently as ≈ 6,000 years ago (the African Humid Period).'),
    P_('Great Barrier Reef', -18.3, 147.7, 'Reef system', 'The largest structure built by living organisms, ≈ 2,300 km long; it has suffered repeated mass bleaching as ocean temperatures rise.'),
    P_('Satish Dhawan Space Centre', 13.72, 80.23, 'Launch site', 'ISRO\'s spaceport at Sriharikota: launch site of Chandrayaan-3 (2023) and Aditya-L1 (2023).'),
    P_('Kennedy Space Center', 28.57, -80.65, 'Launch site', 'NASA\'s launch centre on Florida\'s Space Coast: Apollo, the Shuttle, and today\'s crewed and Artemis launches.'),
    P_('Baikonur Cosmodrome', 45.96, 63.31, 'Launch site', 'The world\'s first and largest spaceport (Kazakhstan): Sputnik 1 (1957) and Yuri Gagarin (1961) launched from here.'),
    P_('Greenland Ice Sheet', 72, -40, 'Ice sheet', 'Up to ≈ 3 km thick; if it all melted, sea level would rise ≈ 7.4 m. It currently loses ≈ 270 billion tonnes of ice a year.'),
    P_('Antarctic Ice Sheet', -80, 30, 'Ice sheet', 'Holds ≈ 70% of Earth\'s fresh water — ≈ 58 m of potential sea-level rise. The lowest natural temperature measured on Earth, −89.2 °C, was recorded at Vostok Station.'),
    P_('Kīlauea', 19.41, -155.29, 'Volcano', 'One of the most active volcanoes on Earth, on Hawaiʻi\'s Big Island, fed by a mantle hotspot.'),
    P_('Yellowstone', 44.6, -110.5, 'Supervolcano', 'A hotspot caldera with over 10,000 hydrothermal features; its last caldera-forming eruption was ≈ 640,000 years ago.'),
    P_('Lake Baikal', 53.5, 108, 'Lake', 'The deepest (1,642 m) and oldest (≈ 25 million years) lake, holding ≈ 20% of the world\'s unfrozen surface fresh water.'),
    P_('Dead Sea', 31.5, 35.5, 'Lowest land', 'Shoreline ≈ 430 m below sea level — the lowest exposed land on Earth.'),
    P_('Point Nemo', -48.88, -123.39, 'Oceanic pole', 'The place in the ocean farthest from any land (≈ 2,700 km). Retired spacecraft are steered to splash down here; the ISS will be too.'),
    P_('Western Ghats', 14, 74.5, 'Mountain range', 'A 1,600 km escarpment that wrings monsoon rain from the Arabian Sea winds; a global biodiversity hotspot.'),
    P_('Mid-Atlantic Ridge', 0, -25, 'Spreading ridge', 'An underwater mountain chain where new ocean floor is created as the Americas move away from Europe and Africa at ≈ 2.5 cm per year.')
  ],
  moon: [
    P_('Apollo 11 · Tranquility Base', 0.674, 23.47, 'Landing site', 'First crewed landing, 20 July 1969. Retroreflectors left here still bounce lasers from Earth, showing the Moon recedes ≈ 3.8 cm per year.'),
    P_('Apollo 17 · Taurus–Littrow', 20.19, 30.77, 'Landing site', 'Last crewed landing (December 1972); the "Blue Marble" photo was taken on the way.'),
    P_('Chandrayaan-3 · Shiv Shakti Point', -69.37, 32.32, 'Landing site', 'India became the first nation to land near the lunar south pole (23 August 2023); the Pragyan rover confirmed sulfur in the regolith.'),
    P_('Chang\'e 4 · Von Kármán crater', -45.4, 177.6, 'Landing site', 'First soft landing on the far side (January 2019), relayed via the Queqiao satellite.'),
    P_('Chang\'e 6 · far-side sample site', -41.6, -153.98, 'Sample return', 'First samples from the far side, returned in June 2024 from the South Pole–Aitken basin.'),
    P_('Tycho', -43.3, -11.2, 'Rayed crater', '86 km crater only ≈ 108 million years old; its bright rays stretch over 1,500 km.'),
    P_('Copernicus', 9.6, -20.1, 'Crater', '93 km crater ≈ 800 million years old, with terraced walls and central peaks.'),
    P_('Mare Imbrium', 32.8, -15.6, 'Lava plain', 'A 1,100 km basin from a giant impact ≈ 3.9 billion years ago, later flooded with basalt lava.'),
    P_('South Pole region', -88, 0, 'Polar region', 'Permanently shadowed craters hold water ice — prime target for Artemis crewed landings.'),
    P_('South Pole–Aitken basin', -53, -169, 'Impact basin', 'One of the largest impact basins in the Solar System, ≈ 2,500 km wide and up to 8 km deep.')
  ],
  mars: [
    P_('Olympus Mons', 18.65, -133.8, 'Shield volcano', 'The tallest volcano in the Solar System: ≈ 22 km high and 600 km wide, with a caldera 80 km across.', [['Height', '≈ 22 km'], ['Width', '≈ 600 km']]),
    P_('Valles Marineris', -10, -70, 'Canyon system', '≈ 4,000 km long and up to 7 km deep — it would span the continental United States.'),
    P_('Tharsis Montes', 1.5, -112.8, 'Volcanoes', 'Arsia, Pavonis and Ascraeus Mons line up on the Tharsis bulge, a volcanic plateau that tilted the whole planet.'),
    P_('Hellas Planitia', -42.4, 70.5, 'Impact basin', '≈ 2,300 km wide and 7 km deep; air pressure on the floor is high enough for liquid water to exist briefly.'),
    P_('Jezero crater · Perseverance', 18.44, 77.45, 'Rover site', 'An ancient river delta and lake. Perseverance (since 2021) caches rock cores; in 2024 it found "leopard spot" textures that are a possible biosignature.'),
    P_('Gale crater · Curiosity', -5.4, 137.8, 'Rover site', 'Curiosity has climbed Mount Sharp since 2012, reading billions of years of climate history in layered rock.'),
    P_('Elysium Planitia · InSight', 4.5, 135.6, 'Lander site', 'InSight (2018–2022) recorded over 1,300 marsquakes and measured the core.'),
    P_('Utopia Planitia · Zhurong', 25.1, 109.9, 'Rover site', 'China\'s first Mars rover landed here in May 2021.'),
    P_('North polar cap', 85, 0, 'Ice cap', 'Water ice ≈ 3 km thick, topped each winter by a seasonal layer of CO₂ frost.'),
    P_('Syrtis Major', 8.4, 69.5, 'Dark albedo feature', 'The first surface feature recorded on another planet (Huygens, 1659) — dark basaltic sand.')
  ],
  mercury: [
    P_('Caloris Basin', 30.5, 170.2, 'Impact basin', '≈ 1,550 km wide. Shockwaves from the impact created "weird terrain" at the exact opposite point of the planet.'),
    P_('Hokusai', 57.8, 16.8, 'Rayed crater', 'A young 114 km crater whose rays cross much of the northern hemisphere.'),
    P_('North polar ice craters', 85, 0, 'Polar deposits', 'Radar-bright water ice hides in craters that never see sunlight, at about −170 °C.')
  ],
  venus: [
    P_('Maxwell Montes', 65.2, 3.3, 'Mountains', 'The highest mountains on Venus, ≈ 11 km above the mean surface. (Visible here in radar view.)'),
    P_('Aphrodite Terra', -5.8, 104.8, 'Highland', 'A continent-sized highland ≈ 10,000 km long near the equator.'),
    P_('Beta Regio', 25.3, -77.2, 'Volcanic rise', 'A huge volcanic rise; 2023 Magellan reanalysis found signs of recent eruptions on Venus.'),
    P_('Venera 13 landing site', -7.5, -56.5, 'Lander site', 'Soviet lander that survived 127 minutes on the surface (1982) and sent the first colour images.')
  ],
  jupiter: [
    P_('Great Red Spot', -22.3, 0, 'Anticyclone', 'A storm larger than Earth, observed for ≥ 190 years. Juno found its roots extend ≈ 300–500 km deep.', [['Width', '≈ 14,000–16,000 km'], ['Rim winds', '≈ 430–680 km/h']]),
    P_('North Equatorial Belt', 12, 60, 'Cloud belt', 'Dark, warm belt of sinking air; home to brown barges and bright plumes.'),
    P_('Equatorial Zone', 0, 140, 'Cloud zone', 'Bright ammonia-ice clouds of rising air, carried east at ≈ 100–150 m/s.'),
    P_('South Equatorial Belt', -13, 200, 'Cloud belt', 'Occasionally "fades" to white for months before violently reviving.'),
    P_('North polar cyclones', 86, 0, 'Cyclone cluster', 'Juno found eight cyclones arranged around one at the north pole (five around one in the south) — a geometric pattern unique in the Solar System.'),
    P_('Oval BA ("Red Spot Jr.")', -33, 120, 'Anticyclone', 'Formed 2000 from three merging white ovals; turned red in 2005.')
  ],
  saturn: [
    P_('North polar hexagon', 78, 0, 'Jet stream', 'A six-sided jet stream ≈ 29,000 km across with a hurricane at its centre; stable since Voyager first saw it in 1981.'),
    P_('Equatorial super-jet', 0, 90, 'Jet stream', 'Winds up to ≈ 1,800 km/h. Great white storms erupt here roughly every Saturn year (2010–11 was the latest).'),
    P_('South polar vortex', -88, 0, 'Polar storm', 'A hurricane-like vortex ≈ 8,000 km across with a clear eye, seen by Cassini.')
  ],
  uranus: [P_('North polar region', 80, 0, 'Polar haze', 'Brightening polar cap of methane haze as the north pole turns toward the Sun (northern summer solstice in 2030).')],
  neptune: [P_('Dark storm', -20, 0, 'Anticyclone', 'Dark vortices like Voyager\'s Great Dark Spot appear and fade over a few years; bright methane clouds ride along their edges.')],
  pluto: [
    P_('Sputnik Planitia', 20, 175, 'Nitrogen glacier', 'A 1,000 km basin of convecting nitrogen ice; the cells overturn every ≈ 500,000 years.'),
    P_('Tombaugh Regio', 5, 205, 'Bright region', 'The famous "heart", named for Pluto\'s discoverer Clyde Tombaugh.'),
    P_('Cthulhu Macula', -5, 105, 'Dark region', 'A dark, reddish equatorial band coloured by tholins — organic molecules made by sunlight on methane.'),
    P_('Wright Mons', -21, 173, 'Cryovolcano', 'A ≈ 4 km high, 150 km wide mound that may be an ice volcano.')
  ]
};
const POI_SITE_IDS = {};

function ringTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.strokeStyle = '#ffb547'; x.lineWidth = 6; x.beginPath(); x.arc(32, 32, 22, 0, 7); x.stroke();
  x.fillStyle = '#ffb547'; x.beginPath(); x.arc(32, 32, 6, 0, 7); x.fill();
  return new THREE.CanvasTexture(c);
}

function bodyHolder(id) { // → {container, mesh, R, renderR(), center()}
  const p = S.objects[id]; if (!p) return null;
  if (p.kind === 'planet') { const P = p.planet; return {id, container: P.tilt, mesh: P.mesh, R: P.B.R, renderR: () => P.tilt.scale.x, center: () => P.sys.position.clone(), P}; }
  if (p.kind === 'moon') { const M = p.moon; return {id, container: M.mesh, mesh: M.mesh, R: M.m.R, renderR: () => M.mesh.scale.x, center: () => M.mesh.getWorldPosition(new V3()), M}; }
  return null;
}
O.bodyHolder = bodyHolder;

function buildPOIs() {
  const tex = ringTex();
  S.pois = [];
  for (const id in O.POIS) {
    const h = bodyHolder(id); if (!h) continue;
    for (const f of O.POIS[id]) {
      const g = new THREE.Group(); g.position.copy(loc(f.lat, f.lon, 1.004)); h.container.add(g);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, sizeAttenuation: false, depthTest: true, transparent: true, opacity: 0.95})); spr.scale.setScalar(0.016); g.add(spr);
      const pid = 'poi:' + id + ':' + f.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const q = {id: pid, body: id, f, g, spr, h};
      S.pois.push(q);
      O.addPick(pid, g, () => 0.001, {kind: 'poi', label: f.name, parent: id, poi: q});
    }
  }
}
O.poiActive = function (q) {
  if (!O.layers.features || O.state.cut === q.body) return false;
  const h = q.h, c = h.center(), rr = h.renderR(), cam = S.camera.position;
  const dist = cam.distanceTo(c); if (dist > rr * 9) return false;
  const wp = q.g.getWorldPosition(new V3()), n = wp.clone().sub(c).normalize(), toCam = cam.clone().sub(wp).normalize();
  return n.dot(toCam) > 0.12;
};
function updatePOIs() {
  // drifting storms follow the shader
  for (const q of S.pois) {
    if (q.body === 'jupiter' && q.f.name === 'Great Red Spot') { const u = q.h.P.mat.uniforms; if (u && u.uSpot) { const sp = u.uSpot.value, lon = (sp.y - u.uTime.value * sp.z) * R2D; q.g.position.copy(loc(-22.3, lon, 1.004)); q.f.lon = ((lon + 540) % 360) - 180; } }
    if (q.body === 'neptune' && q.f.name === 'Dark storm') { const u = q.h.P.mat.uniforms; if (u && u.uSpot) { const sp = u.uSpot.value, lon = (sp.y - u.uTime.value * sp.z) * R2D; q.g.position.copy(loc(-20, lon, 1.004)); q.f.lon = ((lon + 540) % 360) - 180; } }
    q.spr.visible = O.poiActive(q);
  }
}

/* ---------------- body-local geometry helpers ---------------- */
O.localSun = function (h) { // sub-solar lat/lon (deg) in body frame
  const c = h.center(), q = h.container.getWorldQuaternion(new THREE.Quaternion()).invert();
  const v = c.clone().negate().normalize().applyQuaternion(q);
  return {lat: Math.asin(Math.max(-1, Math.min(1, v.y))) * R2D, lon: Math.atan2(-v.z, v.x) * R2D};
};
O.surfaceAt = function (h, lat, lon) {
  const ssun = O.localSun(h);
  const sinE = Math.sin(lat * D2R) * Math.sin(ssun.lat * D2R) + Math.cos(lat * D2R) * Math.cos(ssun.lat * D2R) * Math.cos((lon - ssun.lon) * D2R);
  let lst = 12 + (((lon - ssun.lon) + 540) % 360 - 180) / 15; lst = (lst + 24) % 24;
  return {sunEl: Math.asin(Math.max(-1, Math.min(1, sinE))) * R2D, lst};
};
O.nearestPOI = function (id, lat, lon) {
  let best = null, bd = 1e9;
  for (const f of O.POIS[id] || []) { const a = loc(lat, lon), b = loc(f.lat, f.lon); const ang = Math.acos(Math.max(-1, Math.min(1, a.dot(b)))); if (ang < bd) { bd = ang; best = f; } }
  const h = bodyHolder(id);
  return best ? {f: best, km: bd * (h ? h.R : 1)} : null;
};
const JUP_BANDS = [[48, 'North Polar Region'], [40, 'North North Temperate Belts'], [31, 'North Temperate Zone'], [24, 'North Temperate Belt'], [18, 'North Tropical Zone'], [7, 'North Equatorial Belt'], [-7, 'Equatorial Zone'], [-19, 'South Equatorial Belt'], [-26, 'South Tropical Zone'], [-33, 'South Temperate Belt'], [-40, 'South Temperate Zone'], [-48, 'South South Temperate Belts'], [-91, 'South Polar Region']];
const SAT_BANDS = [[75, 'North polar hexagon region'], [40, 'North temperate region'], [20, 'North Equatorial Belt'], [-20, 'Equatorial Zone (super-jet)'], [-40, 'South Equatorial Belt'], [-75, 'South temperate region'], [-91, 'South polar vortex region']];
O.bandAt = function (id, lat) {
  const T = id === 'jupiter' ? JUP_BANDS : id === 'saturn' ? SAT_BANDS : null;
  if (T) { for (const [l, n] of T) if (lat >= l) return n; }
  const w = O.windAt(id, lat); if (w === null) return null;
  return Math.abs(lat) > 70 ? 'Polar region' : w < 0 ? 'Retrograde (westward) jet' : 'Prograde (eastward) jet';
};
O.windAt = function (id, lat) {
  const B = O.BODIES[id], pr = B && B.winds && B.winds.profile; if (!pr) return null;
  if (lat <= pr[0][0]) return pr[0][1]; if (lat >= pr[pr.length - 1][0]) return pr[pr.length - 1][1];
  for (let k = 0; k < pr.length - 1; k++) if (lat >= pr[k][0] && lat <= pr[k + 1][0]) { const t = (lat - pr[k][0]) / (pr[k + 1][0] - pr[k][0]); return pr[k][1] + (pr[k + 1][1] - pr[k][1]) * t; }
  return null;
};
const fmtLat = (v) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? 'N' : 'S'}`, fmtLon = (v) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? 'E' : 'W'}`;
const fmtTime = (h) => { const hh = Math.floor(h), mm = Math.floor((h - hh) * 60); return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };
O.fmtLatLon = (la, lo) => `${fmtLat(la)}, ${fmtLon(lo)}`;
O.placeRows = function (id, lat, lon) { // live rows for any surface point
  const h = bodyHolder(id), rows = [];
  rows.push(['Coordinates', () => O.fmtLatLon(lat, lon), true]);
  rows.push(['Local solar time', () => fmtTime(O.surfaceAt(h, lat, lon).lst) + (id === 'earth' ? '' : ' (24 local h = 1 solar day)')]);
  rows.push(['Sun elevation', () => { const a = O.surfaceAt(h, lat, lon).sunEl; return `${a.toFixed(1)}° · ${a > 0 ? 'day' : a > -6 ? 'twilight' : 'night'}`; }]);
  const gasBand = O.bandAt(id, lat);
  if (gasBand && S.planets[id] && S.planets[id].gas) {
    rows.push(['Cloud band', () => gasBand, true]);
    rows.push(['Wind here', () => { const w = O.windAt(id, lat); return w === null ? '—' : `${Math.abs(w).toFixed(0)} m/s (${Math.abs(w * 3.6).toFixed(0)} km/h) ${w >= 0 ? 'eastward' : 'westward'}`; }, true]);
  }
  const n = O.nearestPOI(id, lat, lon);
  if (n) rows.push(['Nearest named feature', () => `${n.f.name} · ${n.km < 50 ? 'here' : O.fmt.n(n.km, 0) + ' km away'}`, true]);
  return rows;
};

/* ---------------- surface scanner HUD ---------------- */
let scanT = 0;
function updateScanner(dt) {
  const box = $('#scan'), cross = $('#cross');
  scanT += dt; if (scanT < 0.1) return; scanT = 0;
  const id = O.state.focus, h = id && bodyHolder(id);
  const off = () => { box.hidden = true; cross.hidden = true; };
  if (!h || !O.layers.scanner || O.state.cut || O.SIM.active || (O.SKY && O.SKY.active)) return off();
  const c = h.center(), rr = h.renderR(), cam = S.camera.position, dist = cam.distanceTo(c);
  if (dist > rr * 7) return off();
  // ray through screen centre
  const dir = new V3(0, 0, -1).applyQuaternion(S.camera.quaternion);
  const oc = cam.clone().sub(c), b = oc.dot(dir), cc = oc.lengthSq() - rr * rr, disc = b * b - cc;
  box.hidden = false; cross.hidden = false;
  const body = $('#scanBody'); body.innerHTML = '';
  $('#scanTitle').textContent = 'Scanner · ' + S.objects[id].label;
  const row = (k, v) => { const r = el('div', 'sr'); r.appendChild(el('span', '', k)); r.appendChild(el('b', '', v)); body.appendChild(r); };
  if (disc < 0) { row('Target', 'Aim the crosshair at the surface'); cross.classList.remove('on'); return; }
  cross.classList.add('on');
  const t = -b - Math.sqrt(disc), hit = cam.clone().addScaledVector(dir, t);
  const lp = hit.sub(c).applyQuaternion(h.container.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
  const lat = Math.asin(lp.y) * R2D, lon = Math.atan2(-lp.z, lp.x) * R2D;
  const sf = O.surfaceAt(h, lat, lon);
  row('Position', O.fmtLatLon(lat, lon));
  if (id === 'earth') row('Over', O.countryAt(lat, lon) || O.oceanName(lat, lon));
  const band = O.bandAt(id, lat);
  if (band && S.planets[id] && S.planets[id].gas) { const w = O.windAt(id, lat); row('Cloud band', band); row('Wind', `${Math.abs(w).toFixed(0)} m/s · ${Math.abs(w * 3.6).toFixed(0)} km/h ${w >= 0 ? 'east' : 'west'}`); }
  if (id === 'venus' && !O.state.radar) row('Seeing', 'Sulfuric-acid cloud tops ≈ 65 km up · try Radar view');
  row('Local time', `${fmtTime(sf.lst)} · Sun ${sf.sunEl.toFixed(0)}° ${sf.sunEl > 0 ? '(day)' : sf.sunEl > -6 ? '(twilight)' : '(night)'}`);
  const n = O.nearestPOI(id, lat, lon); if (n) row('Nearest', `${n.f.name} · ${n.km < 50 ? 'here' : O.fmt.n(n.km, 0) + ' km'}`);
  row('View altitude', O.fmt.n(Math.max(0, (dist - rr) / rr * h.R) / (O.scale.mode === 'true' ? 1 : 1), 0) + ' km (scaled)');
}

/* ---------------- magnetic fields, belts, auroras, Io torus ---------------- */
const MAG = {
  earth: {pole: [80.8, -72.7], Ls: [1.5, 2, 3, 4.5, 6, 8, 10], col: '#6fb7ff', belts: true, aur: [23, '#5cff9d', 0.9], field: 'Surface field 25–65 µT. Dipole tilted ≈ 9° from the spin axis; geomagnetic north pole ≈ 80.8° N, 72.7° W (IGRF-14, 2025).'},
  jupiter: {pole: [80.4, 160], Ls: [3, 5.9, 10, 16, 25], col: '#c58bff', torus: 'io', aur: [16, '#ff7ad9', 0.8], field: 'Strongest planetary field: ≈ 420 µT at the equator. The magnetosphere is the largest structure in the Solar System, its tail reaching past Saturn\'s orbit.'},
  saturn: {pole: [90, 0], Ls: [3, 4, 6, 9, 14], col: '#ffd28a', aur: [15, '#ff7ad9', 0.6], field: '≈ 21 µT at the equator; the dipole is aligned with the spin axis to within 0.01° — a puzzle for dynamo theory.'},
  uranus: {pole: [31, 0], off: 0.3, Ls: [2, 3, 5, 8], col: '#9ff3ff', field: 'Tilted 59° from the spin axis and offset ≈ 0.3 radii from the centre, so the magnetosphere corkscrews as the planet spins.'},
  neptune: {pole: [43, 0], off: 0.55, Ls: [2, 3, 5, 8], col: '#8fb0ff', field: 'Tilted 47° and offset ≈ 0.55 radii from the centre.'},
  mercury: {pole: [90, 0], off: 0.2, Ls: [1.3, 1.6, 2.0, 2.6], col: '#c9c0b5', field: 'Weak (≈ 1% of Earth\'s) and offset ≈ 0.2 radii north; solar wind can reach the surface.'}
};
O.MAG = MAG;
function auroraMaterial(axis, colat, color, k, nightOnly) {
  return new THREE.ShaderMaterial({
    uniforms: {uAxis: {value: axis}, uC0: {value: colat * D2R}, uCol: {value: new THREE.Color(color)}, uK: {value: k}, uTime: {value: 0}, uSun: {value: new V3()}, uNight: {value: nightOnly ? 1 : 0}},
    vertexShader: `${O.SH.VHEAD} varying vec3 vObj; varying vec3 vWN; varying vec3 vWP; void main(){ vObj = normalize(position); vWN = normalize(mat3(modelMatrix)*normal); vec4 wp = modelMatrix*vec4(position,1.0); vWP = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; ${O.SH.VTAIL} }`,
    fragmentShader: `${O.SH.FHEAD}${O.SH.NOISE}
    uniform vec3 uAxis, uCol, uSun; uniform float uC0, uK, uTime, uNight; varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
    void main(){
      float cn = acos(clamp(dot(vObj, uAxis), -1.0, 1.0)), cs = acos(clamp(dot(vObj, -uAxis), -1.0, 1.0));
      float c = min(cn, cs);
      vec3 ref = normalize(cross(uAxis, vec3(0.0, 0.0, 1.0)) + 1e-4); float az = atan(dot(vObj, cross(uAxis, ref)), dot(vObj, ref));
      float wav = snoise(vec3(az * 3.0, uTime * 0.25, c * 8.0)) * 0.05;
      float band = exp(-pow((c - uC0 - wav) / 0.035, 2.0));
      float curtain = 0.55 + 0.45 * snoise(vec3(az * 14.0, uTime * 0.6, 1.0));
      float L = dot(normalize(vWN), normalize(uSun - vWP));
      float night = mix(1.0, smoothstep(0.15, -0.2, L), uNight);
      vec3 V = normalize(cameraPosition - vWP); float rim = 0.5 + 0.8 * pow(1.0 - abs(dot(normalize(vWN), V)), 2.0);
      gl_FragColor = vec4(uCol, band * curtain * night * uK * rim);
      ${O.SH.FTAIL}
    }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
}
function buildMagnetospheres() {
  S.mags = {};
  for (const id in MAG) {
    const P = S.planets[id], m = MAG[id], R = P.B.R;
    const axis = loc(m.pole[0], m.pole[1]).normalize();
    const grp = new THREE.Group(); P.tilt.add(grp); grp.visible = false;
    const qAx = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), axis);
    const off = axis.clone().multiplyScalar(m.off || 0);
    const g = (r) => O.moonDistFactor(r * R, R);
    const pos = [], cols = [];
    const colA = new THREE.Color(m.col);
    for (const L of m.Ls) {
      const lmax = Math.acos(Math.sqrt(1 / L));
      for (let k = 0; k < 12; k++) {
        const ph = k / 12 * Math.PI * 2; let prev = null;
        for (let i = 0; i <= 48; i++) {
          const la = -lmax + 2 * lmax * i / 48, r = L * Math.cos(la) * Math.cos(la), rr = g(Math.max(1, r));
          const v = new V3(rr * Math.cos(la) * Math.cos(ph), rr * Math.sin(la), rr * Math.cos(la) * Math.sin(ph)).applyQuaternion(qAx).add(off);
          if (prev) { pos.push(prev.x, prev.y, prev.z, v.x, v.y, v.z); const c = colA.clone().multiplyScalar(0.5 + 0.5 * (1 - L / m.Ls[m.Ls.length - 1])); cols.push(c.r, c.g, c.b, c.r, c.g, c.b); }
          prev = v;
        }
      }
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    grp.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({vertexColors: true, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false})));
    const M = {id, grp, axis, qAx, off, m};
    if (m.belts) { // Van Allen belts: trapped particles bouncing between mirror points and drifting around Earth
      const n = 7000, p = new Float32Array(n * 3), c = new Float32Array(n * 3), s = new Float32Array(n), seed = new Float32Array(n * 5), Rn = O.makeNoise(61).rnd;
      for (let i = 0; i < n; i++) {
        const inner = Rn() < 0.4, L = inner ? 1.25 + Rn() * 0.9 : 3.2 + Rn() * 3.2;
        seed.set([L, Rn() * 6.283, Rn() * 6.283, (inner ? -1 : 1) * (0.4 + Rn() * 0.6), 0.25 + Rn() * 0.6], i * 5);
        const col = inner ? [1.0, 0.45, 0.35] : [0.45, 0.7, 1.0]; c.set(col, i * 3); s[i] = 0.9;
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(p, 3)); bg.setAttribute('color', new THREE.BufferAttribute(c, 3)); bg.setAttribute('size', new THREE.BufferAttribute(s, 1));
      const pts = new THREE.Points(bg, O.pointsMaterial({scale: 0.5, max: 3, opacity: 0.7})); pts.frustumCulled = false; grp.add(pts);
      M.belts = {pts, seed, n, g};
    }
    if (m.aur) {
      const am = auroraMaterial(axis, m.aur[0], m.aur[1], m.aur[2], id === 'earth');
      const sh = new THREE.Mesh(new THREE.SphereGeometry(id === 'earth' ? 1.025 : 1.012, 96, 64), am);
      P.tilt.add(sh); M.aurora = sh; sh.visible = id === 'earth';
    }
    if (m.torus) {
      const io = O.MOONS.jupiter.find((x) => x.id === 'io'), rr = O.moonDistFactor(io.a, R);
      const n = 4000, Rn = O.makeNoise(67).rnd;
      const tp = new Float32Array(n * 3), tc = new Float32Array(n * 3), ts = new Float32Array(n);
      for (let i = 0; i < n; i++) { const a = Rn() * 6.283, d = rr + (Rn() + Rn() - 1) * 0.18, y = (Rn() + Rn() - 1) * 0.12; tp.set([Math.cos(a) * d, y, Math.sin(a) * d], i * 3); tc.set(Rn() < 0.6 ? [0.9, 0.35, 0.6] : [0.6, 0.4, 1.0], i * 3); ts[i] = 1; }
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setAttribute('color', new THREE.BufferAttribute(tc, 3)); tg.setAttribute('size', new THREE.BufferAttribute(ts, 1));
      const torus = new THREE.Points(tg, O.pointsMaterial({scale: 1.2, max: 4, opacity: 0.55})); torus.frustumCulled = false;
      const tq = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), axis); torus.quaternion.copy(tq); // centred on the magnetic equator
      grp.add(torus); M.torus = torus;
    }
    S.mags[id] = M;
  }
}
function updateMags(t) {
  for (const id in S.mags) {
    const M = S.mags[id], P = S.planets[id];
    const near = S.camera.position.distanceTo(P.sys.position) < P.tilt.scale.x * 60;
    const on = O.layers.magnet && near && O.state.cut !== id;
    M.grp.visible = on;
    if (M.aurora) { M.aurora.visible = near && (id === 'earth' || on); M.aurora.material.uniforms.uTime.value = t; }
    if (on && M.belts) {
      const B = M.belts, a = B.pts.geometry.attributes.position.array;
      for (let i = 0; i < B.n; i++) {
        const L = B.seed[i * 5], ph = B.seed[i * 5 + 1] + t * 0.15 * B.seed[i * 5 + 3], lm = Math.acos(Math.sqrt(1 / L)) * 0.55 * B.seed[i * 5 + 4];
        const la = lm * Math.sin(t * 2.2 + B.seed[i * 5 + 2]), r = B.g(Math.max(1, L * Math.cos(la) * Math.cos(la)));
        const v = new V3(r * Math.cos(la) * Math.cos(ph), r * Math.sin(la), r * Math.cos(la) * Math.sin(ph)).applyQuaternion(M.qAx).add(M.off);
        a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z;
      }
      B.pts.geometry.attributes.position.needsUpdate = true;
      B.pts.material.uniforms.uScale.value = 0.5 * P.tilt.scale.x / 0.62;
    }
    if (on && M.torus) M.torus.material.uniforms.uScale.value = 1.2 * P.tilt.scale.x / 1.94;
  }
}

/* ---------------- plumes: Io volcanoes, Enceladus geysers, Triton geysers ---------------- */
const PLUMES = {io: [[-18.7, 104.3, 0.17, '#ffe08a'], [13, 51, 0.1, '#ffd070'], [-1.5, -153, 0.06, '#fff0b0']], enceladus: [[-85, 30, 0.6, '#e8f4ff'], [-82, 150, 0.5, '#e8f4ff'], [-86, -100, 0.55, '#e8f4ff']], triton: [[-50, 60, 0.03, '#d8d0c8'], [-57, 30, 0.03, '#d8d0c8']]};
function buildPlumes() {
  S.plumes = [];
  for (const id in PLUMES) {
    const h = bodyHolder(id); if (!h) continue;
    for (const [la, lo, ht, col] of PLUMES[id]) {
      const n = 500, p = new Float32Array(n * 3), c = new Float32Array(n * 3), s = new Float32Array(n), seed = new Float32Array(n * 3), Rn = O.makeNoise((la * 100 + lo) | 0).rnd;
      const cc = new THREE.Color(col);
      for (let i = 0; i < n; i++) { seed.set([Rn(), Rn() * 6.283, Rn()], i * 3); c.set([cc.r, cc.g, cc.b], i * 3); s[i] = 0.6 + Rn(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('size', new THREE.BufferAttribute(s, 1));
      const pts = new THREE.Points(g, O.pointsMaterial({scale: 0.02, max: 5, opacity: 0.6})); pts.frustumCulled = false;
      h.container.add(pts);
      const up = loc(la, lo).normalize(), t1 = new V3().crossVectors(up, new V3(0, 1, 0.01)).normalize(), t2 = new V3().crossVectors(up, t1);
      S.plumes.push({h, pts, seed, n, up, t1, t2, ht, umbrella: id === 'io'});
    }
  }
}
function updatePlumes(t) {
  for (const q of S.plumes) {
    const near = S.camera.position.distanceTo(q.h.center()) < q.h.renderR() * 14;
    q.pts.visible = near; if (!near) continue;
    const a = q.pts.geometry.attributes.position.array;
    for (let i = 0; i < q.n; i++) {
      const f = (q.seed[i * 3] + t * 0.12) % 1, ang = q.seed[i * 3 + 1];
      const hgt = q.umbrella ? q.ht * 4 * f * (1 - f) : q.ht * f, spread = q.umbrella ? q.ht * 1.6 * f : q.ht * 0.25 * f;
      const v = q.up.clone().multiplyScalar(1 + hgt).addScaledVector(q.t1, Math.cos(ang) * spread).addScaledVector(q.t2, Math.sin(ang) * spread);
      a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z;
    }
    q.pts.geometry.attributes.position.needsUpdate = true;
    q.pts.material.uniforms.uScale.value = 0.02 * q.h.renderR() * 40;
  }
}

/* ---------------- Lagrange points ---------------- */
const LAGR = [
  {id: 'earth-l3', planet: 'earth', k: 'L3', name: 'Sun–Earth L3', desc: 'Directly behind the Sun from Earth. Unstable; nothing is known to orbit here — and nothing hides there, despite the science-fiction trope.'},
  {id: 'earth-l4', planet: 'earth', k: 'L4', name: 'Sun–Earth L4', desc: 'A stable point 60° ahead of Earth. Earth\'s known Trojan asteroids, 2010 TK7 and 2020 XL5, librate around it.'},
  {id: 'earth-l5', planet: 'earth', k: 'L5', name: 'Sun–Earth L5', desc: 'A stable point 60° behind Earth, proposed for space-weather observatories that see solar storms before they rotate toward Earth (ESA\'s Vigil mission, planned for 2031).'},
  {id: 'jup-l4', planet: 'jupiter', k: 'L4', name: 'Jupiter L4 · Greek camp', desc: 'Thousands of Trojan asteroids gather 60° ahead of Jupiter. NASA\'s Lucy spacecraft is touring them through 2033.'},
  {id: 'jup-l5', planet: 'jupiter', k: 'L5', name: 'Jupiter L5 · Trojan camp', desc: 'The trailing swarm, 60° behind Jupiter; Lucy will fly past the binary Patroclus–Menoetius in 2033.'},
  {id: 'jup-l1', planet: 'jupiter', k: 'L1', name: 'Sun–Jupiter L1', desc: 'Where Jupiter\'s and the Sun\'s gravity balance, ≈ 0.35 AU sunward of Jupiter. Unstable.'},
  {id: 'jup-l2', planet: 'jupiter', k: 'L2', name: 'Sun–Jupiter L2', desc: '≈ 0.36 AU beyond Jupiter, on the far side from the Sun. Unstable.'}
];
function buildLagrange() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.strokeStyle = '#9dd6ff'; x.lineWidth = 5; x.beginPath(); x.moveTo(32, 6); x.lineTo(58, 32); x.lineTo(32, 58); x.lineTo(6, 32); x.closePath(); x.stroke();
  const tex = new THREE.CanvasTexture(c);
  S.lagr = [];
  for (const L of LAGR) {
    const g = new THREE.Group(); S.scene.add(g);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, sizeAttenuation: false, transparent: true, opacity: 0.8})); spr.scale.setScalar(0.018); g.add(spr);
    S.lagr.push({L, g, spr});
    O.addPick(L.id, g, () => 0.5, {kind: 'lagrange', label: L.name, lag: L});
  }
}
function updateLagrange() {
  const mu = {earth: 3.0e-6, jupiter: 9.54e-4};
  for (const q of S.lagr) {
    const P = S.planets[q.L.planet], e = P.ecl; if (!e) continue; let v;
    const rot = (a) => [e[0] * Math.cos(a) - e[1] * Math.sin(a), e[0] * Math.sin(a) + e[1] * Math.cos(a), e[2]];
    const hr = Math.cbrt(mu[q.L.planet] / 3);
    if (q.L.k === 'L4') v = rot(Math.PI / 3); else if (q.L.k === 'L5') v = rot(-Math.PI / 3); else if (q.L.k === 'L3') v = [-e[0], -e[1], -e[2]];
    else if (q.L.k === 'L1') v = e.map((x) => x * (1 - hr)); else v = e.map((x) => x * (1 + hr));
    O.mapVec(v, q.g.position);
    q.g.visible = q.spr.visible = O.layers.lagrange;
  }
}

/* ---------------- extra objects: Parker Solar Probe, New Horizons, dwarf planets ---------------- */
const DWARFS = [
  {id: 'eris', name: 'Eris', ra: 26.5, dec: -1.5, au: 95.8, R: 1163, col: '#e8e4dc', desc: 'Almost exactly Pluto\'s size but 27% more massive; its discovery in 2005 triggered the 2006 redefinition of "planet". Moon: Dysnomia. Orbit 557 years.', facts: [['Diameter', '2,326 km'], ['Distance now', '≈ 96 AU (near aphelion)'], ['Moon', 'Dysnomia']]},
  {id: 'makemake', name: 'Makemake', ra: 197, dec: 25.5, au: 52.6, R: 715, col: '#d9a98a', desc: 'Reddish dwarf planet with methane ice; a small dark moon (MK 2) was found in 2016.', facts: [['Diameter', '≈ 1,430 km'], ['Distance now', '≈ 53 AU'], ['Orbit', '≈ 306 years']]},
  {id: 'haumea', name: 'Haumea', ra: 216, dec: 15, au: 50, R: 816, col: '#e9ecef', desc: 'Spins every 3.9 hours, stretching it into an egg shape ≈ 2,100 km long. It has a ring and two moons, Hiʻiaka and Namaka.', facts: [['Size', '≈ 2,100 × 1,700 × 1,100 km'], ['Day', '3.9 hours'], ['Ring', 'Yes (found 2017)']]},
  {id: 'sedna', name: 'Sedna', ra: 58, dec: 7.6, au: 83, R: 500, col: '#c4563a', desc: 'One of the reddest objects known, on an ≈ 11,000-year orbit reaching ≈ 900 AU. Perihelion (≈ 76 AU) comes in 2076.', facts: [['Diameter', '≈ 1,000 km'], ['Distance now', '≈ 83 AU, inbound'], ['Orbit', '≈ 11,400 years']]}
];
function buildExtras() {
  // Parker Solar Probe: q = 0.0459 AU, Q ≈ 0.73 AU, P = 88 d; perihelion 24 Dec 2024 11:53 UTC. Orientation schematic.
  const g = new THREE.Group(); S.scene.add(g);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({map: O.glowTexture('rgba(255,255,255,1)', 'rgba(255,200,120,0.2)', 64), color: 0xffd6a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true})); g.add(spr);
  const line = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({color: 0xffc78a, dashSize: 1, gapSize: 1, transparent: true, opacity: 0.45})); line.frustumCulled = false; S.scene.add(line);
  const psp = {a: (0.0459 + 0.7316) / 2, e: (0.7316 - 0.0459) / (0.7316 + 0.0459), Tp: O.jd(Date.UTC(2024, 11, 24, 11, 53)), P: 88.0, peri: 200 * D2R, g, spr, line};
  S.psp = psp;
  O.addPick('parker', g, () => 0.3, {kind: 'probe2', label: 'Parker Solar Probe'});
  S.dwarfs = [];
  for (const d of DWARFS) {
    const gg = new THREE.Group(); S.scene.add(gg);
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({color: d.col, roughness: 1})); gg.add(m);
    const dir = O.radecToScene(d.ra, d.dec, new V3()).normalize();
    S.dwarfs.push({d, gg, m, dir});
    O.addPick(d.id, gg, () => m.scale.x, {kind: 'dwarf', label: d.name, dwarf: d});
  }
}
function keplerPos(a, e, peri, M) {
  let E = M; for (let k = 0; k < 30; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  return [x * Math.cos(peri) - y * Math.sin(peri), x * Math.sin(peri) + y * Math.cos(peri), 0];
}
function updateExtras(jd) {
  const q = S.psp;
  let M = 2 * Math.PI * (jd - q.Tp) / q.P; M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const pe = keplerPos(q.a, q.e, q.peri, M); q.ecl = pe;
  O.mapVec(pe, q.g.position);
  q.spr.scale.setScalar(Math.max(0.6, S.camera.position.distanceTo(q.g.position) * 0.012));
  if (!q.built || q.mode !== O.scale.mode) { const pts = []; for (let i = 0; i <= 200; i++) pts.push(O.mapVec(keplerPos(q.a, q.e, q.peri, i / 200 * Math.PI * 2))); q.line.geometry.dispose(); q.line.geometry = new THREE.BufferGeometry().setFromPoints(pts); q.line.computeLineDistances(); q.built = true; q.mode = O.scale.mode; }
  q.line.visible = O.layers.orbits;
  for (const w of S.dwarfs) {
    w.gg.position.copy(w.dir).multiplyScalar(O.mapAU(w.d.au));
    const r = Math.max(O.bodyRadius(w.d.R), S.camera.position.distanceTo(w.gg.position) * 0.003); w.m.scale.setScalar(r);
  }
}

/* ---------------- Venus radar view ---------------- */
O.toggleRadar = function (on) {
  const P = S.planets.venus; O.state.radar = on;
  if (on && !P.radarMat) {
    P.radarMat = O.rockyMaterial(null, '#8a6a3a');
    O.queueJob(function* () { yield* O.rockyGen('venus_radar', null, (map, bump) => { P.radarMat.map = map; P.radarMat.bumpMap = bump; P.radarMat.bumpScale = 0.03; P.radarMat.color.set(0xffffff); P.radarMat.needsUpdate = true; }); }, true);
    P.gasMat = P.mesh.material;
  }
  P.mesh.material = on ? P.radarMat : P.gasMat || P.mesh.material;
  if (P.atmo) P.atmo.visible = !on;
  O.toast(on ? 'Radar view: Venus\'s surface as mapped by Magellan\'s radar, seen through the clouds (simplified map).' : 'Cloud view');
  O.refreshFocusBar();
};

/* ---------------- focus toolbar ---------------- */
O.refreshFocusBar = function () {
  const bar = $('#focusbar'); if (!bar) return;
  const id = O.state.focus, p = id && S.objects[id];
  bar.innerHTML = '';
  if (!p || O.SIM.active || (O.SKY && O.SKY.active) || !['planet', 'moon', 'sun'].includes(p.kind)) { bar.hidden = true; return; }
  bar.hidden = false;
  const add = (label, on, fn, cls) => { const b = el('button', 'fb' + (on ? ' on' : '') + (cls ? ' ' + cls : ''), label); b.addEventListener('click', fn); bar.appendChild(b); return b; };
  const layers = p.kind === 'moon' ? p.moon.m.layers : O.BODIES[id] && O.BODIES[id].layers;
  if (layers) {
    add(O.state.cut === id ? 'Close cut' : 'Slice open', O.state.cut === id, () => { O.setCutaway(id, O.state.cut !== id); O.refreshFocusBar(); O.rerender(); }, 'pri');
    if (O.state.cut === id) {
      add('Wedge', O.state.cutMode !== 'half', () => { O.state.cutMode = 'wedge'; O.setCutaway(id, false); O.setCutaway(id, true); O.refreshFocusBar(); });
      add('Half', O.state.cutMode === 'half', () => { O.state.cutMode = 'half'; O.setCutaway(id, false); O.setCutaway(id, true); O.refreshFocusBar(); });
    }
  }
  if (p.kind !== 'sun') add('Scanner', O.layers.scanner, () => { O.layers.scanner = !O.layers.scanner; O.refreshFocusBar(); });
  if (O.POIS[id]) add('Features', O.layers.features, () => { O.layers.features = !O.layers.features; O.refreshFocusBar(); });
  if (MAG[id]) add('Magnetic field', O.layers.magnet, () => { O.layers.magnet = !O.layers.magnet; O.refreshFocusBar(); if (O.layers.magnet) O.toast(id === 'earth' ? 'Field lines + Van Allen belts: red = inner (protons), blue = outer (electrons). Dipole model; solar-wind shaping not shown.' : 'Dipole field model; solar-wind shaping not shown. Auroras shown in false colour (they glow mainly in ultraviolet).'); });
  if (id === 'venus') add('Radar view', O.state.radar, () => O.toggleRadar(!O.state.radar));
  if (id === 'earth') add('Sky view', false, () => O.openSkyDefault());
  add('Zoom out', false, () => O.home());
};

/* ---------------- cut-face layer labels ---------------- */
const cutEls = [];
O.updateCutLabels = function () {
  const id = O.state.cut, p = id && S.objects[id];
  const hide = () => { for (const e of cutEls) e.style.display = 'none'; };
  if (!p || O.SIM.active) return hide();
  const h = p.kind === 'planet' ? p.planet : p.kind === 'sun' ? S.sun : p.moon;
  const mesh = p.kind === 'planet' ? p.planet.mesh : p.kind === 'sun' ? S.sun.mesh : p.moon.mesh;
  const layers = p.kind === 'moon' ? p.moon.m.layers : O.BODIES[id].layers;
  if (!h || !h._faces) return hide();
  layers.forEach((L, i) => {
    let e = cutEls[i]; if (!e) { e = el('div', 'lb cutl'); $('#labels').appendChild(e); cutEls[i] = e; }
    const rm = (L.r0 + L.r1) / 2, half = O.state.cutMode === 'half';
    const a = (half ? (i % 2 ? 140 : 40) : 62) * D2R;
    let lp = half ? new V3(Math.cos(a) * rm, Math.sin(a) * rm * (i % 2 ? 1 : 1), 0) : (i % 2 ? new V3(-Math.cos(a) * rm, Math.sin(a) * rm, 0) : new V3(0, Math.sin(a) * rm, -Math.cos(a) * rm));
    const wp = mesh.localToWorld(lp.clone()); const pr = wp.clone().project(S.camera);
    if (pr.z > 1) { e.style.display = 'none'; return; }
    e.textContent = L.name; e.style.display = 'block';
    e.classList.toggle('sel', O.state.hiLayer === i);
    e.style.transform = `translate(${((pr.x * 0.5 + 0.5) * S.W).toFixed(1)}px,${((-pr.y * 0.5 + 0.5) * S.H).toFixed(1)}px) translate(-50%,-100%)`;
  });
  for (let i = layers.length; i < cutEls.length; i++) cutEls[i].style.display = 'none';
};

/* ---------------- quick stats for hover / distance labels ---------------- */
O.quickStats = function (p) {
  try {
    const E = S.planets.earth.ecl, kmFromEarth = (e) => Math.hypot(e[0] - E[0], e[1] - E[1], e[2] - E[2]) * O.AU_KM;
    if (p.kind === 'planet') { const B = p.planet.B, m = (O.MOONS[p.id] || []).length; return `⌀ ${O.fmt.n(B.R * 2, 0)} km` + (p.id !== 'earth' ? ` · ${O.fmt.km(kmFromEarth(p.planet.ecl))} away` : '') + (B.facts.find((f) => /moons/i.test(f[0])) ? ` · ${B.facts.find((f) => /moons/i.test(f[0]))[1].split(' ')[0]} moons` : ''); }
    if (p.kind === 'moon') return `⌀ ${O.fmt.n(p.moon.m.R * 2, 0)} km · orbit ${O.fmt.km(p.moon.m.a)}`;
    if (p.kind === 'sat') return p.sat.state ? `${O.fmt.n(p.sat.state.alt, 0)} km up · ${p.sat.state.speed.toFixed(2)} km/s` : '';
    if (p.kind === 'deep') return p.deep.D.lyText || O.fmt.ly(p.deep.D.ly);
    if (p.kind === 'poi') return p.poi.f.type;
    if (p.kind === 'dwarf') return `≈ ${p.dwarf.au} AU from the Sun`;
    if (p.kind === 'sun') return `${O.fmt.km(Math.hypot(...E) * O.AU_KM)} from Earth`;
    if (p.kind === 'comet') return `${Math.hypot(...S.comet.ecl).toFixed(1)} AU from the Sun`;
  } catch (e) {}
  return '';
};

O.initExplore = function () {
  buildPOIs(); buildMagnetospheres(); buildPlumes(); buildLagrange(); buildExtras();
  S.tick.push((t, jd) => { updatePOIs(); updateMags(t); updatePlumes(t); updateLagrange(); updateExtras(jd); });
};
let sig = '';
O.updateExplore = function (dt) {
  updateScanner(dt); O.updateCutLabels();
  const k = [O.state.focus, O.state.cut, O.state.cutMode, O.state.radar, O.layers.scanner, O.layers.features, O.layers.magnet, !!O.SIM.active, !!(O.SKY && O.SKY.active)].join('|');
  if (k !== sig) { sig = k; O.refreshFocusBar(); document.querySelectorAll('#layerSeg button').forEach((b) => b.classList.toggle('on', !!O.layers[b.dataset.k])); }
  // detail uniforms: extra surface detail as the camera closes in
  const cam = S.camera.position;
  for (const id of O.PLANET_ORDER) {
    const P = S.planets[id], u = P.mesh.material.uniforms; if (!u) continue;
    const rr = P.tilt.scale.x, dd = cam.distanceTo(P.sys.position), det = Math.max(0, Math.min(1, 1 - (dd - rr) / (rr * 3)));
    if (u.uDetail) u.uDetail.value = det;
    if (u.uReal) u.uReal.value = performance.now() / 1000;
    if (u.uTime && id === 'earth') u.uTime.value = performance.now() / 1000;
    if (u.uPole && id === 'earth') u.uPole.value.copy(P.pole);
    if (id === 'earth' && P.clouds && P.clouds.material.uniforms) P.clouds.material.uniforms.uDetail.value = det;
  }
};

})(window.ORR);
