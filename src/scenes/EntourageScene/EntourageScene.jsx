import { useEffect, useRef } from "react";
import { gsap } from "../../animations/gsap";
import { revealOnScroll } from "../../animations/scrollReveal";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SITE_CONFIG } from "../../config/siteConfig";
import "./EntourageScene.scss";

export default function EntourageScene() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const groupRefs = useRef([]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const groups = groupRefs.current.filter(Boolean);

      if (reducedMotion) {
        gsap.set([headerRef.current, ...groups], { opacity: 1, x: 0, y: 0 });
        return;
      }

      revealOnScroll(headerRef.current);
      groups.forEach((el) => {
        revealOnScroll(el);
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="entourage-scene" ref={sectionRef} aria-label="Entourage">
      <div className="entourage-scene__header" ref={headerRef}>
        <p className="section-kicker">With Gratitude</p>
        <h2 className="section-title">The Entourage</h2>
        <p>The beautiful people standing beside me as I turn eighteen.</p>
      </div>

      <div className="entourage-scene__groups">
        {SITE_CONFIG.entourage.map((group, index) => (
          <div
            className="entourage-group"
            key={group.key}
            ref={(el) => {
              groupRefs.current[index] = el;
            }}
          >
            <p className="entourage-group__label">
              {group.title}
              {group.subtitle ? <span className="entourage-group__subtitle"> &middot; {group.subtitle}</span> : null}
            </p>
            <ol className="entourage-group__list">
              {group.names.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
