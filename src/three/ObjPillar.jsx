import { useLoader, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import useFloorHeightSampler from "./useFloorHeight.js";
import { useIsMobileViewport } from "../hooks/useIsMobileViewport.js";
import { TABLE_HEIGHT } from "./SideTable.jsx";

const DESKTOP_ASPECT = 1.6;
const MODEL_URL = "/assets/3d/objPillar.obj";
const WIDTH_MULTIPLIER = 3.4;

function usePillarGeometry() {
  const obj = useLoader(OBJLoader, MODEL_URL);
  return useMemo(() => {
    let geometry = null;
    obj.traverse((child) => {
      if (child.isMesh && !geometry) geometry = child.geometry;
    });
    if (!geometry) return null;

    geometry.computeBoundingBox();
    const rawHeight = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
    // Normalize so the pillar's own height (at scale 1) matches the table it replaces.
    const normalizeScale = TABLE_HEIGHT / rawHeight;

    geometry.translate(0, -geometry.boundingBox.min.y, 0);
    geometry.scale(normalizeScale, normalizeScale, normalizeScale);
    geometry.computeVertexNormals();
    return geometry;
  }, [obj]);
}

function usePillarMaterial(isMobile) {
  return useMemo(
    () =>
      isMobile
        ? new THREE.MeshLambertMaterial({ color: "#f6f2ea", side: THREE.DoubleSide })
        : new THREE.MeshStandardMaterial({ color: "#f6f2ea", roughness: 0.75, metalness: 0.02, side: THREE.DoubleSide }),
    [isMobile]
  );
}

// Places a pillar so its top touches `topY` (e.g. a photo's bottom edge) while its base is
// guaranteed to sink at least `sinkMargin` below the actual (uneven) terrain at (x, z) —
// growing taller than `minScale` if the local ground dips lower than expected.
export default function ObjPillar({ x, z, topY, minScale = 1, sinkMargin = 0.2, rotation = [0, 0, 0] }) {
  const isMobile = useIsMobileViewport();
  const geometry = usePillarGeometry();
  const material = usePillarMaterial(isMobile);
  const sampleFloorHeight = useFloorHeightSampler();
  const { size: canvasSize } = useThree();
  const xScale = Math.min(1, canvasSize.width / canvasSize.height / DESKTOP_ASPECT);

  if (!geometry) return null;

  const worldX = x * xScale;
  const floorY = sampleFloorHeight(worldX, z);
  const requiredScale = (topY - floorY + sinkMargin) / TABLE_HEIGHT;
  const scale = Math.max(minScale, requiredScale);
  const groundY = topY - TABLE_HEIGHT * scale;

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[worldX, groundY, z]}
      rotation={rotation}
      scale={[scale * WIDTH_MULTIPLIER, scale, scale * WIDTH_MULTIPLIER]}
    />
  );
}
