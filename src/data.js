/* ============================================================
   DATA — physical constants, bodies, moons, satellites, deep sky
   Sources: NASA Planetary Fact Sheet; JPL "Approximate Positions
   of the Planets" (Standish); IAU WGCCRE pole/rotation models;
   TLEs retrieved 2026-10-24 (tle.ivanstanojevic.me / CelesTrak mirror)
   ============================================================ */
window.ORR = window.ORR || {};
(function (O) {

O.AU_KM = 149597870.7;
O.LY_AU = 63241.077;

/* JPL Table 1 (valid 1800–2050): a, e, I, L, varpi, Omega and rates /century */
O.ELEMENTS = {
  mercury:[0.38709927,0.20563593,7.00497902,252.25032350,77.45779628,48.33076593, 0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081],
  venus:  [0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255, 0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418],
  earth:  [1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0.0, 0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0.0],
  mars:   [1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891, 0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343],
  jupiter:[5.20288700,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909, -0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106],
  saturn: [9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448, -0.00125060,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794],
  uranus: [19.18916464,0.04725744,0.77263783,313.23810451,170.95427630,74.01692503, -0.00196176,-0.00004397,-0.00242939,428.48202785,0.40805281,0.04240589],
  neptune:[30.06992276,0.00859048,1.77004347,-55.12002969,44.96476227,131.78422574, 0.00026291,0.00005105,0.00035372,218.45945325,-0.32241464,-0.00508664],
  pluto:  [39.48211675,0.24882730,17.14001206,238.92903833,224.06891629,110.30393684, -0.00031596,0.00005170,0.00004818,145.20780515,-0.04062942,-0.01183482]
};

/* Halley: perihelion 1986-02-09 (JD 2446470.5) — osculating elements, approximate */
O.COMETS = {
  halley:{a:17.834, e:0.96714, i:162.262, node:58.420, peri:111.332, Tp:2446470.5, P:75.32*365.25}
};

/* ---------- Interior layer helper ---------- */
function L(name, r0, r1, color, temp, desc, flow) { return {name, r0, r1, color, temp, desc, flow: flow || 0}; }

O.BODIES = {
sun: {
  name:'Sun', kind:'Star · G2V', parent:null, R:695700, color:'#ffcf6b',
  poleRA:286.13, poleDec:63.87, W0:84.176, Wd:14.1844,
  facts:[['Radius','695,700 km (109 × Earth)'],['Mass','1.989 × 10³⁰ kg (333,000 × Earth)'],['Surface temperature','5,772 K'],['Core temperature','≈ 15.7 million K'],['Rotation','25.4 d (equator) · ≈ 35 d (poles)'],['Luminosity','3.828 × 10²⁶ W'],['Composition','H 73% · He 25% · metals 2%'],['Age','≈ 4.6 billion years'],['Fusion rate','≈ 600 million t H → He per second']],
  layers:[
    L('Core',0,0.25,'#fff6c8','15.7 MK','Proton–proton chain fusion converts ≈ 4 million tonnes of mass to energy every second.',2),
    L('Radiative zone',0.25,0.70,'#ffcf5a','7 → 2 MK','Photons random-walk outward; a single photon\'s energy takes roughly 10,000–170,000 years to cross this zone.',0),
    L('Tachocline',0.70,0.72,'#ff9d3c','≈ 2 MK','Shear layer between rigid radiative interior and differentially rotating convection zone; thought to drive the solar dynamo.',1),
    L('Convective zone',0.72,0.995,'#ff7a1f','2 MK → 5,800 K','Hot plasma rises in convection cells, visible at the surface as granules ≈ 1,000 km across that last 8–20 minutes.',3),
    L('Photosphere',0.995,1,'#ffe08a','5,772 K','The visible surface. Sunspots are cooler (≈ 3,800 K) regions where magnetic fields suppress convection.',1)
  ],
  now:'Solar Cycle 25 reached its maximum period around late 2024 (NASA/NOAA announcement, Oct 2024) and is now in its declining phase; strong flares and CMEs remain possible.',
  features:[['Granulation','Convection cells ≈ 1,000 km wide tile the photosphere.'],['Sunspots','Magnetic regions; counts follow the ≈ 11-year cycle.'],['Corona','Outer atmosphere at 1–3 million K — far hotter than the surface; the heating mechanism is still debated.'],['Solar wind','≈ 400–800 km/s stream of charged particles that inflates the heliosphere out to ≈ 120 AU.']],
  desc:'A main-sequence G-type star containing 99.86% of the Solar System\'s mass. It fuses hydrogen into helium in its core and will remain on the main sequence for another ≈ 5 billion years before swelling into a red giant.'
},
mercury: {
  name:'Mercury', kind:'Terrestrial planet', parent:'sun', R:2439.7, color:'#9b9590',
  poleRA:281.01, poleDec:61.45, W0:329.5469, Wd:6.1385025,
  facts:[['Diameter','4,879 km'],['Mass','0.330 × 10²⁴ kg (0.055 Earth)'],['Surface gravity','3.7 m/s²'],['Escape velocity','4.3 km/s'],['Day (solar)','176 Earth days'],['Year','88.0 days'],['Mean temperature','167 °C (−180 to 430 °C)'],['Atmosphere','Exosphere only (Na, K, O, H, He)'],['Moons','0']],
  layers:[
    L('Solid inner core',0,0.41,'#c9b28f','≈ 2,000 °C','Solid iron–nickel inner core (≈ 1,000 km radius) inferred from MESSENGER gravity and spin data.',0),
    L('Liquid outer core',0.41,0.83,'#e08a3a','≈ 1,500–2,000 °C','Molten iron — huge relative to the planet (≈ 85% of radius incl. inner core). Sustains a weak global magnetic field (≈ 1% of Earth\'s).',2),
    L('Mantle',0.83,0.985,'#8a6a52','≈ 1,000 °C','Thin silicate mantle ≈ 400 km thick.',0),
    L('Crust',0.985,1,'#8f8a85','surface','≈ 35 km silicate crust, heavily cratered; lobate scarps record global contraction as the core cooled.',0)
  ],
  winds:null,
  features:[['Caloris Basin','1,550 km impact basin, one of the largest in the Solar System.'],['Polar ice','Water ice in permanently shadowed craters despite 430 °C dayside.'],['3:2 resonance','Rotates exactly 3 times per 2 orbits.'],['BepiColombo','ESA/JAXA mission due to enter orbit in late 2026.']],
  desc:'The smallest planet and closest to the Sun. With almost no atmosphere to hold heat, it has the most extreme temperature swing of any planet.'
},
venus: {
  name:'Venus', kind:'Terrestrial planet', parent:'sun', R:6051.8, color:'#e6c58a',
  poleRA:272.76, poleDec:67.16, W0:160.20, Wd:-1.4813688,
  facts:[['Diameter','12,104 km'],['Mass','4.87 × 10²⁴ kg (0.815 Earth)'],['Surface gravity','8.9 m/s²'],['Rotation','243 days, retrograde'],['Day (solar)','116.8 Earth days'],['Year','224.7 days'],['Surface temperature','464 °C'],['Surface pressure','92 bar'],['Atmosphere','CO₂ 96.5% · N₂ 3.5% · H₂SO₄ clouds'],['Moons','0']],
  layers:[
    L('Iron core',0,0.50,'#d48a3b','≈ 5,000 °C','Iron–nickel core ≈ 3,000 km radius; whether it is liquid is unknown. No global magnetic field.',1),
    L('Mantle',0.50,0.99,'#9a5b3b','≈ 1,500–3,500 °C','Silicate mantle; the planet appears to lack plate tectonics and may resurface episodically.',1),
    L('Crust',0.99,1,'#b08454','464 °C','Basaltic crust; ≈ 80% of the surface is volcanic plains.',0)
  ],
  winds:{label:'Cloud-top super-rotation',speed:'≈ 360 km/h (100 m/s) at cloud tops; < 7 km/h at the surface',note:'The upper atmosphere circles the planet in ≈ 4 days — 60 × faster than the solid surface rotates.'},
  features:[['Maxwell Montes','11 km-high mountain range.'],['Super-rotation','Clouds circle the planet in ≈ 4 Earth days.'],['Runaway greenhouse','Hottest planetary surface in the Solar System.']],
  desc:'Earth\'s near-twin in size, wrapped in a crushing CO₂ atmosphere and sulfuric-acid clouds. It spins backwards, so the Sun rises in the west.'
},
earth: {
  name:'Earth', kind:'Terrestrial planet', parent:'sun', R:6371.0, color:'#3d7bd9',
  facts:[['Diameter','12,756 km'],['Mass','5.97 × 10²⁴ kg'],['Surface gravity','9.81 m/s²'],['Escape velocity','11.2 km/s'],['Sidereal day','23 h 56 m 4 s'],['Year','365.256 days'],['Axial tilt','23.44°'],['Mean temperature','15 °C'],['Atmosphere','N₂ 78% · O₂ 21% · Ar 0.9% · CO₂ ≈ 0.042%'],['Moons','1']],
  layers:[
    L('Inner core',0,0.192,'#fff1b0','≈ 5,200 °C','Solid iron–nickel ball 1,221 km in radius, kept solid by pressure (≈ 3.6 million atm). Super-rotation relative to the mantle is debated.',0),
    L('Outer core',0.192,0.546,'#ffae3d','≈ 4,000–5,000 °C','Liquid iron alloy 2,260 km thick. Its convection generates Earth\'s magnetic field (the geodynamo).',3),
    L('Lower mantle',0.546,0.896,'#d2552a','≈ 2,000–3,700 °C','Solid but slowly creeping rock (bridgmanite); convection over millions of years drives plate tectonics.',1),
    L('Upper mantle',0.896,0.9945,'#a3412a','≈ 500–900 °C','Includes the asthenosphere, the ductile layer plates slide on.',1),
    L('Crust',0.9945,1,'#6e8f5a','surface','5–70 km thick. Oceanic crust is basaltic and young; continental crust is granitic and up to 4 billion years old.',0)
  ],
  winds:{label:'Jet streams',speed:'Up to ≈ 400 km/h in winter jet cores (≈ 10 km altitude)',note:'Earth\'s weather is shown here as an illustrative cloud layer; live weather data cannot be fetched from this page.'},
  features:[['Liquid water','71% of the surface.'],['Magnetosphere','Deflects the solar wind; produces aurorae.'],['Life','The only known inhabited world.']],
  desc:'The only world known to host life, with liquid surface oceans, plate tectonics, and a protective magnetic field.'
},
mars: {
  name:'Mars', kind:'Terrestrial planet', parent:'sun', R:3389.5, color:'#c1440e',
  poleRA:317.68, poleDec:52.89, W0:176.630, Wd:350.89198226,
  facts:[['Diameter','6,792 km'],['Mass','0.642 × 10²⁴ kg (0.107 Earth)'],['Surface gravity','3.7 m/s²'],['Sol (solar day)','24 h 39 m'],['Year','687 days'],['Axial tilt','25.2°'],['Mean temperature','−65 °C'],['Surface pressure','≈ 0.006 bar'],['Atmosphere','CO₂ 95% · N₂ 2.8% · Ar 2%'],['Moons','2']],
  layers:[
    L('Inner core (reported)',0,0.18,'#f0c070','≈ 2,000 °C','A solid inner core ≈ 600 km in radius was reported in 2025 from InSight seismic data; not yet independently confirmed.',0),
    L('Liquid core',0.18,0.49,'#e0803a','≈ 1,800–2,000 °C','Iron–sulfur liquid core (≈ 1,650–1,830 km radius from InSight). No active global dynamo today.',2),
    L('Molten silicate layer',0.49,0.54,'#c25a32','≈ 1,700 °C','A ≈ 150 km layer of molten rock above the core, proposed in 2023 reanalyses of InSight data.',1),
    L('Mantle',0.54,0.985,'#8e3b22','≈ 1,500 °C','Silicate mantle; source of the giant Tharsis volcanoes.',0),
    L('Crust',0.985,1,'#b5532a','−65 °C','24–72 km thick; iron oxide dust gives the red colour.',0)
  ],
  winds:{label:'Winds & dust storms',speed:'Typically 10–30 km/h; dust-storm gusts up to ≈ 100 km/h',note:'Global dust storms can shroud the whole planet for weeks (e.g. 2018, which ended the Opportunity rover).'},
  features:[['Olympus Mons','Shield volcano ≈ 22 km high, 600 km wide.'],['Valles Marineris','Canyon system ≈ 4,000 km long, up to 7 km deep.'],['Polar caps','Water ice with seasonal CO₂ frost.'],['Active missions','Perseverance rover in Jezero Crater; Curiosity in Gale Crater; several orbiters.']],
  desc:'A cold desert world with the largest volcano and canyon in the Solar System, and strong evidence of ancient rivers and lakes.'
},
jupiter: {
  name:'Jupiter', kind:'Gas giant', parent:'sun', R:69911, color:'#d8b48a',
  poleRA:268.06, poleDec:64.50, W0:284.95, Wd:870.536,
  facts:[['Diameter','142,984 km (11.2 × Earth)'],['Mass','1,898 × 10²⁴ kg (318 Earth)'],['Gravity (1 bar)','24.8 m/s²'],['Rotation','9 h 56 m (System III)'],['Year','11.86 years'],['Temperature (1 bar)','−110 °C'],['Atmosphere','H₂ 90% · He 10% · CH₄, NH₃ traces'],['Known moons','101 (as of early 2026)'],['Rings','Faint dust rings']],
  layers:[
    L('Dilute core',0,0.30,'#f2d29a','≈ 20,000 °C','Juno gravity data point to a "fuzzy" core: heavy elements dissolved into metallic hydrogen out to a large fraction of the radius.',1),
    L('Metallic hydrogen',0.30,0.80,'#c99a64','≈ 10,000 °C','At > 2 million bar, hydrogen becomes an electrically conducting fluid. Its convection powers the strongest planetary magnetic field (≈ 20,000 × Earth\'s magnetic moment).',3),
    L('Molecular hydrogen',0.80,0.995,'#e2c39b','≈ 2,000 °C → −110 °C','Liquid then gaseous H₂/He envelope.',2),
    L('Cloud decks',0.995,1,'#f3e3c8','−110 °C','Three cloud layers: ammonia ice (top), ammonium hydrosulfide, then water clouds.',3)
  ],
  winds:{label:'Zonal jets',speed:'Equatorial jet ≈ 100–150 m/s; 24° N jet ≈ 170 m/s (≈ 620 km/h); Great Red Spot rim ≈ 430–680 km/h',note:'Alternating east–west jets separate the pale zones and dark belts.',profile:[[-70,0],[-60,30],[-50,-20],[-45,40],[-39,-10],[-33,45],[-27,-25],[-20,-50],[-17,30],[-7,110],[0,100],[7,130],[13,-10],[17,-40],[21,40],[24,170],[27,-20],[31,40],[35,-15],[38,30],[45,-10],[50,25],[60,0],[70,0]]},
  features:[['Great Red Spot','Anticyclone wider than Earth (≈ 14,000–16,000 km across); shrinking since the 1800s.'],['Io plasma torus','Volcanic Io feeds a ring of charged particles around Jupiter.'],['Juno','NASA orbiter (arrived 2016) that mapped the interior, poles and the dilute core.'],['Europa Clipper','En route; arrives in 2030.']],
  desc:'The largest planet — more than twice as massive as all other planets combined. Its fast rotation stretches its storms into bands.'
},
saturn: {
  name:'Saturn', kind:'Gas giant', parent:'sun', R:58232, color:'#e3c98f',
  poleRA:40.59, poleDec:83.54, W0:38.90, Wd:810.7939024,
  facts:[['Diameter','120,536 km (9.4 × Earth)'],['Mass','568 × 10²⁴ kg (95 Earth)'],['Density','687 kg/m³ — less than water'],['Rotation','10 h 33 m'],['Year','29.46 years'],['Temperature (1 bar)','−140 °C'],['Atmosphere','H₂ 96% · He 3%'],['Known moons','285 (as of early 2026)'],['Rings','7 main rings; ≈ 280,000 km across, ≈ 10 m thick']],
  layers:[
    L('Dense rocky-icy core',0,0.22,'#e8cf9a','≈ 12,000 °C','Ring-seismology (Cassini) indicates a diffuse core whose heavy elements fade outward over ≈ 60% of the radius.',0),
    L('Metallic hydrogen',0.22,0.55,'#c6a26a','≈ 8,000 °C','Conducting fluid hydrogen generates a magnetic field almost perfectly aligned with the spin axis.',3),
    L('Molecular hydrogen',0.55,0.995,'#e6d2a5','≈ 1,000 °C → −140 °C','Helium "rain" may sink through this layer, releasing heat.',2),
    L('Cloud decks',0.995,1,'#f1e2bb','−140 °C','Ammonia ice haze over ammonium hydrosulfide and water clouds.',3)
  ],
  winds:{label:'Equatorial super-jet',speed:'≈ 1,800 km/h (≈ 500 m/s) at the equator',note:'A persistent hexagonal jet stream (≈ 29,000 km across) circles the north pole.',profile:[[-75,40],[-70,60],[-62,10],[-55,50],[-47,0],[-40,40],[-32,80],[-25,200],[-15,380],[-5,460],[0,470],[5,460],[15,380],[25,200],[32,80],[40,40],[47,0],[55,50],[62,10],[70,60],[75,100],[78,140]]},
  features:[['North polar hexagon','Six-sided jet stream larger than two Earths.'],['Rings','Mostly water ice; probably 100–400 million years old (debated).'],['Ring-plane crossing','Rings appeared edge-on from Earth in March 2025.'],['Enceladus plumes','Geysers feed the E ring.']],
  desc:'The ringed giant — less dense than water, with the most extensive ring system and the most known moons in the Solar System.'
},
uranus: {
  name:'Uranus', kind:'Ice giant', parent:'sun', R:25362, color:'#9fe3e6',
  poleRA:257.31, poleDec:-15.18, W0:203.81, Wd:-501.1600928,
  facts:[['Diameter','51,118 km (4 × Earth)'],['Mass','86.8 × 10²⁴ kg (14.5 Earth)'],['Rotation','17 h 14 m, retrograde'],['Axial tilt','97.8° — spins on its side'],['Year','84 years'],['Temperature (1 bar)','−195 °C (coldest planetary atmosphere: −224 °C)'],['Atmosphere','H₂ 83% · He 15% · CH₄ 2.3%'],['Known moons','29 (incl. S/2025 U1, found by JWST 2025)'],['Rings','13 narrow dark rings']],
  layers:[
    L('Rocky core',0,0.20,'#c9b08a','≈ 5,000 °C','Silicate/iron core about the mass of Earth.',0),
    L('Icy mantle',0.20,0.75,'#5fb3c6','≈ 2,000–5,000 °C','Hot, dense fluid of water, ammonia and methane ("ices"); possibly superionic water, conducting enough to produce an offset, tilted magnetic field.',2),
    L('H/He/CH₄ envelope',0.75,1,'#a8e8ec','−195 °C','Methane absorbs red light, giving the cyan colour.',1)
  ],
  winds:{label:'Zonal winds',speed:'Up to ≈ 900 km/h (250 m/s) at mid-latitudes; retrograde at the equator',note:'Each pole gets ≈ 42 years of continuous sunlight, then 42 years of darkness.',profile:[[-80,0],[-70,150],[-60,230],[-50,200],[-40,120],[-30,40],[-20,-50],[-10,-90],[0,-100],[10,-90],[20,-50],[30,40],[40,130],[50,220],[60,250],[70,170],[80,0]]},
  features:[['Extreme tilt','Likely the result of a giant impact.'],['Seasons','Each season lasts ≈ 21 years.'],['Voyager 2','Only spacecraft to visit (1986).']],
  desc:'An ice giant tipped on its side, giving it the most extreme seasons of any planet.'
},
neptune: {
  name:'Neptune', kind:'Ice giant', parent:'sun', R:24622, color:'#3f62d8',
  poleRA:299.36, poleDec:43.46, W0:249.978, Wd:541.1397757,
  facts:[['Diameter','49,528 km (3.9 × Earth)'],['Mass','102 × 10²⁴ kg (17 Earth)'],['Rotation','16 h 6 m'],['Year','164.8 years'],['Temperature (1 bar)','−200 °C'],['Atmosphere','H₂ 80% · He 19% · CH₄ 1.5%'],['Known moons','16'],['Rings','5 main rings with clumpy arcs']],
  layers:[
    L('Rocky core',0,0.25,'#c2a77f','≈ 5,100 °C','Iron–nickel–silicate core of roughly 1.2 Earth masses.',0),
    L('Icy mantle',0.25,0.80,'#3f86c4','≈ 2,000–5,000 °C','Hot, dense water–ammonia–methane fluid; diamond "rain" has been proposed at depth.',2),
    L('H/He/CH₄ envelope',0.80,1,'#5a7fe0','−200 °C','Radiates 2.6 × more energy than it receives from the Sun.',2)
  ],
  winds:{label:'Fastest winds in the Solar System',speed:'Up to ≈ 2,100 km/h (≈ 600 m/s)',note:'Driven by internal heat despite receiving 1/900th of Earth\'s sunlight.',profile:[[-80,0],[-70,200],[-60,180],[-50,100],[-40,-50],[-30,-200],[-20,-330],[-10,-390],[0,-400],[10,-390],[20,-330],[30,-200],[40,-50],[50,100],[60,180],[70,250],[80,0]]},
  features:[['Dark spots','Transient storms like the Great Dark Spot (Voyager 2, 1989).'],['Triton','Large moon orbiting backwards — a captured Kuiper Belt object.'],['Discovered by maths','Predicted from Uranus\'s orbital wobble (1846).']],
  desc:'The windiest, most distant planet: a deep-blue ice giant with supersonic storms.'
},
pluto: {
  name:'Pluto', kind:'Dwarf planet · Kuiper Belt', parent:'sun', R:1188.3, color:'#d9b99a',
  poleRA:132.99, poleDec:-6.16, W0:302.695, Wd:56.3625225,
  facts:[['Diameter','2,377 km'],['Mass','0.0130 × 10²⁴ kg (0.2% Earth)'],['Rotation','6.39 days, retrograde'],['Year','248 years'],['Axial tilt','≈ 120°'],['Mean temperature','−225 °C'],['Atmosphere','Thin N₂ with CH₄, CO; ≈ 10 µbar'],['Moons','5']],
  layers:[
    L('Rocky core',0,0.72,'#8d7a66','≈ ?','Silicate core ≈ 850 km in radius.',0),
    L('Subsurface ocean (likely)',0.72,0.86,'#3e6b8a','≈ 0 °C','New Horizons data suggest a liquid-water ocean beneath Sputnik Planitia.',1),
    L('Water-ice shell',0.86,1,'#e2d3c0','−225 °C','Topped with nitrogen, methane and CO ices; Sputnik Planitia is a convecting N₂ glacier.',1)
  ],
  winds:null,
  features:[['Tombaugh Regio','The bright "heart", ≈ 1,600 km across.'],['Nitrogen glaciers','Convection cells in Sputnik Planitia.'],['New Horizons','Flyby in July 2015.']],
  desc:'The best-known dwarf planet: a world of nitrogen glaciers, water-ice mountains and a thin hazy atmosphere.'
}
};

O.PLANET_ORDER = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto'];

/* Moons: a (km), P (days; negative = retrograde), R (km) */
O.MOONS = {
  earth:[{id:'moon',name:'Moon',a:384400,P:27.3217,R:1737.4,color:'#bdbab2',
    facts:[['Diameter','3,475 km'],['Distance','363,300–405,500 km'],['Orbital period','27.32 days (sidereal)'],['Surface gravity','1.62 m/s²'],['Temperature','−173 to 127 °C']],
    layers:[L('Inner core',0,0.14,'#e8d49a','≈ 1,400 °C','Solid iron core ≈ 240 km radius.',0),L('Fluid outer core',0.14,0.19,'#d48a3b','≈ 1,500 °C','',1),L('Partial-melt layer',0.19,0.28,'#9a5a3a','','',0),L('Mantle',0.28,0.977,'#6e6560','','',0),L('Crust',0.977,1,'#b9b5ad','','≈ 40 km anorthositic crust.',0)],
    desc:'Earth\'s only natural satellite, probably formed from debris of a Mars-sized impact ≈ 4.5 billion years ago. Tidally locked, it always shows the same face.'}],
  mars:[
    {id:'phobos',name:'Phobos',a:9376,P:0.31891,R:11.1,color:'#7d6e62',desc:'Orbits Mars 3 times a day, closer than any other moon to its planet. Spiralling inward ≈ 1.8 m per century; will break up into a ring in ≈ 30–50 million years. Target of JAXA\'s MMX sample-return mission.'},
    {id:'deimos',name:'Deimos',a:23463,P:1.26244,R:6.2,color:'#8a7a6a',desc:'Tiny, smooth moon ≈ 12 km across; possibly captured or formed from impact debris.'}],
  jupiter:[
    {id:'amalthea',name:'Amalthea',a:181366,P:0.49818,R:83.5,color:'#b0563a',desc:'Reddest object in the Solar System; irregular, ≈ 250 km long.'},
    {id:'io',name:'Io',a:421700,P:1.769138,R:1821.6,color:'#e5cf5a',galilean:0,desc:'The most volcanically active body known — over 400 active volcanoes, driven by tidal heating from Jupiter, Europa and Ganymede.'},
    {id:'europa',name:'Europa',a:671034,P:3.551181,R:1560.8,color:'#c9b9a0',galilean:1,desc:'Ice shell over a global salty ocean holding ≈ 2 × the water of Earth\'s oceans. Prime target for NASA\'s Europa Clipper (arrives 2030).'},
    {id:'ganymede',name:'Ganymede',a:1070412,P:7.154553,R:2634.1,color:'#9c8f80',galilean:2,desc:'Largest moon in the Solar System — bigger than Mercury — and the only moon with its own magnetic field. ESA\'s JUICE will orbit it from 2034.'},
    {id:'callisto',name:'Callisto',a:1882709,P:16.689017,R:2410.3,color:'#5f5448',galilean:3,desc:'The most heavily cratered surface known; an ancient, geologically dead world that may hide a deep ocean.'},
    {id:'himalia',name:'Himalia',a:11461000,P:250.56,R:85,color:'#8a8580',desc:'Largest irregular moon of Jupiter, likely a captured asteroid.'}],
  saturn:[
    {id:'mimas',name:'Mimas',a:185539,P:0.942422,R:198.2,color:'#b9b6b0',desc:'Giant Herschel crater gives it a "Death Star" look; evidence suggests a young internal ocean.'},
    {id:'enceladus',name:'Enceladus',a:237948,P:1.370218,R:252.1,color:'#f4f6f8',desc:'Brightest body in the Solar System; south-polar geysers vent a subsurface ocean containing salts, silica and organics.'},
    {id:'tethys',name:'Tethys',a:294619,P:1.887802,R:531.1,color:'#d6d3cc',desc:'Icy moon with the 400 km Odysseus crater and the 2,000 km Ithaca Chasma.'},
    {id:'dione',name:'Dione',a:377396,P:2.736915,R:561.4,color:'#c9c6c0',desc:'Bright ice cliffs; possible deep ocean.'},
    {id:'rhea',name:'Rhea',a:527108,P:4.518212,R:763.8,color:'#bdb9b2',desc:'Saturn\'s second-largest moon; heavily cratered water ice.'},
    {id:'titan',name:'Titan',a:1221870,P:15.945421,R:2574.7,color:'#d9a54a',desc:'Only moon with a thick atmosphere (1.5 bar, mostly N₂) and the only other world with stable surface liquids — methane/ethane seas. NASA\'s Dragonfly rotorcraft launches 2028.'},
    {id:'hyperion',name:'Hyperion',a:1500880,P:21.276609,R:135,color:'#a89a86',desc:'Sponge-like, chaotically tumbling moon.'},
    {id:'iapetus',name:'Iapetus',a:3560820,P:79.3215,R:734.5,color:'#8f8778',desc:'Two-toned: one hemisphere is as dark as coal, the other bright as snow; has an equatorial ridge 13 km high.'},
    {id:'phoebe',name:'Phoebe',a:12952000,P:-550.31,R:106.5,color:'#5a524a',desc:'Retrograde, captured object; source of the vast, faint Phoebe ring.'}],
  uranus:[
    {id:'miranda',name:'Miranda',a:129390,P:1.413479,R:235.8,color:'#b9b9b4',desc:'Patchwork terrain and Verona Rupes, a cliff ≈ 20 km high — possibly the tallest in the Solar System.'},
    {id:'ariel',name:'Ariel',a:191020,P:2.520379,R:578.9,color:'#c6c4bd',desc:'Brightest Uranian moon; youngest surface with rift valleys.'},
    {id:'umbriel',name:'Umbriel',a:266300,P:4.144177,R:584.7,color:'#6f6c68',desc:'Darkest of the large Uranian moons.'},
    {id:'titania',name:'Titania',a:435910,P:8.705872,R:788.4,color:'#b1aca4',desc:'Largest moon of Uranus, with huge canyons.'},
    {id:'oberon',name:'Oberon',a:583520,P:13.463239,R:761.4,color:'#a49d94',desc:'Outermost major Uranian moon; old, cratered surface.'}],
  neptune:[
    {id:'proteus',name:'Proteus',a:117647,P:1.122315,R:210,color:'#6e6a66',desc:'One of the darkest objects in the Solar System; nearly as large as a body can be without becoming round.'},
    {id:'triton',name:'Triton',a:354759,P:-5.876854,R:1353.4,color:'#d8c9c0',desc:'Orbits backwards — a captured Kuiper Belt object. Nitrogen geysers erupt 8 km high. Spiralling inward; will be torn apart into a ring in ≈ 3.6 billion years.'},
    {id:'nereid',name:'Nereid',a:5513818,P:360.13,R:170,color:'#9a958e',desc:'One of the most eccentric orbits of any moon (e = 0.75).'}],
  pluto:[
    {id:'charon',name:'Charon',a:19591,P:6.387221,R:606,color:'#a8a29a',desc:'Half Pluto\'s size; the two are mutually tidally locked and orbit a point between them. Red north pole "Mordor Macula" is coloured by Pluto\'s escaping methane.'},
    {id:'nix',name:'Nix',a:48694,P:24.8546,R:25,color:'#c9c4bd',desc:'Small, tumbling moon.'},
    {id:'hydra',name:'Hydra',a:64738,P:38.2018,R:25,color:'#c9c4bd',desc:'Outermost known moon of Pluto.'}]
};

/* Real TLEs — epoch Oct 2026. Line checksums verified. */
O.SATS = [
 {id:'iss',name:'ISS (Zarya)',op:'NASA · Roscosmos · ESA · JAXA · CSA',type:'Crewed space station',c:'#ffd27a',
  l1:'1 25544U 98067A   26297.20915682  .00007800  00000+0  14938-3 0  9991',l2:'2 25544  51.6335  21.6229 0006884 302.9098  57.1228 15.49030149591752',
  desc:'Continuously crewed since November 2000. ≈ 109 m across, ≈ 420,000 kg; orbits Earth ≈ 15.5 times a day. Planned deorbit around 2030.'},
 {id:'css',name:'Tiangong (CSS)',op:'CMSA (China)',type:'Crewed space station',c:'#ffd27a',
  l1:'1 48274U 21035A   26296.36963709  .00019264  00000+0  22520-3 0  9999',l2:'2 48274  41.4688 263.3399 0002578 203.0250 157.0474 15.61120902313188',
  desc:'China\'s modular space station (Tianhe core module launched 2021); typically crewed by three taikonauts.'},
 {id:'hst',name:'Hubble Space Telescope',op:'NASA · ESA',type:'Space telescope',c:'#cfe3ff',
  l1:'1 20580U 90037B   26297.30580476  .00006132  00000+0  18497-3 0  9996',l2:'2 20580  28.4737 277.2190 0002082 145.9091 214.1639 15.32067126808383',
  desc:'Launched 1990; 2.4 m mirror. Its orbit is slowly decaying; operating in reduced one-gyro mode since 2024.'},
 {id:'insat3dr',name:'INSAT-3DR',op:'ISRO (India)',type:'Geostationary weather satellite',c:'#9fe0b0',
  l1:'1 41752U 16054A   26272.85834921 -.00000074  00000+0  00000+0 0  9994',l2:'2 41752   0.0722  88.2781 0012446 175.9655 127.4065  1.00270920 36860',
  desc:'Parked over ≈ 74° E above the Indian Ocean, imaging the Indian subcontinent for monsoon and cyclone forecasting.'},
 {id:'irnss1i',name:'IRNSS-1I (NavIC)',op:'ISRO (India)',type:'Regional navigation',c:'#9fe0b0',
  l1:'1 43286U 18035A   26291.98149061  .00000102  00000+0  00000+0 0  9999',l2:'2 43286  29.0428  72.2740 0021412 179.5225 184.0944  1.00275638 31324',
  desc:'Part of India\'s NavIC constellation; an inclined geosynchronous orbit traces a figure-8 over the Indian region.'},
 {id:'cartosat3',name:'Cartosat-3',op:'ISRO (India)',type:'Earth observation',c:'#9fe0b0',
  l1:'1 44804U 19081A   26297.31583265  .00002452  00000+0  11936-3 0  9993',l2:'2 44804  97.4161 356.9869 0012949  64.5846 295.6727 15.19248072383072',
  desc:'Sun-synchronous imaging satellite with ≈ 25 cm panchromatic resolution.'},
 {id:'goes16',name:'GOES-16',op:'NOAA (USA)',type:'Geostationary weather satellite',c:'#9fd1ff',
  l1:'1 41866U 16071A   26297.32641111 -.00000078  00000+0  00000+0 0  9999',l2:'2 41866   0.6548  83.7099 0002503 156.8552 165.0306  1.00272105 36398',
  desc:'Former GOES-East; now in on-orbit storage after GOES-19 took over the East position in 2025.'},
 {id:'goes18',name:'GOES-18 (GOES-West)',op:'NOAA (USA)',type:'Geostationary weather satellite',c:'#9fd1ff',
  l1:'1 51850U 22021A   26212.56915014  .00000000  00000+0  00000+0 0  9998',l2:'2 51850   0.0153 100.5723 0000645  91.4097 185.1030  1.00271014  7037',
  desc:'Watches the western Americas and the Pacific from ≈ 137° W.'},
 {id:'gps72',name:'NAVSTAR 72 (GPS IIF-8)',op:'US Space Force',type:'Navigation (GPS)',c:'#c9b8ff',
  l1:'1 40294U 14068A   26275.61953024 -.00000064  00000+0  00000+0 0  9999',l2:'2 40294  57.0563  26.8261 0066706  73.9643 286.7826  2.00557884 87361',
  desc:'One of ≈ 31 operational GPS satellites in medium Earth orbit (≈ 20,200 km), each circling Earth twice per sidereal day.'},
 {id:'sentinel2a',name:'Sentinel-2A',op:'ESA · Copernicus',type:'Earth observation',c:'#9fd1ff',
  l1:'1 40697U 15028A   26288.98386270 -.00000186  00000+0 -54173-4 0  9991',l2:'2 40697  98.5637   2.0716 0001049  92.2824 267.8479 14.30821471591002',
  desc:'13-band multispectral imager used for agriculture, forests and land-use monitoring.'},
 {id:'aqua',name:'Aqua',op:'NASA',type:'Earth science',c:'#9fd1ff',
  l1:'1 27424U 02022A   26297.26217817  .00000641  00000+0  13700-3 0  9999',l2:'2 27424  98.4461 269.2428 0000786  86.9366  26.6450 14.62250350302135',
  desc:'Studies the water cycle: evaporation, clouds, precipitation, sea ice.'},
 {id:'sl32298',name:'Starlink-32298',op:'SpaceX',type:'Broadband constellation',c:'#e6e6e6',
  l1:'1 61525U 24183S   26296.99349141 -.00002408  00000+0 -65891-4 0  9990',l2:'2 61525  53.1578 160.0862 0000795 129.2111 230.8961 15.31684413114631',
  desc:'One of the many thousands of Starlink satellites in low Earth orbit.'},
 {id:'sl1063',name:'Starlink-1063',op:'SpaceX',type:'Broadband constellation (decaying)',c:'#e6e6e6',
  l1:'1 44768U 19074BH  26297.28944520  .00134844  00000+0  11508-2 0  9990',l2:'2 44768  53.1461 203.8401 0001729 132.9296 227.1867 15.68610446383783',
  desc:'Early Starlink (2019) now deorbiting — note the high drag term; it will re-enter soon.'}
];
O.TLE_DATE = '24 Oct 2026';

/* Deep space: ra/dec deg (J2000), ly, vis = visual model */
O.DEEP = [
 {id:'proxima',name:'Proxima Centauri',group:'Stars',kind:'Red dwarf · M5.5Ve',ra:217.429,dec:-62.680,ly:4.2465,vis:'star',T:3042,size:3,
  facts:[['Distance','4.25 light-years (nearest star)'],['Radius','0.154 × Sun'],['Mass','0.122 × Sun'],['Temperature','3,042 K'],['Planets','Proxima b (11.2 d, ≥ 1.07 Earth masses, habitable zone); Proxima d']],
  desc:'The nearest star to the Sun, a flare-prone red dwarf orbiting the Alpha Centauri pair at ≈ 13,000 AU.',planets:[{n:'Proxima b',P:11.19,a:0.0485}, {n:'Proxima d',P:5.12,a:0.029}]},
 {id:'alphacen',name:'Alpha Centauri A & B',group:'Stars',kind:'Binary · G2V + K1V',ra:219.90,dec:-60.83,ly:4.37,vis:'binary',T:5790,T2:5260,size:5,period:79.9,
  facts:[['Distance','4.37 ly'],['A','1.08 M☉ · 1.22 R☉ · 5,790 K'],['B','0.91 M☉ · 0.86 R☉ · 5,260 K'],['Orbit','79.9 years, 11–35 AU separation']],
  desc:'The closest Sun-like stars. A and B orbit each other every 80 years; JWST imaging in 2025 revealed a candidate gas-giant planet around A.'},
 {id:'sirius',name:'Sirius A & B',group:'Stars',kind:'Binary · A1V + white dwarf',ra:101.287,dec:-16.716,ly:8.6,vis:'binary',T:9940,T2:25000,size:6,period:50.1,small2:true,
  facts:[['Distance','8.6 ly'],['Sirius A','2.06 M☉ · 1.71 R☉ · 9,940 K · 25 L☉'],['Sirius B','White dwarf: 1.02 M☉ packed into an Earth-sized sphere, ≈ 25,000 K'],['Orbit','50.1 years'],['Brightness','Brightest star in the night sky (mag −1.46)']],
  desc:'The brightest star in Earth\'s sky, with a white-dwarf companion — the exposed core of a star that once outshone Sirius A. Watch B orbit A (time-lapsed).'},
 {id:'vega',name:'Vega',group:'Stars',kind:'Main sequence · A0V',ra:279.235,dec:38.784,ly:25,vis:'star',T:9600,size:5,
  facts:[['Distance','25 ly'],['Mass','2.1 × Sun'],['Rotation','≈ 12.5 h — near break-up speed, flattened'],['Temperature','≈ 9,600 K'],['Note','Former and future pole star (≈ 12,000 BCE / ≈ 13,700 CE)']],
  desc:'Former zero-point of the stellar magnitude scale, surrounded by a debris disk.'},
 {id:'polaris',name:'Polaris',group:'Stars',kind:'Supergiant · F7Ib (Cepheid)',ra:37.95,dec:89.264,ly:433,vis:'star',T:6015,size:7,pulse:3.97,
  facts:[['Distance','≈ 433 ly (estimates 320–440)'],['Radius','≈ 46 × Sun'],['Mass','≈ 5.4 × Sun'],['Pulsation','Cepheid, 3.97-day period'],['System','Triple star']],
  desc:'The current North Star, within 0.7° of the celestial pole. A pulsating Cepheid variable.'},
 {id:'betelgeuse',name:'Betelgeuse',group:'Stars',kind:'Red supergiant · M1-2 Ia-ab',ra:88.793,dec:7.407,ly:548,vis:'giant',T:3600,size:26,sim:'supernova',
  facts:[['Distance','≈ 550 ly (estimates 500–720)'],['Radius','≈ 760 × Sun (would engulf Mars\'s orbit)'],['Mass','≈ 16–19 × Sun'],['Temperature','≈ 3,600 K'],['Companion','α Ori B ("Siwarha"), detected 2025'],['Fate','Core-collapse supernova within ≈ 100,000 years']],
  desc:'A dying red supergiant whose "Great Dimming" in 2019–20 was caused by an ejected dust cloud. When it explodes it will rival the half Moon in brightness for weeks. Run the simulation to see the sequence.'},
 {id:'rigel',name:'Rigel',group:'Stars',kind:'Blue supergiant · B8Ia',ra:78.634,dec:-8.202,ly:860,vis:'star',T:12100,size:12,
  facts:[['Distance','≈ 860 ly'],['Radius','≈ 79 × Sun'],['Luminosity','≈ 120,000 × Sun'],['Temperature','≈ 12,100 K']],
  desc:'Orion\'s brilliant blue-white foot; one of the most luminous stars in the Milky Way neighbourhood.'},
 {id:'antares',name:'Antares',group:'Stars',kind:'Red supergiant · M1.5Iab',ra:247.352,dec:-26.432,ly:550,vis:'giant',T:3660,size:22,
  facts:[['Distance','≈ 550 ly'],['Radius','≈ 680 × Sun'],['Mass','≈ 12–15 × Sun'],['Temperature','≈ 3,660 K']],
  desc:'The red heart of Scorpius — its name means "rival of Mars".'},
 {id:'uyscuti',name:'UY Scuti',group:'Stars',kind:'Red supergiant',ra:276.902,dec:-12.466,ly:5900,vis:'giant',T:3365,size:30,
  facts:[['Distance','≈ 5,900 ly (Gaia)'],['Radius','≈ 900 × Sun (revised down from ≈ 1,700)'],['Temperature','≈ 3,365 K']],
  desc:'Once listed as the largest known star; Gaia distances shrank its estimated size, but it remains among the biggest.'},
 {id:'etacar',name:'Eta Carinae',group:'Stars',kind:'Luminous blue variable binary',ra:161.265,dec:-59.685,ly:7500,vis:'etacar',T:30000,size:10,
  facts:[['Distance','≈ 7,500 ly'],['Mass','Primary ≈ 100 × Sun; companion ≈ 30–80'],['Luminosity','≈ 5 million × Sun'],['Great Eruption','1840s: briefly 2nd-brightest star; ejected ≈ 10+ M☉ forming the Homunculus Nebula']],
  desc:'One of the most massive and unstable stars known, wrapped in the twin-lobed Homunculus nebula from its 19th-century eruption.'},
 {id:'trappist1',name:'TRAPPIST-1',group:'Exoplanet systems',kind:'Ultracool dwarf · M8V + 7 planets',ra:346.622,dec:-5.041,ly:40.7,vis:'system',T:2566,size:3,
  facts:[['Distance','40.7 ly'],['Star','0.09 × Sun mass; barely larger than Jupiter'],['Planets','7 Earth-sized (b–h); e, f, g in the habitable zone'],['Resonance','All 7 in a chain of orbital resonances'],['JWST','b and c show no thick CO₂ atmospheres']],
  desc:'Seven rocky planets packed closer to their star than Mercury is to the Sun. Orbits here run at true relative periods (time-lapsed).',
  planets:[{n:'b',P:1.511,a:0.0115},{n:'c',P:2.422,a:0.0158},{n:'d',P:4.049,a:0.0223},{n:'e',P:6.101,a:0.0293},{n:'f',P:9.207,a:0.0385},{n:'g',P:12.352,a:0.0469},{n:'h',P:18.773,a:0.0619}]},
 {id:'gaiabh1',name:'Gaia BH1',group:'Black holes',kind:'Dormant stellar black hole',ra:262.172,dec:-0.581,ly:1560,vis:'bhbinary',size:8,period:185.6,
  facts:[['Distance','≈ 1,560 ly — nearest known black hole'],['Mass','≈ 9.6 × Sun'],['Companion','Sun-like star, 185.6-day orbit'],['Found by','ESA Gaia astrometry (2022)']],
  desc:'A "quiet" black hole revealed only by the wobble of its Sun-like companion — no accretion disk, no X-rays.'},
 {id:'cygx1',name:'Cygnus X-1',group:'Black holes',kind:'X-ray binary · stellar black hole',ra:299.590,dec:35.202,ly:7200,vis:'xrb',size:14,
  facts:[['Distance','≈ 7,200 ly'],['Black hole','≈ 21 × Sun'],['Companion','HDE 226868, blue supergiant ≈ 40 × Sun'],['Orbit','5.6 days'],['History','First black hole widely accepted (1972); subject of the Hawking–Thorne bet']],
  desc:'Gas stripped from a blue supergiant streams into an accretion disk around a black hole, heating to millions of degrees and glowing in X-rays. The stream animates live.'},
 {id:'sgra',name:'Sagittarius A*',group:'Black holes',kind:'Supermassive black hole · Milky Way centre',ra:266.417,dec:-29.008,ly:26670,vis:'smbh',size:40,sim:'sandbox',
  facts:[['Distance','≈ 26,700 ly'],['Mass','4.3 million × Sun'],['Event horizon','≈ 25 million km diameter (≈ 0.17 AU)'],['Image','Event Horizon Telescope, 2022'],['Star S2','16.05-yr orbit; passes within 120 AU at 7,650 km/s (2.5% light speed)'],['Nobel','2020 Physics Prize (Genzel, Ghez) for proving its mass']],
  desc:'The black hole at the centre of our galaxy. The orbit of star S2 shown here is computed from its measured orbit (last periapsis 2018.4, next 2034.4).'},
 {id:'m87',name:'M87*',group:'Black holes',kind:'Supermassive black hole · Virgo A',ra:187.706,dec:12.391,ly:53.5e6,vis:'smbh',size:60,jet:true,sim:'sandbox',
  facts:[['Distance','≈ 53.5 million ly'],['Mass','≈ 6.5 billion × Sun'],['Event horizon','≈ 4 × the diameter of Neptune\'s orbit'],['Jet','Relativistic jet ≈ 5,000 ly long'],['Image','First ever black-hole image (EHT, 2019)']],
  desc:'The first black hole ever imaged. Its jet blasts particles at near light speed across 5,000 light-years.'},
 {id:'ton618',name:'TON 618',group:'Black holes',kind:'Hyperluminous quasar',ra:187.10,dec:31.48,ly:1.8e10,lyText:'≈ 10.8 billion ly (light-travel)',vis:'smbh',size:90,jet:true,
  facts:[['Distance','≈ 10.8 billion ly light-travel'],['Mass','≈ 40–66 billion × Sun (uncertain)'],['Luminosity','≈ 140 trillion × Sun']],
  desc:'Among the most massive black holes known, powering a quasar visible across most of the observable universe.'},
 {id:'crab',name:'Crab Nebula (M1)',group:'Supernovae & remnants',kind:'Supernova remnant + pulsar',ra:83.633,dec:22.015,ly:6500,vis:'crab',size:30,
  facts:[['Distance','≈ 6,500 ly'],['Supernova','SN 1054 — recorded by Chinese and Arab astronomers; visible in daylight for 23 days'],['Size','≈ 11 ly across, expanding ≈ 1,500 km/s'],['Pulsar','PSR B0531+21 spins 30.2 times per second']],
  desc:'The shattered remains of a star seen exploding in 1054 CE, powered by a spinning neutron star whose beams sweep Earth 30 times a second (slowed here).'},
 {id:'casa',name:'Cassiopeia A',group:'Supernovae & remnants',kind:'Supernova remnant',ra:350.85,dec:58.815,ly:11000,vis:'remnant',size:24,col:'#ff7e5f',
  facts:[['Distance','≈ 11,000 ly'],['Explosion seen','≈ 1680 (unrecorded)'],['Size','≈ 10 ly across'],['Core','Neutron star detected by Chandra']],
  desc:'The youngest known core-collapse remnant in the Milky Way, mapped in exquisite detail by JWST in 2023.'},
 {id:'sn1987a',name:'SN 1987A',group:'Supernovae & remnants',kind:'Supernova in the LMC',ra:83.867,dec:-69.27,ly:168000,vis:'rings',size:20,
  facts:[['Distance','≈ 168,000 ly (Large Magellanic Cloud)'],['Seen','23 Feb 1987'],['Neutrinos','24 neutrinos detected ≈ 3 h before the light — first from beyond the Sun'],['Remnant','JWST (2024) found evidence of a neutron star']],
  desc:'The closest supernova observed since the telescope was invented. Its glowing triple-ring structure was shed by the star before it died.'},
 {id:'tycho',name:'Tycho\'s SN (1572)',group:'Supernovae & remnants',kind:'Type Ia remnant',ra:6.34,dec:64.14,ly:8000,vis:'remnant',size:18,col:'#7fb8ff',
  facts:[['Distance','≈ 8,000–9,800 ly'],['Seen','November 1572, by Tycho Brahe'],['Type','Ia — a white dwarf detonated']],
  desc:'Tycho Brahe\'s "new star" overturned the belief that the heavens were unchanging.'},
 {id:'kepler',name:'Kepler\'s SN (1604)',group:'Supernovae & remnants',kind:'Type Ia remnant',ra:262.67,dec:-21.49,ly:20000,vis:'remnant',size:16,col:'#ffb36b',
  facts:[['Distance','≈ 20,000 ly'],['Seen','October 1604'],['Note','Last supernova seen with the naked eye in our galaxy']],
  desc:'Observed by Johannes Kepler; the most recent naked-eye supernova within the Milky Way.'},
 {id:'magnetar',name:'SGR 1806-20',group:'Supernovae & remnants',kind:'Magnetar',ra:272.164,dec:-20.411,ly:42000,vis:'magnetar',size:10,
  facts:[['Distance','≈ 30,000–50,000 ly (uncertain)'],['Magnetic field','≈ 10¹¹ tesla — a quadrillion × Earth\'s'],['Giant flare','27 Dec 2004: released more energy in 0.2 s than the Sun does in 150,000 years; disturbed Earth\'s ionosphere']],
  desc:'A neutron star with the strongest magnetic field known in the universe.'},
 {id:'orion',name:'Orion Nebula (M42)',group:'Nebulae',kind:'Star-forming region',ra:83.822,dec:-5.391,ly:1344,vis:'nebula',size:40,col:'#ff6f91',col2:'#59c3ff',
  facts:[['Distance','≈ 1,344 ly'],['Size','≈ 24 ly across'],['Stars','≈ 2,000+ young stars; Trapezium cluster at its heart'],['Visible','Naked eye, in Orion\'s sword']],
  desc:'The nearest large stellar nursery, where new stars and protoplanetary disks ("proplyds") are forming now.'},
 {id:'eagle',name:'Pillars of Creation (M16)',group:'Nebulae',kind:'Star-forming pillars',ra:274.70,dec:-13.80,ly:6500,vis:'pillars',size:34,
  facts:[['Distance','≈ 6,500 ly'],['Height','≈ 4–5 ly (tallest pillar)'],['Images','Hubble 1995/2014, JWST 2022']],
  desc:'Columns of cold gas and dust being sculpted by radiation from nearby massive stars, with new stars forming inside.'},
 {id:'lmc',name:'Large Magellanic Cloud',group:'Galaxies',kind:'Satellite dwarf galaxy',ra:80.89,dec:-69.756,ly:160000,vis:'galaxy',size:70,shape:'irr',
  facts:[['Distance','≈ 160,000 ly'],['Diameter','≈ 32,000 ly'],['Stellar mass','≈ 10 billion × Sun'],['Contains','Tarantula Nebula, SN 1987A']],
  desc:'A satellite galaxy of the Milky Way visible from the southern hemisphere.'},
 {id:'andromeda',name:'Andromeda (M31)',group:'Galaxies',kind:'Spiral galaxy',ra:10.685,dec:41.269,ly:2.5e6,vis:'galaxy',size:150,shape:'spiral',sim:'merger',
  facts:[['Distance','≈ 2.5 million ly'],['Diameter','≈ 150,000+ ly'],['Stars','≈ 1 trillion'],['Motion','Approaching the Milky Way at ≈ 110 km/s'],['Collision odds','A 2025 study put the chance of merging within 10 billion years at ≈ 50%']],
  desc:'The nearest large galaxy and the most distant object visible to the naked eye. Run the merger simulation to watch a close encounter with the Milky Way.'}
];

/* Bright stars only for the backdrop labelled set (ra, dec, mag, B−V) */
O.BRIGHT = [
 ['Canopus',95.988,-52.696,-0.74,0.15],['Arcturus',213.915,19.182,-0.05,1.23],['Capella',79.172,45.998,0.08,0.80],
 ['Procyon',114.825,5.225,0.34,0.42],['Achernar',24.429,-57.237,0.46,-0.16],['Altair',297.696,8.868,0.76,0.22],
 ['Aldebaran',68.980,16.509,0.86,1.54],['Spica',201.298,-11.161,0.97,-0.23],['Pollux',116.329,28.026,1.14,1.00],
 ['Fomalhaut',344.413,-29.622,1.16,0.09],['Deneb',310.358,45.280,1.25,0.09],['Regulus',152.093,11.967,1.40,-0.11],
 ['Castor',113.650,31.888,1.58,0.03],['Bellatrix',81.283,6.350,1.64,-0.22],['Alnilam',84.053,-1.202,1.69,-0.18],
 ['Alnitak',85.190,-1.943,1.74,-0.21],['Mintaka',83.002,-0.299,2.23,-0.22],['Saiph',86.939,-9.670,2.06,-0.17],
 ['Dubhe',165.932,61.751,1.79,1.07],['Merak',165.460,56.383,2.37,0.03],['Phecda',178.458,53.695,2.44,0.04],
 ['Megrez',183.857,57.033,3.31,0.08],['Alioth',193.507,55.960,1.77,-0.02],['Mizar',200.981,54.925,2.23,0.02],['Alkaid',206.885,49.313,1.86,-0.10],
 ['Acrux',186.650,-63.099,0.76,-0.24],['Mimosa',191.930,-59.689,1.25,-0.23],['Gacrux',187.791,-57.113,1.59,1.60],
 ['Hadar',210.956,-60.373,0.61,-0.23],['Shaula',263.402,-37.104,1.62,-0.22]
];
O.CONSTELLATIONS = [
  ['Orion',[['Betelgeuse','Bellatrix'],['Bellatrix','Mintaka'],['Mintaka','Alnilam'],['Alnilam','Alnitak'],['Alnitak','Saiph'],['Saiph','Rigel'],['Rigel','Mintaka'],['Betelgeuse','Alnitak']]],
  ['Ursa Major (Big Dipper)',[['Dubhe','Merak'],['Merak','Phecda'],['Phecda','Megrez'],['Megrez','Dubhe'],['Megrez','Alioth'],['Alioth','Mizar'],['Mizar','Alkaid']]],
  ['Crux',[['Acrux','Gacrux'],['Mimosa','Gacrux']]]
];

/* Voyager probes: approximate heliocentric distance (AU) = d0 + v·(years since 2024.0), direction RA/Dec */
O.PROBES = [
  {id:'voyager1',name:'Voyager 1',ra:257.6,dec:12.0,d0:162.5,v:3.57,launch:'5 Sep 1977',
   desc:'Farthest human-made object. Crossed the heliopause into interstellar space in August 2012. Will reach one light-day from Earth in late 2026. Still returning data on a few instruments.'},
  {id:'voyager2',name:'Voyager 2',ra:300.0,dec:-58.5,d0:135.8,v:3.21,launch:'20 Aug 1977',
   desc:'The only spacecraft to visit Uranus (1986) and Neptune (1989). Entered interstellar space in November 2018.'},
  {id:'newhorizons',name:'New Horizons',ra:290,dec:-20.5,d0:57.8,v:2.9,launch:'19 Jan 2006',
   desc:'Flew past Pluto in July 2015 and the Kuiper Belt object Arrokoth in January 2019 — the most distant object ever explored up close. Now in an extended mission studying the outer heliosphere.'}
];

})(window.ORR);
