// ==========================================================================
// Tearable invitation entrance — an original Three.js recreation of the
// "tear to enter" concept. The invitation is a real mass-spring cloth grid
// (Verlet integration, iterative constraint relaxation): dragging grabs a
// neighborhood of the fabric and pulls it elastically while cutting a rip
// along the drag path edge-by-edge, exactly like tearing a physical sheet.
// Once torn far enough, the corner pins drop and both halves fall away
// under gravity, still flexing as connected cloth, revealing the site.
// ==========================================================================

import * as THREE from "three";
import {
  clamp,
  lerp,
  mapRange,
  prefersReducedMotion,
  getDevicePerformanceTier,
  createSoftDiscTexture
} from "./utils.js";
import { unlockAndPlayAudio } from "./audio.js";

const GRID_TIERS = {
  low: { segX: 20, segY: 26 },
  medium: { segX: 30, segY: 40 },
  high: { segX: 40, segY: 54 }
};

// Tuned for a stiff paper/cardstock feel rather than loose fabric: limited
// stretch before it snaps, and a fairly high per-iteration correction.
const PHYSICS = {
  gravity: -1500, // px/s^2, negative = downward (world space is +y up)
  damping: 0.985,
  constraintIterations: 3,
  stiffness: 0.7,
  tearStretchRatio: 2.1, // an edge snaps once stretched past 2.1x its rest length
  mouseRadiusRatio: 0.24,
  mouseStrength: 0.55,
  cutRadiusRatio: 0.035,
  tearDragRatio: 0.22, // horizontal drag distance (fraction of width) that fully drops the pins
  flickVelocity: 0.09 // px/ms — a fast flick can drop the pins early
};

