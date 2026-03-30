// Real-time tracking via NASA JPL Horizons API + NeoWs
// Handles API calls, response parsing, coordinate mapping, and position interpolation

import { SPACECRAFT_CATALOG, COMET_CATALOG, ASTEROID_CATALOG } from './trackingdata.js';

const HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const NEOWS_API = 'https://api.nasa.gov/neo/rest/v1/feed';
const NEOWS_KEY = 'DEMO_KEY';

// Fallback NEO data for when NASA API is unavailable (real objects with known close approaches)
const FALLBACK_NEOS = [
  { id: 'neo-99942', name: '99942 Apophis', type: 'neo', color: 0xFF4444, missDistance: 0.00021, velocity: 7.4, isHazardous: true,
    estimatedDiameter: { min: 310, max: 370 },
    info: { Name: '99942 Apophis', 'Est. Diameter': '310-370 m', 'Miss Distance': '0.1 lunar distances (2029 flyby)', 'Relative Velocity': '7.4 km/s', Hazardous: 'Yes' },
    funFact: 'In 2029, Apophis will pass closer to Earth than geostationary satellites \u2014 visible to the naked eye.' },
  { id: 'neo-101955', name: '101955 Bennu', type: 'neo', color: 0xFFAA44, missDistance: 0.0032, velocity: 6.2, isHazardous: true,
    estimatedDiameter: { min: 450, max: 510 },
    info: { Name: '101955 Bennu', 'Est. Diameter': '450-510 m', 'Miss Distance': '1.2 lunar distances', 'Relative Velocity': '6.2 km/s', Hazardous: 'Yes' },
    funFact: 'OSIRIS-REx collected samples from Bennu and returned them to Earth in 2023.' },
  { id: 'neo-153814', name: '2001 WN5', type: 'neo', color: 0xFFAA44, missDistance: 0.0016, velocity: 10.8, isHazardous: true,
    estimatedDiameter: { min: 700, max: 1500 },
    info: { Name: '153814 (2001 WN5)', 'Est. Diameter': '700-1500 m', 'Miss Distance': '0.6 lunar distances (2028)', 'Relative Velocity': '10.8 km/s', Hazardous: 'Yes' },
    funFact: 'One of the larger potentially hazardous asteroids expected to pass close to Earth.' },
  { id: 'neo-7482', name: '7482 (1994 PC1)', type: 'neo', color: 0xFF4444, missDistance: 0.013, velocity: 19.6, isHazardous: true,
    estimatedDiameter: { min: 900, max: 1100 },
    info: { Name: '7482 (1994 PC1)', 'Est. Diameter': '900-1100 m', 'Miss Distance': '5.2 lunar distances', 'Relative Velocity': '19.6 km/s', Hazardous: 'Yes' },
    funFact: 'This kilometer-class asteroid passed Earth in January 2022 at 1.93 million km.' },
  { id: 'neo-163348', name: '2002 NN4', type: 'neo', color: 0xFFAA44, missDistance: 0.034, velocity: 11.2, isHazardous: true,
    estimatedDiameter: { min: 250, max: 570 },
    info: { Name: '163348 (2002 NN4)', 'Est. Diameter': '250-570 m', 'Miss Distance': '13.2 lunar distances', 'Relative Velocity': '11.2 km/s', Hazardous: 'Yes' },
    funFact: 'A large near-Earth asteroid that makes regular close approaches to our planet.' },
  { id: 'neo-388945', name: '2008 TZ3', type: 'neo', color: 0xFFAA44, missDistance: 0.019, velocity: 8.2, isHazardous: false,
    estimatedDiameter: { min: 220, max: 490 },
    info: { Name: '388945 (2008 TZ3)', 'Est. Diameter': '220-490 m', 'Miss Distance': '7.4 lunar distances', 'Relative Velocity': '8.2 km/s', Hazardous: 'No' },
    funFact: 'This asteroid is a regular visitor to Earth\'s neighborhood, returning every few years.' },
];
const AU_TO_SCENE = 50; // 1 AU = 50 scene units (matches Earth orbit)
const LOG_THRESHOLD_AU = 5; // Beyond this, apply logarithmic compression
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const NEO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export class TrackingManager {
  constructor() {
    this.positions = new Map(); // id -> {x, y, z, vx, vy, vz, lastFetched}
    this.neoData = [];
    this.status = 'idle'; // idle, loading, ready, error, fallback
    this.onStatusChange = null;
    this._refreshTimer = null;
    this._neoRefreshTimer = null;
  }

  async fetchAll() {
    this.status = 'loading';
    this._notifyStatus();

    const allObjects = [
      ...SPACECRAFT_CATALOG.map(s => ({ ...s, catalog: 'spacecraft' })),
      ...COMET_CATALOG.map(c => ({ ...c, catalog: 'comet' })),
      ...ASTEROID_CATALOG.map(a => ({ ...a, catalog: 'asteroid' }))
    ];

    // Step 1: Load positions from embedded state vectors and orbital elements (instant, no API)
    let loadedCount = 0;
    allObjects.forEach(obj => {
      // State vectors take priority (most accurate for spacecraft on escape trajectories)
      if (obj.stateVector) {
        const sv = obj.stateVector;
        const jdNow = (Date.now() / 86400000) + 2440587.5;
        const dt = jdNow - sv.epoch; // days since epoch
        this.positions.set(obj.id, {
          x: sv.x + sv.vx * dt,
          y: sv.y + sv.vy * dt,
          z: sv.z + sv.vz * dt,
          vx: sv.vx, vy: sv.vy, vz: sv.vz,
          lastFetched: Date.now()
        });
        loadedCount++;
      } else {
        // Fall back to Keplerian computation from orbital elements
        const pos = this._computeKeplerian(obj);
        if (pos) {
          this.positions.set(obj.id, { ...pos, lastFetched: Date.now() });
          loadedCount++;
        }
      }
    });

    console.log(`Tracking: ${loadedCount}/${allObjects.length} objects loaded from embedded data`);

    // Step 2: Try to upgrade positions via Horizons API (may fail due to CORS)
    this._tryAPIUpgrade(allObjects);

    // Step 3: Try to fetch NEOs, fallback to curated data
    try {
      this.neoData = await this._fetchNEOs();
      if (!this.neoData || this.neoData.length === 0) throw new Error('Empty response');
    } catch (e) {
      console.warn('NEO API unavailable, using fallback data:', e.message);
      this.neoData = FALLBACK_NEOS;
    }

    this.status = loadedCount > 0 ? 'ready' : 'error';
    this._notifyStatus();

    return this.positions;
  }

  // Attempt to upgrade positions from API (non-blocking, fails silently if CORS blocks)
  async _tryAPIUpgrade(allObjects) {
    try {
      const results = await Promise.allSettled(
        allObjects.map(obj => this._fetchHorizons(obj.id))
      );

      let apiCount = 0;
      results.forEach((result, i) => {
        const obj = allObjects[i];
        if (result.status === 'fulfilled' && result.value) {
          this.positions.set(obj.id, { ...result.value, lastFetched: Date.now() });
          apiCount++;
        }
      });

      if (apiCount > 0) {
        console.log(`Tracking: upgraded ${apiCount} positions from Horizons API`);
        this.status = 'ready';
        this._notifyStatus();

        // Set up periodic refresh only if API works
        this._refreshTimer = setInterval(() => this._refreshPositions(), REFRESH_INTERVAL);
      }
    } catch (e) {
      console.warn('Horizons API unavailable (likely CORS), using embedded data:', e.message);
    }
  }

  async _fetchHorizons(objectId) {
    const now = new Date();
    const startTime = now.toISOString().slice(0, 19).replace('T', ' ');
    const later = new Date(now.getTime() + 60000);
    const stopTime = later.toISOString().slice(0, 19).replace('T', ' ');

    const params = new URLSearchParams({
      format: 'json',
      COMMAND: `'${objectId}'`,
      OBJ_DATA: 'NO',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'VECTORS',
      CENTER: "'500@10'", // Heliocentric
      START_TIME: `'${startTime}'`,
      STOP_TIME: `'${stopTime}'`,
      STEP_SIZE: "'1'",
      VEC_TABLE: "'2'", // Position + velocity
      REF_PLANE: "'ECLIPTIC'",
      REF_SYSTEM: "'ICRF'",
      OUT_UNITS: "'AU-D'", // AU and AU/day
      CSV_FORMAT: "'YES'",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(`${HORIZONS_API}?${params}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Horizons API error: ${response.status}`);

    const data = await response.json();
    return this._parseHorizonsResponse(data);
  }

  _parseHorizonsResponse(data) {
    const result = data.result;
    if (!result) return null;

    const soeIdx = result.indexOf('$$SOE');
    const eoeIdx = result.indexOf('$$EOE');
    if (soeIdx === -1 || eoeIdx === -1) return null;

    const dataBlock = result.substring(soeIdx + 5, eoeIdx).trim();
    const lines = dataBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length < 2) return null;

    // CSV format: JDTDB, Calendar Date, X, Y, Z, VX, VY, VZ, ...
    // The data is typically on 2 lines per entry (position then velocity) or comma-separated
    // With CSV_FORMAT=YES, each record is comma-delimited
    const firstLine = lines[0];
    const values = firstLine.split(',').map(v => v.trim());

    // Try to extract position (X, Y, Z) and velocity (VX, VY, VZ)
    // Format: JDTDB, Cal, X, Y, Z, VX, VY, VZ, LT, RG, RR
    let x, y, z, vx, vy, vz;

    if (values.length >= 8) {
      x = parseFloat(values[2]);
      y = parseFloat(values[3]);
      z = parseFloat(values[4]);
      vx = parseFloat(values[5]);
      vy = parseFloat(values[6]);
      vz = parseFloat(values[7]);
    } else {
      // Non-CSV fallback: try space-delimited
      const allNums = dataBlock.match(/-?\d+\.\d+E[+-]\d+/g);
      if (!allNums || allNums.length < 6) return null;
      x = parseFloat(allNums[0]);
      y = parseFloat(allNums[1]);
      z = parseFloat(allNums[2]);
      vx = parseFloat(allNums[3]);
      vy = parseFloat(allNums[4]);
      vz = parseFloat(allNums[5]);
    }

    if (isNaN(x) || isNaN(y) || isNaN(z)) return null;

    return { x, y, z, vx: vx || 0, vy: vy || 0, vz: vz || 0 };
  }

  async _fetchNEOs() {
    const today = new Date().toISOString().slice(0, 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(
      `${NEOWS_API}?start_date=${today}&end_date=${today}&api_key=${NEOWS_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`NeoWs error: ${response.status}`);
    const data = await response.json();

    const neos = [];
    const dateEntries = Object.values(data.near_earth_objects || {});
    for (const dayList of dateEntries) {
      for (const neo of dayList) {
        const ca = neo.close_approach_data?.[0];
        if (!ca) continue;
        neos.push({
          id: neo.id,
          name: neo.name,
          type: 'neo',
          color: neo.is_potentially_hazardous_asteroid ? 0xFF4444 : 0xFFAA44,
          estimatedDiameter: {
            min: neo.estimated_diameter?.meters?.estimated_diameter_min || 0,
            max: neo.estimated_diameter?.meters?.estimated_diameter_max || 0,
          },
          missDistance: parseFloat(ca.miss_distance?.astronomical || 0),
          velocity: parseFloat(ca.relative_velocity?.kilometers_per_second || 0),
          isHazardous: neo.is_potentially_hazardous_asteroid,
          info: {
            Name: neo.name,
            'Est. Diameter': `${Math.round(neo.estimated_diameter?.meters?.estimated_diameter_min || 0)}-${Math.round(neo.estimated_diameter?.meters?.estimated_diameter_max || 0)} m`,
            'Miss Distance': `${parseFloat(ca.miss_distance?.lunar || 0).toFixed(1)} lunar distances`,
            'Relative Velocity': `${parseFloat(ca.relative_velocity?.kilometers_per_second || 0).toFixed(1)} km/s`,
            Hazardous: neo.is_potentially_hazardous_asteroid ? 'Yes' : 'No',
          },
          funFact: neo.is_potentially_hazardous_asteroid
            ? 'This asteroid is classified as potentially hazardous due to its size and close approach distance.'
            : 'This near-Earth object is passing through our neighborhood today.',
        });
      }
    }

    // Sort by miss distance ascending, take top 8
    neos.sort((a, b) => a.missDistance - b.missDistance);
    return neos.slice(0, 8);
  }

  _computeKeplerian(obj) {
    const elems = obj.orbitalElements;
    if (!elems) return null;

    const { a, e, i, om, w, ma, epoch } = elems;

    // Current Julian date
    const now = Date.now();
    const jd = (now / 86400000) + 2440587.5;
    const dt = jd - epoch; // days since epoch

    // Mean motion (rad/day) for heliocentric orbit
    const n = (2 * Math.PI) / (Math.sqrt(a * a * a) * 365.25);

    // Current mean anomaly
    let M = ((ma * Math.PI / 180) + n * dt) % (2 * Math.PI);
    if (M < 0) M += 2 * Math.PI;

    // Solve Kepler's equation M = E - e*sin(E) via Newton-Raphson
    let E = M;
    for (let iter = 0; iter < 20; iter++) {
      const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-10) break;
    }

    // True anomaly
    const sinV = Math.sqrt(1 - e * e) * Math.sin(E) / (1 - e * Math.cos(E));
    const cosV = (Math.cos(E) - e) / (1 - e * Math.cos(E));
    const v = Math.atan2(sinV, cosV);

    // Distance from Sun
    const r = a * (1 - e * Math.cos(E));

    // Position in orbital plane
    const xOrb = r * Math.cos(v);
    const yOrb = r * Math.sin(v);

    // Convert to ecliptic coordinates
    const omRad = om * Math.PI / 180;
    const wRad = w * Math.PI / 180;
    const iRad = i * Math.PI / 180;

    const cosOm = Math.cos(omRad), sinOm = Math.sin(omRad);
    const cosW = Math.cos(wRad), sinW = Math.sin(wRad);
    const cosI = Math.cos(iRad), sinI = Math.sin(iRad);

    const x = (cosOm * cosW - sinOm * sinW * cosI) * xOrb + (-cosOm * sinW - sinOm * cosW * cosI) * yOrb;
    const y = (sinOm * cosW + cosOm * sinW * cosI) * xOrb + (-sinOm * sinW + cosOm * cosW * cosI) * yOrb;
    const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;

    return { x, y, z, vx: 0, vy: 0, vz: 0 };
  }

  // Compute orbit path points from orbital elements (128 points)
  computeOrbitPath(obj) {
    const elems = obj.orbitalElements;
    if (!elems) return null;

    const { a, e, i, om, w } = elems;
    const points = [];
    const steps = 128;

    const omRad = om * Math.PI / 180;
    const wRad = w * Math.PI / 180;
    const iRad = i * Math.PI / 180;

    const cosOm = Math.cos(omRad), sinOm = Math.sin(omRad);
    const cosW = Math.cos(wRad), sinW = Math.sin(wRad);
    const cosI = Math.cos(iRad), sinI = Math.sin(iRad);

    for (let s = 0; s <= steps; s++) {
      const v = (s / steps) * 2 * Math.PI;
      const r = a * (1 - e * e) / (1 + e * Math.cos(v));

      const xOrb = r * Math.cos(v);
      const yOrb = r * Math.sin(v);

      const x = (cosOm * cosW - sinOm * sinW * cosI) * xOrb + (-cosOm * sinW - sinOm * cosW * cosI) * yOrb;
      const y = (sinOm * cosW + cosOm * sinW * cosI) * xOrb + (-sinOm * sinW + cosOm * cosW * cosI) * yOrb;
      const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;

      const pos = this.auToScene(x, y, z);
      points.push(pos.sx, pos.sy, pos.sz);
    }

    return points;
  }

  // Convert AU ecliptic coordinates to scene coordinates
  auToScene(auX, auY, auZ) {
    // Ecliptic X,Y -> scene X,Z (Y-up in Three.js)
    // Ecliptic Z -> scene Y (out of ecliptic plane)
    const r = Math.sqrt(auX * auX + auY * auY + auZ * auZ);

    let scale;
    if (r <= LOG_THRESHOLD_AU) {
      scale = AU_TO_SCENE;
    } else {
      // Logarithmic compression beyond threshold
      // At threshold: linear scale = 250 scene units
      // Beyond: grows logarithmically
      const linearPart = LOG_THRESHOLD_AU * AU_TO_SCENE; // 250
      const logPart = 60 * Math.log2(r / LOG_THRESHOLD_AU); // slower growth
      scale = (linearPart + logPart) / r;
    }

    return {
      sx: auX * scale,
      sy: auZ * scale,  // ecliptic Z -> scene Y
      sz: -auY * scale   // ecliptic Y -> scene -Z
    };
  }

  // Get interpolated position for a specific object at current time
  getPosition(id) {
    const data = this.positions.get(id);
    if (!data) return null;

    const elapsed = (Date.now() - data.lastFetched) / 86400000; // days
    const pos = this.auToScene(
      data.x + data.vx * elapsed,
      data.y + data.vy * elapsed,
      data.z + data.vz * elapsed
    );

    return pos;
  }

  // Get distance from sun in AU for an object
  getDistanceAU(id) {
    const data = this.positions.get(id);
    if (!data) return null;
    return Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
  }

  async _refreshPositions() {
    const allObjects = [
      ...SPACECRAFT_CATALOG,
      ...COMET_CATALOG,
      ...ASTEROID_CATALOG
    ];

    const results = await Promise.allSettled(
      allObjects.map(obj => this._fetchHorizons(obj.id))
    );

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        this.positions.set(allObjects[i].id, { ...result.value, lastFetched: Date.now() });
      }
    });
  }

  _notifyStatus() {
    if (this.onStatusChange) this.onStatusChange(this.status);
  }

  destroy() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    if (this._neoRefreshTimer) clearInterval(this._neoRefreshTimer);
  }
}
