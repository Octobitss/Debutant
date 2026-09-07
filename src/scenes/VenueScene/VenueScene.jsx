import { useEffect, useRef } from "react";
import { gsap } from "../../animations/gsap";
import { revealOnScroll } from "../../animations/scrollReveal";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SITE_CONFIG } from "../../config/siteConfig";
import MapEmbed from "../../components/ui/MapEmbed.jsx";
import "./VenueScene.scss";

export default function VenueScene() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const mapRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set([headerRef.current, mapRef.current], { opacity: 1, y: 0 });
        return;
      }

      revealOnScroll(headerRef.current);
      revealOnScroll(mapRef.current);
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="venue-scene" ref={sectionRef} aria-label="Venue">
      <div className="venue-scene__header" ref={headerRef}>
        <p className="section-kicker">The Venue</p>
        <h2 className="section-title">{SITE_CONFIG.venue.name}</h2>
        <div className="venue-scene__meta-wrapper">
                  <p>{SITE_CONFIG.venue.address}</p>
        <p className="venue-scene__meta">
          {SITE_CONFIG.event.displayDate} &middot; {SITE_CONFIG.event.displayTime}
        </p>
        </div>
      </div>

      <div className="venue-scene__spacer" aria-hidden="true" />

      <div className="venue-scene__map" ref={mapRef}>
        <p className="section-kicker">Find Your Way</p>
        <h2 className="section-title">Getting There</h2>
        <MapEmbed />
      </div>
    </section>
  );
}
