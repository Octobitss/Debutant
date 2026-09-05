import { useEffect, useRef } from "react";
import { gsap } from "../../animations/gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
import { SITE_CONFIG } from "../../config/siteConfig";
import "./MirrorScene.scss";

const [TITLE_NAME, TITLE_NUMERAL] = SITE_CONFIG.title.split(" @ ");

export default function MirrorScene() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobileViewport();

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
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            // Mobile-only: fade out over a short, viewport-relative distance so the caption
            // clears the frame before the camera dollies into the mirror. Desktop keeps the
            // original section-relative fade.
            end: isMobile ? () => `+=${Math.round(window.innerHeight * 0.35)}` : "40% top",
            scrub: 1
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion, isMobile]);

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
