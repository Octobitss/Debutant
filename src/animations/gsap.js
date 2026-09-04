// ==========================================================================
// Single place that registers GSAP plugins — import gsap/ScrollTrigger from
// here everywhere else so registration only ever happens once.
// ==========================================================================

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const EASE = {
  cinematic: "power2.out",
  soft: "power1.inOut",
  bloom: "back.out(1.4)"
};

export { gsap, ScrollTrigger };
