import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "../animations/gsap";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useMobilePerformance } from "./useIsMobileViewport";

export function useLenis() {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useMobilePerformance();
  const lenisRef = useRef(null);

  useEffect(() => {
    if (reducedMotion || isMobile) return undefined;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion, isMobile]);

  return lenisRef;
}
