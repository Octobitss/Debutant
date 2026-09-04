import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";

const PETAL_URL = "/assets/3d/petal-decimated.obj";
const PALETTE = ["#e9c3d6", "#c98fa8", "#f3e3cf", "#b5678a"];
const INSTANCES_PER_VARIANT = 22;
const TARGET_SIZE = 0.3;
const X_SPREAD = 11;
const Y_SPREAD = 14;
const Z_AHEAD = 13;
const Z_BEHIND = 3;

function useVariantGeometries() {
  const obj = useLoader(OBJLoader, PETAL_URL);
  return useMemo(() => {
    const geoms = [];
    obj.traverse((child) => {
      if (child.isMesh && child.name.startsWith("petal")) {
        const geo = child.geometry.clone();
        geo.computeBoundingBox();
        const size = new THREE.Vector3();
        geo.boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const center = new THREE.Vector3();
        geo.boundingBox.getCenter(center);
        geo.translate(-center.x, -center.y, -center.z);
        geo.computeVertexNormals();
        geoms.push({ geometry: geo, normalize: TARGET_SIZE / maxDim });
      }
    });
    return geoms;
  }, [obj]);
}

function FallingPetalVariant({ geometry, normalize, color, seed }) {
  const { camera } = useThree();
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const instances = useMemo(
    () =>
      Array.from({ length: INSTANCES_PER_VARIANT }, (_, i) => ({
        x: (Math.random() - 0.5) * X_SPREAD * 2,
        y: (Math.random() - 0.5) * Y_SPREAD,
        z: (Math.random() - 0.5) * (Z_AHEAD + Z_BEHIND),
        rotSpeed: (Math.random() - 0.5) * 0.6,
        rotPhase: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
        fallSpeed: 0.15 + Math.random() * 0.25,
        sway: 0.2 + Math.random() * 0.3,
        swayPhase: (i + seed) * 0.9,
        scale: normalize * (0.7 + Math.random() * 0.6)
      })),
    [normalize, seed]
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
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, INSTANCES_PER_VARIANT]} frustumCulled={false}>
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export default function FallingPetals() {
  const variants = useVariantGeometries();

  if (!variants.length) return null;

  return (
    <group>
      {variants.map((variant, index) => (
        <FallingPetalVariant
          key={index}
          geometry={variant.geometry}
          normalize={variant.normalize}
          color={PALETTE[index % PALETTE.length]}
          seed={index * 7}
        />
      ))}
    </group>
  );
}
