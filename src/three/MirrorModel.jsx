import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import MirrorGlass from "./MirrorGlass.jsx";

/**
 * The real decimated mirror model (see scripts/decimate-mirror.mjs — the
 * source STL was 338MB/6.76M triangles, cut down ~99% via spatial vertex
 * clustering to something a browser can actually load) plus the existing
 * glass-distortion portrait plane, positioned to sit in its frame opening.
 */
export default function MirrorModel({ position = [0, 0, 0], scale = 3.6, progressRef, computeState }) {
  const obj = useLoader(OBJLoader, "/assets/3d/mirror-decimated.obj");

  const model = useMemo(() => {
    const clone = obj.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: "#cdb08a",
          metalness: 0.75,
          roughness: 0.28,
          envMapIntensity: 1.2,
          side: THREE.DoubleSide
        });
      }
    });
    return clone;
  }, [obj]);

  return (
    <group position={position} scale={scale}>
      <primitive object={model} />
      <MirrorGlass progressRef={progressRef} computeState={computeState} />
    </group>
  );
}
