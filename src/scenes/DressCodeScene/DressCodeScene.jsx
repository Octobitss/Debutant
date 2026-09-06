import { useEffect, useRef } from "react";
import { gsap } from "../../animations/gsap";
import { revealOnScroll } from "../../animations/scrollReveal";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SITE_CONFIG } from "../../config/siteConfig";
import "./DressCodeScene.scss";

export default function DressCodeScene() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const womenRef = useRef(null);
  const menRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set([headerRef.current, womenRef.current, menRef.current], { opacity: 1, x: 0, y: 0 });
        return;
      }

      revealOnScroll(headerRef.current);
      revealOnScroll(womenRef.current);
      revealOnScroll(menRef.current);
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="dresscode-scene" ref={sectionRef} aria-label="Dress code">
      <div className="dresscode-scene__header" ref={headerRef}>
        <p className="section-kicker">What to Wear</p>
        <h2 className="section-title">Dress Code</h2>
        <p>Dress in the palette of the garden — dusty rose, orchid mauve, and deep plum.</p>
        <img
          className="dresscode-scene__palette"
          src="/assets/images/color-palette.webp"
          alt="Dress code color palette"
        />
      </div>

      <div className="dresscode-scene__grid">
        <div className="dresscode-note dresscode-note--women" ref={womenRef}>
          <p className="dresscode-note__label">Women</p>
          <h3 className="dresscode-note__title">Elegant &amp; Formal</h3>
          <p className="dresscode-note__copy">{SITE_CONFIG.dressCode.women}</p>
        </div>

        <div className="dresscode-note dresscode-note--men" ref={menRef}>
          <p className="dresscode-note__label">Men</p>
          <h3 className="dresscode-note__title">Formal &amp; Semi-Formal</h3>
          <p className="dresscode-note__copy">{SITE_CONFIG.dressCode.men}</p>
        </div>
      </div>

      <p className="dresscode-scene__extra-note">{SITE_CONFIG.dressCode.note}</p>
    </section>
  );
}
