import { gsap } from "./gsap.js";

/**
 * Fades an element in as it scrolls into view, then fades it back out
 * before it would otherwise scroll up and sit fully-opaque behind the
 * fixed countdown header. Every scene's text should use this rather than
 * a bare fade-in — a fade-in with no matching fade-out reliably ends up
 * garbling with the countdown once the user keeps scrolling past it.
 *
 * This is one GSAP timeline driven by one ScrollTrigger, not two separate
 * scrubbed tweens sharing the same `opacity`/`y` properties — two
 * independent scrubbed tweens on the same property raced each other
 * depending on scroll direction (confirmed: the same scroll position
 * rendered a paragraph at opacity 1 when reached by scrolling down, and
 * opacity 0 reached by scrolling up). A single timeline's progress is a
 * pure function of scroll position, so it's identical either direction.
 */
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
