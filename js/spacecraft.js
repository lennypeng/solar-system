// Procedural 3D spacecraft models built from Three.js primitives
// Each function returns a THREE.Group at approximately unit scale

import * as THREE from 'three';

const metalMat = (color, emissive) => new THREE.MeshStandardMaterial({
  color, roughness: 0.4, metalness: 0.6,
  emissive: emissive || color, emissiveIntensity: 0.15
});

const panelMat = (color) => new THREE.MeshStandardMaterial({
  color, roughness: 0.3, metalness: 0.7,
  emissive: color, emissiveIntensity: 0.1, side: THREE.DoubleSide
});

function createVoyagerModel() {
  const group = new THREE.Group();

  // Central bus (box)
  const bus = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.2, 0.4),
    metalMat(0x888899)
  );
  group.add(bus);

  // High-gain antenna dish
  const dishGeo = new THREE.CircleGeometry(0.45, 24);
  const dish = new THREE.Mesh(dishGeo, metalMat(0xDDDDDD, 0x8888AA));
  dish.position.set(0, 0.15, 0);
  dish.rotation.x = -Math.PI / 2;
  group.add(dish);

  // Dish struts
  const strutMat = metalMat(0x666677);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.2),
      strutMat
    );
    strut.position.set(Math.cos(angle) * 0.15, 0.07, Math.sin(angle) * 0.15);
    strut.rotation.z = Math.cos(angle) * 0.3;
    strut.rotation.x = Math.sin(angle) * 0.3;
    group.add(strut);
  }

  // Magnetometer boom (long arm)
  const boom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.8),
    strutMat
  );
  boom.position.set(0.4, 0, 0);
  boom.rotation.z = Math.PI / 2;
  group.add(boom);

  // RTG boom (opposite side, shorter)
  const rtgBoom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.5),
    strutMat
  );
  rtgBoom.position.set(-0.25, -0.05, 0);
  rtgBoom.rotation.z = Math.PI / 2;
  group.add(rtgBoom);

  // RTG (cylinder at end of boom)
  const rtg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8),
    metalMat(0x554433)
  );
  rtg.position.set(-0.5, -0.05, 0);
  rtg.rotation.z = Math.PI / 2;
  group.add(rtg);

  // Science scan platform
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.1),
    metalMat(0x777788)
  );
  platform.position.set(0, -0.15, 0.25);
  group.add(platform);

  return group;
}

function createJWSTModel() {
  const group = new THREE.Group();

  // Hexagonal mirror segments (gold)
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xFFCC33, roughness: 0.1, metalness: 0.9,
    emissive: 0xFFAA00, emissiveIntensity: 0.2
  });

  const hexRadius = 0.15;
  const hexShape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const x = Math.cos(angle) * hexRadius;
    const y = Math.sin(angle) * hexRadius;
    if (i === 0) hexShape.moveTo(x, y);
    else hexShape.lineTo(x, y);
  }
  hexShape.closePath();
  const hexGeo = new THREE.ShapeGeometry(hexShape);

  // 18 mirror segments in honeycomb pattern
  const offsets = [
    [0, 0], [0.26, 0], [-0.26, 0], [0.13, 0.225], [-0.13, 0.225],
    [0.13, -0.225], [-0.13, -0.225], [0.39, 0.225], [-0.39, 0.225],
    [0.39, -0.225], [-0.39, -0.225], [0.26, 0.45], [-0.26, 0.45],
    [0.26, -0.45], [-0.26, -0.45], [0, 0.45], [0, -0.45], [0.52, 0]
  ];

  offsets.forEach(([ox, oz]) => {
    const hex = new THREE.Mesh(hexGeo, mirrorMat);
    hex.position.set(ox, 0.05, oz);
    hex.rotation.x = -Math.PI / 2;
    group.add(hex);
  });

  // Sunshield (5 layers, silver/purple)
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0xCCBBDD, roughness: 0.6, metalness: 0.3,
    emissive: 0x443355, emissiveIntensity: 0.1,
    side: THREE.DoubleSide, transparent: true, opacity: 0.8
  });

  for (let layer = 0; layer < 3; layer++) {
    const yOff = -0.08 - layer * 0.04;
    const scale = 1 + layer * 0.05;
    const shield = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0 * scale, 0.6 * scale),
      shieldMat
    );
    shield.position.y = yOff;
    shield.rotation.x = -Math.PI / 2;
    group.add(shield);
  }

  // Solar panel boom
  const boomMat = metalMat(0x555566);
  const boom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.4),
    boomMat
  );
  boom.position.set(0.55, -0.05, 0);
  boom.rotation.z = Math.PI / 2;
  group.add(boom);

  // Solar panel
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.3),
    panelMat(0x2244AA)
  );
  panel.position.set(0.75, -0.05, 0);
  panel.rotation.y = Math.PI / 2;
  group.add(panel);

  return group;
}

