import { useState } from "react";
import { SPOTIFY_CONFIG } from "../../config/siteConfig";
import "./SpotifyPlayer.scss";

export default function SpotifyPlayer() {
  const [dismissed, setDismissed] = useState(false);

  if (!SPOTIFY_CONFIG.enabled || dismissed) return null;

  return (
    <div className="spotify-player">
      <button
        type="button"
        className="spotify-player__close"
        onClick={() => setDismissed(true)}
        aria-label="Close music player"
      >
        &times;
      </button>
      <iframe
        title="Now Playing"
        src={`https://open.spotify.com/embed/track/${SPOTIFY_CONFIG.trackId}?utm_source=generator&theme=0&autoplay=1`}
        width="100%"
        height="152"
        style={{ borderRadius: 12 }}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
