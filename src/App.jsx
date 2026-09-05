import { Suspense, lazy, useEffect, useState } from "react";
import { useLenis } from "./hooks/useLenis";
import { useScrollProgress } from "./hooks/useScrollProgress";
import { ScrollTrigger } from "./animations/gsap";
import LoadingScreen from "./components/layout/LoadingScreen.jsx";
import FixedCountdown from "./components/layout/FixedCountdown.jsx";
import SoundToggle from "./components/layout/SoundToggle.jsx";
import MusicPlayer from "./components/layout/MusicPlayer.jsx";

const SceneEnvironment = lazy(() => import("./three/SceneEnvironment.jsx"));
const MirrorScene = lazy(() => import("./scenes/MirrorScene/MirrorScene.jsx"));
const GardenScene = lazy(() => import("./scenes/GardenScene/GardenScene.jsx"));
const VenueScene = lazy(() => import("./scenes/VenueScene/VenueScene.jsx"));
const EntourageScene = lazy(() => import("./scenes/EntourageScene/EntourageScene.jsx"));
const DressCodeScene = lazy(() => import("./scenes/DressCodeScene/DressCodeScene.jsx"));
const RsvpScene = lazy(() => import("./scenes/RsvpScene/RsvpScene.jsx"));
const OutroScene = lazy(() => import("./scenes/OutroScene/OutroScene.jsx"));

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
      {!reducedMotion && (
        <Suspense fallback={null}>
          <SceneEnvironment progressRef={progressRef} reducedMotion={reducedMotion} />
        </Suspense>
      )}
      <FixedCountdown />
      <SoundToggle />
      <MusicPlayer />
      <main id="main-content" style={{ opacity: ready ? 1 : 0, transition: "opacity 0.6s ease" }}>
        <Suspense fallback={null}>
          <MirrorScene />
          <GardenScene />
          <VenueScene />
          <EntourageScene />
          <DressCodeScene />
          <RsvpScene />
          <OutroScene />
        </Suspense>
      </main>
    </>
  );
}
