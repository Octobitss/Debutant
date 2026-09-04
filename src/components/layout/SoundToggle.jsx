import { useRef, useState } from "react";
import { AUDIO_CONFIG } from "../../config/siteConfig";
import "./SoundToggle.scss";

/**
 * Ambient audio architecture — inert until a real user gesture unlocks it,
 * and only rendered at all once AUDIO_CONFIG.enabled + a real source exist.
 * No autoplay: playback only ever starts from this click handler.
 */
export default function SoundToggle() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  if (!AUDIO_CONFIG.enabled) return null;

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(AUDIO_CONFIG.source);
      audioRef.current.loop = true;
      audioRef.current.volume = AUDIO_CONFIG.volume;
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <button
      type="button"
      className={`sound-toggle${playing ? " sound-toggle--playing" : ""}`}
      onClick={toggle}
      aria-pressed={playing}
    >
      {playing ? "Sound On" : "Sound Off"}
    </button>
  );
}