function pointToSegmentDistSq(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  let t = lenSq > 1e-6 ? ((px - ax) * abx + (py - ay) * aby) / lenSq : 0;
  t = clamp(t, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
}

class ClothTearScene {
  constructor(canvas, textureUrl, { onTearStart, onComplete } = {}) {
    this.canvas = canvas;
    this.textureUrl = textureUrl;
    this.onTearStart = onTearStart;
    this.onComplete = onComplete;

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    const tier = GRID_TIERS[getDevicePerformanceTier()];
    this.segX = tier.segX;
    this.segY = tier.segY;
    this.cols = this.segX + 1;
    this.rows = this.segY + 1;
    this.count = this.cols * this.rows;

    this.dragging = false;
    this.tearStarted = false;
    this.pinsDropped = false;
    this._completed = false;
    this._dirtyIndex = false;
    this.fragments = [];
    this._lastFrame = 0;
    this.grabActive = false;
    this.grabParticles = [];
    this._grabbedIndexSet = null;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      -this.width / 2,
      this.width / 2,
      this.height / 2,
      -this.height / 2,
      -10,
      10
    );

    const texture = await new THREE.TextureLoader().loadAsync(this.textureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    const imageAspect = texture.image.width / texture.image.height;

    this._buildGrid(imageAspect);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)
    );
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(this.uv, 2));
    this._rebuildIndex();

    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.fragmentTexture = createSoftDiscTexture({ petal: false });
    this.fragmentGroup = new THREE.Group();
    this.scene.add(this.fragmentGroup);

    this.canvas.addEventListener("pointerdown", this._onPointerDown);
    window.addEventListener("pointermove", this._onPointerMove);
    window.addEventListener("pointerup", this._onPointerUp);
    window.addEventListener("pointercancel", this._onPointerUp);

    this._raf = requestAnimationFrame((t) => this._animate(t));
    return this;
  }

  _idx(x, y) {
    return y * this.cols + x;
  }

  _buildGrid(imageAspect = 1) {
    const { width, height, cols, rows, segX, segY } = this;
    const dx = width / segX;
    const dy = height / segY;
    this.dx = dx;
    this.dy = dy;

    this.pos = new Float32Array(this.count * 3);
    this.prev = new Float32Array(this.count * 3);
    this.invMass = new Float32Array(this.count).fill(1);
    this.uv = new Float32Array(this.count * 2);
    this.brokenH = new Uint8Array(segX * rows);
    this.brokenV = new Uint8Array(cols * segY);

    // Cover-fit the texture to the viewport plane (like CSS object-fit:
    // cover) instead of stretching it to whatever aspect ratio the
    // window happens to be — crop the wider axis, keep the image true.
    const containerAspect = width / height;
    let uRepeat = 1;
    let vRepeat = 1;
    if (containerAspect > imageAspect) {
      vRepeat = imageAspect / containerAspect;
    } else {
      uRepeat = containerAspect / imageAspect;
    }
    const uOffset = (1 - uRepeat) / 2;
    const vOffset = (1 - vRepeat) / 2;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = this._idx(x, y);
        const px = x * dx - width / 2;
        const py = height / 2 - y * dy;
        this.pos[i * 3] = px;
        this.pos[i * 3 + 1] = py;
        this.prev[i * 3] = px;
        this.prev[i * 3 + 1] = py;
        this.uv[i * 2] = uOffset + (x / segX) * uRepeat;
        this.uv[i * 2 + 1] = vOffset + (1 - y / segY) * vRepeat;
      }
    }

    // Pin the entire border so the sheet reads as taut, held paper at
    // rest — only the interior can bulge and tear when actually grabbed.
    for (let x = 0; x < cols; x += 1) {
      this.invMass[this._idx(x, 0)] = 0;
      this.invMass[this._idx(x, segY)] = 0;
    }
    for (let y = 0; y < rows; y += 1) {
      this.invMass[this._idx(0, y)] = 0;
      this.invMass[this._idx(segX, y)] = 0;
    }

    this.mouseRadiusPx = width * PHYSICS.mouseRadiusRatio;
    this.cutRadiusPx = Math.max(width, height) * PHYSICS.cutRadiusRatio;
  }

  _rebuildIndex() {
    const { segX, segY, cols } = this;
    const index = [];

    for (let y = 0; y < segY; y += 1) {
      for (let x = 0; x < segX; x += 1) {
        const a = this._idx(x, y);
        const b = this._idx(x, y + 1);
        const c = this._idx(x + 1, y + 1);
        const d = this._idx(x + 1, y);

        const leftBroken = this.brokenV[y * cols + x];
        const topBroken = this.brokenH[y * segX + x];
        const rightBroken = this.brokenV[y * cols + (x + 1)];
        const bottomBroken = this.brokenH[(y + 1) * segX + x];

        if (!leftBroken && !topBroken) index.push(a, b, d);
        if (!bottomBroken && !rightBroken) index.push(b, c, d);
      }
    }

    this.indexArray = new Uint32Array(index);
    this.geometry.setIndex(new THREE.BufferAttribute(this.indexArray, 1));
    this._dirtyIndex = false;
  }

  _satisfyPair(a, b, rest, stretchMaxSq, onBreak) {
    const pa = a * 3;
    const pb = b * 3;
    const dx = this.pos[pb] - this.pos[pa];
    const dy = this.pos[pb + 1] - this.pos[pa + 1];
    const distSq = dx * dx + dy * dy;

    if (distSq > stretchMaxSq) {
      onBreak();
      return;
    }

    const dist = Math.sqrt(distSq) || 0.0001;
    const diff = (dist - rest) / dist;
    const wa = this.invMass[a];
    const wb = this.invMass[b];
    const wsum = wa + wb;
    if (wsum === 0) return;

    const corrX = dx * diff * PHYSICS.stiffness;
    const corrY = dy * diff * PHYSICS.stiffness;
    const ra = wa / wsum;
    const rb = wb / wsum;

    this.pos[pa] += corrX * ra;
    this.pos[pa + 1] += corrY * ra;
    this.pos[pb] -= corrX * rb;
    this.pos[pb + 1] -= corrY * rb;
  }

  _satisfyConstraints() {
    const { segX, segY, rows, cols, dx, dy } = this;
    const stretchMaxSqH = (dx * PHYSICS.tearStretchRatio) ** 2;
    const stretchMaxSqV = (dy * PHYSICS.tearStretchRatio) ** 2;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < segX; x += 1) {
        const e = y * segX + x;
        if (this.brokenH[e]) continue;
        this._satisfyPair(this._idx(x, y), this._idx(x + 1, y), dx, stretchMaxSqH, () => {
          this.brokenH[e] = 1;
          this._dirtyIndex = true;
        });
      }
    }

    for (let y = 0; y < segY; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const e = y * cols + x;
        if (this.brokenV[e]) continue;
        this._satisfyPair(this._idx(x, y), this._idx(x, y + 1), dy, stretchMaxSqV, () => {
          this.brokenV[e] = 1;
          this._dirtyIndex = true;
        });
      }
    }
  }

  _stepPhysics(dt) {
    const g = PHYSICS.gravity;
    const damping = PHYSICS.damping;

    for (let i = 0; i < this.count; i += 1) {
      if (this.invMass[i] === 0) continue;
      if (this._grabbedIndexSet && this._grabbedIndexSet.has(i)) continue;

      const p = i * 3;
      const vx = (this.pos[p] - this.prev[p]) * damping;
      const vy = (this.pos[p + 1] - this.prev[p + 1]) * damping;
      const nx = this.pos[p] + vx;
      const ny = this.pos[p + 1] + vy + g * dt * dt;

      this.prev[p] = this.pos[p];
      this.prev[p + 1] = this.pos[p + 1];
      this.pos[p] = nx;
      this.pos[p + 1] = ny;
    }

    for (let iter = 0; iter < PHYSICS.constraintIterations; iter += 1) {
      this._satisfyConstraints();
    }

    this._applyGrabBlend();
  }

  _toWorld(clientX, clientY) {
    return { x: clientX - this.width / 2, y: this.height / 2 - clientY };
  }

  _startGrab(wx, wy) {
    this.grabActive = true;
    this.grabTarget = { x: wx, y: wy };
    this.grabParticles = [];
    this._grabbedIndexSet = new Set();

    const r2 = this.mouseRadiusPx * this.mouseRadiusPx;
    for (let i = 0; i < this.count; i += 1) {
      if (this.invMass[i] === 0) continue;
      const dx = this.pos[i * 3] - wx;
      const dy = this.pos[i * 3 + 1] - wy;
      if (dx * dx + dy * dy <= r2) {
        this.grabParticles.push({ index: i, ox: dx, oy: dy });
        this._grabbedIndexSet.add(i);
      }
    }
  }

  _applyGrabBlend() {
    if (!this.grabActive) return;
    const s = PHYSICS.mouseStrength;

    for (const particle of this.grabParticles) {
      const p = particle.index * 3;
      const tx = this.grabTarget.x + particle.ox;
      const ty = this.grabTarget.y + particle.oy;
      const beforeX = this.pos[p];
      const beforeY = this.pos[p + 1];

      this.pos[p] = lerp(beforeX, tx, s);
      this.pos[p + 1] = lerp(beforeY, ty, s);
      // Leave prev at the pre-blend position so release carries this
      // frame's motion as natural momentum (Verlet-implied velocity).
      this.prev[p] = beforeX;
      this.prev[p + 1] = beforeY;
    }
  }

  _releaseGrab() {
    this.grabActive = false;
    this.grabParticles = [];
    this._grabbedIndexSet = null;
  }

  _applyCut(fromX, fromY, toX, toY) {
    const r2 = this.cutRadiusPx * this.cutRadiusPx;
    const { segX, segY, rows, cols } = this;
    let broke = false;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < segX; x += 1) {
        const e = y * segX + x;
        if (this.brokenH[e]) continue;
        const a = this._idx(x, y);
        const b = this._idx(x + 1, y);
        const mx = (this.pos[a * 3] + this.pos[b * 3]) / 2;
        const my = (this.pos[a * 3 + 1] + this.pos[b * 3 + 1]) / 2;
        if (pointToSegmentDistSq(mx, my, fromX, fromY, toX, toY) < r2) {
          this.brokenH[e] = 1;
          broke = true;
        }
      }
    }

    for (let y = 0; y < segY; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const e = y * cols + x;
        if (this.brokenV[e]) continue;
        const a = this._idx(x, y);
        const b = this._idx(x, y + 1);
        const mx = (this.pos[a * 3] + this.pos[b * 3]) / 2;
        const my = (this.pos[a * 3 + 1] + this.pos[b * 3 + 1]) / 2;
        if (pointToSegmentDistSq(mx, my, fromX, fromY, toX, toY) < r2) {
          this.brokenV[e] = 1;
          broke = true;
        }
      }
    }

    if (broke) this._dirtyIndex = true;
  }

  _onPointerDown(event) {
    if (this.pinsDropped) return;
    const w = this._toWorld(event.clientX, event.clientY);
    this.dragging = true;
    this.dragStartX = event.clientX;
    this.lastPointer = w;
    this.lastMoveTime = performance.now();
    this.lastClientX = event.clientX;
    this.velocity = 0;
    this._startGrab(w.x, w.y);
  }

  _onPointerMove(event) {
    if (!this.dragging || this.pinsDropped) return;
    const w = this._toWorld(event.clientX, event.clientY);

    if (!this.tearStarted) {
      this.tearStarted = true;
      this.onTearStart?.();
    }

    this._applyCut(this.lastPointer.x, this.lastPointer.y, w.x, w.y);
    this.grabTarget = { x: w.x, y: w.y };

    const now = performance.now();
    const dt = Math.max(now - this.lastMoveTime, 1);
    this.velocity = (event.clientX - this.lastClientX) / dt;
    this.lastMoveTime = now;
    this.lastClientX = event.clientX;
    this.lastPointer = w;

    const dragDistance = Math.abs(event.clientX - this.dragStartX);
    if (dragDistance > this.width * PHYSICS.tearDragRatio) {
      this._dropPinsAndFling(Math.sign(event.clientX - this.dragStartX) || 1);
    }
  }

  _onPointerUp() {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.pinsDropped) return;

    const dragDistance = Math.abs((this.lastClientX ?? 0) - (this.dragStartX ?? 0));
    if (Math.abs(this.velocity) > PHYSICS.flickVelocity && dragDistance > this.width * 0.08) {
      this._dropPinsAndFling(Math.sign(this.velocity) || 1);
      return;
    }

    this._releaseGrab();
  }

  _dropPinsAndFling() {
    if (this.pinsDropped) return;
    this.pinsDropped = true;
    this._releaseGrab();

    const centerX = this.lastPointer?.x ?? 0;
    const dtNominal = 1 / 60;

    for (let i = 0; i < this.count; i += 1) {
      this.invMass[i] = 1;
      const p = i * 3;
      const side = this.pos[p] < centerX ? -1 : 1;
      const outSpeed = mapRange(Math.random(), 0, 1, 260, 560) * side;
      const upSpeed = mapRange(Math.random(), 0, 1, 60, 240);
      this.prev[p] = this.pos[p] - outSpeed * dtNominal;
      this.prev[p + 1] = this.pos[p + 1] - upSpeed * dtNominal;
    }

    this._rebuildIndex();
    this._spawnFragments(centerX, this.lastPointer?.y ?? 0);
    this.pinsDroppedAt = performance.now();
  }

  _spawnFragments(originX, originY) {
    const count = prefersReducedMotion() ? 0 : 50;
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: this.fragmentTexture,
        color: i % 2 === 0 ? 0xcc96bb : 0xe4d3ad,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(material);
      const size = mapRange(Math.random(), 0, 1, 6, 20);
      sprite.scale.set(size, size, 1);
      sprite.position.set(
        originX + (Math.random() - 0.5) * 60,
        originY + (Math.random() - 0.5) * 80,
        Math.random() * 4
      );

      const angle = Math.random() * Math.PI * 2;
      const speed = mapRange(Math.random(), 0, 1, 60, 320);
      sprite.userData.velocity = new THREE.Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed + 100);
      sprite.userData.life = 1;

      this.fragmentGroup.add(sprite);
      this.fragments.push(sprite);
    }
  }

  _updateFragments(dt) {
    this.fragments.forEach((sprite) => {
      sprite.userData.velocity.y -= 500 * dt;
      sprite.position.x += sprite.userData.velocity.x * dt;
      sprite.position.y += sprite.userData.velocity.y * dt;
      sprite.rotation.z += dt * 2;
      sprite.userData.life -= dt * 0.9;
      sprite.material.opacity = clamp(sprite.userData.life, 0, 1);
    });
  }

  forceOpen(direction = 1) {
    if (this.pinsDropped) return;
    this.onTearStart?.();
    this.lastPointer = { x: 0, y: 0 };
    this._applyCut(0, this.height / 2 + 10, 0, -this.height / 2 - 10);
    this._dropPinsAndFling(direction);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scaleX = width / this.width;
    const scaleY = height / this.height;

    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (!this.pinsDropped) {
      this.mesh.scale.set(scaleX, scaleY, 1);
    }

    this.width = width;
    this.height = height;
    this.mouseRadiusPx = width * PHYSICS.mouseRadiusRatio;
    this.cutRadiusPx = Math.max(width, height) * PHYSICS.cutRadiusRatio;
  }

  _animate(now) {
    this._raf = requestAnimationFrame((t) => this._animate(t));
    const dt = Math.min((now - (this._lastFrame || now)) / 1000, 1 / 30);
    this._lastFrame = now;

    this._stepPhysics(dt);

    if (this._dirtyIndex && !this.pinsDropped) {
      this._rebuildIndex();
    }

    this.geometry.attributes.position.needsUpdate = true;

    if (this.fragments.length) this._updateFragments(dt);

    if (this.pinsDropped && !this._completed) {
      const elapsed = performance.now() - this.pinsDroppedAt;
      if (elapsed > 700) {
        this.material.opacity = clamp(1 - (elapsed - 700) / 400, 0, 1);
      }
      if (elapsed > 1150) {
        this._completed = true;
        this.onComplete?.();
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("pointerup", this._onPointerUp);
    window.removeEventListener("pointercancel", this._onPointerUp);
    this.geometry?.dispose();
    this.material?.dispose();
    this.fragments.forEach((sprite) => sprite.material.dispose());
    this.renderer?.dispose();
  }
}

export function initEntrance({ root, canvas, hint, fallbackButton, coverImageUrl, onComplete }) {
  let completed = false;
  let tearScene = null;

  const finish = () => {
    if (completed) return;
    completed = true;
    root.classList.add("is-finished");
    window.setTimeout(() => {
      root.hidden = true;
      tearScene?.destroy();
    }, 700);
    onComplete?.();
  };

  const reducedMotion = prefersReducedMotion();
  let webglAvailable = true;
  try {
    const testCanvas = document.createElement("canvas");
    webglAvailable = !!(testCanvas.getContext("webgl2") || testCanvas.getContext("webgl"));
  } catch (error) {
    webglAvailable = false;
  }

  const useSimpleMode = reducedMotion || !webglAvailable;

  if (useSimpleMode) {
    root.classList.add("entrance--reduced");
    root.style.setProperty("--entrance-cover-image", `url(${coverImageUrl})`);
    hint?.setAttribute("hidden", "");
  } else {
    tearScene = new ClothTearScene(canvas, coverImageUrl, {
      onTearStart: () => {
        hint?.setAttribute("hidden", "");
        unlockAndPlayAudio();
      },
      onComplete: finish
    });
    tearScene.init().catch(() => {
      root.classList.add("entrance--reduced");
      root.style.setProperty("--entrance-cover-image", `url(${coverImageUrl})`);
      hint?.setAttribute("hidden", "");
    });

    window.addEventListener("resize", () => tearScene?.resize());
  }

  fallbackButton?.addEventListener("click", () => {
    unlockAndPlayAudio();
    if (tearScene && !tearScene.pinsDropped) {
      tearScene.forceOpen(1);
    } else {
      finish();
    }
  });

  return {
    destroy: () => tearScene?.destroy()
  };
}
