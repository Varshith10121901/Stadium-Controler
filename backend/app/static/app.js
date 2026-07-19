/**
 * SwarmAI — Estadio Santiago Bernabéu 3D Engine (Vanilla Three.js)
 * ================================================================
 * Pure HTML5/WebGL 3D Stadium Crowd Visualization & Interactive Routing.
 */

// ── Global State ─────────────────────────────────────────────────────────────
let scene, camera, renderer, controls;
let seatBlocks = [];
let agentMeshGroup = new THREE.Group();
let pathLine = null;
let selectedSeat = null; // [x, y, z]
let isFpv = false;
let isFollowingPath = false;
let currentPathData = [];
let ws = null;

const GOLD = 0xFEBE10;
const NAVY = 0x00529F;

// ── Initialize 3D Engine ──────────────────────────────────────────────────────
function init3D() {
  const container = document.getElementById('canvas-container');
  
  // Scene & Fog
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);
  scene.fog = new THREE.FogExp2(0x020617, 0.008);

  // Camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 45, -65);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 20;
  controls.maxDistance = 140;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 10, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(30, 60, -30);
  sun.castShadow = true;
  scene.add(sun);

  const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x0f172a, 0.4);
  scene.add(hemiLight);

  // Build Bernabéu Geometry
  buildPitch();
  buildStadiumSeating();
  buildPOIs();
  buildFloodlights();
  scene.add(agentMeshGroup);

  // Interaction Events
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('click', onSeatClick);

  // Start Animation Loop
  animate();
}

// ── Pitch ────────────────────────────────────────────────────────────────────
function buildPitch() {
  const pitchGeo = new THREE.PlaneGeometry(60, 40);
  const pitchMat = new THREE.MeshStandardMaterial({ color: 0x0f5132, roughness: 0.7 });
  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = 0.01;
  pitch.receiveShadow = true;
  scene.add(pitch);

  // Pitch Border Line
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
  const points = [
    new THREE.Vector3(-29, 0.05, -19),
    new THREE.Vector3(29, 0.05, -19),
    new THREE.Vector3(29, 0.05, 19),
    new THREE.Vector3(-29, 0.05, 19),
    new THREE.Vector3(-29, 0.05, -19)
  ];
  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  scene.add(new THREE.Line(lineGeo, lineMat));
}

// ── Bernabéu Stadium Radial Seating ──────────────────────────────────────────
function buildStadiumSeating() {
  const seatingGroup = new THREE.Group();
  const numSections = 32;

  for (let i = 0; i < numSections; i++) {
    const angle = (i / numSections) * Math.PI * 2;
    for (let tier = 1; tier <= 4; tier++) {
      const radius = 26 + tier * 7;
      const height = tier * 4.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const blockGeo = new THREE.BoxGeometry(4.5, 1.8, 3.5);
      const blockMat = new THREE.MeshStandardMaterial({
        color: tier === 4 ? 0x0f172a : 0x1e293b,
        roughness: 0.6
      });
      const block = new THREE.Mesh(blockGeo, blockMat);
      block.position.set(x, height, z);
      block.rotation.y = -angle + Math.PI / 2;
      block.castShadow = true;
      block.receiveShadow = true;

      block.userData = { isSeat: true, coords: [x, height, z], id: `Seat_${i}_${tier}` };
      seatBlocks.push(block);
      seatingGroup.add(block);
    }
  }

  // Outer Metallic Shell Columns
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const radius = 58;
    const colGeo = new THREE.CylinderGeometry(1.2, 1.5, 30, 8);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(Math.cos(angle) * radius, 15, Math.sin(angle) * radius);
    seatingGroup.add(col);
  }

  scene.add(seatingGroup);
}

