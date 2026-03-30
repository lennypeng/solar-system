// Visual representations for comets, asteroids, NEOs, and meteor shower radiants

import * as THREE from 'three';

// Create a comet visual: nucleus + dust tail + ion tail
export function createCometVisual(color) {
  const group = new THREE.Group();

  // Nucleus (icy blue-white sphere)
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xCCDDFF, roughness: 0.5, metalness: 0.1,
      emissive: color || 0xAADDFF, emissiveIntensity: 0.4
    })
  );
  nucleus.name = 'nucleus';
  group.add(nucleus);

  // Inner coma glow
  const comaGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const comaMat = new THREE.MeshBasicMaterial({
    color: 0xBBDDFF, transparent: true, opacity: 0.2,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const coma = new THREE.Mesh(comaGeo, comaMat);
  coma.name = 'coma';
  group.add(coma);

  // Dust tail (curved, yellowish particles)
  const dustCount = 200;
  const dustGeo = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSizes = new Float32Array(dustCount);

  for (let i = 0; i < dustCount; i++) {
    const t = i / dustCount;
    // Spread along tail direction (will be updated dynamically)
    dustPositions[i * 3] = t * 8 + Math.random() * 0.5;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * t * 2;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * t * 2;
    dustSizes[i] = 0.3 * (1 - t * 0.7);
  }

  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeo.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));

  const dustTail = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xFFEEAA, size: 0.3, transparent: true, opacity: 0.5,
    blending: THREE.NormalBlending, depthWrite: false, sizeAttenuation: true
  }));
  dustTail.name = 'dustTail';
  group.add(dustTail);

  // Ion tail (straight, blue particles)
  const ionCount = 100;
  const ionGeo = new THREE.BufferGeometry();
  const ionPositions = new Float32Array(ionCount * 3);

  for (let i = 0; i < ionCount; i++) {
    const t = i / ionCount;
    ionPositions[i * 3] = t * 12;
    ionPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
    ionPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }

  ionGeo.setAttribute('position', new THREE.BufferAttribute(ionPositions, 3));

  const ionTail = new THREE.Points(ionGeo, new THREE.PointsMaterial({
    color: 0x4488FF, size: 0.2, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  ionTail.name = 'ionTail';
  group.add(ionTail);

  return group;
}

// Update comet tail direction to point away from Sun (at origin)
export function updateCometTail(group, position) {
  // Tail points away from Sun (which is at origin)
  const dir = new THREE.Vector3(position.sx || position.x, position.sy || position.y, position.sz || position.z);
  const dist = dir.length();
  if (dist < 0.01) return;
  dir.normalize();

  // Tail length inversely proportional to distance (brighter when closer to Sun)
  const tailScale = Math.min(3.0, 8.0 / Math.max(dist / 50, 0.5));

  const dustTail = group.getObjectByName('dustTail');
  const ionTail = group.getObjectByName('ionTail');

  if (dustTail) {
    const pos = dustTail.geometry.attributes.position.array;
    const count = pos.length / 3;
    // Create a perpendicular vector for the curved dust tail
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const len = t * 8 * tailScale;
      // Curve the dust tail slightly
      const curve = t * t * 1.5;
      pos[i * 3] = dir.x * len + perp.x * curve + (Math.random() - 0.5) * t * 0.8;
      pos[i * 3 + 1] = dir.y * len + (Math.random() - 0.5) * t * 0.6;
      pos[i * 3 + 2] = dir.z * len + perp.z * curve + (Math.random() - 0.5) * t * 0.8;
    }
    dustTail.geometry.attributes.position.needsUpdate = true;
    dustTail.material.opacity = Math.min(0.6, tailScale * 0.2);
  }

  if (ionTail) {
    const pos = ionTail.geometry.attributes.position.array;
    const count = pos.length / 3;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const len = t * 12 * tailScale;
      pos[i * 3] = dir.x * len + (Math.random() - 0.5) * 0.15;
      pos[i * 3 + 1] = dir.y * len + (Math.random() - 0.5) * 0.15;
      pos[i * 3 + 2] = dir.z * len + (Math.random() - 0.5) * 0.15;
    }
    ionTail.geometry.attributes.position.needsUpdate = true;
    ionTail.material.opacity = Math.min(0.5, tailScale * 0.15);
  }

  // Scale coma based on distance
  const coma = group.getObjectByName('coma');
  if (coma) {
    const comaScale = Math.min(2.0, tailScale * 0.6);
    coma.scale.setScalar(comaScale);
  }
}

// Create an asteroid visual: irregular rock shape
export function createAsteroidVisual(color, size) {
  const group = new THREE.Group();

  const radius = size || 0.5;
  const geo = new THREE.DodecahedronGeometry(radius, 1);

  // Displace vertices for irregular shape
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const len = Math.sqrt(x * x + y * y + z * z);
    const displacement = 0.7 + Math.random() * 0.6;
    posAttr.setXYZ(i, x / len * radius * displacement, y / len * radius * displacement, z / len * radius * displacement);
  }
  geo.computeVertexNormals();

  const rock = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: color || 0x887766, roughness: 0.95, metalness: 0.05,
    emissive: color || 0x887766, emissiveIntensity: 0.15
  }));

  // Slight squish for variety
  rock.scale.set(1, 0.6 + Math.random() * 0.4, 0.7 + Math.random() * 0.3);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  group.add(rock);

  return group;
}

// Create a NEO visual: small glowing warning dot
export function createNEOVisual(color, isHazardous) {
  const group = new THREE.Group();

  // Core dot
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 12),
    new THREE.MeshStandardMaterial({
      color: color || 0xFFAA44, roughness: 0.3, metalness: 0.2,
      emissive: color || 0xFFAA44, emissiveIntensity: 0.5
    })
  );
  group.add(core);

  // Warning ring for hazardous
  if (isHazardous) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.5, 24),
      new THREE.MeshBasicMaterial({
        color: 0xFF2222, transparent: true, opacity: 0.5,
        side: THREE.DoubleSide, depthWrite: false
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.name = 'warningRing';
    group.add(ring);
  }

  return group;
}

// Create meteor shower radiant marker
export function createMeteorShowerMarker(color) {
  const group = new THREE.Group();

  // Central point
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshBasicMaterial({
      color: color || 0xFFDD88, transparent: true, opacity: 0.8
    })
  );
  group.add(core);

  // Radiant streaks (6 short lines radiating outward)
  const streakMat = new THREE.LineBasicMaterial({
    color: color || 0xFFDD88, transparent: true, opacity: 0.6
  });

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const geo = new THREE.BufferGeometry();
    const innerR = 0.2;
    const outerR = 0.5 + Math.random() * 0.3;
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      Math.cos(angle) * innerR, Math.sin(angle) * innerR, 0,
      Math.cos(angle) * outerR, Math.sin(angle) * outerR, (Math.random() - 0.5) * 0.2
    ], 3));
    const line = new THREE.Line(geo, streakMat);
    group.add(line);
  }

  return group;
}
