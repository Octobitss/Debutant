import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const ROSE_URL = "/assets/3d/Rose.glb";
const COUNT = 180;
const Z_AHEAD = 13;
const Z_BEHIND = 3;
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

      const wrappedY = camY + (THREE.MathUtils.euclideanModulo(inst.y - camY + 7, 14) - 7);
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
