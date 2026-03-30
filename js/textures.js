import * as THREE from 'three';

// Deterministic noise
function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}
function fbm(x, y, octaves) {
  let v = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * noise2D(x * freq, y * freq);
    amp *= 0.5; freq *= 2.0;
  }
  return v;
}

export function generatePlanetTexture(name, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const id = ctx.createImageData(w, h);
  const d = id.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const u = px / w, v = py / h;
      const lat = (v - 0.5) * Math.PI;
      const lon = u * Math.PI * 2;
      const nx = Math.cos(lat) * Math.cos(lon);
      const ny = Math.sin(lat);
      const nz = Math.cos(lat) * Math.sin(lon);
      let r, g, b;
      const n1 = fbm(nx * 3, nz * 3, 6);
      const n2 = fbm(nx * 5 + 10, nz * 5 + 10, 4);
      const n3 = fbm(nx * 8 + 20, ny * 8 + 20, 5);

      if (name === 'Mercury') {
        const base = 0.35 + n1 * 0.3;
        const crater = n3 > 0.7 ? -0.15 : 0;
        const val = Math.max(0, Math.min(1, base + crater));
        r = val * 180; g = val * 170; b = val * 160;
      } else if (name === 'Venus') {
        const base = 0.5 + n1 * 0.25;
        const clouds = n2 * 0.2;
        r = (base + clouds) * 235; g = (base + clouds) * 200; b = (base + clouds) * 140;
      } else if (name === 'Earth') {
        const elev = n1 * 1.2 - 0.1;
        const pole = Math.abs(ny) > 0.75;
        if (pole) { r = 240; g = 245; b = 255; }
        else if (elev < 0.42) { const depth = 0.6 + elev * 0.5; r = 20 * depth; g = 60 * depth; b = 180 * depth; }
        else if (elev < 0.48) { r = 194; g = 178; b = 128; }
        else if (elev < 0.65) { const g2 = n2 * 0.3; r = 40 + g2 * 60; g = 100 + n1 * 50; b = 30 + g2 * 20; }
        else { const mt = 0.6 + n3 * 0.3; r = 140 * mt; g = 130 * mt; b = 110 * mt; }
        const cloud = fbm(nx * 4 + 50, nz * 4 + 50, 5);
        if (cloud > 0.55) { const ca = (cloud - 0.55) * 4; r = r * (1 - ca) + 255 * ca; g = g * (1 - ca) + 255 * ca; b = b * (1 - ca) + 255 * ca; }
      } else if (name === 'Mars') {
        const base = 0.4 + n1 * 0.35;
        const dark = n2 > 0.6 ? -0.1 : 0;
        const pole = Math.abs(ny) > 0.85 ? 0.5 : 0;
        r = Math.min(255, (base + dark) * 210 + pole * 200); g = Math.min(255, (base + dark) * 120 + pole * 180); b = Math.min(255, (base + dark) * 60 + pole * 170);
      } else if (name === 'Jupiter') {
        const band = Math.sin(v * 28 + n1 * 2) * 0.5 + 0.5;
        const storm = (Math.abs(v - 0.38) < 0.04 && Math.abs(u - 0.65) < 0.03) ? 0.3 : 0;
        const turb = n2 * 0.15;
        r = (band * 0.4 + 0.4 + turb + storm) * 220; g = (band * 0.3 + 0.35 + turb) * 180; b = (band * 0.15 + 0.2 + turb) * 120;
      } else if (name === 'Saturn') {
        const band = Math.sin(v * 22 + n1 * 1.5) * 0.5 + 0.5;
        const turb = n2 * 0.1;
        r = (band * 0.3 + 0.55 + turb) * 240; g = (band * 0.25 + 0.5 + turb) * 210; b = (band * 0.1 + 0.35 + turb) * 140;
      } else if (name === 'Uranus') {
        const band = Math.sin(v * 12 + n1) * 0.15;
        const base = 0.55 + n2 * 0.1 + band;
        r = base * 120; g = base * 200; b = base * 230;
      } else if (name === 'Neptune') {
        const band = Math.sin(v * 15 + n1 * 1.5) * 0.2;
        const storm = n3 > 0.75 ? 0.2 : 0;
        const base = 0.4 + band + storm;
        r = base * 70; g = base * 100; b = base * 240;
      } else if (name === 'Pluto') {
        const base = 0.4 + n1 * 0.3;
        const heart = (Math.abs(v - 0.45) < 0.15 && Math.abs(u - 0.5) < 0.12) ? 0.2 : 0;
        r = (base + heart) * 210; g = (base + heart) * 190; b = (base + heart) * 170;
      } else {
        // Generic moon texture
        const base = 0.35 + n1 * 0.25;
        const crater = n3 > 0.68 ? -0.12 : 0;
        const mare = n2 < 0.35 ? -0.08 : 0;
        const val = Math.max(0.1, base + crater + mare);
        r = val * 200; g = val * 195; b = val * 190;
      }

      const idx = (py * w + px) * 4;
      d[idx] = Math.max(0, Math.min(255, r));
      d[idx + 1] = Math.max(0, Math.min(255, g));
      d[idx + 2] = Math.max(0, Math.min(255, b));
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Special textures for specific moons
export function generateMoonTexture(name, w, h, color) {
  if (name === 'Io') return generateIoTexture(w, h);
  if (name === 'Europa') return generateEuropaTexture(w, h);
  return generatePlanetTexture(name, w, h); // fallback to generic
}

function generateIoTexture(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const id = ctx.createImageData(w, h);
  const d = id.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const u = px / w, v = py / h;
      const lat = (v - 0.5) * Math.PI, lon = u * Math.PI * 2;
      const nx = Math.cos(lat) * Math.cos(lon), nz = Math.cos(lat) * Math.sin(lon);
      const n1 = fbm(nx * 4, nz * 4, 5);
      const n2 = fbm(nx * 8 + 5, nz * 8 + 5, 4);
      const volcanic = n2 > 0.7 ? 0.4 : 0;
      const base = 0.5 + n1 * 0.3;
      const r = Math.min(255, (base + volcanic) * 240);
      const g = Math.min(255, (base + volcanic * 0.3) * 200);
      const b = Math.min(255, base * 50);
      const idx = (py * w + px) * 4;
      d[idx] = r; d[idx+1] = g; d[idx+2] = b; d[idx+3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function generateEuropaTexture(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const id = ctx.createImageData(w, h);
  const d = id.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const u = px / w, v = py / h;
      const lat = (v - 0.5) * Math.PI, lon = u * Math.PI * 2;
      const nx = Math.cos(lat) * Math.cos(lon), ny = Math.sin(lat), nz = Math.cos(lat) * Math.sin(lon);
      const n1 = fbm(nx * 3, nz * 3, 5);
      const cracks = Math.abs(Math.sin(nx * 15 + n1 * 3)) < 0.05 || Math.abs(Math.sin(nz * 12 + n1 * 2)) < 0.04;
      const base = 0.75 + n1 * 0.15;
      const r = cracks ? 140 : base * 210;
      const g = cracks ? 100 : base * 215;
      const b = cracks ? 80 : base * 230;
      const idx = (py * w + px) * 4;
      d[idx] = r; d[idx+1] = g; d[idx+2] = b; d[idx+3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function generateBumpMap(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const id = ctx.createImageData(w, h);
  const d = id.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const u = px / w, v = py / h;
      const lat = (v - 0.5) * Math.PI, lon = u * Math.PI * 2;
      const nx = Math.cos(lat) * Math.cos(lon), nz = Math.cos(lat) * Math.sin(lon);
      const val = fbm(nx * 6, nz * 6, 5) * 255;
      const idx = (py * w + px) * 4;
      d[idx] = d[idx+1] = d[idx+2] = val; d[idx+3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return new THREE.CanvasTexture(c);
}

export function createSunTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, '#FFF8E0'); g.addColorStop(0.3, '#FFDD44');
  g.addColorStop(0.6, '#FFAA22'); g.addColorStop(1, '#DD6600');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, r = Math.random() * 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${200 + Math.random()*55}, ${150 + Math.random()*80}, ${Math.random()*60}, ${0.1 + Math.random()*0.15})`;
    ctx.fill();
  }
  for (let i = 0; i < 8; i++) {
    const x = 128 + Math.random() * 256, y = 128 + Math.random() * 256;
    ctx.beginPath(); ctx.arc(x, y, 5 + Math.random() * 15, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120, 60, 0, ${0.3 + Math.random()*0.3})`;
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGlowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255, 240, 200, 0.6)');
  g.addColorStop(0.3, 'rgba(255, 200, 80, 0.3)');
  g.addColorStop(0.7, 'rgba(255, 150, 30, 0.08)');
  g.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function createPlanetGlowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.2)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.05)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function createRingTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 64;
  const ctx = c.getContext('2d');
  for (let x = 0; x < 1024; x++) {
    const t = x / 1024;
    const cassini = (t > 0.44 && t < 0.48) ? 0 : 1;
    const encke = (t > 0.72 && t < 0.735) ? 0.3 : 1;
    const density = (Math.sin(t * 80) * 0.2 + 0.6) * (Math.sin(t * 30) * 0.15 + 0.7);
    const alpha = density * cassini * encke * (1 - Math.pow(Math.abs(t - 0.5) * 2, 3)) * 0.85;
    const r = 200 + Math.sin(t * 45) * 35 + Math.sin(t * 120) * 15;
    const g = 185 + Math.sin(t * 35) * 30 + Math.sin(t * 90) * 10;
    const b = 150 + Math.sin(t * 55) * 25;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha)})`;
    ctx.fillRect(x, 0, 1, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.rotation = Math.PI / 2;
  return tex;
}

export function createTextSprite(text, color) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 56px Segoe UI, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const metrics = ctx.measureText(text);
  const pw = metrics.width + 40, ph = 70;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect((256 - pw) / 2, (64 - ph) / 2, pw, ph, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = 6;
  ctx.strokeText(text, 256, 64);
  const hex = '#' + color.toString(16).padStart(6, '0');
  ctx.fillStyle = hex;
  ctx.globalAlpha = 1.0;
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(18, 4.5, 1);
  return sprite;
}
