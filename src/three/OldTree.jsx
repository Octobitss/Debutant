import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";

const TREE_URL = "/assets/3d/old-tree-decimated.obj";

const MATERIAL_FACTORIES = {
  "Tree_Плоскость": () => new THREE.MeshStandardMaterial({ color: "#5a4335", roughness: 0.85, metalness: 0.02 }),
  "BRANCH.001_Плоскость.003": () =>
    new THREE.MeshStandardMaterial({ color: "#e8a9c4", roughness: 0.75, metalness: 0, side: THREE.DoubleSide })
};

function useTreeParts() {
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
        parts.push({ geometry: child.geometry, material: makeMaterial() });
      }
    });
    return parts;
  }, [obj]);
}

function TreeInstance({ parts, position, scale, rotationY }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotationY, 0]}>
      {parts.map((part, i) => (
        <mesh key={i} geometry={part.geometry} material={part.material} />
      ))}
    </group>
  );
}

export default function OldTree({ groundY = -2.7 }) {
  const parts = useTreeParts();

  const placements = useMemo(
    () => [
      { position: [-10.5, groundY, -3], scale: 1.15, rotationY: 0.4 },
      { position: [10.5, groundY, -3], scale: 1.05, rotationY: -0.6 },
      { position: [-10.5, groundY, -14], scale: 1.1, rotationY: 2.0 },
      { position: [10.5, groundY, -14], scale: 1.15, rotationY: 2.6 },
      { position: [-10.5, groundY, -25], scale: 1.1, rotationY: 1.1 },
      { position: [10.5, groundY, -25], scale: 1.2, rotationY: -1.4 }
    ],
    [groundY]
  );

  if (!parts.length) return null;

  return (
    <group>
      {placements.map((placement, i) => (
        <TreeInstance
          key={i}
          parts={parts}
          position={placement.position}
          scale={placement.scale}
          rotationY={placement.rotationY}
        />
      ))}
    </group>
  );
}
