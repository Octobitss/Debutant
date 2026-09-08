import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useMobilePerformance } from "../hooks/useIsMobileViewport.js";
import CameraRig from "./CameraRig.jsx";
import MirrorMesh from "./MirrorMesh.jsx";
import MirrorModel from "./MirrorModel.jsx";
import PhotoPlane from "./PhotoPlane.jsx";
import OceanFloor from "./OceanFloor.jsx";
import WaterLilyScatter from "./WaterLilyScatter.jsx";
import DebutanteGallery from "./DebutanteGallery.jsx";
import ObjPillar from "./ObjPillar.jsx";
import Pillars from "./Pillars.jsx";
import CloudField from "./CloudField.jsx";
import OldTree from "./OldTree.jsx";
import FallingLilies from "./FallingLilies.jsx";
import { DEPTHS } from "./cameraPath.js";

const FOG_STOPS = [
  { t: 0, color: "#a08a9c" },
  { t: 0.08, color: "#ab97a5" },
  { t: 0.13, color: "#f4e6da" },
  { t: 0.18, color: "#b6a0b0" },
  { t: 0.3, color: "#a3b09e" },
  { t: 0.45, color: "#ac9aa7" },
  { t: 0.65, color: "#a89aa0" },
  { t: 0.79, color: "#b3a0ac" },
  { t: 1, color: "#8f7d8b" }
].map((stop) => ({ ...stop, color: new THREE.Color(stop.color) }));

function sampleColor(progress, target) {
  if (progress <= FOG_STOPS[0].t) return target.set(FOG_STOPS[0].color);
  for (let i = 0; i < FOG_STOPS.length - 1; i += 1) {
    const a = FOG_STOPS[i];
    const b = FOG_STOPS[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const localT = (progress - a.t) / (b.t - a.t || 1);
      return target.copy(a.color).lerp(b.color, localT);
    }
  }
  return target.set(FOG_STOPS[FOG_STOPS.length - 1].color);
}

function FogController({ progressRef }) {
  const { scene } = useThree();
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    sampleColor(progressRef.current, tmp);
    if (scene.fog) scene.fog.color.lerp(tmp, 0.08);
    if (!scene.background) scene.background = new THREE.Color();
    scene.background.lerp(tmp, 0.08);
  });

  return null;
}

function DeferredMount({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 600));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = schedule(() => setReady(true), { timeout: 1200 });
    return () => cancel(id);
  }, []);

  if (!ready) return null;
  return children;
}

function SceneContents({ progressRef, reducedMotion }) {
  return (
    <>
      <fogExp2 attach="fog" args={["#a08a9c", 0.028]} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#e3bfd8", "#4e3b4a", 0.6]} />
      <directionalLight position={[3, 4, 6]} intensity={1.4} color="#f8ece7" />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#cc96bb" />

      <CameraRig progressRef={progressRef} reducedMotion={reducedMotion} />
      <FogController progressRef={progressRef} />

      <Suspense fallback={null}>
        <MirrorModel
          position={[0, 0, DEPTHS.mirror]}
          scale={0.85}
          progressRef={progressRef}
          computeState={(p) => {
            const distortion = Math.sin(THREE.MathUtils.clamp((p - 0.09) / 0.05, 0, 1) * Math.PI);
            const opacity = 1 - THREE.MathUtils.smoothstep(p, 0.11, 0.16);
            return { distortion, opacity };
          }}
        />

        <MirrorMesh
          position={[0, 0.6, DEPTHS.outroMirror]}
          scale={0.6}
          progressRef={progressRef}
          computeState={(p) => ({
            distortion: 0,
            opacity: THREE.MathUtils.smoothstep(p, 0.9, 0.97) * 0.5
          })}
        />

        {!reducedMotion && (
          <DeferredMount>
            <OceanFloor />
            <WaterLilyScatter zStart={DEPTHS.gardenStart + 8} zEnd={-72} />
            <Pillars />
            <OldTree />
            <CloudField />
            <FallingLilies />
          </DeferredMount>
        )}
        <DebutanteGallery />

        <ObjPillar x={-1.8} z={DEPTHS.venue[0]} topY={0.2 - 0.6 - 0.2} minScale={1.72} />
        <PhotoPlane
          textureUrl="/assets/images/venue-1.webp"
          position={[-1.8, 0.2, DEPTHS.venue[0]]}
          rotation={[0, 0.25, 0]}
          size={[1.8, 1.2]}
        />
        <ObjPillar x={1.8} z={DEPTHS.venue[1]} topY={-0.3 - 0.6 - 0.2} minScale={1.72} />
        <PhotoPlane
          textureUrl="/assets/images/venue-2.webp"
          position={[1.8, -0.3, DEPTHS.venue[1]]}
          rotation={[0, -0.25, 0]}
          size={[1.8, 1.2]}
        />

        <ObjPillar x={-1.8} z={DEPTHS.dresscode[0]} topY={-1 - 0.2} minScale={1.42} />
        <PhotoPlane
          textureUrl="/assets/images/dresscode-women.webp"
          position={[-1.8, 0, DEPTHS.dresscode[0]]}
          rotation={[0, 0.3, 0]}
          size={[1.125, 2]}
        />
        <ObjPillar x={1.8} z={DEPTHS.dresscode[1]} topY={-1 - 0.2} minScale={1.42} />
        <PhotoPlane
          textureUrl="/assets/images/dresscode-men.webp"
          position={[1.8, 0, DEPTHS.dresscode[1]]}
          rotation={[0, -0.3, 0]}
          size={[1.125, 2]}
        />
      </Suspense>
    </>
  );
}

export default function SceneEnvironment({ progressRef, reducedMotion }) {
  const isMobile = useMobilePerformance();

  if (reducedMotion) return null;

  return (
    <Canvas
      className="scene-environment"
      camera={{ position: [0, 0, 8], fov: 42, near: 0.1, far: 100 }}
      dpr={isMobile ? 1 : [1, 1.75]}
      gl={{ antialias: !isMobile, alpha: false, powerPreference: "high-performance" }}
    >
      <SceneContents progressRef={progressRef} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