// ── Points of Interest (Gates, Food, Merch) ──────────────────────────────────
function buildPOIs() {
  const pois = [
    { pos: [0, 22, -52], label: 'Gate A (North)', color: 0x8b5cf6 },
    { pos: [0, 22, 52], label: 'Gate C (South)', color: 0x8b5cf6 },
    { pos: [-52, 22, 0], label: 'Gate B (East)', color: 0x8b5cf6 },
    { pos: [52, 22, 0], label: 'Gate D (West)', color: 0x8b5cf6 },
    { pos: [-38, 20, 38], label: 'Merchandise North', color: 0xa855f7 },
    { pos: [38, 20, -38], label: 'Merchandise East', color: 0xa855f7 },
    { pos: [48, 20, 0], label: 'Concessions 1', color: 0xf59e0b },
    { pos: [-48, 20, 0], label: 'Concessions 2', color: 0x10b981 },
  ];

  pois.forEach(p => {
    const markerGeo = new THREE.CylinderGeometry(2, 2, 4, 16);
    const markerMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.3 });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(p.pos[0], p.pos[1], p.pos[2]);
    scene.add(marker);
  });
}

// ── Floodlight Towers ───────────────────────────────────────────────────────
function buildFloodlights() {
  const coords = [[42, 11, 42], [-42, 11, 42], [42, 11, -42], [-42, 11, -42]];
  coords.forEach(c => {
    const poleGeo = new THREE.CylinderGeometry(0.5, 0.8, 25, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(c[0], c[1] + 12, c[2]);
    scene.add(pole);

    const light = new THREE.PointLight(0xfffaed, 0.8, 80);
    light.position.set(c[0], c[1] + 25, c[2]);
    scene.add(light);
  });
}

// ── Seat Selection Raycaster ────────────────────────────────────────────────
function onSeatClick(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(seatBlocks);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hit.userData.isSeat) {
      // Reset previous selection
      seatBlocks.forEach(b => b.material.color.setHex(b.userData.coords[1] > 15 ? 0x0f172a : 0x1e293b));
      
      // Highlight selected block in Real Madrid Gold
      hit.material.color.setHex(GOLD);
      selectedSeat = hit.userData.coords;

      // Update UI Dock Bar
      document.getElementById('seat-coords').innerText = `X: ${selectedSeat[0].toFixed(1)} / Z: ${selectedSeat[2].toFixed(1)}`;
      document.getElementById('dock-bar').style.display = 'flex';
    }
  }
}

// ── Draw 3D A* Route Line ────────────────────────────────────────────────────
function drawRoutePath(pathCoords) {
  if (pathLine) scene.remove(pathLine);
  if (!pathCoords || pathCoords.length < 2) return;

  const points = pathCoords.map(pt => {
    // Map stadium 100x100 grid back to 3D world space
    const wx = (pt[0] - 50) * 1.1;
    const wz = (pt[1] - 50) * 1.1;
    return new THREE.Vector3(wx, 5.0, wz);
  });

  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 4 });
  pathLine = new THREE.Line(lineGeo, lineMat);
  scene.add(pathLine);
}

// ── Request Route Path from API ──────────────────────────────────────────────
async function requestPath(targetType) {
  if (!selectedSeat) return;
  const sx = (selectedSeat[0] / 1.1) + 50;
  const sy = (selectedSeat[2] / 1.1) + 50;

  try {
    const res = await fetch(`/api/routes/path?start_x=${sx}&start_y=${sy}&target_type=${targetType}`);
    if (res.ok) {
      const data = await res.json();
      if (data.path && data.path.length > 0) {
        currentPathData = data.path;
        drawRoutePath(data.path);
        appendChatMessage(`Mapped optimal path to nearest ${targetType}. Follow the green vector on your 3D map.`, false);
        return;
      }
    }
  } catch (e) {
    console.warn("API route fallback triggered:", e);
  }

  // Fallback static path
  const concourseY = sy > 50 ? 95 : 5;
  const fallbackPath = [[sx, sy], [sx, concourseY], [50, concourseY]];
  currentPathData = fallbackPath;
  drawRoutePath(fallbackPath);
  appendChatMessage(`Mapped trajectory to nearest ${targetType} (fallback mode active).`, false);
}

