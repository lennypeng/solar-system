// All celestial body data with moons
// orbital.L0 = mean longitude at J2000 epoch (degrees)
// orbital.periodDays = orbital period in Earth days
// Moon L0 values are approximate where exact ephemeris is unavailable

export const BODIES = [
  { name: 'Sun', type: 'star', radius: 8, orbitalRadius: 0, orbitalSpeed: 0, rotationSpeed: 0.002, color: 0xFDB813,
    info: { Diameter: '1,391,000 km', Mass: '1.989 \u00d7 10\u00b3\u2070 kg', Type: 'G-type main-sequence star', Age: '~4.6 billion years', Temperature: '5,500\u00b0C (surface)', Composition: '73% Hydrogen, 25% Helium', Luminosity: '3.828 \u00d7 10\u00b2\u2076 watts' },
    funFact: 'The Sun contains 99.86% of all mass in the solar system. Over 1 million Earths could fit inside it.',
    surface: { skyTop: 0xFF6600, skyBot: 0xFFCC00, groundColor: 0xFF4400, fog: 0xFF8800, fogDensity: 0.06, particles: 'embers', particleCount: 600, particleColor: 0xFFDD44, ambient: 2.0, desc: 'Inside the Sun: a roiling plasma inferno at 5,500\u00b0C. Hydrogen fuses into helium, releasing the energy that powers our solar system.' }
  },
  { name: 'Mercury', type: 'planet', radius: 0.8, orbitalRadius: 25, orbitalSpeed: 4.15, rotationSpeed: 0.005, color: 0xB5B5B5,
    orbital: { L0: 252.251, periodDays: 87.969 },
    moons: [],
    info: { Diameter: '4,879 km', 'Distance from Sun': '57.9 million km', 'Orbital Period': '88 Earth days', 'Day Length': '176 Earth days', Temperature: '-180\u00b0C to 430\u00b0C', Moons: '0', Atmosphere: 'Virtually none (thin exosphere)' },
    funFact: 'Mercury has the most extreme temperature swings \u2014 over 600\u00b0C difference between day and night.',
    surface: { skyTop: 0x000000, skyBot: 0x111111, groundColor: 0x666666, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.3, desc: 'A barren, cratered world baking under an enormous Sun. With virtually no atmosphere, the sky is pitch black even during the day.' }
  },
  { name: 'Venus', type: 'planet', radius: 1.2, orbitalRadius: 38, orbitalSpeed: 1.62, rotationSpeed: -0.003, color: 0xE8CDA0,
    orbital: { L0: 181.980, periodDays: 224.701 },
    moons: [],
    info: { Diameter: '12,104 km', 'Distance from Sun': '108.2 million km', 'Orbital Period': '225 Earth days', 'Day Length': '243 Earth days (retrograde)', Temperature: '462\u00b0C (average)', Moons: '0', Atmosphere: '96.5% CO\u2082, thick sulfuric acid clouds' },
    funFact: 'Venus rotates backwards compared to most planets, and its day is longer than its year.',
    surface: { skyTop: 0xCC8833, skyBot: 0x885522, groundColor: 0x8B6914, fog: 0xBB8833, fogDensity: 0.08, particles: 'haze', particleCount: 400, particleColor: 0xDDAA44, ambient: 0.5, desc: 'Suffocating under 90 atmospheres of pressure. Thick sulfuric acid clouds block the Sun. Lightning crackles through the haze.' }
  },
  { name: 'Earth', type: 'planet', radius: 1.3, orbitalRadius: 50, orbitalSpeed: 1.0, rotationSpeed: 0.01, color: 0x4B7BE5,
    orbital: { L0: 100.464, periodDays: 365.256 },
    moons: [
      { name: 'Moon', radius: 0.35, orbitalRadius: 3.5, speed: 13.37, color: 0xAAAAAA, // 365.25/27.3 orbits per Earth year
        orbital: { L0: 218.316, periodDays: 27.322 },
        info: { Diameter: '3,474 km', 'Distance from Earth': '384,400 km', 'Orbital Period': '27.3 days', Temperature: '-173\u00b0C to 127\u00b0C', Atmosphere: 'None' },
        funFact: 'The Moon is slowly drifting away from Earth at 3.8 cm per year.',
        surface: { skyTop: 0x000000, skyBot: 0x000000, groundColor: 0x888888, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.4, desc: 'Gray regolith under a pitch-black sky blazing with stars. Earth hangs above \u2014 a brilliant blue marble.' }
      }
    ],
    info: { Diameter: '12,742 km', 'Distance from Sun': '149.6 million km', 'Orbital Period': '365.25 days', 'Day Length': '24 hours', Temperature: '15\u00b0C (average)', Moons: '1', Atmosphere: '78% N\u2082, 21% O\u2082' },
    funFact: 'Earth is the only known planet with liquid water on its surface and the only confirmed home of life.',
    surface: { skyTop: 0x4488DD, skyBot: 0x88BBEE, groundColor: 0x3B7A3B, fog: 0x99BBDD, fogDensity: 0.01, particles: 'clouds', particleCount: 200, particleColor: 0xFFFFFF, ambient: 1.0, desc: 'Home. Blue skies, drifting clouds, and green landscapes. The only world known to harbor life.' }
  },
  { name: 'Mars', type: 'planet', radius: 1.0, orbitalRadius: 65, orbitalSpeed: 0.53, rotationSpeed: 0.009, color: 0xC1440E,
    orbital: { L0: 355.453, periodDays: 686.980 },
    moons: [
      { name: 'Phobos', radius: 0.12, orbitalRadius: 2.2, speed: 1145, color: 0x887766, // 365.25/0.319
        orbital: { L0: 35.0, periodDays: 0.319 },
        info: { Diameter: '22.4 km', 'Orbital Period': '7h 39m', 'Distance from Mars': '9,376 km' },
        funFact: 'Phobos orbits so close to Mars it will eventually be torn apart by tidal forces.',
        surface: { skyTop: 0x000000, skyBot: 0x111100, groundColor: 0x555544, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.25, desc: 'A tiny, potato-shaped rock scarred by the massive Stickney crater. Mars looms enormous in the sky.' }
      },
      { name: 'Deimos', radius: 0.08, orbitalRadius: 3.5, speed: 289, color: 0x998877, // 365.25/1.263
        orbital: { L0: 162.0, periodDays: 1.263 },
        info: { Diameter: '12.4 km', 'Orbital Period': '30.3 hours', 'Distance from Mars': '23,460 km' },
        funFact: 'Deimos is one of the smallest moons in the solar system.',
        surface: { skyTop: 0x000000, skyBot: 0x0A0A05, groundColor: 0x665544, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.2, desc: 'A tiny, smooth rock. Mars appears as a giant orange disk dominating the sky.' }
      }
    ],
    info: { Diameter: '6,779 km', 'Distance from Sun': '227.9 million km', 'Orbital Period': '687 Earth days', 'Day Length': '24h 37m', Temperature: '-60\u00b0C (average)', Moons: '2 (Phobos & Deimos)', Atmosphere: '95% CO\u2082, very thin' },
    funFact: 'Mars has the tallest volcano (Olympus Mons, 21.9 km) and deepest canyon (Valles Marineris) in the solar system.',
    surface: { skyTop: 0xCC9966, skyBot: 0xBB7744, groundColor: 0xAA4422, fog: 0xCC8855, fogDensity: 0.02, particles: 'dust', particleCount: 350, particleColor: 0xCC9966, ambient: 0.6, desc: 'A rusty desert world under a butterscotch sky. Dust devils swirl across ancient riverbeds.' }
  },
  { name: 'Jupiter', type: 'planet', radius: 4.5, orbitalRadius: 100, orbitalSpeed: 0.084, rotationSpeed: 0.02, color: 0xC88B3A,
    orbital: { L0: 34.351, periodDays: 4332.589 },
    moons: [
      { name: 'Io', radius: 0.3, orbitalRadius: 7, speed: 206, color: 0xDDCC44, // 365.25/1.77
        orbital: { L0: 5.5, periodDays: 1.769 },
        info: { Diameter: '3,643 km', 'Orbital Period': '1.77 days', 'Distance from Jupiter': '421,700 km' },
        funFact: 'Io is the most volcanically active body in the solar system with over 400 active volcanoes.',
        surface: { skyTop: 0x222200, skyBot: 0x443300, groundColor: 0xCCBB33, fog: 0x665500, fogDensity: 0.03, particles: 'embers', particleCount: 200, particleColor: 0xFF8800, ambient: 0.4, desc: 'A volcanic hellscape. Sulfur geysers erupt 300 km high. The ground is painted yellow, red, and black by sulfur deposits.' }
      },
      { name: 'Europa', radius: 0.25, orbitalRadius: 9.5, speed: 103, color: 0xBBCCDD, // 365.25/3.55
        orbital: { L0: 171.0, periodDays: 3.551 },
        info: { Diameter: '3,122 km', 'Orbital Period': '3.55 days', 'Distance from Jupiter': '671,100 km' },
        funFact: 'Europa likely has a saltwater ocean beneath its icy crust \u2014 a top candidate for extraterrestrial life.',
        surface: { skyTop: 0x000005, skyBot: 0x111122, groundColor: 0xAABBCC, fog: null, fogDensity: 0, particles: 'ice', particleCount: 100, particleColor: 0xCCDDEE, ambient: 0.3, desc: 'A cracked ice shell stretches to the horizon. Beneath lies a vast ocean \u2014 perhaps harboring life.' }
      },
      { name: 'Ganymede', radius: 0.35, orbitalRadius: 12, speed: 51.1, color: 0x998888, // 365.25/7.15
        orbital: { L0: 317.5, periodDays: 7.155 },
        info: { Diameter: '5,268 km', 'Orbital Period': '7.15 days', 'Distance from Jupiter': '1,070,400 km' },
        funFact: 'Ganymede is the largest moon in the solar system \u2014 bigger than Mercury.',
        surface: { skyTop: 0x050508, skyBot: 0x111118, groundColor: 0x887777, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.3, desc: 'A world of grooved terrain and ancient craters. The largest moon in the solar system has its own magnetic field.' }
      },
      { name: 'Callisto', radius: 0.3, orbitalRadius: 15, speed: 21.9, color: 0x666666, // 365.25/16.7
        orbital: { L0: 181.4, periodDays: 16.689 },
        info: { Diameter: '4,821 km', 'Orbital Period': '16.7 days', 'Distance from Jupiter': '1,882,700 km' },
        funFact: 'Callisto is the most heavily cratered object in the solar system.',
        surface: { skyTop: 0x000002, skyBot: 0x080810, groundColor: 0x555555, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.25, desc: 'Ancient and battered, the most cratered surface in the solar system. A frozen, quiet world far from Jupiter\'s intense radiation.' }
      }
    ],
    info: { Diameter: '139,820 km', 'Distance from Sun': '778.5 million km', 'Orbital Period': '11.86 Earth years', 'Day Length': '9h 56m', Temperature: '-110\u00b0C (cloud tops)', Moons: '95 known', Atmosphere: '89% H\u2082, 10% He' },
    funFact: 'Jupiter\u2019s Great Red Spot is a storm larger than Earth raging for over 350 years.',
    surface: { skyTop: 0xAA7733, skyBot: 0xDD9944, groundColor: 0xBB8844, fog: 0xCC8833, fogDensity: 0.05, particles: 'turbulence', particleCount: 500, particleColor: 0xDDBB77, ambient: 0.4, desc: 'No solid surface \u2014 endless swirling gas. Massive cloud bands churn in 600 km/h winds.' }
  },
  { name: 'Saturn', type: 'planet', radius: 3.8, orbitalRadius: 140, orbitalSpeed: 0.034, rotationSpeed: 0.018, color: 0xE8D191, hasRings: true,
    orbital: { L0: 49.945, periodDays: 10759.22 },
    moons: [
      { name: 'Titan', radius: 0.35, orbitalRadius: 11, speed: 22.9, color: 0xCC9944, // 365.25/15.95
        orbital: { L0: 120.0, periodDays: 15.945 },
        info: { Diameter: '5,150 km', 'Orbital Period': '15.95 days', 'Distance from Saturn': '1,221,870 km' },
        funFact: 'Titan has a thick atmosphere and lakes of liquid methane \u2014 the only moon with a dense atmosphere.',
        surface: { skyTop: 0x885522, skyBot: 0xAA7733, groundColor: 0x776633, fog: 0xAA8844, fogDensity: 0.07, particles: 'haze', particleCount: 300, particleColor: 0xCCAA66, ambient: 0.3, desc: 'An orange, hazy world with methane rain and hydrocarbon lakes. The thick atmosphere hides Saturn from view.' }
      },
      { name: 'Enceladus', radius: 0.12, orbitalRadius: 7, speed: 266.6, color: 0xEEEEFF, // 365.25/1.37
        orbital: { L0: 211.0, periodDays: 1.370 },
        info: { Diameter: '504 km', 'Orbital Period': '1.37 days', 'Distance from Saturn': '238,020 km' },
        funFact: 'Enceladus shoots geysers of water ice into space from its south pole \u2014 feeding Saturn\'s E ring.',
        surface: { skyTop: 0x000005, skyBot: 0x0A0A15, groundColor: 0xDDDDEE, fog: null, fogDensity: 0, particles: 'ice', particleCount: 200, particleColor: 0xFFFFFF, ambient: 0.35, desc: 'A brilliant white ice world. Geysers of water vapor erupt from tiger stripe fractures near the south pole.' }
      },
      { name: 'Mimas', radius: 0.08, orbitalRadius: 5, speed: 387.7, color: 0xCCCCCC, // 365.25/0.942
        orbital: { L0: 14.0, periodDays: 0.942 },
        info: { Diameter: '396 km', 'Orbital Period': '22.6 hours', 'Distance from Saturn': '185,520 km' },
        funFact: 'Mimas looks like the Death Star due to its enormous Herschel crater.',
        surface: { skyTop: 0x000000, skyBot: 0x080808, groundColor: 0xBBBBBB, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.25, desc: 'A small icy moon dominated by the massive Herschel crater \u2014 giving it an uncanny resemblance to the Death Star.' }
      }
    ],
    info: { Diameter: '116,460 km', 'Distance from Sun': '1.43 billion km', 'Orbital Period': '29.46 Earth years', 'Day Length': '10h 42m', Temperature: '-140\u00b0C', Moons: '146 known', Atmosphere: '96% H\u2082, 3% He' },
    funFact: 'Saturn is so light it would float in water. Its rings span 282,000 km but are only ~10 meters thick.',
    surface: { skyTop: 0xBB9955, skyBot: 0xDDBB77, groundColor: 0xCCAA66, fog: 0xCCBB88, fogDensity: 0.04, particles: 'turbulence', particleCount: 400, particleColor: 0xEECC88, ambient: 0.35, desc: 'Golden cloud bands swirl beneath spectacular rings arcing across the sky.' }
  },
  { name: 'Uranus', type: 'planet', radius: 2.5, orbitalRadius: 190, orbitalSpeed: 0.012, rotationSpeed: 0.012, color: 0x7EC8E3, axialTilt: 98,
    orbital: { L0: 313.232, periodDays: 30688.5 },
    moons: [
      { name: 'Titania', radius: 0.18, orbitalRadius: 6, speed: 42.0, color: 0xBBBBCC, // 365.25/8.7
        orbital: { L0: 77.0, periodDays: 8.706 },
        info: { Diameter: '1,578 km', 'Orbital Period': '8.7 days', 'Distance from Uranus': '435,910 km' },
        funFact: 'Titania is the largest moon of Uranus, with enormous canyons up to 1,500 km long.',
        surface: { skyTop: 0x000005, skyBot: 0x0A0A12, groundColor: 0x999AAA, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.2, desc: 'An icy world scarred by enormous fault canyons. Uranus hangs as a pale blue-green orb in the dark sky.' }
      },
      { name: 'Oberon', radius: 0.15, orbitalRadius: 8, speed: 27.1, color: 0xAAAABB, // 365.25/13.5
        orbital: { L0: 283.0, periodDays: 13.463 },
        info: { Diameter: '1,523 km', 'Orbital Period': '13.5 days', 'Distance from Uranus': '583,520 km' },
        funFact: 'Oberon has a mountain that may be 11 km tall \u2014 spotted in Voyager 2 images.',
        surface: { skyTop: 0x000003, skyBot: 0x08080E, groundColor: 0x888899, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.18, desc: 'Dark, ancient, and heavily cratered. One of the most distant large moons in the solar system.' }
      }
    ],
    info: { Diameter: '50,724 km', 'Distance from Sun': '2.87 billion km', 'Orbital Period': '84 Earth years', 'Day Length': '17h 14m', Temperature: '-195\u00b0C', Moons: '28 known', Atmosphere: '83% H\u2082, 15% He, 2% Methane' },
    funFact: 'Uranus rotates on its side with a 98\u00b0 tilt \u2014 likely from a massive ancient collision.',
    surface: { skyTop: 0x5599AA, skyBot: 0x77BBCC, groundColor: 0x88CCDD, fog: 0x77AACC, fogDensity: 0.04, particles: 'ice', particleCount: 300, particleColor: 0xAADDEE, ambient: 0.25, desc: 'A pale cyan-blue world of freezing methane haze. Ice crystals drift through the atmosphere.' }
  },
  { name: 'Neptune', type: 'planet', radius: 2.4, orbitalRadius: 230, orbitalSpeed: 0.006, rotationSpeed: 0.013, color: 0x3E54E8,
    orbital: { L0: 304.880, periodDays: 60182 },
    moons: [
      { name: 'Triton', radius: 0.22, orbitalRadius: 5.5, speed: 62.1, color: 0xBBCCDD, // 365.25/5.88
        orbital: { L0: 200.0, periodDays: 5.877 },
        info: { Diameter: '2,707 km', 'Orbital Period': '5.88 days (retrograde)', 'Distance from Neptune': '354,760 km' },
        funFact: 'Triton orbits backwards \u2014 likely a captured Kuiper Belt object. It has nitrogen geysers.',
        surface: { skyTop: 0x000008, skyBot: 0x0A0A18, groundColor: 0x99AABB, fog: null, fogDensity: 0, particles: 'ice', particleCount: 100, particleColor: 0xCCDDEE, ambient: 0.2, desc: 'A frozen world with nitrogen geysers erupting into the thin atmosphere. Neptune looms blue in the dark sky.' }
      }
    ],
    info: { Diameter: '49,244 km', 'Distance from Sun': '4.5 billion km', 'Orbital Period': '164.8 Earth years', 'Day Length': '16h 6m', Temperature: '-200\u00b0C', Moons: '16 known', Atmosphere: '80% H\u2082, 19% He, 1.5% Methane' },
    funFact: 'Neptune has the strongest winds in the solar system \u2014 up to 2,100 km/h.',
    surface: { skyTop: 0x1A2266, skyBot: 0x2244AA, groundColor: 0x223388, fog: 0x2233AA, fogDensity: 0.05, particles: 'storm', particleCount: 500, particleColor: 0x4466CC, ambient: 0.2, desc: 'Deep blue and violently stormy. The fastest winds in the solar system howl at 2,100 km/h.' }
  },
  { name: 'Pluto', type: 'dwarf', radius: 0.5, orbitalRadius: 260, orbitalSpeed: 0.004, rotationSpeed: 0.004, color: 0xC9B8A4,
    orbital: { L0: 238.929, periodDays: 90560 },
    moons: [
      { name: 'Charon', radius: 0.2, orbitalRadius: 2.5, speed: 57.1, color: 0x999999, // 365.25/6.4
        orbital: { L0: 25.0, periodDays: 6.387 },
        info: { Diameter: '1,212 km', 'Orbital Period': '6.4 days (tidally locked)', 'Distance from Pluto': '19,571 km' },
        funFact: 'Charon is so large relative to Pluto that they orbit each other \u2014 a true binary system.',
        surface: { skyTop: 0x000002, skyBot: 0x050508, groundColor: 0x777777, fog: null, fogDensity: 0, particles: 'none', particleCount: 0, particleColor: 0, ambient: 0.1, desc: 'A gray, frozen world locked in an eternal dance with Pluto. A reddish polar cap of tholins crowns the north.' }
      }
    ],
    info: { Diameter: '2,377 km', 'Distance from Sun': '5.9 billion km', 'Orbital Period': '248 Earth years', 'Day Length': '6.4 Earth days', Temperature: '-230\u00b0C', Moons: '5 (incl. Charon)', Atmosphere: 'Thin N\u2082, CH\u2084, CO' },
    funFact: 'Pluto\u2019s heart-shaped nitrogen glacier (Tombaugh Regio) is larger than Texas.',
    surface: { skyTop: 0x050508, skyBot: 0x0A0A12, groundColor: 0x887766, fog: null, fogDensity: 0, particles: 'frost', particleCount: 150, particleColor: 0xCCBBAA, ambient: 0.1, desc: 'A frozen, twilight world at the edge of the solar system. The Sun is just a bright star.' }
  }
];
