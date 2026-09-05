import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import useFloorHeightSampler from "./useFloorHeight.js";

const LILY_URL = "/assets/3d/Water Lily.obj";
const INSTANCE_COUNT = 720;
const TARGET_SIZE = 0.7;
const PAD_COLOR = "#3f6b3a";
const BLOOM_COLOR = "#f6e3ea";

function useLilyParts() {
  const obj = useLoader(OBJLoader, LILY_URL);
  return useMemo(() => {
    const meshes = [];
    obj.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });
    if (!meshes.length) return { parts: [], normalize: 1 };

    const combinedBox = new THREE.Box3();
    meshes.forEach((mesh) => combinedBox.expandByObject(mesh));
    const size = new THREE.Vector3();
    combinedBox.getSize(size);
    const center = new THREE.Vector3();
    combinedBox.getCenter(center);
    const maxDim = Math.max(size.x, size.z) || 1;
    const normalize = TARGET_SIZE / maxDim;

    const parts = meshes.map((mesh, index) => {
      const geo = mesh.geometry.clone();
      geo.translate(-center.x, -center.y, -center.z);
      geo.computeVertexNormals();

      return { geometry: geo, color: index === 0 ? PAD_COLOR : BLOOM_COLOR };
    });

    return { parts, normalize };
  }, [obj]);
}

function LilyPart({ geometry, color, normalize, instances }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    instances.forEach((inst, i) => {
      dummy.position.set(inst.x, inst.y, inst.z);
      dummy.rotation.set(0, inst.rotY, 0);
      dummy.scale.setScalar(normalize * inst.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [instances, normalize, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, instances.length]} frustumCulled={false}>
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.02} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export default function WaterLilyScatter({ xSpread = 21, zStart = 4, zEnd = -58, surfaceLift = 0.03 }) {
  const { parts, normalize } = useLilyParts();
  const sampleFloorHeight = useFloorHeightSampler();

  const instances = useMemo(
    () =>
      Array.from({ length: INSTANCE_COUNT }, () => {
        const x = (Math.random() - 0.5) * xSpread * 2;
        const z = zStart + Math.random() * (zEnd - zStart);
        return {
          x,
          z,
          y: sampleFloorHeight(x, z) + surfaceLift,
          rotY: Math.random() * Math.PI * 2,
          scale: 0.6 + Math.random() * 0.9
        };
      }),
    [xSpread, zStart, zEnd, surfaceLift, sampleFloorHeight]
  );

  if (!parts.length) return null;

  return (
    <group>
      {parts.map((part, index) => (
        <LilyPart key={index} geometry={part.geometry} color={part.color} normalize={normalize} instances={instances} />
      ))}
    </group>
  );
}