// ── Live WebSocket Agent Synchronization ─────────────────────────────────────
function connectWS() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const clientId = `tab_${Date.now()}`;
  
  ws = new WebSocket(`${protocol}//${host}/ws/${clientId}`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state_update' && msg.data.agents) {
        update3DAgents(msg.data.agents);
      }
    } catch (e) {}
  };

  ws.onclose = () => {
    setTimeout(connectWS, 3000);
  };
}

function update3DAgents(agents) {
  // Clear old meshes
  while (agentMeshGroup.children.length > 0) {
    agentMeshGroup.remove(agentMeshGroup.children[0]);
  }

  const agentGeo = new THREE.SphereGeometry(0.6, 8, 8);
  const agentMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.3 });

  Object.values(agents).forEach(a => {
    const wx = (a.x - 50) * 1.1;
    const wz = (a.y - 50) * 1.1;
    const mesh = new THREE.Mesh(agentGeo, agentMat);
    mesh.position.set(wx, 1.2, wz);
    agentMeshGroup.add(mesh);
  });
}

// ── Gemini Chat Integration ──────────────────────────────────────────────────
document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  appendChatMessage(text, true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        seat_x: selectedSeat ? selectedSeat[0] : null,
        seat_z: selectedSeat ? selectedSeat[2] : null,
      })
    });
    const data = await res.json();
    appendChatMessage(data.reply, false);
    if (data.suggested_action === 'route_restroom') requestPath('restroom');
    if (data.suggested_action === 'route_food') requestPath('concession');
    if (data.suggested_action === 'route_exit') requestPath('gate');
  } catch (err) {
    appendChatMessage("🧠 SwarmAI is tracking crowd vectors. Ask about merchandise, food, or exits for live paths!", false);
  }
});

function quickChat(text) {
  document.getElementById('chat-input').value = text;
  document.getElementById('chat-form').dispatchEvent(new Event('submit'));
}

function appendChatMessage(text, isUser) {
  const container = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isUser ? 'user' : 'bot'}`;
  msgDiv.innerText = text;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

// ── Event Handlers & Controls ────────────────────────────────────────────────
document.getElementById('chat-toggle').addEventListener('click', () => {
  document.getElementById('chat-window').classList.toggle('hidden');
});
document.getElementById('chat-close').addEventListener('click', () => {
  document.getElementById('chat-window').classList.add('hidden');
});

document.getElementById('btn-fpv').addEventListener('click', () => {
  if (!selectedSeat) return;
  isFpv = !isFpv;
  document.getElementById('btn-fpv').classList.toggle('fpv-active', isFpv);
  if (isFpv) {
    camera.position.set(selectedSeat[0], selectedSeat[1] + 1.2, selectedSeat[2]);
    controls.target.set(0, 5, 0);
  } else {
    camera.position.set(0, 45, -65);
    controls.target.set(0, 10, 0);
  }
});

document.getElementById('btn-traverse').addEventListener('click', () => {
  if (currentPathData.length > 0) {
    isFpv = true;
    let idx = 0;
    const animTimer = setInterval(() => {
      if (idx >= currentPathData.length) {
        clearInterval(animTimer);
        isFpv = false;
        camera.position.set(0, 45, -65);
        controls.target.set(0, 10, 0);
        return;
      }
      const pt = currentPathData[idx];
      const wx = (pt[0] - 50) * 1.1;
      const wz = (pt[1] - 50) * 1.1;
      camera.position.set(wx, 5, wz);
      controls.target.set(wx + 2, 5, wz + 2);
      idx++;
    }, 400);
  }
});

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
  init3D();
  connectWS();
  document.getElementById('temp-id').innerText = `ID: ${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
});
