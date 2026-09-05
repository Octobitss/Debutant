import { useEffect, useRef } from "react";
import { gsap } from "../../animations/gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SITE_CONFIG } from "../../config/siteConfig";
import "./OutroScene.scss";

export default function OutroScene() {
  const sectionRef = useRef(null);
  const messageRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(messageRef.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        messageRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: { trigger: messageRef.current, start: "top 85%", end: "top 55%", scrub: 1 }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="outro-scene" ref={sectionRef} aria-label="Closing">
      <div className="outro-scene__spacer" aria-hidden="true" />

      <div className="outro-scene__message" ref={messageRef}>
        <p className="outro-scene__thanks">Thank you for being part of my story.</p>
        <p className="outro-scene__signoff">
          With love,
          <br />
          {SITE_CONFIG.debutantName}
        </p>
      </div>

      <footer className="outro-scene__footer">
        <p>
          {SITE_CONFIG.title} &middot; {SITE_CONFIG.tagline}
        </p>
        <p className="outro-scene__credit">
          Made by{" "}
          <a href="https://opnexus.tech" target="_blank" rel="noopener noreferrer">
            opnexus.tech
          </a>
        </p>
      </footer>
    </section>
  );
}
