import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BODIES } from './data.js';
import {
  generatePlanetTexture, generateMoonTexture, generateBumpMap,
  createSunTexture, createGlowTexture, createPlanetGlowTexture,
  createRingTexture, createTextSprite
} from './textures.js';
import { TrackingManager } from './tracking.js';
import { createSpacecraftModel } from './spacecraft.js';
import { createCometVisual, updateCometTail, createAsteroidVisual, createNEOVisual, createMeteorShowerMarker } from './smallbodies.js';
import { SPACECRAFT_CATALOG, COMET_CATALOG, ASTEROID_CATALOG, METEOR_SHOWER_DATA } from './trackingdata.js';

// ============== RENDERER ==============
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ============== SCENE ==============
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(80, 60, 120);

// ============== CONTROLS ==============
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2;
controls.maxDistance = 800;
controls.zoomSpeed = 1.2;

// ============== CURSOR-CENTERED ZOOM ==============
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const zoomPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

canvas.addEventListener('wheel', (e) => {
  if (currentView !== 'solar') return;
  const mx = (e.clientX / innerWidth) * 2 - 1;
  const my = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);
  const target3D = new THREE.Vector3();
  raycaster.ray.intersectPlane(zoomPlane, target3D);
  if (target3D) {
    const shiftAmount = e.deltaY > 0 ? -0.06 : 0.06;
    controls.target.lerp(target3D, Math.abs(shiftAmount));
  }
}, { passive: true });

// ============== LIGHTING ==============
const sunLight = new THREE.PointLight(0xFFF5E0, 3.0, 1000, 0.4);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x223344, 0.35));
const fillLight = new THREE.DirectionalLight(0x4466AA, 0.4);
fillLight.position.set(-50, 30, -80);
scene.add(fillLight);

// ============== POST-PROCESSING ==============
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.4, 0.85
);
composer.addPass(bloomPass);

// ============== STATE ==============
const clock = new THREE.Clock();
let speedMultiplier = 0; // set from slider during init
let paused = false;
let savedSpeed = 0;
let liveMode = false;
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0); // J2000 epoch in ms
const DEG2RAD = Math.PI / 180;
let alwaysShowInfo = false;
const hoverTargets = [];
const pivots = [];
const meshes = [];
const allMoonPivots = [];
const planetOrbitLines = []; // track for toggling
const moonOrbitLines = [];   // track for toggling
const planetOrbitLabels = [];
let currentView = 'solar';
let surfaceScene = null, surfaceCamera = null, surfaceControls = null, surfaceAnimData = null;
let surfaceComposer = null;
let selectedBody = null;
const planetGlowTex = createPlanetGlowTexture();
const glowTex = createGlowTexture();

// ============== TRACKING STATE ==============
const trackingManager = new TrackingManager();
const spacecraftGroups = [];   // {group, id, catalogEntry, label}
const cometGroups = [];        // {group, id, catalogEntry, label, orbitLine}
const asteroidGroups = [];     // {group, id, catalogEntry, label, orbitLine}
const neoGroups = [];          // {group, id, data, label}
const meteorGroups = [];       // {group, data, label}
let flyToTarget = null;        // Vector3 for smooth camera target fly-to
let flyToCamTarget = null;     // Vector3 for smooth camera position fly-to
const spacecraftListEl = document.getElementById('spacecraft-list');
let zoomedSpacecraft = null;
let preZoomCameraPos = null;
let preZoomTarget = null;
let flyToStartPos = null;

// ============== STARFIELD ==============
{
  const count = 15000;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const starColors = [[1,1,1],[1,0.95,0.8],[0.8,0.85,1],[1,0.8,0.6],[0.7,0.8,1]];
  for (let i = 0; i < count; i++) {
    const r = 500 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    const sc = starColors[Math.floor(Math.random() * starColors.length)];
    const bright = 0.5 + Math.random() * 0.5;
    colors[i*3] = sc[0]*bright; colors[i*3+1] = sc[1]*bright; colors[i*3+2] = sc[2]*bright;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ vertexColors: true, size: 1.2, sizeAttenuation: true })));
}

// ============== HELPERS ==============
function addGlow(mesh, color, size) {
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: planetGlowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
  }));
  glow.scale.setScalar(size);
  glow.raycast = () => {};
  mesh.add(glow);
}

function createOrbitLine(radius, color) {
  const geo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }));
}

function createOrbitHit(radius, bodyData) {
  const hit = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 1.2, 8, 128),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.rotation.x = Math.PI / 2;
  hit.userData.bodyData = bodyData;
  return hit;
}

// ============== SUN ==============
let sunGlow;
{
  const sunBody = BODIES[0];
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(sunBody.radius, 64, 64),
    new THREE.MeshBasicMaterial({ map: createSunTexture() })
  );
  mesh.userData.bodyData = sunBody;
  scene.add(mesh);
  meshes.push({ mesh, body: sunBody, pivot: null });
  hoverTargets.push(mesh);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
  }));
  sprite.scale.setScalar(28);
  sprite.raycast = () => {};
  mesh.add(sprite);
  sunGlow = sprite;

  const corona = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xFFAA44, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.3, depthWrite: false
  }));
  corona.scale.setScalar(45);
  corona.raycast = () => {};
  mesh.add(corona);
}

// ============== PLANETS + MOONS ==============
// Store planet bodies for "always show info" feature
const planetBodies = [];

