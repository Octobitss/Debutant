// ==========================================================================
// Countdown — reads EVENT_CONFIG.date only. Ticks every second.
// ==========================================================================

import { EVENT_CONFIG } from "./config.js";

const UNITS = ["days", "hours", "minutes", "seconds"];

function diffToUnits(target) {
  const diff = Math.max(target - Date.now(), 0);
  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isComplete: diff <= 0
  };
}

export function initCountdown(root) {
  if (!root) return;

  const targetDate = new Date(EVENT_CONFIG.date).getTime();
  const valueEls = Object.fromEntries(
    UNITS.map((unit) => [unit, root.querySelector(`[data-countdown="${unit}"]`)])
  );
  const gridEl = root.querySelector("[data-countdown-grid]");
  const completeEl = root.querySelector("[data-countdown-complete]");
  const previous = { days: null, hours: null, minutes: null, seconds: null };

  function render() {
    const values = diffToUnits(targetDate);

    if (values.isComplete) {
      if (gridEl) gridEl.hidden = true;
      if (completeEl) completeEl.hidden = false;
      clearInterval(intervalId);
      return;
    }

    UNITS.forEach((unit) => {
      const el = valueEls[unit];
      if (!el) return;
      const formatted = String(values[unit]).padStart(2, "0");
      if (previous[unit] !== formatted) {
        el.textContent = formatted;
        el.classList.add("is-tick");
        window.setTimeout(() => el.classList.remove("is-tick"), 320);
        previous[unit] = formatted;
      }
    });
  }

  render();
  const intervalId = window.setInterval(render, 1000);

  return () => clearInterval(intervalId);
}
