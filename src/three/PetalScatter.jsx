import { useLoader } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";

const PETAL_URL = "/assets/3d/petal-decimated.obj";
const PALETTE = ["#e9c3d6", "#c98fa8", "#f3e3cf", "#b5678a"];
const INSTANCES_PER_VARIANT = 50;
const TARGET_SIZE = 0.32;

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

function PetalVariant({ geometry, normalize, color, zStart, zEnd, seed }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const instances = useMemo(
    () =>
      Array.from({ length: INSTANCES_PER_VARIANT }, (_, i) => ({
        x: (Math.random() - 0.5) * 42,
        z: zStart + Math.random() * (zEnd - zStart),
        y: -1.95 + Math.random() * 0.45,
        scale: normalize * (0.7 + Math.random() * 0.8),
        rot: [(Math.random() - 0.5) * 0.5, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5],
        speed: 0.15 + Math.random() * 0.3,
        phase: (i + seed) * 0.9
      })),
    [normalize, zStart, zEnd, seed]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    instances.forEach((inst, i) => {
      const sway = Math.sin(t * inst.speed + inst.phase) * 0.05;
      dummy.position.set(inst.x + sway, inst.y, inst.z);
      dummy.rotation.set(inst.rot[0], inst.rot[1] + t * 0.05, inst.rot[2]);
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, INSTANCES_PER_VARIANT]}>
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export default function PetalScatter({ zStart = 4, zEnd = -58 }) {
  const variants = useVariantGeometries();

  if (!variants.length) return null;

  return (
    <group>
      {variants.map((variant, index) => (
        <PetalVariant
          key={index}
          geometry={variant.geometry}
          normalize={variant.normalize}
          color={PALETTE[index % PALETTE.length]}
          zStart={zStart}
          zEnd={zEnd}
          seed={index * 7}
        />
      ))}
    </group>
  );
}
