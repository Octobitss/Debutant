import { useFrame } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MIRROR_VERTEX_SHADER, MIRROR_FRAGMENT_SHADER } from "./shaders.js";

function createCircleGeometry(diameter, imageAspect, focus = { x: 0.5, y: 0.5 }, segments = 64) {
  const geometry = new THREE.CircleGeometry(diameter / 2, segments);

  const renderedW = imageAspect < 1 ? diameter : diameter * imageAspect;
  const renderedH = imageAspect < 1 ? diameter / imageAspect : diameter;

  const uv = geometry.attributes.uv;
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    uv.setXY(i, focus.x + pos.getX(i) / renderedW, focus.y + pos.getY(i) / renderedH);
  }
  uv.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export default function MirrorGlass({ progressRef, computeState, diameter = 2.9 }) {
  const texture = useLoader(THREE.TextureLoader, "/assets/images/loading-hero.webp");
  texture.colorSpace = THREE.SRGBColorSpace;
  const materialRef = useRef(null);
  const imageAspect = texture.image.width / texture.image.height;
  const geometry = useMemo(
    () => createCircleGeometry(diameter, imageAspect, { x: 0.5, y: 0.5 }),
    [diameter, imageAspect]
  );

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
    if (materialRef.current) materialRef.current.visible = opacity > 0.01;
  });

  return (
    <group>
      <mesh position={[0, 0, 0.02]} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={MIRROR_VERTEX_SHADER}
          fragmentShader={MIRROR_FRAGMENT_SHADER}
          toneMapped={false}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
