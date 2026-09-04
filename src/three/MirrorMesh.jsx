import { useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MIRROR_VERTEX_SHADER, MIRROR_FRAGMENT_SHADER } from "./shaders.js";

export default function MirrorMesh({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, progressRef, computeState }) {
  const texture = useLoader(THREE.TextureLoader, "/assets/images/debutante-portrait.webp");
  texture.colorSpace = THREE.SRGBColorSpace;
  const materialRef = useRef(null);

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uProgress: { value: 0 },
      uOpacity: { value: 1 },
      uTime: { value: 0 }
    }),
    [texture]
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    const { distortion, opacity } = computeState(progressRef.current);
    uniforms.uProgress.value = distortion;
    uniforms.uOpacity.value = opacity;
    if (materialRef.current) {
      materialRef.current.visible = opacity > 0.01;
    }
  });

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[2.4, 3.2, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={MIRROR_VERTEX_SHADER}
        fragmentShader={MIRROR_FRAGMENT_SHADER}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
