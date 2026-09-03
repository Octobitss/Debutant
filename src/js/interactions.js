// ==========================================================================
// Small, purposeful UI interactions that don't belong in the Three.js layer.
// ==========================================================================

import { mapRange, prefersReducedMotion, isCoarsePointer } from "./utils.js";
import { AUDIO_CONFIG } from "./config.js";
import { toggleAudio } from "./audio.js";

function initHeroTilt() {
  const frame = document.querySelector("[data-tilt]");
  if (!frame || prefersReducedMotion() || isCoarsePointer()) return;

  const strength = 10;

  frame.addEventListener("pointermove", (event) => {
    const rect = frame.getBoundingClientRect();
    const rx = mapRange(event.clientY, rect.top, rect.bottom, strength, -strength);
    const ry = mapRange(event.clientX, rect.left, rect.right, -strength, strength);
    frame.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  frame.addEventListener("pointerleave", () => {
    frame.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
}

function initAudioToggle() {
  const toggle = document.querySelector("[data-audio-toggle]");
  if (!toggle) return;

  if (!AUDIO_CONFIG.enabled) {
    toggle.hidden = true;
    return;
  }

  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    toggleAudio();
    toggle.classList.toggle("is-playing");
  });
}

function initTouchFlag() {
  if (isCoarsePointer()) {
    document.body.classList.add("has-touch");
  }
}

export function initInteractions() {
  initHeroTilt();
  initAudioToggle();
  initTouchFlag();
}
