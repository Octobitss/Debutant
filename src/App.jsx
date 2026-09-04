import { useEffect, useState } from "react";
import { useLenis } from "./hooks/useLenis";
import { useScrollProgress } from "./hooks/useScrollProgress";
import { ScrollTrigger } from "./animations/gsap";
import LoadingScreen from "./components/layout/LoadingScreen.jsx";
import FixedCountdown from "./components/layout/FixedCountdown.jsx";
import SoundToggle from "./components/layout/SoundToggle.jsx";
import SpotifyPlayer from "./components/layout/SpotifyPlayer.jsx";
import SceneEnvironment from "./three/SceneEnvironment.jsx";
import MirrorScene from "./scenes/MirrorScene/MirrorScene.jsx";
import GardenScene from "./scenes/GardenScene/GardenScene.jsx";
import VenueScene from "./scenes/VenueScene/VenueScene.jsx";
import DressCodeScene from "./scenes/DressCodeScene/DressCodeScene.jsx";
import RsvpScene from "./scenes/RsvpScene/RsvpScene.jsx";
import OutroScene from "./scenes/OutroScene/OutroScene.jsx";

const MIN_LOADING_MS = 900;

export default function App() {
  useLenis();
  const { progressRef, reducedMotion } = useScrollProgress();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const minDelay = new Promise((resolve) => window.setTimeout(resolve, MIN_LOADING_MS));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    Promise.all([fontsReady, minDelay]).then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [ready]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <LoadingScreen visible={!ready} />
      <SceneEnvironment progressRef={progressRef} reducedMotion={reducedMotion} />
      <FixedCountdown />
      <SoundToggle />
      <SpotifyPlayer />
      <main id="main-content" style={{ opacity: ready ? 1 : 0, transition: "opacity 0.6s ease" }}>
        <MirrorScene />
        <GardenScene />
        <VenueScene />
        <DressCodeScene />
        <RsvpScene />
        <OutroScene />
      </main>
    </>
  );
}
