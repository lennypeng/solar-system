// Curated catalogs of spacecraft, comets, and asteroids for real-time tracking
// Orbital elements are J2000 ecliptic heliocentric, used as fallback when API is unavailable

export const SPACECRAFT_CATALOG = [
  {
    id: '-31', name: 'Voyager 1', type: 'spacecraft', modelType: 'voyager',
    color: 0x88AAFF,
    info: { Mission: 'Interstellar exploration', Launch: 'Sep 5, 1977', Status: 'Active', Agency: 'NASA/JPL', 'Current Region': 'Interstellar space (~160 AU)', 'Distance from Earth': '~25.4 billion km (~170 AU)', Instruments: 'Plasma, magnetic field, cosmic ray detectors' },
    funFact: 'Voyager 1 is the most distant human-made object, carrying a Golden Record with sounds and images of Earth.',
    stateVector: { x: -3.194234e+01, y: -1.353742e+02, z: 9.794746e+01, vx: -1.196737e-03, vy: -7.861219e-03, vz: 5.679497e-03, epoch: 2461130.0 }
  },
  {
    id: '-32', name: 'Voyager 2', type: 'spacecraft', modelType: 'voyager',
    color: 0x88AADD,
    info: { Mission: 'Grand Tour of outer planets', Launch: 'Aug 20, 1977', Status: 'Active', Agency: 'NASA/JPL', 'Current Region': 'Interstellar space (~135 AU)', 'Distance from Earth': '~21.3 billion km (~143 AU)', Instruments: 'Plasma, magnetic field, cosmic ray detectors' },
    funFact: 'Voyager 2 is the only spacecraft to have visited all four giant planets: Jupiter, Saturn, Uranus, and Neptune.',
    stateVector: { x: 3.944237e+01, y: -1.044690e+02, z: -8.849727e+01, vx: 2.427547e-03, vy: -5.394985e-03, vz: -6.537618e-03, epoch: 2461130.0 }
  },
  {
    id: '-98', name: 'New Horizons', type: 'spacecraft', modelType: 'newhorizons',
    color: 0xFFAA55,
    info: { Mission: 'Pluto & Kuiper Belt exploration', Launch: 'Jan 19, 2006', Status: 'Active', Agency: 'NASA', 'Current Region': 'Kuiper Belt (~60 AU)', 'Distance from Earth': '~9.6 billion km (~64 AU)', Target: 'Pluto flyby 2015, Arrokoth flyby 2019' },
    funFact: 'New Horizons reached Pluto in just 9.5 years, traveling faster than any spacecraft before it at launch.',
    stateVector: { x: 2.028129e+01, y: -6.094401e+01, z: 2.238103e+00, vx: 3.068704e-03, vy: -7.224046e-03, vz: 2.843358e-04, epoch: 2461130.0 }
  },
  {
    id: '-96', name: 'Parker Solar Probe', type: 'spacecraft', modelType: 'parker',
    color: 0xFFDD44,
    info: { Mission: 'Study the Sun\'s corona', Launch: 'Aug 12, 2018', Status: 'Active', Agency: 'NASA', 'Closest Approach': '6.16 million km from Sun', 'Distance from Earth': '~206 million km (~1.4 AU)', 'Top Speed': '635,266 km/h (fastest human-made object)' },
    funFact: 'Parker Solar Probe is the fastest human-made object ever built, and has "touched" the Sun by entering its corona.',
    stateVector: { x: 3.493358e-01, y: -4.369606e-01, z: -2.617806e-02, vx: 1.614697e-02, vy: -5.760905e-03, vz: -1.010097e-03, epoch: 2461130.0 }
  },
  {
    id: '-170', name: 'James Webb (JWST)', type: 'spacecraft', modelType: 'jwst',
    color: 0xFFCC00,
    info: { Mission: 'Deep space infrared observatory', Launch: 'Dec 25, 2021', Status: 'Active', Agency: 'NASA/ESA/CSA', Location: 'Earth-Sun L2 point', 'Distance from Earth': '~1.5 million km (0.01 AU)', 'Mirror Diameter': '6.5 meters (gold-coated beryllium)' },
    funFact: 'JWST\'s mirror is so large it had to be folded like origami to fit inside its rocket, then unfolded in space.',
    stateVector: { x: -9.925587e-01, y: -1.677690e-01, z: 1.561027e-03, vx: 2.622062e-03, vy: -1.733170e-02, vz: -4.326026e-05, epoch: 2461130.0 }
  },
  {
    id: '-61', name: 'Juno', type: 'spacecraft', modelType: 'juno',
    color: 0x44BBFF,
    info: { Mission: 'Jupiter orbital study', Launch: 'Aug 5, 2011', Status: 'Active', Agency: 'NASA/JPL', Orbit: 'Polar orbit around Jupiter', 'Distance from Earth': '~750 million km (~5 AU)', 'Key Discovery': 'Jupiter\'s core is larger and more diffuse than expected' },
    funFact: 'Juno is the farthest solar-powered spacecraft from the Sun, with solar panels the size of a basketball court.',
    stateVector: { x: -2.317856e+00, y: 4.705010e+00, z: 2.606691e-02, vx: -5.149572e-03, vy: -3.208870e-03, vz: -8.164697e-03, epoch: 2461130.0 }
  },
  {
    id: '-168', name: 'Perseverance', type: 'spacecraft', modelType: 'generic',
    color: 0xCC4422,
    info: { Mission: 'Mars exploration & sample caching', Launch: 'Jul 30, 2020', Status: 'Active on Mars surface', Agency: 'NASA/JPL', Location: 'Jezero Crater, Mars', 'Distance from Earth': '~225 million km (~1.5 AU, varies 55-400M km)', Companion: 'Ingenuity helicopter (first powered flight on another planet)' },
    funFact: 'Perseverance carries a small piece of Martian meteorite back to Mars, and produced oxygen from the Martian atmosphere.',
    parentBody: 'Mars' // Rover on Mars surface - snap to Mars position
  },
  {
    id: '-64', name: 'OSIRIS-APEX', type: 'spacecraft', modelType: 'generic',
    color: 0xAA66CC,
    info: { Mission: 'Asteroid Apophis encounter', Launch: 'Sep 8, 2016 (as OSIRIS-REx)', Status: 'Active, en route', Agency: 'NASA', Target: 'Asteroid Apophis (arrival 2029)', 'Distance from Earth': '~88 million km (~0.6 AU)', 'Previous Mission': 'Collected samples from asteroid Bennu' },
    funFact: 'Originally OSIRIS-REx, this spacecraft successfully returned asteroid Bennu samples to Earth before being repurposed to visit Apophis.',
    stateVector: { x: -9.340564e-01, y: -7.136247e-01, z: -6.186449e-05, vx: 6.510391e-03, vy: -1.352962e-02, vz: -9.397719e-07, epoch: 2461130.0 }
  },
  {
    id: '-49', name: 'Lucy', type: 'spacecraft', modelType: 'generic',
    color: 0x66CC88,
    info: { Mission: 'Jupiter Trojan asteroid tour', Launch: 'Oct 16, 2021', Status: 'Active', Agency: 'NASA', Targets: '8 asteroids over 12 years', 'Distance from Earth': '~523 million km (~3.5 AU)', 'First Target': 'Dinkinesh (visited Nov 2023)' },
    funFact: 'Lucy will visit more individual destinations than any previous space mission, exploring the "fossils" of planet formation.',
    stateVector: { x: -3.675869e+00, y: -2.351164e+00, z: -2.531282e-01, vx: -1.210627e-03, vy: -6.760928e-03, vz: -1.275557e-05, epoch: 2461130.0 }
  },
  {
    id: '-121', name: 'BepiColombo', type: 'spacecraft', modelType: 'generic',
    color: 0xDDAA88,
    info: { Mission: 'Mercury orbital study', Launch: 'Oct 20, 2018', Status: 'Active, en route', Agency: 'ESA/JAXA', 'Arrival at Mercury': '2025', 'Distance from Earth': '~139 million km (~0.9 AU)', Components: 'Two orbiters (MPO + MMO) + transfer module' },
    funFact: 'BepiColombo must make 9 gravity assists (Earth, Venus, Mercury) to slow down enough to enter Mercury orbit.',
    stateVector: { x: -1.210857e-01, y: -4.535467e-01, z: -2.582893e-02, vx: 2.168825e-02, vy: -5.499499e-03, vz: -2.433570e-03, epoch: 2461130.0 }
  }
];

