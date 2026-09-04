import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// Positions were tuned against a desktop-ish aspect ratio. A tall mobile
// viewport gives the same vertical fov a much narrower horizontal field
// of view, so those same x offsets fall outside the frustum entirely —
// pull them proportionally toward center on narrow viewports instead.
const DESKTOP_ASPECT = 1.6;

/**
 * A textured plane that fades in/out as the camera passes it, based on
 * overall scroll progress — used for the venue gallery and dress-code
 * portraits floating in 3D space.
 */
export default function PhotoPlane({
  textureUrl,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [2.2, 1.6],
  progressRef,
  peak,
  fadeWidth = 0.05,
  maxOpacity = 1,
  // Optional [xStart, xEnd]: instead of a fixed x, sweep linearly from
  // xStart to xEnd across the same [peak - fadeWidth, peak + fadeWidth]
  // window the opacity fades in/out over — used for the drifting
  // left-to-right gallery in the intro/garden scene.
  driftX = null
}) {
  const texture = useLoader(THREE.TextureLoader, textureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  const materialRef = useRef(null);
  const meshRef = useRef(null);
  const { size: canvasSize } = useThree();
  const xScale = Math.min(1, canvasSize.width / canvasSize.height / DESKTOP_ASPECT);

  useFrame(() => {
    const p = progressRef.current;
    const local = THREE.MathUtils.clamp(1 - Math.abs(p - peak) / fadeWidth, 0, 1);
    const eased = local * local * (3 - 2 * local);
    if (materialRef.current) {
      materialRef.current.opacity = eased * maxOpacity;
    }
    if (meshRef.current) {
      meshRef.current.visible = eased > 0.01;
      if (driftX) {
        const sweep = THREE.MathUtils.clamp((p - (peak - fadeWidth)) / (2 * fadeWidth), 0, 1);
        meshRef.current.position.x = THREE.MathUtils.lerp(driftX[0], driftX[1], sweep) * xScale;
      } else {
        meshRef.current.position.x = position[0] * xScale;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={materialRef} map={texture} transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}
