import { useLoader } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";

const CLOUDS_URL = "/assets/3d/LOW-POLY CLOUDS.obj";
const INSTANCES_PER_VARIANT = 9;
const TARGET_SIZE = 5;

function useVariantGeometries() {
  const obj = useLoader(OBJLoader, CLOUDS_URL);
  return useMemo(() => {
    const geoms = [];
    obj.traverse((child) => {
      if (child.isMesh) {
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

function CloudVariant({ geometry, normalize, zStart, zEnd, seed }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const instances = useMemo(
    () =>
      Array.from({ length: INSTANCES_PER_VARIANT }, (_, i) => ({
        x: (Math.random() - 0.5) * 34,
        z: zStart + Math.random() * (zEnd - zStart),
        y: 9 + Math.random() * 6,
        scale: normalize * (0.8 + Math.random() * 1.4),
        rotY: Math.random() * Math.PI * 2,
        drift: 0.02 + Math.random() * 0.03,
        phase: (i + seed) * 1.3
      })),
    [normalize, zStart, zEnd, seed]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    instances.forEach((inst, i) => {
      const drift = Math.sin(t * inst.drift + inst.phase) * 2;
      dummy.position.set(inst.x + drift, inst.y, inst.z);
      dummy.rotation.set(0, inst.rotY, 0);
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, INSTANCES_PER_VARIANT]} frustumCulled={false}>
      <meshStandardMaterial color="#faf3f5" roughness={0.9} metalness={0} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export default function CloudField({ zStart = 4, zEnd = -58 }) {
  const variants = useVariantGeometries();

  if (!variants.length) return null;

  return (
    <group>
      {variants.map((variant, index) => (
        <CloudVariant
          key={index}
          geometry={variant.geometry}
          normalize={variant.normalize}
          zStart={zStart}
          zEnd={zEnd}
          seed={index * 11}
        />
      ))}
    </group>
  );
}
