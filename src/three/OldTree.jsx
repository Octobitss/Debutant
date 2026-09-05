import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import { useIsMobileViewport } from "../hooks/useIsMobileViewport.js";

const TREE_URL = "/assets/3d/old-tree-decimated.obj";

const MATERIAL_FACTORIES = {
  "Tree_Плоскость": (isMobile) =>
    isMobile
      ? new THREE.MeshLambertMaterial({ color: "#5a4335" })
      : new THREE.MeshStandardMaterial({ color: "#5a4335", roughness: 0.85, metalness: 0.02 }),
  "BRANCH.001_Плоскость.003": (isMobile) =>
    isMobile
      ? new THREE.MeshLambertMaterial({ color: "#e8a9c4", side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ color: "#e8a9c4", roughness: 0.75, metalness: 0, side: THREE.DoubleSide })
};

function useTreeParts(isMobile) {
  const obj = useLoader(OBJLoader, TREE_URL);
  return useMemo(() => {
    const box = new THREE.Box3().setFromObject(obj);
    const groundShift = -box.min.y;

    const parts = [];
    obj.traverse((child) => {
      if (child.isMesh) {
        child.geometry.translate(0, groundShift, 0);
        child.geometry.computeVertexNormals();
        const makeMaterial = MATERIAL_FACTORIES[child.name] || MATERIAL_FACTORIES["Tree_Плоскость"];
        parts.push({ geometry: child.geometry, material: makeMaterial(isMobile) });
      }
    });
    return parts;
  }, [obj, isMobile]);
}

function TreePartInstanced({ geometry, material, placements }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    placements.forEach((placement, i) => {
      dummy.position.set(...placement.position);
      dummy.rotation.set(0, placement.rotationY, 0);
      dummy.scale.setScalar(placement.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [placements, dummy]);

  return <instancedMesh ref={meshRef} args={[geometry, material, placements.length]} />;
}

const ALL_PLACEMENTS = [
  [
    { x: -10.5, z: 2, scale: 1.1, rotationY: 0.9 },
    { x: 10.5, z: 2, scale: 1.15, rotationY: -2.2 }
  ],
  [
    { x: -10.5, z: -3, scale: 1.15, rotationY: 0.4 },
    { x: 10.5, z: -3, scale: 1.05, rotationY: -0.6 }
  ],
  [
    { x: -10.5, z: -14, scale: 1.1, rotationY: 2.0 },
    { x: 10.5, z: -14, scale: 1.15, rotationY: 2.6 }
  ],
  [
    { x: -10.5, z: -25, scale: 1.1, rotationY: 1.1 },
    { x: 10.5, z: -25, scale: 1.2, rotationY: -1.4 }
  ],
  [
    { x: -10.5, z: -30, scale: 1.12, rotationY: 1.5 },
    { x: 10.5, z: -30, scale: 1.08, rotationY: -0.3 }
  ],
  [
    { x: -10.5, z: -36, scale: 1.05, rotationY: -1.8 },
    { x: 10.5, z: -36, scale: 1.1, rotationY: 0.7 }
  ],
  [
    { x: -10.5, z: -47, scale: 1.15, rotationY: 2.4 },
    { x: 10.5, z: -47, scale: 1.1, rotationY: -1.9 }
  ],
  [
    { x: -10.5, z: -58, scale: 1.05, rotationY: 0.6 },
    { x: 10.5, z: -58, scale: 1.12, rotationY: -2.7 }
  ]
];

export default function OldTree({ groundY = -2.7 }) {
  const isMobile = useIsMobileViewport();
  const parts = useTreeParts(isMobile);

  const placements = useMemo(() => {
    const pairs = isMobile ? ALL_PLACEMENTS.filter((_, i) => i % 2 === 0) : ALL_PLACEMENTS;
    return pairs
      .flat()
      .map(({ x, z, scale, rotationY }) => ({ position: [x, groundY, z], scale, rotationY }));
  }, [groundY, isMobile]);

  if (!parts.length) return null;

  return (
    <group>
      {parts.map((part, i) => (
        <TreePartInstanced key={i} geometry={part.geometry} material={part.material} placements={placements} />
      ))}
    </group>
  );
}
