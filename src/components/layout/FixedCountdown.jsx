import { useCountdown } from "../../hooks/useCountdown";
import { SITE_CONFIG } from "../../config/siteConfig";
import "./FixedCountdown.scss";

function pad(n) {
  return String(n).padStart(2, "0");
}

export default function FixedCountdown() {
  const { days, hours, minutes, seconds, isComplete } = useCountdown(SITE_CONFIG.event.date);

  return (
    <div className="fixed-countdown" role="timer" aria-live="off">
      {isComplete ? (
        <p className="fixed-countdown__complete">The garden has bloomed.</p>
      ) : (
        <ul className="fixed-countdown__list">
          <li>
            <span className="fixed-countdown__value">{pad(days)}</span>
            <span className="fixed-countdown__label">Days</span>
          </li>
          <li>
            <span className="fixed-countdown__value">{pad(hours)}</span>
            <span className="fixed-countdown__label">Hrs</span>
          </li>
          <li>
            <span className="fixed-countdown__value">{pad(minutes)}</span>
            <span className="fixed-countdown__label">Min</span>
          </li>
          <li>
            <span className="fixed-countdown__value">{pad(seconds)}</span>
            <span className="fixed-countdown__label">Sec</span>
          </li>
        </ul>
      )}
    </div>
  );
}