for (let i = 1; i < BODIES.length; i++) {
  const body = BODIES[i];
  planetBodies.push(body);

  const texSize = body.radius > 2 ? 1024 : 512;
  const map = generatePlanetTexture(body.name, texSize, texSize / 2);
  const bumpMap = generateBumpMap(texSize / 2, texSize / 4);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(body.radius, 48, 48),
    new THREE.MeshStandardMaterial({
      map, bumpMap, bumpScale: 0.3,
      roughness: body.name === 'Earth' ? 0.5 : 0.8,
      metalness: 0.05, emissive: body.color, emissiveIntensity: 0.08
    })
  );
  mesh.userData.bodyData = body;
  addGlow(mesh, body.color, body.radius * 4);

  const pivot = new THREE.Group();
  // moonAnchor sits at the planet's position but doesn't self-rotate
  // so moons orbit the planet without being dragged by planet spin
  const moonAnchor = new THREE.Group();
  moonAnchor.position.x = body.orbitalRadius;
  mesh.position.x = body.orbitalRadius;
  pivot.add(mesh);
  pivot.add(moonAnchor);
  scene.add(pivot);
  pivots.push({ pivot, body });
  meshes.push({ mesh, body, pivot, moonAnchor });

  // Enlarged hit area for all planets (minimum radius 2 units for easy clicking)
  const hitRadius = Math.max(2, body.radius * 2);
  const hitMesh = new THREE.Mesh(
    new THREE.SphereGeometry(hitRadius, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.userData.bodyData = body;
  hitMesh.position.copy(mesh.position);
  pivot.add(hitMesh);
  hoverTargets.push(hitMesh);

  // Earth atmosphere
  if (body.name === 'Earth') {
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(0x4488FF) } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float rim = 1.0 - max(0.0, dot(vNormal, vViewDir));
          float intensity = pow(rim, 3.0) * 1.2;
          gl_FragColor = vec4(glowColor, intensity);
        }
      `,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    });
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(body.radius * 1.12, 48, 48), atmoMat);
    atmo.raycast = () => {};
    mesh.add(atmo);
  }

  // Saturn rings
  if (body.hasRings) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4.8, 9, 128),
      new THREE.MeshBasicMaterial({ map: createRingTexture(), side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false })
    );
    ring.rotation.x = -Math.PI * 0.47;
    ring.material.polygonOffset = true;
    ring.material.polygonOffsetFactor = 1;
    mesh.add(ring);
  }

  // Axial tilt
  if (body.axialTilt) {
    mesh.rotation.z = THREE.MathUtils.degToRad(body.axialTilt);
  }

  // Orbital path (tracked for toggling)
  const orbitLine = createOrbitLine(body.orbitalRadius, body.color);
  scene.add(orbitLine);
  planetOrbitLines.push(orbitLine);

  const orbitHit = createOrbitHit(body.orbitalRadius, body);
  scene.add(orbitHit);
  hoverTargets.push(orbitHit);

  const label = createTextSprite(body.name, body.color);
  label.position.set(0, 1, -body.orbitalRadius);
  label.userData.bodyData = body;
  scene.add(label);
  hoverTargets.push(label);
  planetOrbitLabels.push(label);

  // ---- MOONS ----
  if (body.moons && body.moons.length > 0) {
    body.moons.forEach(moonData => {
      const mTexSize = 256;
      const mMap = generateMoonTexture(moonData.name, mTexSize, mTexSize / 2, moonData.color);
      const mBump = generateBumpMap(mTexSize / 2, mTexSize / 4);

      const moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(moonData.radius, 24, 24),
        new THREE.MeshStandardMaterial({
          map: mMap, bumpMap: mBump, bumpScale: 0.2,
          roughness: 0.9, metalness: 0.0,
          emissive: moonData.color, emissiveIntensity: 0.1
        })
      );
      moonMesh.userData.bodyData = moonData;
      addGlow(moonMesh, moonData.color, moonData.radius * 5);

      const moonPivot = new THREE.Group();
      moonMesh.position.x = moonData.orbitalRadius;
      moonPivot.add(moonMesh);
      moonAnchor.add(moonPivot); // attach to non-rotating anchor, not planet mesh

      // Enlarged hit area for moons (minimum 1 unit for easy clicking)
      const moonHitRadius = Math.max(1, moonData.radius * 3);
      const moonHit = new THREE.Mesh(
        new THREE.SphereGeometry(moonHitRadius, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      moonHit.userData.bodyData = moonData;
      moonHit.position.copy(moonMesh.position);
      moonPivot.add(moonHit);

      allMoonPivots.push({ pivot: moonPivot, data: moonData });
      hoverTargets.push(moonHit);

      // Moon orbit line (tracked for toggling)
      const moonOrbitGeo = new THREE.BufferGeometry();
      const moonOrbitPts = [];
      for (let j = 0; j <= 64; j++) {
        const a = (j / 64) * Math.PI * 2;
        moonOrbitPts.push(Math.cos(a) * moonData.orbitalRadius, 0, Math.sin(a) * moonData.orbitalRadius);
      }
      moonOrbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(moonOrbitPts, 3));
      const moonLine = new THREE.LineLoop(moonOrbitGeo, new THREE.LineBasicMaterial({
        color: moonData.color, transparent: true, opacity: 0.4
      }));
      moonAnchor.add(moonLine); // attach to non-rotating anchor
      moonOrbitLines.push(moonLine);
    });
  }
}

// ============== ASTEROID BELT ==============
{
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(2500 * 3);
  for (let i = 0; i < 2500; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 80 + Math.random() * 15;
    positions[i*3] = Math.cos(angle) * r;
    positions[i*3+1] = (Math.random() - 0.5) * 4;
    positions[i*3+2] = Math.sin(angle) * r;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x888888, size: 0.3 })));
}

// ============== LIVE TRACKING ==============
const trackingDot = document.getElementById('tracking-dot');
const trackingLabel = document.getElementById('tracking-label');

trackingManager.onStatusChange = (status) => {
  trackingDot.className = status;
  const labels = { idle: 'Tracking: idle', loading: 'Tracking: loading...', ready: 'Tracking: live', partial: 'Tracking: partial', error: 'Tracking: offline', fallback: 'Tracking: fallback' };
  trackingLabel.textContent = labels[status] || 'Tracking: ' + status;
};

function initTracking() {
  trackingManager.fetchAll().then(() => {
    // Create spacecraft visuals
    SPACECRAFT_CATALOG.forEach(entry => {
      const isOnSurface = !!entry.parentBody;
      let pos = trackingManager.getPosition(entry.id);

      // For surface spacecraft, position at origin (will be child of planet)
      if (isOnSurface) {
        pos = { sx: 0, sy: 0, sz: 0 };
      }
      if (!pos) return;

      // Scale spacecraft based on distance so they're always visible
      const dist = isOnSurface ? meshes.find(m => m.body.name === entry.parentBody).body.orbitalRadius
        : Math.sqrt(pos.sx * pos.sx + pos.sy * pos.sy + pos.sz * pos.sz);
      // JWST gets moon-sized scale; others scale with distance
      const isJWST = entry.id === '-170';
      const scaleMultiplier = isJWST ? 0.7 : Math.max(3, dist * 0.04);

      const model = createSpacecraftModel(entry.modelType);
      const group = new THREE.Group();
      group.add(model);
      model.scale.multiplyScalar(scaleMultiplier);

      // Glow sprite - JWST gets subtle glow, others scale with distance
      const glowSize = isJWST ? 1.5 : Math.max(6, dist * 0.06);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: planetGlowTex, color: entry.color,
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
      }));
      glow.scale.setScalar(glowSize);
      glow.raycast = () => {};
      glow.name = 'glow';
      group.add(glow);

      // Label - position above based on scale, clickable
      const label = createTextSprite(entry.name, entry.color);
      label.position.y = isJWST ? 1.5 : scaleMultiplier * 1.2;
      if (isJWST) label.scale.set(10, 2.5, 1);
      label.userData.bodyData = entry;
      group.add(label);
      hoverTargets.push(label);

      // Invisible hit sphere for easy clicking - scale with distance
      const hitRadius = isJWST ? 1.2 : Math.max(3, dist * 0.03);
      const hitSphere = new THREE.Mesh(
        new THREE.SphereGeometry(hitRadius, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitSphere.userData.bodyData = entry;
      group.add(hitSphere);

      group.userData.bodyData = entry;

      if (isOnSurface) {
        // Attach to planet's moonAnchor so it follows automatically
        const parentEntry = meshes.find(m => m.body.name === entry.parentBody);
        if (parentEntry && parentEntry.moonAnchor) {
          group.position.set(0, 0, 0); // at planet center
          parentEntry.moonAnchor.add(group);
        } else {
          group.position.set(pos.sx, pos.sy, pos.sz);
          scene.add(group);
        }
      } else {
        group.position.set(pos.sx, pos.sy, pos.sz);
        scene.add(group);
      }

      hoverTargets.push(hitSphere);
      spacecraftGroups.push({ group, id: entry.id, catalogEntry: entry, label });
    });

    // Create comet visuals
    COMET_CATALOG.forEach(entry => {
      const pos = trackingManager.getPosition(entry.id);
      const group = createCometVisual(entry.color);

      if (pos) {
        group.position.set(pos.sx, pos.sy, pos.sz);
        updateCometTail(group, pos);
      }

      // Label - clickable
      const label = createTextSprite(entry.name, entry.color);
      label.position.y = 2;
      label.userData.bodyData = entry;
      group.add(label);
      hoverTargets.push(label);

      group.userData.bodyData = entry;
      const nucleus = group.getObjectByName('nucleus');
      if (nucleus) {
        nucleus.userData.bodyData = entry;
        hoverTargets.push(nucleus);
      }
      scene.add(group);

      // Draw orbit path
      let orbitLine = null;
      const orbitPts = trackingManager.computeOrbitPath(entry);
      if (orbitPts) {
        const orbitGeo = new THREE.BufferGeometry();
        orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPts, 3));
        orbitLine = new THREE.LineLoop(orbitGeo, new THREE.LineDashedMaterial({
          color: entry.color, transparent: true, opacity: 0.35,
          dashSize: 2, gapSize: 1
        }));
        orbitLine.computeLineDistances();
        scene.add(orbitLine);
      }

      cometGroups.push({ group, id: entry.id, catalogEntry: entry, label, orbitLine });
    });

    // Create asteroid visuals
    ASTEROID_CATALOG.forEach(entry => {
      const pos = trackingManager.getPosition(entry.id);
      const group = createAsteroidVisual(entry.color, 0.6);

      if (pos) {
        group.position.set(pos.sx, pos.sy, pos.sz);
      }

      // Label - clickable
      const label = createTextSprite(entry.name, entry.color);
      label.position.y = 1.5;
      label.userData.bodyData = entry;
      group.add(label);
      hoverTargets.push(label);

      group.userData.bodyData = entry;
      group.children[0].userData.bodyData = entry;
      hoverTargets.push(group.children[0]);
      scene.add(group);

      // Draw orbit path
      let orbitLine = null;
      const orbitPts = trackingManager.computeOrbitPath(entry);
      if (orbitPts) {
        const orbitGeo = new THREE.BufferGeometry();
        orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPts, 3));
        orbitLine = new THREE.LineLoop(orbitGeo, new THREE.LineDashedMaterial({
          color: entry.color, transparent: true, opacity: 0.25,
          dashSize: 1.5, gapSize: 1
        }));
        orbitLine.computeLineDistances();
        scene.add(orbitLine);
      }

      asteroidGroups.push({ group, id: entry.id, catalogEntry: entry, label, orbitLine });
    });

    // Create NEO visuals (initially hidden, toggle defaults to off)
    trackingManager.neoData.forEach(neoEntry => {
      const group = createNEOVisual(neoEntry.color, neoEntry.isHazardous);

      // Position NEOs near Earth based on miss distance
      // Find Earth's current position in the scene
      const earthPivot = pivots.find(p => p.body.name === 'Earth');
      if (earthPivot) {
        const earthAngle = earthPivot.pivot.rotation.y;
        const earthR = 50; // Earth orbital radius
        const missR = neoEntry.missDistance * 50; // Convert AU to scene units
        const neoAngle = earthAngle + (Math.random() - 0.5) * 0.5;
        group.position.set(
          Math.sin(neoAngle) * (earthR + missR * 0.5),
          (Math.random() - 0.5) * 2,
          Math.cos(neoAngle) * (earthR + missR * 0.5)
        );
      }

      // Label - clickable
      const label = createTextSprite(neoEntry.name.replace(/[()]/g, ''), neoEntry.color);
      label.position.y = 1;
      label.userData.bodyData = neoEntry;
      group.add(label);
      hoverTargets.push(label);

      group.userData.bodyData = neoEntry;
      group.children[0].userData.bodyData = neoEntry;
      hoverTargets.push(group.children[0]);
      group.visible = false; // Default off
      scene.add(group);

      neoGroups.push({ group, id: neoEntry.id, data: neoEntry, label });
    });

    // Create meteor shower markers (initially hidden)
    METEOR_SHOWER_DATA.forEach(shower => {
      const group = createMeteorShowerMarker(shower.color);

      // Position at a point on the ecliptic using RA as angle
      const angle = (shower.radiantRA / 360) * Math.PI * 2;
      const r = 55 + Math.random() * 30; // Between Earth and Mars orbits
      group.position.set(
        Math.sin(angle) * r,
        (Math.random() - 0.5) * 3,
        Math.cos(angle) * r
      );

      const bodyData = {
        name: shower.name, color: shower.color,
        info: { ...shower.info, 'Parent Body': shower.parent },
        funFact: `The ${shower.name} meteor shower produces up to ${shower.ZHR} meteors per hour at its peak around ${shower.peak}.`
      };

      // Label - clickable
      const label = createTextSprite(shower.name, shower.color);
      label.position.y = 1.2;
      label.userData.bodyData = bodyData;
      group.add(label);
      hoverTargets.push(label);

      group.userData.bodyData = bodyData;
      group.children[0].userData.bodyData = bodyData;
      hoverTargets.push(group.children[0]);
      group.visible = false; // Default off
      scene.add(group);

      meteorGroups.push({ group, data: shower, label });
    });

    console.log('Tracking initialized:', spacecraftGroups.length, 'spacecraft,', cometGroups.length, 'comets,', asteroidGroups.length, 'asteroids,', neoGroups.length, 'NEOs');
    // Rebuild spacecraft list now that data is loaded
    if (document.getElementById('toggle-spacecraft').classList.contains('on')) showSpacecraftList();
  }).catch(err => {
    console.error('Tracking initialization failed:', err);
  });
}

// Start tracking
initTracking();

// ============== RAYCASTING & UI ==============
const infoPanel = document.getElementById('info-panel');
let frameCount = 0;

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
});

function checkHover() {
  if (currentView !== 'solar') return;
  frameCount++;
  if (frameCount % 3 !== 0) return;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(hoverTargets);
  canvas.style.cursor = hits.length > 0 ? 'pointer' : 'default';
}

window.addEventListener('click', e => {
  if (currentView !== 'solar') return;
  if (infoPanel.contains(e.target)) return;
  if (document.getElementById('control-panel').contains(e.target)) return;
  if (spacecraftListEl.contains(e.target)) return;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(hoverTargets);
  if (hits.length > 0) {
    const body = hits[0].object.userData.bodyData;
    if (body) {
      selectedBody = body;
      showInfoPanel(body);

      // Fly-to for tracked objects
      if (body.type && ['spacecraft', 'comet', 'asteroid', 'neo'].includes(body.type)) {
        const worldPos = new THREE.Vector3();
        hits[0].object.getWorldPosition(worldPos);
        flyToTarget = worldPos;
      }
    }
  } else {
    // Clicked empty space
    if (zoomedSpacecraft) {
      zoomOutFromSpacecraft();
    } else if (!alwaysShowInfo) {
      selectedBody = null;
      hideInfoPanel();
    }
  }
});

function showInfoPanel(body) {
  let html = `<button class="close-btn" id="close-panel-btn">&times;</button>`;
  html += `<h2 style="color: #${body.color.toString(16).padStart(6, '0')}">${body.name}</h2><div class="info-grid">`;
  for (const [k, v] of Object.entries(body.info)) {
    html += `<span class="info-label">${k}</span><span class="info-value">${v}</span>`;
  }
  html += '</div>';
  if (body.funFact) html += `<div class="fun-fact">\uD83D\uDCA1 ${body.funFact}</div>`;
  if (body.surface) {
    html += `<button class="explore-btn" id="explore-btn">\uD83D\uDE80 Explore ${body.name}</button>`;
  }
  infoPanel.innerHTML = html;
  infoPanel.classList.add('visible');

  document.getElementById('close-panel-btn').addEventListener('click', () => {
    if (!alwaysShowInfo) hideInfoPanel();
    else infoPanel.classList.remove('visible');
  });
  const exploreBtn = document.getElementById('explore-btn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => { hideInfoPanel(); enterSurfaceView(body); });
  }
}

function hideInfoPanel() { infoPanel.classList.remove('visible'); infoPanel.classList.remove('always-visible'); selectedBody = null; }

// "Always show info" cycling through planets
let alwaysInfoIndex = 0;
let alwaysInfoInterval = null;

function startAlwaysInfo() {
  alwaysShowInfo = true;
  alwaysInfoIndex = 0;
  showAlwaysInfoForPlanet();
  alwaysInfoInterval = setInterval(() => {
    alwaysInfoIndex = (alwaysInfoIndex + 1) % planetBodies.length;
    showAlwaysInfoForPlanet();
  }, 5000);
}

function showAlwaysInfoForPlanet() {
  const body = planetBodies[alwaysInfoIndex];
  selectedBody = body;
  let html = `<h2 style="color: #${body.color.toString(16).padStart(6, '0')}">${body.name}</h2><div class="info-grid">`;
  for (const [k, v] of Object.entries(body.info)) {
    html += `<span class="info-label">${k}</span><span class="info-value">${v}</span>`;
  }
  html += '</div>';
  if (body.funFact) html += `<div class="fun-fact">\uD83D\uDCA1 ${body.funFact}</div>`;
  if (body.surface) {
    html += `<button class="explore-btn" id="explore-btn">\uD83D\uDE80 Explore ${body.name}</button>`;
  }
  infoPanel.innerHTML = html;
  infoPanel.classList.add('visible');
  infoPanel.classList.add('always-visible');

  const exploreBtn = document.getElementById('explore-btn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
      stopAlwaysInfo();
      document.getElementById('toggle-always-info').classList.remove('on');
      enterSurfaceView(body);
    });
  }
}

function stopAlwaysInfo() {
  alwaysShowInfo = false;
  if (alwaysInfoInterval) { clearInterval(alwaysInfoInterval); alwaysInfoInterval = null; }
  hideInfoPanel();
}

// ============== CONTROL PANEL WIRING ==============
// Toggle collapse
document.getElementById('panel-toggle').addEventListener('click', () => {
  document.getElementById('control-panel').classList.toggle('collapsed');
});

// Speed slider
// Earth orbitalSpeed=1.0, full orbit = 2π/speedMultiplier seconds in real time.
// Real Earth year = 365.25 days = 31,557,600 seconds.
// So time compression = 31557600 / (2π / speedMultiplier) = 31557600 * speedMultiplier / 2π
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const speedSub = document.getElementById('speed-sub');

// Slider maps 0-200 to a speed range.
// At 0: realtime (1×) = speedMultiplier of 2π/31557600 ≈ 0.0000002
// At 200: max speed = speedMultiplier of 0.2
// We use exponential mapping so the low end covers a wide range of realistic speeds.
const REALTIME_MULT = (2 * Math.PI) / 31557600; // ~0.0000002
const MAX_MULT = 0.2;

function sliderToSpeed(val) {
  // Exponential: 0 → realtime, 200 → max
  const t = val / 200;
  return REALTIME_MULT * Math.pow(MAX_MULT / REALTIME_MULT, t);
}

function speedToSlider(mult) {
  if (mult <= REALTIME_MULT) return 0;
  const t = Math.log(mult / REALTIME_MULT) / Math.log(MAX_MULT / REALTIME_MULT);
  return Math.round(t * 200);
}

function formatSpeed(mult) {
  if (paused) return { main: 'Paused', sub: '' };
  if (liveMode) return { main: 'LIVE', sub: 'Real positions right now' };
  const realFactor = mult / REALTIME_MULT;
  if (realFactor <= 1.01) return { main: '1\u00d7 realtime', sub: '1 yr = 365.25 days' };

  const orbitSec = (2 * Math.PI) / mult;
  let yrLabel;
  if (orbitSec < 60) yrLabel = `1 yr = ${orbitSec.toFixed(1)}s`;
  else if (orbitSec < 3600) yrLabel = `1 yr = ${(orbitSec / 60).toFixed(1)} min`;
  else if (orbitSec < 86400) yrLabel = `1 yr = ${(orbitSec / 3600).toFixed(1)} hr`;
  else yrLabel = `1 yr = ${(orbitSec / 86400).toFixed(1)} days`;

  let mainLabel;
  if (realFactor >= 1e9) mainLabel = (realFactor / 1e9).toFixed(1) + 'B\u00d7';
  else if (realFactor >= 1e6) mainLabel = (realFactor / 1e6).toFixed(1) + 'M\u00d7';
  else if (realFactor >= 1e3) mainLabel = (realFactor / 1e3).toFixed(0) + 'K\u00d7';
  else mainLabel = realFactor.toFixed(0) + '\u00d7';
  return { main: mainLabel + ' realtime', sub: yrLabel };
}

function updateSpeedDisplay() {
  const { main, sub } = formatSpeed(speedMultiplier);
  speedVal.textContent = main;
  speedSub.textContent = sub;
}

// Set initial speed from slider default
speedMultiplier = sliderToSpeed(parseInt(speedSlider.value));
savedSpeed = speedMultiplier;
updateSpeedDisplay();

speedSlider.addEventListener('input', e => {
  speedMultiplier = sliderToSpeed(parseInt(e.target.value));
  savedSpeed = speedMultiplier;
  updateSpeedDisplay();
  if (paused && speedMultiplier > 0) {
    paused = false;
    document.getElementById('stop-btn').textContent = 'Pause';
    document.getElementById('stop-btn').classList.remove('active');
  }
});

// Stop/pause
document.getElementById('stop-btn').addEventListener('click', () => {
  paused = !paused;
  const btn = document.getElementById('stop-btn');
  if (paused) {
    savedSpeed = speedMultiplier;
    speedMultiplier = 0;
    btn.textContent = 'Resume';
    btn.classList.add('active');
  } else {
    speedMultiplier = savedSpeed || sliderToSpeed(50);
    btn.textContent = 'Pause';
    btn.classList.remove('active');
    speedSlider.value = speedToSlider(speedMultiplier);
    updateSpeedDisplay();
  }
});

// Reset view
document.getElementById('reset-view-btn').addEventListener('click', () => {
  if (zoomedSpacecraft) zoomOutFromSpacecraft();
  hideInfoPanel();
  flyToTarget = new THREE.Vector3(0, 0, 0);
  flyToCamTarget = new THREE.Vector3(80, 60, 120);
  controls.target.set(0, 0, 0);
});

// Toggle planet orbits
document.getElementById('toggle-planet-orbits').addEventListener('click', function() {
  this.classList.toggle('on');
  const visible = this.classList.contains('on');
  planetOrbitLines.forEach(l => { l.visible = visible; });
  planetOrbitLabels.forEach(l => { l.visible = visible; });
});

// Toggle moon orbits
document.getElementById('toggle-moon-orbits').addEventListener('click', function() {
  this.classList.toggle('on');
  const visible = this.classList.contains('on');
  moonOrbitLines.forEach(l => { l.visible = visible; });
});

// Toggle always show info
document.getElementById('toggle-always-info').addEventListener('click', function() {
  this.classList.toggle('on');
  if (this.classList.contains('on')) {
    startAlwaysInfo();
  } else {
    stopAlwaysInfo();
  }
});

// ============== LIVE MODE ==============
function getLiveAngle(orbital) {
  const daysSinceJ2000 = (Date.now() - J2000_MS) / 86400000;
  const L = orbital.L0 + (360 / orbital.periodDays) * daysSinceJ2000;
  return (L % 360) * DEG2RAD;
}

function enableLiveMode() {
  liveMode = true;
  savedSpeed = speedMultiplier;
  speedMultiplier = REALTIME_MULT;
  paused = false;

  // Immediately snap all positions to live
  pivots.forEach(({ pivot, body }) => {
    if (body.orbital) pivot.rotation.y = getLiveAngle(body.orbital);
  });
  allMoonPivots.forEach(({ pivot, data }) => {
    if (data.orbital) pivot.rotation.y = getLiveAngle(data.orbital);
  });

  // Disable speed controls
  speedSlider.disabled = true;
  speedSlider.style.opacity = '0.3';
  document.getElementById('stop-btn').disabled = true;
  document.getElementById('stop-btn').style.opacity = '0.3';

  // Live indicator + title
  document.getElementById('live-dot').classList.add('active');
  document.getElementById('live-status').classList.add('active');
  document.getElementById('live-status').textContent = 'LIVE \u2014 real positions right now';
  document.getElementById('title-overlay').textContent = 'Live';
  document.getElementById('title-overlay').classList.add('live');
  document.getElementById('live-banner').classList.add('visible');

  // Enable tracking controls
  document.getElementById('tracking-controls').classList.remove('disabled');
  document.getElementById('tracking-header').classList.remove('disabled');

  // Show tracked objects
  const scOn = document.getElementById('toggle-spacecraft').classList.contains('on');
  spacecraftGroups.forEach(s => { s.group.visible = scOn; });
  if (scOn) showSpacecraftList(); else hideSpacecraftList();
  cometGroups.forEach(c => { c.group.visible = document.getElementById('toggle-comets').classList.contains('on'); if (c.orbitLine) c.orbitLine.visible = c.group.visible; });
  asteroidGroups.forEach(a => { a.group.visible = document.getElementById('toggle-asteroids').classList.contains('on'); if (a.orbitLine) a.orbitLine.visible = a.group.visible; });

  updateSpeedDisplay();
}

function disableLiveMode() {
  liveMode = false;
  speedMultiplier = 300000 * REALTIME_MULT; // Default to 300K× realtime
  speedSlider.disabled = false;
  speedSlider.style.opacity = '1';
  speedSlider.value = speedToSlider(speedMultiplier);
  document.getElementById('stop-btn').disabled = false;
  document.getElementById('stop-btn').style.opacity = '1';

  // Live indicator off + title
  document.getElementById('live-dot').classList.remove('active');
  document.getElementById('live-status').classList.remove('active');
  document.getElementById('title-overlay').textContent = 'Interactive Solar System';
  document.getElementById('title-overlay').classList.remove('live');
  document.getElementById('live-banner').classList.remove('visible');

  // Disable tracking controls and hide all tracked objects
  document.getElementById('tracking-controls').classList.add('disabled');
  document.getElementById('tracking-header').classList.add('disabled');
  spacecraftGroups.forEach(s => { s.group.visible = false; });
  hideSpacecraftList();
  cometGroups.forEach(c => { c.group.visible = false; if (c.orbitLine) c.orbitLine.visible = false; });
  asteroidGroups.forEach(a => { a.group.visible = false; if (a.orbitLine) a.orbitLine.visible = false; });
  neoGroups.forEach(n => { n.group.visible = false; });
  meteorGroups.forEach(m => { m.group.visible = false; });

  // Reset simTime so normal mode continues from live positions
  const earthAngle = getLiveAngle(BODIES.find(b => b.name === 'Earth').orbital);
  simTime = earthAngle / 1.0;

  updateSpeedDisplay();
}

document.getElementById('toggle-live-mode').addEventListener('click', function() {
  this.classList.toggle('on');
  if (this.classList.contains('on')) enableLiveMode();
  else disableLiveMode();
});

// Default to live mode on startup
enableLiveMode();

// ============== SPACECRAFT LIST ==============
function buildSpacecraftList() {
  if (spacecraftGroups.length === 0) { spacecraftListEl.innerHTML = ''; return; }
  let html = '<div class="sc-header">Spacecraft</div>';
  spacecraftGroups.forEach((s, idx) => {
    const colorHex = '#' + s.catalogEntry.color.toString(16).padStart(6, '0');
    const distStr = s.catalogEntry.info['Distance from Earth'] || '—';
    html += `<div class="sc-item" data-sc-idx="${idx}">
      <div class="sc-dot" style="color:${colorHex}; background:${colorHex}"></div>
      <span class="sc-name">${s.catalogEntry.name}</span>
      <span class="sc-dist">${distStr}</span>
    </div>`;
  });
  spacecraftListEl.innerHTML = html;

  // Attach click handlers
  spacecraftListEl.querySelectorAll('.sc-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(item.dataset.scIdx);
      const sc = spacecraftGroups[idx];
      if (!sc) return;

      // Clear all highlights first
      spacecraftListEl.querySelectorAll('.sc-item').forEach(i => i.classList.remove('active'));

      if (zoomedSpacecraft === sc) {
        // Already zoomed in — zoom out
        zoomOutFromSpacecraft();
        return;
      }

      zoomToSpacecraft(sc);
      item.classList.add('active');
    });
  });
}

function zoomToSpacecraft(sc) {
  // Save current camera state
  if (!zoomedSpacecraft) {
    preZoomCameraPos = camera.position.clone();
    preZoomTarget = controls.target.clone();
  }
  zoomedSpacecraft = sc;

  // Get world position of spacecraft
  const worldPos = new THREE.Vector3();
  sc.group.getWorldPosition(worldPos);

  // Animate camera toward it
  const offset = new THREE.Vector3(5, 3, 5);
  const targetCamPos = worldPos.clone().add(offset);

  // Use smooth lerp via flyTo
  flyToTarget = worldPos.clone();
  flyToCamTarget = targetCamPos;

  // Show info panel
  showInfoPanel(sc.catalogEntry);
}

function zoomOutFromSpacecraft() {
  if (!preZoomCameraPos) return;
  zoomedSpacecraft = null;

  // Fly back to saved position
  flyToTarget = preZoomTarget.clone();
  flyToCamTarget = preZoomCameraPos.clone();

  spacecraftListEl.querySelectorAll('.sc-item').forEach(i => i.classList.remove('active'));
  hideInfoPanel();

  // Clear saved state after animation settles
  setTimeout(() => { preZoomCameraPos = null; preZoomTarget = null; }, 2000);
}

function showSpacecraftList() {
  buildSpacecraftList();
  spacecraftListEl.classList.add('visible');
}

function hideSpacecraftList() {
  spacecraftListEl.classList.remove('visible');
  if (zoomedSpacecraft) zoomOutFromSpacecraft();
}

// Toggle tracking layers
document.getElementById('toggle-spacecraft').addEventListener('click', function() {
  this.classList.toggle('on');
  const visible = this.classList.contains('on');
  spacecraftGroups.forEach(s => { s.group.visible = visible; });
  if (visible) showSpacecraftList();
  else hideSpacecraftList();
});
document.getElementById('toggle-comets').addEventListener('click', function() {
  this.classList.toggle('on');
  const visible = this.classList.contains('on');
  cometGroups.forEach(c => { c.group.visible = visible; if (c.orbitLine) c.orbitLine.visible = visible; });
});
document.getElementById('toggle-asteroids').addEventListener('click', function() {
  this.classList.toggle('on');
  const visible = this.classList.contains('on');
  asteroidGroups.forEach(a => { a.group.visible = visible; if (a.orbitLine) a.orbitLine.visible = visible; });
});
document.getElementById('toggle-neos').addEventListener('click', function() {
  this.classList.toggle('on');
  const visible = this.classList.contains('on');
  neoGroups.forEach(n => { n.group.visible = visible; });
});
document.getElementById('toggle-meteors').addEventListener('click', function() {
  this.classList.toggle('on');
  const visible = this.classList.contains('on');
  meteorGroups.forEach(m => { m.group.visible = visible; });
});

// ============== SURFACE VIEW ==============
function enterSurfaceView(body) {
  currentView = 'transitioning';
  hideInfoPanel();
  const fade = document.getElementById('fade-overlay');
  fade.classList.add('active');

  setTimeout(() => {
    buildSurfaceScene(body);
    currentView = 'surface';
    document.getElementById('back-btn').style.display = 'block';
    document.getElementById('surface-label').style.display = 'block';
    document.getElementById('surface-label').textContent = body.name;
    document.getElementById('surface-desc').style.display = 'block';
    document.getElementById('surface-desc').textContent = body.surface.desc;
    document.getElementById('controls-hint').style.display = 'none';
    document.getElementById('control-panel').style.display = 'none';
    setTimeout(() => fade.classList.remove('active'), 50);
  }, 600);
}

function exitSurfaceView() {
  const fade = document.getElementById('fade-overlay');
  fade.classList.add('active');
  setTimeout(() => {
    if (surfaceControls) surfaceControls.dispose();
    surfaceScene = null; surfaceCamera = null; surfaceControls = null; surfaceAnimData = null; surfaceComposer = null;
    currentView = 'solar';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('surface-label').style.display = 'none';
    document.getElementById('surface-desc').style.display = 'none';
    document.getElementById('controls-hint').style.display = 'block';
    document.getElementById('control-panel').style.display = 'flex';
    setTimeout(() => fade.classList.remove('active'), 50);
  }, 600);
}
document.getElementById('back-btn').addEventListener('click', exitSurfaceView);

function buildSurfaceScene(body) {
  const s = body.surface;
  surfaceScene = new THREE.Scene();
  surfaceCamera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);
  surfaceCamera.position.set(0, 3, 5);

  surfaceControls = new OrbitControls(surfaceCamera, canvas);
  surfaceControls.enableDamping = true;
  surfaceControls.dampingFactor = 0.1;
  surfaceControls.target.set(0, 2, -5);
  surfaceControls.maxPolarAngle = Math.PI * 0.85;
  surfaceControls.minDistance = 1;
  surfaceControls.maxDistance = 100;

  surfaceComposer = new EffectComposer(renderer);
  surfaceComposer.addPass(new RenderPass(surfaceScene, surfaceCamera));
  surfaceComposer.addPass(new UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight),
    body.type === 'star' ? 1.5 : 0.3, 0.4, 0.85
  ));

  // Sky dome
  surfaceScene.add(new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 32),
    new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(s.skyTop) },
        bottomColor: { value: new THREE.Color(s.skyBot) },
        offset: { value: 10 }, exponent: { value: 0.6 }
      },
      vertexShader: `varying vec3 vWorldPosition; void main() { vec4 wp = modelMatrix * vec4(position,1.0); vWorldPosition = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main() { float h = normalize(vWorldPosition + offset).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h,0.0), exponent),0.0)),1.0); }`,
      side: THREE.BackSide
    })
  ));

  // Ground with terrain displacement
  const groundGeo = new THREE.PlaneGeometry(400, 400, 200, 200);
  const posAttr = groundGeo.attributes.position;
  const isSolid = !['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Sun'].includes(body.name);
  if (isSolid) {
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i), y = posAttr.getY(i);
      // Multi-octave noise for natural terrain
      const h = Math.sin(x*0.03)*Math.cos(y*0.04)*3 +
                Math.sin(x*0.08+1.5)*Math.cos(y*0.06+0.7)*1.5 +
                Math.sin(x*0.2+3)*Math.cos(y*0.15+2)*0.6 +
                Math.sin(x*0.5+5)*Math.cos(y*0.4+3)*0.2;
      posAttr.setZ(i, h);
    }
    groundGeo.computeVertexNormals();
  }

  // Ground texture
  const groundTex = generateGroundTexture(body.name, s.groundColor);
  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTex, roughness: 0.95, metalness: 0.02
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  surfaceScene.add(ground);

  // Rocks and boulders for rocky bodies
  const rockyBodies = ['Mercury','Mars','Moon','Pluto','Phobos','Deimos','Callisto','Ganymede','Mimas','Oberon','Titania','Charon','Io','Europa','Enceladus'];
  if (rockyBodies.includes(body.name)) {
    for (let i = 0; i < 80; i++) {
      const size = 0.2 + Math.random() * 2;
      const detail = size > 1 ? 2 : 1;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(size, detail),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(s.groundColor).multiplyScalar(0.5 + Math.random() * 0.7),
          roughness: 0.95, metalness: 0.02
        })
      );
      const dist = 3 + Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      rock.position.set(Math.cos(angle) * dist, size * 0.15, Math.sin(angle) * dist);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.scale.set(1, 0.3 + Math.random() * 0.5, 0.7 + Math.random() * 0.5);
      surfaceScene.add(rock);
    }
  }

  // Lighting
  surfaceScene.add(new THREE.AmbientLight(s.skyTop, s.ambient * 0.7));
  if (body.type !== 'star') {
    const dirLight = new THREE.DirectionalLight(0xFFF5E0, s.ambient * 2);
    dirLight.position.set(50, 30, -20);
    surfaceScene.add(dirLight);
    // Soft fill from opposite side
    const fill = new THREE.DirectionalLight(s.skyTop, s.ambient * 0.3);
    fill.position.set(-30, 10, 30);
    surfaceScene.add(fill);
  } else {
    surfaceScene.add(new THREE.PointLight(0xFF8800, 3, 100));
  }

  if (s.fog) surfaceScene.fog = new THREE.FogExp2(s.fog, s.fogDensity);

  // Stars for airless bodies
  if (!s.fog || s.fogDensity < 0.015) {
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(4000 * 3);
    for (let i = 0; i < 4000; i++) {
      const r = 300, theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
      starPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = Math.abs(r * Math.sin(phi) * Math.sin(theta));
      starPos[i*3+2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    surfaceScene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xFFFFFF, size: 1.2 })));
  }

  // Sky objects
  if (body.name === 'Moon') {
    const earth = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 32), new THREE.MeshBasicMaterial({ map: generatePlanetTexture('Earth', 256, 128) }));
    earth.position.set(30, 60, -80); surfaceScene.add(earth);
    const eg = new THREE.Sprite(new THREE.SpriteMaterial({ map: createGlowTexture(), color: 0x4488FF, blending: THREE.AdditiveBlending, transparent: true }));
    eg.scale.setScalar(20); eg.raycast = () => {}; earth.add(eg);
  } else if (body.name === 'Mercury') {
    const sun = new THREE.Mesh(new THREE.SphereGeometry(25, 32, 32), new THREE.MeshBasicMaterial({ color: 0xFFF5DD }));
    sun.position.set(50, 40, -100); surfaceScene.add(sun);
    const sg = new THREE.Sprite(new THREE.SpriteMaterial({ map: createGlowTexture(), color: 0xFFDD88, blending: THREE.AdditiveBlending, transparent: true }));
    sg.scale.setScalar(60); sg.raycast = () => {}; sun.add(sg);
  } else if (['Mars','Pluto','Neptune'].includes(body.name)) {
    const sunSize = body.name === 'Pluto' ? 0.5 : body.name === 'Neptune' ? 0.8 : 2;
    const sun = new THREE.Mesh(new THREE.SphereGeometry(sunSize, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFFF8EE }));
    sun.position.set(40, 50, -150); surfaceScene.add(sun);
    const sg = new THREE.Sprite(new THREE.SpriteMaterial({ map: createGlowTexture(), color: 0xFFEECC, blending: THREE.AdditiveBlending, transparent: true }));
    sg.scale.setScalar(sunSize * 4); sg.raycast = () => {}; sun.add(sg);
  }
  if (body.name === 'Saturn') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(80, 200, 128),
      new THREE.MeshBasicMaterial({ map: createRingTexture(), side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
    );
    ring.position.set(0, 80, -50); ring.rotation.x = Math.PI / 3;
    surfaceScene.add(ring);
  }

  // Sun interior flares
  if (body.type === 'star') {
    for (let i = 0; i < 12; i++) {
      const flare = new THREE.Sprite(new THREE.SpriteMaterial({
        map: createGlowTexture(), color: 0xFF6600, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.3
      }));
      flare.position.set((Math.random()-0.5)*50, 3+Math.random()*25, (Math.random()-0.5)*50);
      flare.scale.setScalar(8 + Math.random() * 18);
      surfaceScene.add(flare);
    }
  }

  // Particles
  surfaceAnimData = { particles: null, time: 0, body, lightning: null };
  if (s.particles !== 'none' && s.particleCount > 0) {
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(s.particleCount * 3);
    const pVel = new Float32Array(s.particleCount * 3);
    for (let i = 0; i < s.particleCount; i++) {
      pPos[i*3] = (Math.random()-0.5)*80;
      pPos[i*3+1] = Math.random()*30+0.5;
      pPos[i*3+2] = (Math.random()-0.5)*80;
      pVel[i*3] = (Math.random()-0.5)*0.5;
      pVel[i*3+1] = (Math.random()-0.5)*0.2;
      pVel[i*3+2] = (Math.random()-0.5)*0.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    let pSize = 0.4, pOpacity = 0.6;
    if (s.particles === 'embers') { pSize = 0.8; pOpacity = 0.8; }
    if (s.particles === 'clouds') { pSize = 3.0; pOpacity = 0.3; }
    if (s.particles === 'turbulence') { pSize = 1.5; pOpacity = 0.4; }
    if (s.particles === 'storm') { pSize = 0.6; pOpacity = 0.5; }
    if (s.particles === 'ice') { pSize = 0.3; pOpacity = 0.7; }
    if (s.particles === 'frost') { pSize = 0.2; pOpacity = 0.5; }
    if (s.particles === 'haze') { pSize = 2.0; pOpacity = 0.25; }
    surfaceScene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: s.particleColor, size: pSize, transparent: true, opacity: pOpacity,
      blending: s.particles === 'embers' ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false
    })));
    surfaceAnimData.particles = pGeo;
    surfaceAnimData.velocities = pVel;
    surfaceAnimData.particleType = s.particles;
  }

  if (body.name === 'Venus') {
    surfaceAnimData.lightning = [];
    for (let i = 0; i < 3; i++) {
      const flash = new THREE.PointLight(0xFFFFDD, 0, 80);
      flash.position.set((Math.random()-0.5)*60, 15+Math.random()*20, -20-Math.random()*40);
      surfaceScene.add(flash);
      surfaceAnimData.lightning.push(flash);
    }
  }
}

// Procedural ground texture for surface views
function generateGroundTexture(name, baseColor) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const col = new THREE.Color(baseColor);
  const r = Math.floor(col.r * 255), g = Math.floor(col.g * 255), b = Math.floor(col.b * 255);

  // Base color
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, 512, 512);

  // Noise variation
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const size = 1 + Math.random() * 4;
    const vary = (Math.random() - 0.5) * 50;
    ctx.fillStyle = `rgba(${Math.max(0,Math.min(255,r+vary))},${Math.max(0,Math.min(255,g+vary))},${Math.max(0,Math.min(255,b+vary))},${0.3+Math.random()*0.4})`;
    ctx.fillRect(x, y, size, size);
  }

  // Larger patches
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const radius = 10 + Math.random() * 40;
    const vary = (Math.random() - 0.5) * 40;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(${Math.max(0,Math.min(255,r+vary))},${Math.max(0,Math.min(255,g+vary))},${Math.max(0,Math.min(255,b+vary))},0.4)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x-radius, y-radius, radius*2, radius*2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============== ANIMATION ==============
let simTime = 0; // accumulated simulation time (respects speed changes)
let lastFrameTime = performance.now() / 1000;

function animate() {
  requestAnimationFrame(animate);
  try {
  const now = performance.now() / 1000;
  const dt = now - lastFrameTime;
  lastFrameTime = now;

  // Accumulate sim time using current speed
  if (!paused) simTime += dt * speedMultiplier;

  if (currentView === 'solar') {
    // Position updates - live mode uses real ephemeris, normal mode uses simTime
    pivots.forEach(({ pivot, body }) => {
      pivot.rotation.y = liveMode && body.orbital
        ? getLiveAngle(body.orbital)
        : simTime * body.orbitalSpeed;
    });
    allMoonPivots.forEach(({ pivot, data }) => {
      pivot.rotation.y = liveMode && data.orbital
        ? getLiveAngle(data.orbital)
        : simTime * data.speed;
    });
    meshes.forEach(({ mesh, body }) => {
      mesh.rotation.y = liveMode
        ? now * body.rotationSpeed * 0.5
        : simTime * body.rotationSpeed * 50;
    });
    if (sunGlow) sunGlow.scale.setScalar(28 * (1 + Math.sin(now * 2) * 0.05));

    // Update tracked object positions
    spacecraftGroups.forEach(s => {
      if (!s.group.visible) return;

      // Update position from tracking (surface spacecraft are children of planet, no update needed)
      if (!s.catalogEntry.parentBody) {
        const pos = trackingManager.getPosition(s.id);
        if (pos) {
          s.group.position.set(pos.sx, pos.sy, pos.sz);
        }
      }
      // Pulsing glow
      const glow = s.group.getObjectByName('glow');
      if (glow) glow.scale.setScalar(4 * (1 + Math.sin(now * 3) * 0.2));
    });

    cometGroups.forEach(c => {
      if (!c.group.visible) return;
      const pos = trackingManager.getPosition(c.id);
      if (pos) {
        c.group.position.set(pos.sx, pos.sy, pos.sz);
        updateCometTail(c.group, pos);
      }
    });

    asteroidGroups.forEach(a => {
      if (!a.group.visible) return;
      const pos = trackingManager.getPosition(a.id);
      if (pos) {
        a.group.position.set(pos.sx, pos.sy, pos.sz);
      }
      // Slow rotation
      a.group.children[0].rotation.y += 0.005;
    });

    // Animate NEO warning rings
    neoGroups.forEach(n => {
      if (!n.group.visible) return;
      const ring = n.group.getObjectByName('warningRing');
      if (ring) {
        ring.rotation.z += 0.02;
        ring.material.opacity = 0.3 + Math.sin(now * 4) * 0.2;
      }
    });

    // Fly-to camera animation
    if (flyToTarget) {
      controls.target.lerp(flyToTarget, 0.04);
      if (controls.target.distanceTo(flyToTarget) < 0.5) {
        flyToTarget = null;
      }
    }
    if (flyToCamTarget) {
      camera.position.lerp(flyToCamTarget, 0.04);
      if (camera.position.distanceTo(flyToCamTarget) < 0.5) {
        flyToCamTarget = null;
      }
    }

    checkHover();
    controls.update();
    composer.render();
  } else if (currentView === 'surface' && surfaceScene && surfaceCamera) {
    const d = surfaceAnimData;
    d.time += 0.016;

    if (d.particles) {
      const pos = d.particles.attributes.position.array;
      const vel = d.velocities;
      const speed = d.particleType === 'storm' ? 3 : d.particleType === 'turbulence' ? 1.5 : d.particleType === 'embers' ? 0.8 : 0.4;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i*3] += vel[i*3] * speed * 0.1;
        pos[i*3+1] += vel[i*3+1] * speed * 0.1;
        pos[i*3+2] += vel[i*3+2] * speed * 0.1;
        if (Math.abs(pos[i*3]) > 40) pos[i*3] *= -0.9;
        if (pos[i*3+1] > 30) pos[i*3+1] = 0.5;
        if (pos[i*3+1] < 0.2) pos[i*3+1] = 0.5;
        if (Math.abs(pos[i*3+2]) > 40) pos[i*3+2] *= -0.9;
        if (d.particleType === 'embers') pos[i*3+1] += 0.02;
        if (d.particleType === 'dust') pos[i*3] += 0.01;
      }
      d.particles.attributes.position.needsUpdate = true;
    }
    if (d.lightning) {
      d.lightning.forEach(l => {
        if (Math.random() < 0.005) l.intensity = 5 + Math.random() * 10;
        else l.intensity *= 0.85;
      });
    }

    surfaceControls.update();
    surfaceComposer.render();
  } else {
    renderer.render(scene, camera);
  }
  } catch(e) { console.error('ANIMATE ERROR:', e.message, e.stack); }
}
animate();

// Debug: expose key objects for console inspection
window._solar = { scene, pivots, meshes, allMoonPivots, spacecraftGroups, trackingManager, hoverTargets, liveMode: () => liveMode, speedMultiplier: () => speedMultiplier };

// ============== RESIZE ==============
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloomPass.setSize(innerWidth, innerHeight);
  if (surfaceCamera) {
    surfaceCamera.aspect = innerWidth / innerHeight;
    surfaceCamera.updateProjectionMatrix();
  }
  if (surfaceComposer) surfaceComposer.setSize(innerWidth, innerHeight);
});
