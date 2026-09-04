import { gsap } from "./gsap.js";

export function revealOnScroll(el, { x = 0, y = 30, fadeOut = true } = {}) {
  if (!el) return;

  const outY = -Math.max(20, Math.abs(y) * 0.6);

  if (!fadeOut) {
    gsap.fromTo(
      el,
      { opacity: 0, x, y },
      {
        opacity: 1,
        x: 0,
        y: 0,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 82%", end: "top 50%", scrub: 1 }
      }
    );
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: { trigger: el, start: "top 82%", end: "top -10%", scrub: 1 }
  });

  tl.fromTo(el, { opacity: 0, x, y }, { opacity: 1, x: 0, y: 0, ease: "power2.out", duration: 0.35 })
    .to(el, { opacity: 1, duration: 0.3 })
    .to(el, { opacity: 0, y: outY, ease: "power1.in", duration: 0.35 });
}
