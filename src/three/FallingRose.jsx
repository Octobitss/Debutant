import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const ROSE_URL = "/assets/3d/Rose.glb";
const COUNT = 180;
// The Z window used to be symmetric around the camera, so roughly half of
// every rose's cycle was spent behind the camera (never visible) since
// the camera always looks toward -z. Biasing it forward-heavy means most
// of the pool is actually in view at any moment, including on load.
const Z_AHEAD = 13;
const Z_BEHIND = 3;
// The source model's own bounding box is ~50 units across — recenter and
// scale it down to fit the rest of the scene's ~1-unit-ish object sizes (a
// "petal" should read as roughly 0.1-0.2 units, not a room-filling boulder).
const SOURCE_SCALE = 0.005;

function useRoseGeometry() {
  const { scene } = useGLTF(ROSE_URL);
  return useMemo(() => {
    let geometry = null;
    scene.traverse((child) => {
      if (child.isMesh && !geometry) geometry = child.geometry.clone();
    });
    if (!geometry) return null;
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    return geometry;
  }, [scene]);
}

/**
 * Falling rose petals as GPU instances (a single draw call for all of
 * them) so the count can be pushed high enough to read as "many" rather
 * than a handful of countable objects.
 */
export default function FallingRose() {
  const { camera } = useThree();
  const geometry = useRoseGeometry();
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#a3455a",
        roughness: 0.55,
        metalness: 0.05,
        side: THREE.DoubleSide
      }),
    []
  );

  const instances = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        // Kept tight enough to actually sit inside a typical viewing
        // frustum (the initial mirror-approach shot has a narrow 42deg
        // fov) — a wider spread meant most roses were statistically off
        // to the side and never visible, including on first load before
        // any scrolling happened.
        x: (Math.random() - 0.5) * 11,
        y: (Math.random() - 0.5) * 14,
        z: (Math.random() - 0.5) * (Z_AHEAD + Z_BEHIND),
        rotSpeed: (Math.random() - 0.5) * 0.6,
        rotPhase: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
        fallSpeed: 0.15 + Math.random() * 0.25,
        sway: 0.2 + Math.random() * 0.3,
        swayPhase: Math.random() * Math.PI * 2,
        scale: SOURCE_SCALE * (0.7 + Math.random() * 0.6)
      })),
    []
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const elapsed = state.clock.elapsedTime;
    const camY = camera.position.y;
    const camZ = camera.position.z;

    instances.forEach((inst, i) => {
      inst.y -= inst.fallSpeed * delta * 0.6;
      const sway = Math.sin(elapsed * inst.sway + inst.swayPhase) * 0.4;

      // Wrap continuously into a +/-11 window around the camera instead of
      // resetting position once a threshold is crossed — a threshold reset
      // meant a fast scroll (a big single-frame camera jump) could push
      // many roses past it in the same frame, all snapping to a new spot
      // at once ("popping"). Wrapping recomputes a smooth position every
      // frame with no discrete reset event, so it stays stable regardless
      // of how far the camera jumps between frames.
      const wrappedY = camY + (THREE.MathUtils.euclideanModulo(inst.y - camY + 7, 14) - 7);
      // Asymmetric: mostly ahead of the camera (-Z_AHEAD), a little
      // trailing behind (+Z_BEHIND) so roses don't vanish the instant
      // they're passed.
      const wrappedZ =
        camZ + (THREE.MathUtils.euclideanModulo(inst.z - camZ + Z_AHEAD, Z_AHEAD + Z_BEHIND) - Z_AHEAD);

      dummy.position.set(inst.x + sway, wrappedY, wrappedZ);
      dummy.rotation.set(
        inst.rotPhase[0] + elapsed * inst.rotSpeed,
        inst.rotPhase[1] + elapsed * inst.rotSpeed * 0.7,
        inst.rotPhase[2] + elapsed * inst.rotSpeed * 0.5
      );
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!geometry) return null;

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} />
  );
}

useGLTF.preload(ROSE_URL);
