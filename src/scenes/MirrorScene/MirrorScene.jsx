import { useEffect, useRef } from "react";
import { revealOnScroll } from "../../animations/scrollReveal";
import { gsap } from "../../animations/gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SITE_CONFIG } from "../../config/siteConfig";
import "./MirrorScene.scss";

const [TITLE_NAME, TITLE_NUMERAL] = SITE_CONFIG.title.split(" @ ");

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

      revealOnScroll(titleRef.current);
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="mirror-scene" ref={sectionRef} aria-label="Approaching the mirror">
      <div className="mirror-scene__content" ref={titleRef}>
        <p className="section-kicker">{SITE_CONFIG.tagline}</p>
        <h1 className="mirror-scene__heading">
          <span className="mirror-scene__heading-name">{TITLE_NAME}</span>
          {TITLE_NUMERAL && (
            <>
              <span className="mirror-scene__heading-at">@</span>
              <span className="mirror-scene__heading-numeral">{TITLE_NUMERAL}</span>
            </>
          )}
        </h1>
      </div>

      <div className="mirror-scene__scroll-cue" aria-hidden="true">
        <span />
        <span>Scroll</span>
      </div>
    </section>
  );
}
