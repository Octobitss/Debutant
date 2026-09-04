import { useEffect, useRef } from "react";
import { ScrollTrigger } from "../animations/gsap";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Tracks overall page scroll progress (0..1) in a ref (not React state) so
 * the 3D scene can read it every frame via useFrame without triggering a
 * React re-render on every scroll tick.
 */
export function useScrollProgress() {
  const progressRef = useRef(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progressRef.current = self.progress;
      }
    });

    return () => trigger.kill();
  }, []);

  return { progressRef, reducedMotion };
}
