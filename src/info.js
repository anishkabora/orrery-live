/* ============================================================
   INFO — deeper knowledge for every object: exploration history,
   origin, open questions, surprising facts, atmosphere make-up,
   discovery of moons, spacecraft specs, plus personal calculators.
   ============================================================ */
(function (O) {
const S = O.S;

/* [year, mission, agency, what it did] */
O.INFO = {
  sun: {
    g: 274, missions: [[1995, 'SOHO', 'ESA/NASA', 'Watching from L1 for 30 years; found 5,000+ sungrazing comets'], [2010, 'Solar Dynamics Observatory', 'NASA', 'Full-disk images every 12 s in 10 wavelengths'], [2018, 'Parker Solar Probe', 'NASA', 'First spacecraft to fly through the corona (2021)'], [2020, 'Solar Orbiter', 'ESA/NASA', 'First images of the Sun\'s poles (2025)'], [2020, 'DKIST', 'NSF', 'Largest solar telescope (4 m) — sharpest surface images'], [2023, 'Aditya-L1', 'ISRO', 'India\'s first solar observatory, at L1 since Jan 2024']],
    origin: 'Formed ≈ 4.6 billion years ago when a fragment of a cold molecular cloud collapsed — possibly nudged by a nearby supernova, whose short-lived isotopes are found in meteorites. 99.86% of the material ended up in the Sun; the rest became planets.',
    unknowns: ['Why is the corona (1–3 million K) hundreds of times hotter than the surface below it?', 'What sets the strength of each 11-year cycle — and why did sunspots nearly vanish in 1645–1715 (the Maunder Minimum)?', 'How exactly is the fast solar wind accelerated?'],
    dyk: ['The energy reaching you as sunlight today was made in the core thousands of years ago — it random-walks out for 10,000–170,000 years, then crosses to Earth in 8 minutes 20 seconds.', 'The Sun converts ≈ 4 million tonnes of matter into energy every second, yet will lose only ≈ 0.03% of its mass over its whole lifetime.', 'Seen from space the Sun is white; our atmosphere scatters blue light away and makes it look yellow.'],
    atmo: null
  },
  mercury: {
    g: 3.7, year: 87.97, day: 4222.6, missions: [[1974, 'Mariner 10', 'NASA', 'Three flybys, mapped 45% of the surface'], [2011, 'MESSENGER', 'NASA', 'First orbiter; found polar ice and a hollow-pitted surface'], [2018, 'BepiColombo', 'ESA/JAXA', 'Two orbiters, arriving in orbit Nov 2026']],
    origin: 'Its iron core is ≈ 85% of its radius — far too big. Leading ideas: a giant impact stripped away much of its rocky mantle, or it formed where the young Sun\'s heat vaporised lighter rock.',
    unknowns: ['Why is the core so large?', 'Why is its magnetic field offset 480 km north of the centre?', 'What creates the bright "hollows" — fresh pits where something volatile is escaping?'],
    dyk: ['One solar day (sunrise to sunrise) lasts two Mercury years.', 'Mercury is shrinking: its radius has contracted by ≈ 7 km as the core cooled, wrinkling the crust into cliffs up to 3 km high.', 'It is not the hottest planet — Venus is, thanks to its greenhouse atmosphere.'],
    atmo: null
  },
  venus: {
    g: 8.87, year: 224.7, day: 2802, missions: [[1962, 'Mariner 2', 'NASA', 'First successful planetary flyby'], [1970, 'Venera 7', 'USSR', 'First landing on another planet — transmitted for 23 minutes'], [1982, 'Venera 13', 'USSR', 'First colour pictures from the surface'], [1990, 'Magellan', 'NASA', 'Radar-mapped 98% of the surface'], [2006, 'Venus Express', 'ESA', 'Studied the super-rotating atmosphere'], [2015, 'Akatsuki', 'JAXA', 'Climate orbiter, operated until 2024'], [2030, 'DAVINCI · VERITAS · EnVision', 'NASA/ESA', 'Planned descent probe and radar orbiters (2030s)']],
    origin: 'Probably formed much like Earth and may once have had shallow oceans. A runaway greenhouse boiled them away; the hydrogen escaped to space, leaving a CO₂ atmosphere 90 times thicker than ours.',
    unknowns: ['Was Venus ever habitable, and for how long?', 'Is it volcanically active today? (2023 reanalysis of Magellan images found a vent that changed shape.)', 'What absorbs ultraviolet light in the clouds — the "unknown absorber"?'],
    dyk: ['A Venus day (243 Earth days) is longer than its year (225 days).', 'At 464 °C the surface is hot enough to melt lead — at night too.', 'Venus is the brightest object in the night sky after the Moon.'],
    atmo: [['CO₂', 96.5, '#d9a066'], ['N₂', 3.5, '#8fa6c9']]
  },
  earth: {
    g: 9.81, year: 365.256, day: 24, missions: [[1957, 'Sputnik 1', 'USSR', 'First artificial satellite'], [1958, 'Explorer 1', 'USA', 'Discovered the Van Allen radiation belts'], [1968, 'Apollo 8', 'NASA', '"Earthrise" — first photo of Earth from lunar orbit'], [1972, 'Landsat 1', 'NASA/USGS', 'Start of the longest continuous record of Earth from space'], [1990, 'Voyager 1', 'NASA', '"Pale Blue Dot" from 6 billion km'], [1998, 'ISS', 'International', 'Continuously crewed since 2000']],
    origin: 'Formed ≈ 4.54 billion years ago from colliding planetesimals. A Mars-sized body (Theia) struck the young Earth, and the debris formed the Moon. Oceans existed by ≈ 4.4 billion years ago.',
    unknowns: ['When did plate tectonics begin — 4 billion or 2.5 billion years ago?', 'How and where did life start?', 'How old is the solid inner core (estimates range from 0.5 to 2 billion years)?'],
    dyk: ['Days are getting longer by ≈ 1.8 milliseconds per century as tides slow Earth\'s spin.', 'Earth is not a perfect sphere: the equator bulges ≈ 21 km farther out than the poles.', 'By mass Earth is mostly iron (≈ 32%), then oxygen (≈ 30%).'],
    atmo: [['N₂', 78.08, '#8fa6c9'], ['O₂', 20.95, '#5fb3c6'], ['Ar', 0.93, '#b49ad9'], ['CO₂ & other', 0.04, '#d9a066']]
  },
  moon: {
    g: 1.62, year: 27.32, day: 708.7, missions: [[1959, 'Luna 2', 'USSR', 'First human-made object to reach the Moon'], [1966, 'Luna 9', 'USSR', 'First soft landing and surface photos'], [1969, 'Apollo 11', 'NASA', 'First humans on the Moon'], [1972, 'Apollo 17', 'NASA', 'Last crewed landing of the Apollo era'], [2008, 'Chandrayaan-1', 'ISRO', 'Its M3 instrument confirmed water molecules on the surface'], [2019, 'Chang\'e 4', 'CNSA', 'First landing on the far side'], [2023, 'Chandrayaan-3', 'ISRO', 'First landing near the south pole'], [2024, 'Chang\'e 6', 'CNSA', 'First samples returned from the far side']],
    origin: 'Formed from the debris of the giant impact between the proto-Earth and Theia ≈ 4.5 billion years ago. Moon rocks match Earth\'s oxygen isotopes almost exactly — a clue that the two mixed thoroughly.',
    unknowns: ['Exactly how did the giant impact happen to give such similar compositions?', 'How much water ice is locked in the permanently shadowed polar craters?', 'Why is the far side\'s crust so much thicker, with almost no dark maria?'],
    dyk: ['The Moon drifts ≈ 3.8 cm farther from Earth every year — measured with lasers bounced off Apollo reflectors.', 'Its surface is as dark as worn asphalt; it only looks bright against the night sky.', 'We always see the same side, but wobbles (libration) let us see 59% of the surface over time.'],
    atmo: null
  },
  mars: {
    g: 3.71, year: 686.98, day: 24.66, missions: [[1965, 'Mariner 4', 'NASA', 'First close-up photos of another planet'], [1976, 'Viking 1 & 2', 'NASA', 'First long-lived landers; searched for life'], [1997, 'Pathfinder · Sojourner', 'NASA', 'First rover on Mars'], [2004, 'Spirit & Opportunity', 'NASA', 'Opportunity drove 45 km over 14 years'], [2012, 'Curiosity', 'NASA', 'Showed Gale crater once held a habitable lake'], [2014, 'Mangalyaan (MOM)', 'ISRO', 'India reached Mars orbit on its first attempt'], [2021, 'Perseverance & Ingenuity', 'NASA', 'First powered flight on another world (72 flights)'], [2021, 'Tianwen-1 · Zhurong', 'CNSA', 'China\'s first Mars orbiter and rover'], [2021, 'Hope', 'UAE', 'Weather satellite studying the atmosphere']],
    origin: 'Formed fast and stayed small — perhaps a planetary embryo that never grew. It lost its global magnetic field ≈ 4 billion years ago; the solar wind then stripped most of its atmosphere (measured by MAVEN), and its rivers and lakes dried up.',
    unknowns: ['Did life ever arise on Mars?', 'Where did all the water go? (InSight hinted at liquid water 11–20 km down in the crust.)', 'Why is the planet lopsided — low, smooth north and high, cratered south?'],
    dyk: ['Martian sunsets are blue: fine dust scatters blue light forward around the Sun.', 'Olympus Mons is ≈ 2.5 times the height of Everest — and so broad its summit is beyond the horizon from its edge.', 'A year on Mars lasts 687 Earth days, so seasons last about twice as long.'],
    atmo: [['CO₂', 95, '#d9a066'], ['N₂', 2.8, '#8fa6c9'], ['Ar', 2, '#b49ad9'], ['O₂ & CO', 0.2, '#5fb3c6']]
  },
  jupiter: {
    g: 24.79, year: 4332.6, day: 9.93, missions: [[1973, 'Pioneer 10', 'NASA', 'First flyby of Jupiter'], [1979, 'Voyager 1 & 2', 'NASA', 'Discovered rings and Io\'s volcanoes'], [1995, 'Galileo', 'NASA', 'First orbiter; dropped a probe into the atmosphere'], [2016, 'Juno', 'NASA', 'Polar orbiter: dilute core, deep winds, polar cyclones'], [2023, 'JUICE', 'ESA', 'En route; arrives 2031, will orbit Ganymede'], [2024, 'Europa Clipper', 'NASA', 'En route; arrives 2030, 49 flybys of Europa']],
    origin: 'Probably the first planet to form, within a few million years, gathering gas onto a core of rock and ice. It may have migrated inward and then back out (the "Grand Tack"), shaping the asteroid belt and starving Mars of material.',
    unknowns: ['How did its core end up "dilute" — dissolved over half the planet?', 'Why is the Great Red Spot shrinking, and will it disappear?', 'How much water does Jupiter contain? (Galileo\'s probe fell into an unusually dry patch.)'],
    dyk: ['About 1,300 Earths would fit inside Jupiter.', 'Jupiter and the Sun orbit a common point that lies just outside the Sun\'s surface.', 'Jupiter has the shortest day of any planet: under 10 hours.'],
    atmo: [['H₂', 89.8, '#e6d3b2'], ['He', 10.2, '#c99a64'], ['CH₄, NH₃ …', 0.3, '#8fa6c9']]
  },
  saturn: {
    g: 10.44, year: 10759, day: 10.66, missions: [[1979, 'Pioneer 11', 'NASA', 'First flyby of Saturn'], [1980, 'Voyager 1 & 2', 'NASA', 'Revealed ring structure and the hexagon'], [2004, 'Cassini–Huygens', 'NASA/ESA/ASI', '13 years in orbit; Huygens landed on Titan (2005)'], [2017, 'Cassini Grand Finale', 'NASA', '22 dives between the rings and the planet'], [2028, 'Dragonfly', 'NASA', 'Rotorcraft to Titan (launch 2028, arrival 2034)']],
    origin: 'Formed like Jupiter but further out, with less gas. The rings may be young — perhaps the debris of a moon torn apart 100–400 million years ago — though some researchers argue they are as old as the planet.',
    unknowns: ['How old are the rings?', 'What keeps the north-polar hexagon so stable?', 'Why did Saturn\'s exact day length stay uncertain until ring seismology pinned it at 10 h 33 m 38 s (2019)?'],
    dyk: ['Saturn\'s average density is less than water\'s.', 'The main rings span ≈ 280,000 km but are typically only ≈ 10 m thick.', 'Material from the rings is raining into Saturn ("ring rain") at up to tonnes per second.'],
    atmo: [['H₂', 96.3, '#e6d3b2'], ['He', 3.25, '#c99a64'], ['CH₄ & other', 0.45, '#8fa6c9']]
  },
  uranus: {
    g: 8.69, year: 30688, day: 17.24, missions: [[1781, 'Discovery', 'William Herschel', 'First planet discovered with a telescope'], [1977, 'Ring discovery', 'Kuiper Airborne Obs.', 'Rings found as they dimmed a background star'], [1986, 'Voyager 2', 'NASA', 'Only flyby: 10 new moons, 2 new rings'], [2023, 'JWST imaging', 'NASA/ESA/CSA', 'Detailed infrared views of rings and polar cap']],
    origin: 'Likely formed closer to the Sun and migrated outward. Its 98° tilt is thought to come from one or more giant impacts.',
    unknowns: ['Why does Uranus emit almost no internal heat when Neptune emits plenty?', 'What exactly tipped it over?', 'What is the interior really like? A Uranus Orbiter and Probe is NASA\'s top-priority flagship for the 2030s.'],
    dyk: ['It has the coldest measured planetary atmosphere: −224 °C.', 'Its moons are named after characters from Shakespeare and Alexander Pope.', '2024 reanalysis showed Voyager 2 arrived during a rare solar-wind gust, so our picture of its magnetosphere may be skewed.'],
    atmo: [['H₂', 82.5, '#e6d3b2'], ['He', 15.2, '#c99a64'], ['CH₄', 2.3, '#5fb3c6']]
  },
  neptune: {
    g: 11.15, year: 60182, day: 16.11, missions: [[1846, 'Discovery', 'Le Verrier & Galle', 'Found where mathematics predicted it should be'], [1989, 'Voyager 2', 'NASA', 'Only flyby: Great Dark Spot, Triton\'s geysers'], [2022, 'JWST imaging', 'NASA/ESA/CSA', 'Clearest view of its rings in 30 years']],
    origin: 'Probably formed closer to the Sun and moved outward, scattering the Kuiper Belt as it went (the "Nice model"). Triton is a captured Kuiper Belt object.',
    unknowns: ['What powers the fastest winds in the Solar System so far from the Sun?', 'Why does it radiate 2.6 times the energy it receives?', 'How did it capture Triton, and what happened to its original moons?'],
    dyk: ['Neptune completed its first full orbit since discovery in 2011.', 'It was the first planet found by mathematical prediction rather than observation.', 'Its blue is deeper than Uranus\'s, partly because Uranus has a thicker haze layer.'],
    atmo: [['H₂', 80, '#e6d3b2'], ['He', 19, '#c99a64'], ['CH₄', 1.5, '#5fb3c6']]
  },
  pluto: {
    g: 0.62, year: 90560, day: 153.3, missions: [[1930, 'Discovery', 'Clyde Tombaugh', 'Found by blinking photographic plates at Lowell Observatory'], [1978, 'Charon discovered', 'James Christy', 'Revealed Pluto\'s true (tiny) mass'], [2006, 'Reclassified', 'IAU', 'Became a "dwarf planet"'], [2015, 'New Horizons', 'NASA', 'First flyby: glaciers, mountains, blue haze']],
    origin: 'A Kuiper Belt object formed in the outer Solar System. Charon likely formed in a giant collision — a 2024 study proposed a "kiss and capture" where the two briefly stuck together.',
    unknowns: ['Is its subsurface ocean still liquid today?', 'What keeps the young Sputnik Planitia glacier renewing?', 'Does its atmosphere freeze onto the surface as it moves farther from the Sun?'],
    dyk: ['Pluto has not completed a single orbit since its discovery — that will happen in 2178.', 'It is smaller than Earth\'s Moon.', 'Pluto and Charon orbit a point in space between them, outside Pluto.'],
    atmo: [['N₂', 99, '#8fa6c9'], ['CH₄, CO', 1, '#5fb3c6']]
  }
};

/* moon discovery: [year, discoverer] */
O.MOON_DISC = {moon: ['prehistory', '—'], phobos: [1877, 'Asaph Hall'], deimos: [1877, 'Asaph Hall'], io: [1610, 'Galileo Galilei'], europa: [1610, 'Galileo Galilei'], ganymede: [1610, 'Galileo Galilei'], callisto: [1610, 'Galileo Galilei'], amalthea: [1892, 'E. E. Barnard'], himalia: [1904, 'Charles Perrine'],
  mimas: [1789, 'William Herschel'], enceladus: [1789, 'William Herschel'], tethys: [1684, 'G. D. Cassini'], dione: [1684, 'G. D. Cassini'], rhea: [1672, 'G. D. Cassini'], titan: [1655, 'Christiaan Huygens'], hyperion: [1848, 'Bond & Lassell'], iapetus: [1671, 'G. D. Cassini'], phoebe: [1899, 'W. H. Pickering'],
  miranda: [1948, 'Gerard Kuiper'], ariel: [1851, 'William Lassell'], umbriel: [1851, 'William Lassell'], titania: [1787, 'William Herschel'], oberon: [1787, 'William Herschel'], proteus: [1989, 'Voyager 2'], triton: [1846, 'William Lassell'], nereid: [1949, 'Gerard Kuiper'], charon: [1978, 'James Christy'], nix: [2005, 'Hubble team'], hydra: [2005, 'Hubble team']};

/* spacecraft specs */
O.SAT_INFO = {
  iss: [['Launched', '20 Nov 1998 (first module, Zarya)'], ['Mass', '≈ 420,000 kg'], ['Size', '109 × 73 m — about a football field'], ['Crew', 'Usually 7'], ['Power', '8 solar array wings, ≈ 120 kW usable']],
  css: [['Launched', '29 Apr 2021 (Tianhe core); completed Nov 2022'], ['Layout', 'T-shape: Tianhe, Wentian and Mengtian modules'], ['Crew', '3 (6 during handovers)'], ['Planned life', '≥ 10 years']],
  hst: [['Launched', '24 Apr 1990, Space Shuttle Discovery'], ['Size', '13.2 m long, 4.2 m wide'], ['Mass', '11,110 kg'], ['Mirror', '2.4 m primary'], ['Servicing', '5 Shuttle missions, 1993–2009']],
  insat3dr: [['Launched', '8 Sep 2016, GSLV-F05'], ['Mass', '2,211 kg'], ['Instruments', '6-channel imager, 19-channel sounder'], ['Also carries', 'Search-and-rescue transponder']],
  irnss1i: [['Launched', '12 Apr 2018, PSLV-C41'], ['Mass', '1,425 kg'], ['Signals', 'L5 and S band navigation'], ['System', 'NavIC — India\'s regional GPS alternative']],
  cartosat3: [['Launched', '27 Nov 2019, PSLV-C47'], ['Mass', '1,625 kg'], ['Resolution', '≈ 25 cm panchromatic'], ['Orbit', 'Sun-synchronous, ≈ 509 km at launch']],
  goes16: [['Launched', '19 Nov 2016'], ['Mass', '5,192 kg at launch'], ['Instruments', 'ABI (16 bands), first lightning mapper in geostationary orbit'], ['Status', 'In on-orbit storage since 2025']],
  goes18: [['Launched', '1 Mar 2022'], ['Instruments', 'ABI imager, GLM lightning mapper, space-weather suite'], ['Position', '≈ 137° W (GOES-West)']],
  gps72: [['Launched', '29 Oct 2014, Atlas V'], ['Mass', '≈ 1,630 kg'], ['Clocks', 'Rubidium and caesium atomic clocks'], ['Note', 'GPS clocks are corrected for relativity: they gain ≈ 38 µs per day']],
  sentinel2a: [['Launched', '23 Jun 2015, Vega'], ['Mass', '1,140 kg'], ['Camera', '13 bands, 10 m resolution, 290 km swath'], ['Revisit', 'Every 5 days with its twin']],
  aqua: [['Launched', '4 May 2002, Delta II'], ['Mass', '2,934 kg'], ['Instruments', 'MODIS, AIRS, CERES, AMSR-E'], ['Note', 'Flew in the "A-Train" satellite formation for two decades']],
  sl32298: [['Launched', '2024'], ['Version', 'Starlink V2 Mini, ≈ 800 kg'], ['Propulsion', 'Argon Hall-effect thrusters'], ['Links', 'Laser links between satellites']],
  sl1063: [['Launched', 'Nov 2019'], ['Version', 'Starlink v1.0, ≈ 260 kg'], ['Propulsion', 'Krypton Hall-effect thrusters'], ['Status', 'Deorbiting']],
  jwst: [['Launched', '25 Dec 2021, Ariane 5'], ['Mass', '6,200 kg'], ['Mirror', '6.5 m, 18 gold-coated beryllium segments'], ['Sunshield', '21 × 14 m, 5 layers of Kapton'], ['Cold side', 'Instruments run below −230 °C']],
  aditya: [['Launched', '2 Sep 2023, PSLV-C57'], ['Arrived at L1', '6 Jan 2024'], ['Mass', '1,475 kg'], ['Instruments', 'VELC coronagraph, SUIT UV imager + 5 more']]
};

/* deep-sky extras */
O.DEEP_DYK = {
  sgra: 'Stars near Sagittarius A* move so fast that astronomers can watch their orbits change over a single human career — S2 has been tracked through two complete orbits.',
  m87: 'The glowing ring imaged by the Event Horizon Telescope is ≈ 100 billion km across — more than ten times the width of Neptune\'s orbit.',
  betelgeuse: 'If Betelgeuse replaced the Sun, its surface would reach somewhere between the orbits of Mars and Jupiter.',
  crab: 'Chinese astronomers recorded the 1054 "guest star" bright enough to see in daylight for 23 days; the pulsar now spins 30 times per second.',
  andromeda: 'Andromeda is about six full Moons wide in our sky — it is just too faint for its full extent to be seen by eye.',
  proxima: 'Even at Parker Solar Probe\'s record speed (192 km/s) the trip would take ≈ 6,600 years; at Voyager 1\'s speed, ≈ 75,000 years.',
  sirius: 'A teaspoon of Sirius B, the white dwarf, would weigh about 10 tonnes on Earth.',
  trappist1: 'From the surface of one TRAPPIST-1 planet, the others would appear larger than the Moon does from Earth.',
  orion: 'The light you see from the Orion Nebula tonight left it around 680 CE.',
  eagle: 'A 2007 study suggested a supernova shockwave may already have destroyed the pillars — light from that event would not reach us for centuries. The idea is still debated.',
  sn1987a: 'Of the 24 neutrinos detected, each carried information from the moment the star\'s core collapsed — confirming core-collapse theory.',
  cygx1: 'Stephen Hawking bet Kip Thorne in 1974 that Cygnus X-1 was not a black hole. He conceded in 1990.',
  uyscuti: 'Light takes about 1 hour to cross its diameter (vs 4.6 seconds for the Sun).',
  ton618: 'Its event horizon is roughly 25 times wider than Neptune\'s orbit.',
  lmc: 'The LMC is slowly falling into the Milky Way and will merge with it in ≈ 2 billion years.'
};

/* ---------- helpers for the dossier ---------- */
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
function sec(body, title, badge) { const s = el('div', 'sec'); const h = el('h3', '', title); if (badge) h.appendChild(el('span', 'badge ' + badge[0], badge[1])); s.appendChild(h); body.appendChild(s); return s; }
const store = {get(k, d) { try { const v = localStorage.getItem('orr-' + k); return v === null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('orr-' + k, v); } catch (e) {} }};

function timeline(parent, list) {
  const ol = el('ol', 'tl');
  for (const [y, n, a, d] of list) { const li = el('li'); li.appendChild(el('span', 'ty', String(y))); const b = el('div'); b.appendChild(el('b', '', n)); b.appendChild(el('span', 'ta', ' · ' + a)); b.appendChild(el('p', '', d)); li.appendChild(b); ol.appendChild(li); }
  parent.appendChild(ol);
}
function bullets(parent, list, cls) { const ul = el('ul', cls || 'feat'); for (const t of list) ul.appendChild(el('li', '', t)); parent.appendChild(ul); }
function atmoBar(parent, comp) {
  const bar = el('div', 'abar'), leg = el('div', 'aleg');
  for (const [n, v, c] of comp) {
    const seg = el('span'); seg.style.flex = Math.max(v, 0.8) + ' 0 0'; seg.style.background = c; seg.title = `${n} ${v}%`; bar.appendChild(seg);
    const k = el('span', 'ak'); const sw = el('i'); sw.style.background = c; k.appendChild(sw); k.appendChild(document.createTextNode(`${n} ${v < 1 ? v.toFixed(2) : v}%`)); leg.appendChild(k);
  }
  parent.appendChild(bar); parent.appendChild(leg);
}
function sizeCompare(parent, name, Rkm, color) {
  const ns = 'http://www.w3.org/2000/svg', w = 320, h = 120, Re = 6371;
  const big = Math.max(Rkm, Re), s = 46 / big;
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `${name} compared with Earth`);
  const circ = (cx, r, fill, label, sub) => {
    const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', cx); c.setAttribute('cy', 56); c.setAttribute('r', Math.max(0.8, r)); c.setAttribute('fill', fill); svg.appendChild(c);
    const t = document.createElementNS(ns, 'text'); t.setAttribute('x', cx); t.setAttribute('y', 114); t.setAttribute('text-anchor', 'middle'); t.setAttribute('fill', '#9dabc4'); t.setAttribute('font-size', '10'); t.setAttribute('font-family', 'Inter Tight, sans-serif'); t.textContent = label; svg.appendChild(t);
  };
  circ(90, Re * s, '#3d7bd9', 'Earth'); circ(230, Rkm * s, color, name);
  const box = el('div', 'wind'); box.appendChild(svg);
  const ratio = Rkm / Re;
  box.appendChild(el('p', 'note', ratio >= 1 ? `${ratio.toFixed(ratio < 10 ? 2 : 0)}× Earth's diameter · ${Math.round(ratio ** 3).toLocaleString()} Earths would fit inside by volume` : `${(ratio * 100).toFixed(ratio < 0.1 ? 1 : 0)}% of Earth's diameter`));
  parent.appendChild(box);
}
function calculators(parent, id, I) {
  const wrap = el('div', 'calc');
  const kg = parseFloat(store.get('kg', '60')) || 60, age = parseFloat(store.get('age', '25')) || 25;
  const row = (label, val, unit, key) => { const r = el('label', 'cr'); r.appendChild(el('span', '', label)); const inp = el('input'); inp.type = 'number'; inp.min = '1'; inp.max = key === 'kg' ? '500' : '130'; inp.value = val; inp.id = 'calc-' + key; r.appendChild(inp); r.appendChild(el('span', 'u', unit)); wrap.appendChild(r); return inp; };
  const iKg = row('Your mass', kg, 'kg', 'kg'), out1 = el('p', 'co');
  wrap.appendChild(out1);
  let iAge = null, out2 = null;
  if (I.year) { iAge = row('Your age', age, 'Earth years', 'age'); out2 = el('p', 'co'); wrap.appendChild(out2); }
  const upd = () => {
    const m = parseFloat(iKg.value) || 0; store.set('kg', m);
    const f = I.g / 9.81;
    out1.textContent = id === 'sun' ? `At the Sun's visible surface you would weigh as much as ${Math.round(m * f).toLocaleString()} kg does on Earth (28× your weight).` : `You would feel like you weigh ${(m * f).toFixed(1)} kg — ${f >= 1 ? f.toFixed(2) + '× heavier' : 'only ' + (f * 100).toFixed(0) + '% of your Earth weight'}.` + (f < 0.5 ? ` You could jump ≈ ${(0.5 / f).toFixed(1)} m high.` : '');
    if (iAge) { const a = parseFloat(iAge.value) || 0; store.set('age', a); const local = a * 365.256 / I.year; out2.textContent = local >= 1 ? `You would be ${local.toFixed(local < 10 ? 2 : 1)} ${O.BODIES[id] ? O.BODIES[id].name : 'local'} years old.` : `You would not yet be ${id === 'neptune' || id === 'pluto' || id === 'uranus' ? 'one year old — not even close' : 'one year old'} (${(local * 100).toFixed(1)}% of a year).`; }
  };
  iKg.addEventListener('input', upd); if (iAge) iAge.addEventListener('input', upd); upd();
  parent.appendChild(wrap);
}
function travel(parent, kmFn) {
  const rows = [['Walking (5 km/h)', 5], ['Car (100 km/h)', 100], ['Airliner (900 km/h)', 900], ['New Horizons (58,500 km/h)', 58536], ['Parker Solar Probe peak (692,000 km/h)', 692000], ['Light', 1079252849]];
  const tb = el('table', 'kv'); parent.appendChild(tb);
  const fmt = (h) => { if (h < 1 / 60) return (h * 3600).toFixed(1) + ' s'; if (h < 1) return (h * 60).toFixed(1) + ' min'; if (h < 48) return h.toFixed(1) + ' hours'; const d = h / 24; if (d < 730) return Math.round(d).toLocaleString() + ' days'; const y = d / 365.25; return (y < 1e4 ? y.toFixed(y < 100 ? 1 : 0) : y.toExponential(1)).toLocaleString() + ' years'; };
  const trs = rows.map(([n, v]) => { const tr = el('tr'); tr.appendChild(el('td', '', n)); const td = el('td', 'mono', '—'); tr.appendChild(td); tb.appendChild(tr); return [td, v]; });
  return () => { const km = kmFn(); for (const [td, v] of trs) td.textContent = fmt(km / v); };
}

/* ---------- inject into dossiers ---------- */
O.infoForBody = function (body, id, teleFns) {
  const I = O.INFO[id]; if (!I) return;
  const B = O.BODIES[id] || {name: 'Moon', R: 1737.4, color: '#bdbab2'};
  const R = id === 'moon' ? 1737.4 : B.R, col = id === 'moon' ? '#bdbab2' : B.color;
  if (I.atmo) atmoBar(sec(body, 'Atmosphere make-up (by volume)'), I.atmo);
  sizeCompare(sec(body, 'Size compared with Earth'), B.name || 'Moon', R, col);
  if (id !== 'earth') {
    const t = sec(body, 'How long to get there now', ['live', 'LIVE']);
    const fn = travel(t, () => {
      const E = S.planets.earth.ecl;
      if (id === 'moon') return Math.hypot(...O.moonEcl(S.jd));
      if (id === 'sun') return Math.hypot(...E) * O.AU_KM;
      const P = S.planets[id].ecl; return Math.hypot(P[0] - E[0], P[1] - E[1], P[2] - E[2]) * O.AU_KM;
    });
    teleFns.push(fn); fn();
    t.appendChild(el('p', 'note', 'Straight-line distance today. Real spacecraft follow curved transfer orbits and usually take far longer — or far less, with gravity assists.'));
  }
  calculators(sec(body, 'You, on ' + (id === 'sun' ? 'the Sun' : id === 'moon' ? 'the Moon' : B.name)), id, I);
  const m = sec(body, 'Exploration timeline'); timeline(m, I.missions);
  const o = sec(body, 'How it formed'); o.appendChild(el('p', 'lede', I.origin)).style.marginTop = '0';
  const u = sec(body, 'Still unsolved'); bullets(u, I.unknowns, 'feat q');
  const d = sec(body, 'Did you know'); bullets(d, I.dyk, 'feat dyk');
};
O.infoForMoon = function (body, m) {
  const disc = O.MOON_DISC[m.id];
  if (disc && m.id !== 'moon') { const s = sec(body, 'Discovery'); s.appendChild(el('p', '', disc[0] + ' · ' + disc[1])).style.margin = '0'; }
  if (m.id === 'moon') O.infoForBody(body, 'moon', O._teleFns || []);
  else sizeCompare(sec(body, 'Size compared with Earth'), m.name, m.R, m.color);
};
O.infoForSat = function (body, id) {
  const spec = O.SAT_INFO[id]; if (!spec) return;
  const s = sec(body, 'Spacecraft'); const t = el('table', 'kv'); for (const [k, v] of spec) { const tr = el('tr'); tr.appendChild(el('td', '', k)); tr.appendChild(el('td', '', v)); t.appendChild(tr); } s.appendChild(t);
  s.appendChild(el('p', 'note', 'The 3D model follows the real layout of this spacecraft but is magnified thousands of times so you can see it.'));
};
O.infoForDeep = function (body, id) {
  const d = O.DEEP_DYK[id]; if (!d) return;
  const s = sec(body, 'Did you know'); bullets(s, [d], 'feat dyk');
};
})(window.ORR);
