// ==========================================================================
// Ambient audio architecture — inert until a real user gesture unlocks it.
// No autoplay: initAudio() only wires things up; play() must follow a
// click/tap. Disabled entirely while AUDIO_CONFIG.enabled is false.
// ==========================================================================

import { AUDIO_CONFIG } from "./config.js";

let audioEl = null;
let unlocked = false;

export function initAudio() {
  if (!AUDIO_CONFIG.enabled || audioEl) return;

  audioEl = new Audio(AUDIO_CONFIG.source);
  audioEl.loop = true;
  audioEl.preload = "none";
  audioEl.volume = AUDIO_CONFIG.volume;
}

/** Call this from inside a trusted user-gesture handler (e.g. tear release). */
export function unlockAndPlayAudio() {
  if (!AUDIO_CONFIG.enabled || !audioEl || unlocked) return;
  unlocked = true;

  audioEl.play().catch(() => {
    // Autoplay policies may still refuse silently — fail gracefully.
    unlocked = false;
  });
}

export function toggleAudio() {
  if (!audioEl) return;
  if (audioEl.paused) {
    audioEl.play().catch(() => {});
  } else {
    audioEl.pause();
  }
}

export function isAudioEnabled() {
  return AUDIO_CONFIG.enabled;
}
