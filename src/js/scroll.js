// ==========================================================================
// Scroll architecture — maps page scroll to cinematic animation progress,
// drives the ambient Three.js camera, and reveals sections/parallax layers.
// ==========================================================================

import { clamp, mapRange, prefersReducedMotion } from "./utils.js";

export function initScrollAnimations({ threeScene } = {}) {
  const reducedMotion = prefersReducedMotion();
  const revealEls = document.querySelectorAll("[data-reveal]");
  const parallaxEls = document.querySelectorAll("[data-parallax]");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  revealEls.forEach((el, index) => {
    el.style.setProperty("--reveal-index", index % 6);
    revealObserver.observe(el);
  });

  let ticking = false;
  let mouseX = 0;
  let mouseY = 0;

  function getScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return maxScroll > 0 ? clamp(scrollTop / maxScroll, 0, 1) : 0;
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