export const COMET_CATALOG = [
  {
    id: '90000030', name: "Halley's Comet", type: 'comet',
    color: 0xAADDFF,
    info: { Type: 'Short-period comet', 'Orbital Period': '~75 years', 'Last Perihelion': 'Feb 9, 1986', 'Next Perihelion': '~Jul 28, 2061', 'Nucleus Size': '15 x 8 km', Discovery: 'Observed since 240 BC, predicted by Edmond Halley' },
    funFact: 'Halley\'s Comet is the only short-period comet visible to the naked eye, and has been recorded for over 2,000 years.',
    stateVector: { x: -1.945453e+01, y: 2.744298e+01, z: -9.877114e+00, vx: 5.221925e-04, vy: 1.560133e-04, vz: 1.190870e-04, epoch: 2461130.0 },
    orbitalElements: { a: 17.834, e: 0.96714, i: 162.26, om: 58.42, w: 111.33, ma: 38.38, epoch: 2449400.5 }
  },
  {
    id: '90000091', name: 'Comet Encke', type: 'comet',
    color: 0x99CCEE,
    info: { Type: 'Short-period comet', 'Orbital Period': '3.3 years', 'Nucleus Size': '4.8 km', Discovery: '1786 (Pierre Mechain)', 'Associated Shower': 'Taurids meteor shower' },
    funFact: 'Comet Encke has the shortest orbital period of any known comet and is the parent body of the Taurid meteor shower.',
    stateVector: { x: 3.434354e+00, y: -2.518237e-01, z: 2.565047e-01, vx: -4.481463e-03, vy: 4.213329e-03, vz: 3.660914e-04, epoch: 2461130.0 },
    orbitalElements: { a: 2.2154, e: 0.8483, i: 11.78, om: 334.57, w: 186.55, ma: 186.89, epoch: 2460000.5 }
  },
  {
    id: '90000702', name: 'Comet 67P', type: 'comet',
    color: 0xBBCCDD,
    info: { Type: 'Short-period comet', 'Full Name': '67P/Churyumov-Gerasimenko', 'Orbital Period': '6.45 years', 'Nucleus Size': '4.3 x 4.1 km (duck-shaped)', 'Visited By': 'ESA Rosetta mission (2014-2016)' },
    funFact: 'The Rosetta spacecraft orbited 67P for 2 years and landed the Philae probe on its surface, the first comet landing ever.',
    stateVector: { x: -1.033380e+00, y: -5.025827e+00, z: -2.324288e-01, vx: 5.176385e-03, vy: 1.692370e-03, vz: -1.149309e-04, epoch: 2461130.0 },
    orbitalElements: { a: 3.4630, e: 0.6410, i: 7.04, om: 50.19, w: 12.78, ma: 303.71, epoch: 2460000.5 }
  },
  {
    id: '90000547', name: 'Comet Wirtanen', type: 'comet',
    color: 0x88EEBB,
    info: { Type: 'Short-period comet', 'Full Name': '46P/Wirtanen', 'Orbital Period': '5.44 years', 'Nucleus Size': '1.2 km', 'Close Approach': 'Passed 0.077 AU from Earth in Dec 2018' },
    funFact: 'Wirtanen was the original target for the Rosetta mission before a launch delay redirected it to 67P.',
    stateVector: { x: -2.184798e+00, y: -4.216631e+00, z: 3.305948e-01, vx: 3.035065e-03, vy: -4.344155e-03, vz: -7.484816e-04, epoch: 2461130.0 },
    orbitalElements: { a: 3.0935, e: 0.6588, i: 11.75, om: 82.16, w: 356.34, ma: 120.45, epoch: 2460000.5 }
  },
  {
    id: '90000395', name: 'Comet SW1', type: 'comet',
    color: 0xCCBBFF,
    info: { Type: 'Short-period comet', 'Full Name': '29P/Schwassmann-Wachmann 1', 'Orbital Period': '14.7 years', 'Nucleus Size': '~60 km', 'Notable Feature': 'Frequent outbursts every few weeks' },
    funFact: '29P has one of the most nearly circular orbits of any comet, yet experiences dramatic brightness outbursts regularly.',
    stateVector: { x: -6.218204e+00, y: 8.617821e-01, z: -6.607457e-01, vx: -8.852696e-04, vy: -6.589499e-03, vz: -8.396952e-04, epoch: 2461130.0 },
    orbitalElements: { a: 5.989, e: 0.0449, i: 9.39, om: 312.76, w: 48.24, ma: 233.12, epoch: 2460000.5 }
  }
];

