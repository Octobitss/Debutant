import { useEffect, useRef, useState } from "react";
import "./MusicPlayer.scss";

const TRACK_URL = "/assets/music/Sometimes.mp3";
const ARTIST_IMAGE = "/assets/music/authorimage.png";
const TRACK_TITLE = "Sometimes by Ariana Grande";
const DEFAULT_VOLUME = 0.5;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const attemptPlay = () => audio.play().then(() => setPlaying(true));

    const onFirstInteraction = () => {
      attemptPlay().catch(() => {});
    };

    attemptPlay().catch(() => {
      window.addEventListener("pointerdown", onFirstInteraction, { once: true });
      window.addEventListener("keydown", onFirstInteraction, { once: true });
    });

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    const next = Number(event.target.value);
    if (audio) audio.currentTime = next;
    setCurrentTime(next);
  };

  const handleVolume = (event) => {
    setVolume(Number(event.target.value));
  };

  return (
    <div className={`music-player${playing ? " music-player--playing" : ""}`}>
      <audio ref={audioRef} src={TRACK_URL} preload="metadata" loop />

      <img className="music-player__art" src={ARTIST_IMAGE} alt="" aria-hidden="true" />

      <div className="music-player__body">
        <div className="music-player__row">
          <button
            type="button"
            className="music-player__play"
            onClick={togglePlay}
            aria-label={playing ? "Pause music" : "Play music"}
            aria-pressed={playing}
          >
            {playing ? (
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <rect x="2" y="1" width="4" height="14" rx="1" fill="currentColor" />
                <rect x="10" y="1" width="4" height="14" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path d="M3 1.5v13l11-6.5-11-6.5z" fill="currentColor" />
              </svg>
            )}
          </button>
          <p className="music-player__title">{TRACK_TITLE}</p>
        </div>

        <div className="music-player__seek-row">
          <span className="music-player__time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="music-player__seek"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek track position"
          />
          <span className="music-player__time">{formatTime(duration)}</span>
        </div>

        <div className="music-player__volume-row">
          <svg className="music-player__volume-icon" viewBox="0 0 20 20" width="13" height="13" aria-hidden="true">
            <path
              d="M3 7v6h3.5L11 17V3L6.5 7H3z M13.5 6.5a5 5 0 0 1 0 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="range"
            className="music-player__volume"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolume}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
