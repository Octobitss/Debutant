// ==========================================================================
// Small shared helpers used across the entrance, scroll and scene modules.
// ==========================================================================

import * as THREE from "three";

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const lerp = (a, b, t) => a + (b - a) * t;

export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return lerp(outMin, outMax, t);
};

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t) => t * t * t;
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isCoarsePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(pointer: coarse)").matches;

/**
 * requestAnimationFrame-driven tween. Returns a cancel function.
 */
export function tween({ from, to, duration = 600, easing = easeOutCubic, onUpdate, onComplete }) {
  const start = performance.now();
  let raf = null;

  const step = (now) => {
    const elapsed = now - start;
    const t = clamp(elapsed / duration, 0, 1);
    const eased = easing(t);
    const value = lerp(from, to, eased);
    onUpdate?.(value, t);

    if (t < 1) {
      raf = requestAnimationFrame(step);
    } else {
      onComplete?.();
    }
  };

  raf = requestAnimationFrame(step);
  return () => raf && cancelAnimationFrame(raf);
}

export function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

export function debounce(fn, wait = 150) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export function getDevicePerformanceTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const coarse = isCoarsePointer();

  if (cores <= 4 && (memory <= 4 || coarse)) return "low";
  if (cores <= 6) return "medium";
  return "high";
}

/**
 * A soft radial sprite used for both the ambient petal field and the
 * entrance tear fragments — generated once on a canvas so no binary
 * texture asset is required for these purely decorative particles.
 */
export function createSoftDiscTexture({ petal = true } = {}) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.85)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  if (petal) {
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2, size * 0.5, size * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