export const ASTEROID_CATALOG = [
  {
    id: '2101955', name: 'Bennu', type: 'asteroid',
    color: 0xAA8866,
    info: { Type: 'Near-Earth asteroid (B-type)', Diameter: '~490 meters', 'Orbital Period': '1.2 years', 'Visited By': 'OSIRIS-REx (2018-2021)', 'Hazard Rating': 'Potentially hazardous', 'Sample Return': 'Sep 24, 2023 (4.3 oz of material)' },
    funFact: 'Bennu is a "rubble pile" asteroid, and samples returned by OSIRIS-REx contained amino acids and water-bearing minerals.',
    stateVector: { x: -3.995021e-03, y: 9.026562e-01, z: 9.535446e-02, vx: -1.969357e-02, vy: 1.156329e-03, vz: 1.936156e-04, epoch: 2461130.0 },
    orbitalElements: { a: 1.1264, e: 0.2037, i: 6.03, om: 2.06, w: 66.22, ma: 101.70, epoch: 2460000.5 }
  },
  {
    id: '2099942', name: 'Apophis', type: 'asteroid',
    color: 0xDD6644,
    info: { Type: 'Near-Earth asteroid (Sq-type)', Diameter: '~370 meters', 'Orbital Period': '0.89 years', 'Close Approach': 'Apr 13, 2029 (31,000 km from Earth)', 'Hazard Rating': 'No longer considered a threat' },
    funFact: 'In 2029, Apophis will pass closer to Earth than geostationary satellites, visible to the naked eye from Europe/Africa.',
    orbitalElements: { a: 0.9224, e: 0.1915, i: 3.34, om: 204.43, w: 126.40, ma: 215.54, epoch: 2460000.5 }
  },
  {
    id: '2000001', name: 'Ceres', type: 'asteroid',
    color: 0x99AABB,
    info: { Type: 'Dwarf planet / largest asteroid', Diameter: '939 km', 'Orbital Period': '4.6 years', Location: 'Main asteroid belt', 'Visited By': 'Dawn spacecraft (2015-2018)', 'Notable Feature': 'Bright spots (sodium carbonate deposits)' },
    funFact: 'Ceres contains about one-third of the total mass of the entire asteroid belt and may have a subsurface ocean.',
    stateVector: { x: 2.000047e+00, y: 1.968526e+00, z: -3.061398e-01, vx: -7.442182e-03, vy: 6.689982e-03, vz: 1.582867e-03, epoch: 2461130.0 },
    orbitalElements: { a: 2.7691, e: 0.0760, i: 10.59, om: 80.33, w: 73.60, ma: 77.37, epoch: 2460000.5 }
  },
  {
    id: '2000004', name: 'Vesta', type: 'asteroid',
    color: 0xCCBB99,
    info: { Type: 'V-type asteroid (differentiated)', Diameter: '525 km', 'Orbital Period': '3.63 years', Location: 'Main asteroid belt', 'Visited By': 'Dawn spacecraft (2011-2012)', 'Notable Feature': 'Giant impact crater (Rheasilvia, 505 km)' },
    funFact: 'Vesta is the brightest asteroid and one of the only ones visible to the naked eye. Its south pole crater is one of the largest in the solar system.',
    stateVector: { x: 1.894030e+00, y: -1.249767e+00, z: -1.935310e-01, vx: 7.065338e-03, vy: 9.129959e-03, vz: -1.131398e-03, epoch: 2461130.0 },
    orbitalElements: { a: 2.3615, e: 0.0887, i: 7.14, om: 103.85, w: 149.84, ma: 20.86, epoch: 2460000.5 }
  },
  {
    id: '2000433', name: 'Eros', type: 'asteroid',
    color: 0xBB8855,
    info: { Type: 'Near-Earth asteroid (S-type)', Diameter: '34 x 11 x 11 km', 'Orbital Period': '1.76 years', 'Visited By': 'NEAR Shoemaker (2000-2001)', 'Historic First': 'First asteroid orbited and landed on by a spacecraft' },
    funFact: 'Eros is shaped like a peanut and was the first near-Earth asteroid ever discovered (1898).',
    orbitalElements: { a: 1.4583, e: 0.2229, i: 10.83, om: 304.32, w: 178.64, ma: 320.42, epoch: 2460000.5 }
  }
];

