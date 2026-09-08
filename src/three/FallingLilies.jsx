import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import { useMobilePerformance } from "../hooks/useIsMobileViewport.js";

const LILY_URL = "/assets/3d/pink_lily_flower.obj";
const COUNT = 100;
const COUNT_MOBILE = 16;
const TARGET_SIZE = 0.35;
const X_SPREAD = 11;
const Y_SPREAD = 14;
const Z_AHEAD = 13;
const Z_BEHIND = 3;
const COLOR = "#e78bb0";

function useLilyGeometry() {
  const obj = useLoader(OBJLoader, LILY_URL);
  return useMemo(() => {
    let geometry = null;
    obj.traverse((child) => {
      if (child.isMesh && !geometry) geometry = child.geometry.clone();
    });
    if (!geometry) return null;
    geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeVertexNormals();
    geometry.userData.normalize = TARGET_SIZE / maxDim;
    return geometry;
  }, [obj]);
}

export default function FallingLilies() {
  const { camera } = useThree();
  const geometry = useLilyGeometry();
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const isMobile = useMobilePerformance();
  const count = isMobile ? COUNT_MOBILE : COUNT;

  const material = useMemo(
    () =>
      isMobile
        ? new THREE.MeshLambertMaterial({ color: COLOR, side: THREE.DoubleSide })
        : new THREE.MeshStandardMaterial({ color: COLOR, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }),
    [isMobile]
  );

  const instances = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * X_SPREAD * 2,
        y: (Math.random() - 0.5) * Y_SPREAD,
        z: (Math.random() - 0.5) * (Z_AHEAD + Z_BEHIND),
        rotSpeed: (Math.random() - 0.5) * 0.6,
        rotPhase: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
        fallSpeed: 0.15 + Math.random() * 0.25,
        sway: 0.2 + Math.random() * 0.3,
        swayPhase: i * 0.9,
        scale: (geometry?.userData.normalize || 1) * (0.7 + Math.random() * 0.6)
      })),
    [geometry, count]
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const elapsed = state.clock.elapsedTime;
    const camY = camera.position.y;
    const camZ = camera.position.z;

    instances.forEach((inst, i) => {
      inst.y -= inst.fallSpeed * delta * 0.6;
      const sway = Math.sin(elapsed * inst.sway + inst.swayPhase) * 0.4;

      const wrappedY =
        camY + (THREE.MathUtils.euclideanModulo(inst.y - camY + Y_SPREAD / 2, Y_SPREAD) - Y_SPREAD / 2);
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
    meshRef.current.computeBoundingSphere();
  });

  if (!geometry) return null;

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}