function createParkerModel() {
  const group = new THREE.Group();

  // Heat shield (large white disk facing Sun)
  const shield = new THREE.Mesh(
    new THREE.CircleGeometry(0.4, 32),
    new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, roughness: 0.3, metalness: 0.1,
      emissive: 0xDDDDEE, emissiveIntensity: 0.15
    })
  );
  shield.position.set(0, 0, 0.2);
  group.add(shield);

  // Spacecraft body (behind shield)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.4, 12),
    metalMat(0x666677)
  );
  body.position.set(0, 0, -0.05);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Solar panels (small, angled)
  const panelGeo = new THREE.PlaneGeometry(0.08, 0.3);
  const sPanelMat = panelMat(0x223388);
  const panel1 = new THREE.Mesh(panelGeo, sPanelMat);
  panel1.position.set(0.25, 0, -0.1);
  panel1.rotation.y = Math.PI / 6;
  group.add(panel1);

  const panel2 = new THREE.Mesh(panelGeo, sPanelMat);
  panel2.position.set(-0.25, 0, -0.1);
  panel2.rotation.y = -Math.PI / 6;
  group.add(panel2);

  // Antenna
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.3),
    metalMat(0x888899)
  );
  antenna.position.set(0, 0, -0.35);
  antenna.rotation.x = Math.PI / 2;
  group.add(antenna);

  return group;
}

function createNewHorizonsModel() {
  const group = new THREE.Group();

  // Triangular body (wedge-shaped)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(0, 0.15);
  bodyShape.lineTo(0.2, -0.15);
  bodyShape.lineTo(-0.2, -0.15);
  bodyShape.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.1, bevelEnabled: false });
  const body = new THREE.Mesh(bodyGeo, metalMat(0x887766));
  body.position.set(0, 0, -0.05);
  group.add(body);

  // High-gain dish antenna
  const dish = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 24),
    metalMat(0xCCCCCC, 0x8888AA)
  );
  dish.position.set(0, 0.2, 0);
  dish.rotation.x = -Math.PI / 2;
  group.add(dish);

  // RTG boom
  const rtgBoom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.4),
    metalMat(0x555566)
  );
  rtgBoom.position.set(-0.2, 0, 0);
  rtgBoom.rotation.z = Math.PI / 2;
  group.add(rtgBoom);

  // RTG cylinder
  const rtg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8),
    metalMat(0x443322)
  );
  rtg.position.set(-0.4, 0, 0);
  rtg.rotation.z = Math.PI / 2;
  group.add(rtg);

  return group;
}

function createJunoModel() {
  const group = new THREE.Group();

  // Hexagonal body
  const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 6);
  const body = new THREE.Mesh(bodyGeo, metalMat(0x777788));
  group.add(body);

  // Three large solar panel wings (120 degrees apart)
  const wingMat = panelMat(0x2255AA);
  const wingGeo = new THREE.PlaneGeometry(0.6, 0.15);

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(
      Math.cos(angle) * 0.4,
      0,
      Math.sin(angle) * 0.4
    );
    wing.rotation.y = -angle + Math.PI / 2;
    wing.rotation.x = Math.PI / 2;
    group.add(wing);

    // Wing strut
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.25),
      metalMat(0x555566)
    );
    strut.position.set(
      Math.cos(angle) * 0.2,
      0,
      Math.sin(angle) * 0.2
    );
    strut.rotation.z = Math.PI / 2;
    strut.rotation.y = angle;
    group.add(strut);
  }

  // High-gain antenna on top
  const antenna = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 16),
    metalMat(0xCCCCCC)
  );
  antenna.position.y = 0.15;
  antenna.rotation.x = -Math.PI / 2;
  group.add(antenna);

  return group;
}

function createGenericProbeModel() {
  const group = new THREE.Group();

  // Box body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.15, 0.25),
    metalMat(0x777788)
  );
  group.add(body);

  // Two solar panels
  const wingMat = panelMat(0x2244AA);
  const wingGeo = new THREE.PlaneGeometry(0.35, 0.12);

  const wing1 = new THREE.Mesh(wingGeo, wingMat);
  wing1.position.set(0.27, 0, 0);
  wing1.rotation.x = Math.PI / 2;
  group.add(wing1);

  const wing2 = new THREE.Mesh(wingGeo, wingMat);
  wing2.position.set(-0.27, 0, 0);
  wing2.rotation.x = Math.PI / 2;
  group.add(wing2);

  // Dish antenna
  const dish = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 16),
    metalMat(0xCCCCCC)
  );
  dish.position.y = 0.1;
  dish.rotation.x = -Math.PI / 2;
  group.add(dish);

  // Antenna mast
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.15),
    metalMat(0x888899)
  );
  mast.position.y = 0.15;
  group.add(mast);

  return group;
}

const MODEL_BUILDERS = {
  voyager: createVoyagerModel,
  jwst: createJWSTModel,
  parker: createParkerModel,
  newhorizons: createNewHorizonsModel,
  juno: createJunoModel,
  generic: createGenericProbeModel,
};

export function createSpacecraftModel(modelType) {
  const builder = MODEL_BUILDERS[modelType] || MODEL_BUILDERS.generic;
  const model = builder();

  // Normalize: scale so the group fits roughly within a 1-unit sphere
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) model.scale.multiplyScalar(1.0 / maxDim);

  return model;
}
