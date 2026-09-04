import { useEffect, useRef } from "react";
import { gsap } from "../../animations/gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SITE_CONFIG } from "../../config/siteConfig";
import Button from "../../components/ui/Button.jsx";
import "./RsvpScene.scss";

export default function RsvpScene() {
  const sectionRef = useRef(null);
  const dateRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(dateRef.current, { opacity: 1, scale: 1 });
        return;
      }

      // One timeline driven by one ScrollTrigger — not two independent
      // scrubbed tweens sharing `opacity`, which raced each other
      // depending on scroll direction (confirmed elsewhere: the same
      // scroll position rendered opposite opacity values depending on
      // whether it was reached by scrolling down vs. up).
      const tl = gsap.timeline({
        scrollTrigger: { trigger: dateRef.current, start: "top 80%", end: "top -20%", scrub: 1 }
      });
      tl.fromTo(
        dateRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, ease: "back.out(1.3)", duration: 0.3 }
      )
        .to(dateRef.current, { opacity: 1, scale: 1, duration: 0.3 })
        .to(dateRef.current, { opacity: 0, ease: "power1.in", duration: 0.4 });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="rsvp-scene" ref={sectionRef} aria-label="RSVP">
      <p className="section-kicker">Save the Date</p>
      <h2 className="rsvp-scene__date" ref={dateRef}>
        {SITE_CONFIG.event.displayDate}
      </h2>
      <p className="rsvp-scene__time">{SITE_CONFIG.event.displayTime}</p>

      <h3 className="rsvp-scene__title">Will You Join Us?</h3>
      <p className="rsvp-scene__copy">A garden of dreams, magic, and unforgettable memories awaits.</p>

      <Button
        as="a"
        variant="primary"
        className="rsvp-scene__cta"
        href={SITE_CONFIG.rsvp.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        RSVP
      </Button>

      <p className="rsvp-scene__note">Kindly respond by two weeks before the celebration.</p>
    </section>
  );
}