export const METEOR_SHOWER_DATA = [
  { name: 'Perseids', peak: 'Aug 12-13', parent: 'Comet 109P/Swift-Tuttle', ZHR: 100, color: 0xFFDD88,
    radiantRA: 48, radiantDec: 58, info: { 'Peak Rate': '~100 meteors/hour', Speed: '59 km/s', Active: 'Jul 17 - Aug 24' } },
  { name: 'Geminids', peak: 'Dec 13-14', parent: 'Asteroid 3200 Phaethon', ZHR: 150, color: 0xFFBB44,
    radiantRA: 112, radiantDec: 33, info: { 'Peak Rate': '~150 meteors/hour', Speed: '35 km/s', Active: 'Dec 4 - Dec 17' } },
  { name: 'Leonids', peak: 'Nov 17-18', parent: 'Comet 55P/Tempel-Tuttle', ZHR: 15, color: 0xAADDFF,
    radiantRA: 152, radiantDec: 22, info: { 'Peak Rate': '~15 meteors/hour (storm years: 1000+)', Speed: '71 km/s', Active: 'Nov 6 - Nov 30' } },
  { name: 'Quadrantids', peak: 'Jan 3-4', parent: 'Asteroid 2003 EH1', ZHR: 120, color: 0x88CCFF,
    radiantRA: 230, radiantDec: 49, info: { 'Peak Rate': '~120 meteors/hour', Speed: '41 km/s', Active: 'Jan 1 - Jan 5' } },
  { name: 'Eta Aquariids', peak: 'May 6-7', parent: "Halley's Comet (1P)", ZHR: 50, color: 0xAAEEFF,
    radiantRA: 338, radiantDec: -1, info: { 'Peak Rate': '~50 meteors/hour', Speed: '66 km/s', Active: 'Apr 19 - May 28' } },
  { name: 'Orionids', peak: 'Oct 21-22', parent: "Halley's Comet (1P)", ZHR: 20, color: 0xCCBBFF,
    radiantRA: 95, radiantDec: 16, info: { 'Peak Rate': '~20 meteors/hour', Speed: '66 km/s', Active: 'Oct 2 - Nov 7' } },
];
