// ==========================================================================
// Persistent atmospheric Three.js layer — floating petals, depth, camera
// movement driven by scroll progress and mouse parallax.
// ==========================================================================

import * as THREE from "three";
import {
  clamp,
  lerp,
  prefersReducedMotion,
  getDevicePerformanceTier,
  createSoftDiscTexture
} from "./utils.js";

const PALETTE = {
  primary: new THREE.Color("#cc96bb"),
  secondary: new THREE.Color("#e3bfd8"),
  gold: new THREE.Color("#e4d3ad"),
  plum: new THREE.Color("#4e3b4a")
};

// Camera / fog keyframes mapped across overall page scroll progress (0..1).
const CAMERA_STOPS = [
  { t: 0.0, y: 0.0, z: 8.2, rotX: 0.0, fog: "#2c2030" },
  { t: 0.16, y: -1.3, z: 7.6, rotX: 0.02, fog: "#3a2a3a" },
  { t: 0.32, y: -2.6, z: 7.1, rotX: -0.015, fog: "#42314a" },
  { t: 0.48, y: -3.7, z: 7.7, rotX: 0.02, fog: "#4e3b4a" },
  { t: 0.64, y: -4.6, z: 7.2, rotX: -0.02, fog: "#463143" },
  { t: 0.8, y: -5.5, z: 7.9, rotX: 0.015, fog: "#3c2a3c" },
  { t: 1.0, y: -6.6, z: 6.8, rotX: 0.0, fog: "#241a24" }
];

const TIER_SETTINGS = {
  low: { petals: 50, orbs: 4, dpr: 1.4 },
  medium: { petals: 110, orbs: 7, dpr: 1.8 },
  high: { petals: 200, orbs: 10, dpr: 2 }
};

function lerpColorStops(stops, t, key) {
  if (t <= stops[0].t) return stops[0][key];
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.t && t <= b.t) {
      const localT = (t - a.t) / (b.t - a.t || 1);
      return { a: a[key], b: b[key], localT };
    }
  }
  return stops[stops.length - 1][key];
}

