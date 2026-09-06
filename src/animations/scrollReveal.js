import { gsap } from "./gsap.js";

export function revealOnScroll(el, { y = 30 } = {}) {
  if (!el) return;

  return gsap.fromTo(
    el,
    { y },
    {
      y: 0,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 100%", end: "top 65%", scrub: 1 }
    }
  );
}
