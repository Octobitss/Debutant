import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const DESKTOP_ASPECT = 1.6;
const FLOAT_AMPLITUDE = 0.09;
const FLOAT_SPEED = 1.4;

export default function PhotoPlane({
  textureUrl,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [2.2, 1.6],
  maxOpacity = 1
}) {
  const texture = useLoader(THREE.TextureLoader, textureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  const { size: canvasSize } = useThree();
  const xScale = Math.min(1, canvasSize.width / canvasSize.height / DESKTOP_ASPECT);
  const meshPosition = [position[0] * xScale, position[1], position[2]];
  const meshRef = useRef(null);
  // Stable per-instance offset so photos don't all bob in lockstep.
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const lift = (Math.sin(clock.elapsedTime * FLOAT_SPEED + phase) * 0.5 + 0.5) * FLOAT_AMPLITUDE;
    meshRef.current.position.y = meshPosition[1] + lift;
  });

  return (
    <mesh ref={meshRef} position={meshPosition} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} transparent opacity={maxOpacity} side={THREE.DoubleSide} />
    </mesh>
  );
}
