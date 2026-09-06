import { useEffect, useRef } from "react";
import { gsap } from "../../animations/gsap";
import { revealOnScroll } from "../../animations/scrollReveal.js";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SITE_CONFIG } from "../../config/siteConfig";
import "./GardenScene.scss";

export default function GardenScene() {
  const sectionRef = useRef(null);
  const paragraphRefs = useRef([]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const paragraphs = paragraphRefs.current.filter(Boolean);

      if (reducedMotion) {
        gsap.set(paragraphs, { opacity: 1, y: 0 });
        return;
      }

      paragraphs.forEach((el) => {
        revealOnScroll(el);
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="garden-scene" ref={sectionRef} aria-label="A whimsical garden of memories">
      <p className="section-kicker garden-scene__kicker">The Story</p>
      <div className="garden-scene__letter">
        {SITE_CONFIG.letter.map((paragraph, index) => (
          <p
            key={paragraph.slice(0, 12)}
            className="garden-scene__paragraph"
            ref={(el) => {
              paragraphRefs.current[index] = el;
            }}
          >
            {paragraph}
          </p>
        ))}
        {/* <p
          className="garden-scene__signoff"
          ref={(el) => {
            paragraphRefs.current[SITE_CONFIG.letter.length] = el;
          }}
        >
          With love,
          <br />
          {SITE_CONFIG.debutantName}
        </p> */}
      </div>
    </section>
  );
}
