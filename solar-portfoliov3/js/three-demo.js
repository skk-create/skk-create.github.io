/* ============================================================
   three-demo.js — proof of concept only. Not wired into the real
   site. Renders a real 3D sun + Mars: textured, lit by an actual
   light source, orbit-able with the mouse, and clickable (jumps to
   contact.html, same as the CSS version does today).
   ============================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------- scene / camera / renderer ---------- */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 4, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 6;
controls.maxDistance = 40;

/* ---------- starfield (simple point cloud) ---------- */
const starGeo = new THREE.BufferGeometry();
const STAR_COUNT = 1500;
const starPositions = new Float32Array(STAR_COUNT * 3);
for (let i = 0; i < STAR_COUNT * 3; i++) {
  starPositions[i] = (Math.random() - 0.5) * 400;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 })));

/* ---------- the sun: its own light source, so it uses an unlit material ---------- */
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2, 48, 48),
  new THREE.MeshBasicMaterial({ color: 0xffb545 })
);
scene.add(sun);

const sunLight = new THREE.PointLight(0xfff2d0, 3, 100);
sun.add(sunLight); // travels with the sun, sits at its center

// soft fill light so Mars's night side isn't pure black
scene.add(new THREE.AmbientLight(0x1a2440, 0.6));

/* ---------- Mars: a real lit, textured sphere ---------- */
const textureLoader = new THREE.TextureLoader();
const marsTexture = textureLoader.load(
  'img/textures/mars.jpg',
  undefined,
  undefined,
  (err) => console.error('Mars texture failed to load — check that img/textures/mars.jpg exists:', err)
);

const mars = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 48, 48),
  new THREE.MeshStandardMaterial({ map: marsTexture, roughness: 1 })
);
mars.position.set(7, 0, 0);
scene.add(mars);

/* ---------- click Mars to navigate, same destination as the CSS version ---------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function setPointer(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
}

renderer.domElement.addEventListener('mousemove', (e) => {
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const hovering = raycaster.intersectObject(mars).length > 0;
  renderer.domElement.style.cursor = hovering ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('click', (e) => {
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.intersectObject(mars).length > 0) {
    window.location.href = 'contact.html';
  }
});

/* ---------- resize ---------- */
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ---------- render loop ---------- */
function animate() {
  requestAnimationFrame(animate);
  mars.rotation.y += 0.003;
  sun.rotation.y += 0.0008;
  controls.update();
  renderer.render(scene, camera);
}
animate();