export class ThreeScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.reducedMotion = prefersReducedMotion();
    this.tier = TIER_SETTINGS[getDevicePerformanceTier()];
    this.paused = false;
    this.scrollProgress = 0;
    this.mouseTarget = { x: 0, y: 0 };
    this.mouseCurrent = { x: 0, y: 0 };
    this.clock = new THREE.Clock();
    this._fogColorA = new THREE.Color();
    this._fogColorB = new THREE.Color();
  }

  init() {
    this.createRenderer();
    this.createScene();
    this.createCamera();
    this.createLights();
    this.createParticles();
    this.createFloralElements();

    this._onVisibilityChange = () => {
      this.paused = document.hidden;
    };
    document.addEventListener("visibilitychange", this._onVisibilityChange);

    this.animate();
    return this;
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.tier.dpr));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x2c2030, 0.045);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      60
    );
    this.camera.position.set(0, 0, CAMERA_STOPS[0].z);
    this.cameraRig = new THREE.Group();
    this.cameraRig.add(this.camera);
    this.scene.add(this.cameraRig);
  }

  createLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const hemi = new THREE.HemisphereLight(PALETTE.secondary, PALETTE.plum, 0.5);
    this.scene.add(ambient, hemi);
  }

  createParticles() {
    const texture = createSoftDiscTexture();
    const count = this.reducedMotion ? Math.round(this.tier.petals * 0.25) : this.tier.petals;

    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const sways = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const tintChoices = [PALETTE.primary, PALETTE.secondary, PALETTE.gold];

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

      speeds[i] = lerp(0.35, 1.1, Math.random());
      sways[i] = lerp(0.2, 0.9, Math.random());
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = lerp(0.12, 0.32, Math.random());

      const tint = tintChoices[Math.floor(Math.random() * tintChoices.length)];
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.26,
      map: texture,
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
    this.particleData = { speeds, sways, phases, sizes, count };
    this.scene.add(this.particles);
  }

  createFloralElements() {
    const texture = createSoftDiscTexture();
    const count = this.reducedMotion ? 0 : this.tier.orbs;
    const group = new THREE.Group();

    for (let i = 0; i < count; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: i % 2 === 0 ? PALETTE.secondary : PALETTE.gold,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(material);
      const scale = lerp(2.4, 5.5, Math.random());
      sprite.scale.set(scale, scale * 0.8, 1);
      sprite.position.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 22,
        -4 - Math.random() * 6
      );
      sprite.userData.driftPhase = Math.random() * Math.PI * 2;
      sprite.userData.driftSpeed = lerp(0.06, 0.16, Math.random());
      group.add(sprite);
    }

    this.floralGroup = group;
    this.scene.add(group);
  }

  updateScroll(progress) {
    this.scrollProgress = clamp(progress, 0, 1);
  }

  updateMouse(normalizedX, normalizedY) {
    this.mouseTarget.x = normalizedX;
    this.mouseTarget.y = normalizedY;
  }

  resize() {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _applyCameraForProgress(t) {
    const yData = lerpColorStops(CAMERA_STOPS, t, "y");
    const zData = lerpColorStops(CAMERA_STOPS, t, "z");
    const rotData = lerpColorStops(CAMERA_STOPS, t, "rotX");
    const fogData = lerpColorStops(CAMERA_STOPS, t, "fog");

    const resolve = (data) =>
      typeof data === "object" ? lerp(data.a, data.b, data.localT) : data;

    const targetY = this.reducedMotion ? CAMERA_STOPS[0].y * 0.3 : resolve(yData);
    const targetZ = resolve(zData);
    const targetRotX = this.reducedMotion ? 0 : resolve(rotData);

    this.cameraRig.position.y = lerp(this.cameraRig.position.y, targetY, 0.06);
    this.camera.position.z = lerp(this.camera.position.z, targetZ, 0.06);
    this.camera.rotation.x = lerp(this.camera.rotation.x, targetRotX, 0.06);

    if (typeof fogData === "object") {
      this._fogColorA.set(fogData.a);
      this._fogColorB.set(fogData.b);
      this._fogColorA.lerp(this._fogColorB, fogData.localT);
      this.scene.fog.color.lerp(this._fogColorA, 0.08);
    } else {
      this._fogColorA.set(fogData);
      this.scene.fog.color.lerp(this._fogColorA, 0.08);
    }
  }

  _updateParticles(delta, elapsed) {
    if (!this.particles) return;
    const positions = this.particles.geometry.attributes.position.array;
    const { speeds, sways, phases, count } = this.particleData;
    const camY = this.cameraRig.position.y;
    const fallScale = this.reducedMotion ? 0.15 : 1;

    for (let i = 0; i < count; i += 1) {
      const idx = i * 3;
      positions[idx + 1] -= speeds[i] * delta * 0.6 * fallScale;
      positions[idx] += Math.sin(elapsed * sways[i] + phases[i]) * delta * 0.25;

      const relativeY = positions[idx + 1] - camY;
      if (relativeY < -11) {
        positions[idx + 1] = camY + 11;
        positions[idx] = (Math.random() - 0.5) * 16;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  _updateFloral(elapsed) {
    if (!this.floralGroup) return;
    this.floralGroup.children.forEach((sprite) => {
      sprite.position.x += Math.sin(elapsed * sprite.userData.driftSpeed + sprite.userData.driftPhase) * 0.002;
    });
  }

  animate() {
    this._raf = requestAnimationFrame(() => this.animate());
    if (this.paused) return;

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    this.mouseCurrent.x = lerp(this.mouseCurrent.x, this.mouseTarget.x, 0.04);
    this.mouseCurrent.y = lerp(this.mouseCurrent.y, this.mouseTarget.y, 0.04);

    if (!this.reducedMotion) {
      this.cameraRig.position.x = lerp(this.cameraRig.position.x, this.mouseCurrent.x * 0.6, 0.05);
      this.camera.position.y = lerp(this.camera.position.y, -this.mouseCurrent.y * 0.3, 0.05);
    }

    this._applyCameraForProgress(this.scrollProgress);
    this._updateParticles(delta, elapsed);
    this._updateFloral(elapsed);

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    this.particles?.geometry.dispose();
    this.particles?.material.dispose();
    this.floralGroup?.children.forEach((sprite) => {
      sprite.material.dispose();
    });
    this.renderer?.dispose();
  }
}

export function initThreeScene(canvas) {
  return new ThreeScene(canvas).init();
}
