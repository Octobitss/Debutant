import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import CameraRig from "./CameraRig.jsx";
import MirrorMesh from "./MirrorMesh.jsx";
import MirrorModel from "./MirrorModel.jsx";
import PhotoPlane from "./PhotoPlane.jsx";
import OceanFloor from "./OceanFloor.jsx";
import PetalScatter from "./PetalScatter.jsx";
import DebutanteGallery from "./DebutanteGallery.jsx";
import FallingRose from "./FallingRose.jsx";
import Pillars from "./Pillars.jsx";
import CloudField from "./CloudField.jsx";
import { DEPTHS } from "./cameraPath.js";

const FOG_STOPS = [
  { t: 0, color: "#a08a9c" },
  { t: 0.11, color: "#ab97a5" },
  { t: 0.145, color: "#f4e6da" },
  { t: 0.19, color: "#b6a0b0" },
  { t: 0.35, color: "#a3b09e" },
  { t: 0.55, color: "#ac9aa7" },
  { t: 0.75, color: "#b3a0ac" },
  { t: 1, color: "#8f7d8b" }
]; 

function sampleColor(progress, target) {
  if (progress <= FOG_STOPS[0].t) return target.set(FOG_STOPS[0].color);
  for (let i = 0; i < FOG_STOPS.length - 1; i += 1) {
    const a = FOG_STOPS[i];
    const b = FOG_STOPS[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const localT = (progress - a.t) / (b.t - a.t || 1);
      const ca = new THREE.Color(a.color);
      const cb = new THREE.Color(b.color);
      return target.copy(ca).lerp(cb, localT);
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
          progressRef={progressRef}
          computeState={(p) => {
            const distortion = Math.sin(THREE.MathUtils.clamp((p - 0.14) / 0.1, 0, 1) * Math.PI);
            const opacity = 1 - THREE.MathUtils.smoothstep(p, 0.2, 0.28);
            return { distortion, opacity };
          }}
        />

        <MirrorMesh
          position={[0, 0.6, DEPTHS.outroMirror]}
          scale={0.6}
          progressRef={progressRef}
          computeState={(p) => ({
            distortion: 0,
            opacity: THREE.MathUtils.smoothstep(p, 0.84, 0.94) * 0.5
          })}
        />

        {!reducedMotion && <OceanFloor />}
        {!reducedMotion && <PetalScatter zStart={DEPTHS.gardenStart + 8} zEnd={-58} />}
        {!reducedMotion && <Pillars />}
        {!reducedMotion && <CloudField />}
        <DebutanteGallery progressRef={progressRef} />

        <PhotoPlane
          textureUrl="/assets/images/venue-1.webp"
          position={[-1.8, 0.2, DEPTHS.venue[0]]}
          rotation={[0, 0.25, 0]}
          size={[1.8, 1.2]}
          progressRef={progressRef}
          peak={0.44}
          fadeWidth={0.16}
        />
        <PhotoPlane
          textureUrl="/assets/images/venue-2.webp"
          position={[1.8, -0.3, DEPTHS.venue[1]]}
          rotation={[0, -0.25, 0]}
          size={[1.8, 1.2]}
          progressRef={progressRef}
          peak={0.51}
          fadeWidth={0.16}
        />

        <PhotoPlane
          textureUrl="/assets/images/dresscode-women.webp"
          position={[-1.8, 0, DEPTHS.dresscode[0]]}
          rotation={[0, 0.3, 0]}
          size={[1.125, 2]}
          progressRef={progressRef}
          peak={0.6}
          fadeWidth={0.14}
        />
        <PhotoPlane
          textureUrl="/assets/images/dresscode-men.webp"
          position={[1.8, 0, DEPTHS.dresscode[1]]}
          rotation={[0, -0.3, 0]}
          size={[1.125, 2]}
          progressRef={progressRef}
          peak={0.66}
          fadeWidth={0.14}
        />

        {!reducedMotion && <FallingRose />}
      </Suspense>
    </>
  );
}

export default function SceneEnvironment({ progressRef, reducedMotion }) {
  if (reducedMotion) return null;

  return (
    <Canvas
      className="scene-environment"
      camera={{ position: [0, 0, 8], fov: 42, near: 0.1, far: 100 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <SceneContents progressRef={progressRef} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
