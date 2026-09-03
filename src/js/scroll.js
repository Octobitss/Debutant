// ==========================================================================
// Scroll architecture — maps page scroll to cinematic animation progress.
// Section reveals are continuously scrubbed from scroll position (not a
// one-shot transition fired by an IntersectionObserver): as an element
// travels through the lower half of the viewport its opacity/transform
// are driven directly from how far it has traveled, the same way a
// scroll-driven cinematic scene plays out frame-by-frame rather than
// cross-fading once and stopping.
// ==========================================================================

import { clamp, lerp, mapRange, prefersReducedMotion } from "./utils.js";

const REVEAL_VARIANTS = {
  default: { y: 130, x: 0, scale: 0.94 },
  fade: { y: 0, x: 0, scale: 1 },
  left: { y: 0, x: -190, scale: 1 },
  right: { y: 0, x: 190, scale: 1 },
  scale: { y: 50, x: 0, scale: 0.72 }
};

function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function initScrollAnimations({ threeScene } = {}) {
  const reducedMotion = prefersReducedMotion();
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  const parallaxEls = document.querySelectorAll("[data-parallax]");

  document.querySelector(".hero")?.classList.add("is-revealed");

  if (reducedMotion) {
    revealEls.forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
  }

  let ticking = false;
  let mouseX = 0;
  let mouseY = 0;

  function getScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return maxScroll > 0 ? clamp(scrollTop / maxScroll, 0, 1) : 0;
  }

  function updateReveals() {
    if (reducedMotion) return;
    const viewportH = window.innerHeight;
    // Cap the horizontal travel to a fraction of the viewport so a
    // full-width block on a narrow screen never gets pushed past the
    // edge and widens the page's scrollable area.
    const maxX = window.innerWidth * 0.3;

    revealEls.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const variant = REVEAL_VARIANTS[el.dataset.reveal] || REVEAL_VARIANTS.default;
      const stagger = (index % 5) * 34;

      // Element starts animating in once its top crosses ~92% down the
      // viewport, and finishes settling once it reaches ~42% up — a wide
      // window so the motion reads as a continuous scroll-scrubbed
      // entrance rather than a snap.
      const enterAt = viewportH * 0.92 + stagger;
      const settleAt = viewportH * 0.42;
      const eased = smoothstep(mapRange(rect.top, settleAt, enterAt, 1, 0));

      const startX = clamp(variant.x, -maxX, maxX);
      const ty = lerp(variant.y, 0, eased);
      const tx = lerp(startX, 0, eased);
      const sc = lerp(variant.scale, 1, eased);

      el.style.opacity = eased.toFixed(3);
      el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
    });
  }

  function updateParallax() {
    if (reducedMotion) return;
    const viewportH = window.innerHeight;

    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      const rect = el.getBoundingClientRect();
      const centerDelta = rect.top + rect.height / 2 - viewportH / 2;
      const offset = mapRange(centerDelta, -viewportH, viewportH, 40, -40) * speed * 4;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });
  }

  function onFrame() {
    ticking = false;
    const progress = getScrollProgress();
    threeScene?.updateScroll(progress);
    updateReveals();
    updateParallax();
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onFrame);
    }
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", () => {
    threeScene?.resize();
    requestTick();
  });

  if (!reducedMotion) {
    window.addEventListener(
      "pointermove",
      (event) => {
        mouseX = mapRange(event.clientX, 0, window.innerWidth, -1, 1);
        mouseY = mapRange(event.clientY, 0, window.innerHeight, -1, 1);
        threeScene?.updateMouse(mouseX, mouseY);
      },
      { passive: true }
    );
  }

  requestTick();
}
