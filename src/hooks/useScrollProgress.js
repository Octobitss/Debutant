import { useEffect, useRef } from "react";
import { ScrollTrigger } from "../animations/gsap";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

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
