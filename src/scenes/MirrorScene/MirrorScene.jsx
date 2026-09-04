import { useEffect, useRef } from "react";
import { gsap } from "../../animations/gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SITE_CONFIG } from "../../config/siteConfig";
import "./MirrorScene.scss";

export default function MirrorScene() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(titleRef.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, ease: "power2.out", duration: 1.2, delay: 0.3 }
      );

      gsap.fromTo(
        titleRef.current,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -40,
          ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "40% top", scrub: 1 }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="mirror-scene" ref={sectionRef} aria-label="Approaching the mirror">
      <div className="mirror-scene__content" ref={titleRef}>
        <p className="section-kicker">{SITE_CONFIG.tagline}</p>
        <h1 className="mirror-scene__heading">{SITE_CONFIG.title}</h1>
      </div>

      <div className="mirror-scene__scroll-cue" aria-hidden="true">
        <span />
        <span>Scroll</span>
      </div>
    </section>
  );
}
