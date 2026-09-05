import { useLoader, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import useFloorHeightSampler from "./useFloorHeight.js";

const DESKTOP_ASPECT = 1.6;
const MODEL_URL = "/assets/3d/raffstudio_rustic_round_side_table_v1.gltf";
const TEXTURE_BASE = "/assets/3d/rustic_round_side_table_basecolor.png";
const TEXTURE_NORMAL = "/assets/3d/rustic_round_side_table_normal.png";
const TEXTURE_ORM = "/assets/3d/rustic_round_side_table_metallic-rustic_round_side_table_roughness.png";

// Known from the model's accessor bounds: full height once its base is grounded at y = 0.
export const TABLE_HEIGHT = 0.911;

function useTableGeometry() {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  return useMemo(() => {
    let geometry = null;
    gltf.scene.traverse((child) => {
      if (child.isMesh && !geometry) geometry = child.geometry;
    });
    if (!geometry) return null;
    geometry.computeBoundingBox();
    geometry.translate(0, -geometry.boundingBox.min.y, 0);
    geometry.computeVertexNormals();
    return geometry;
  }, [gltf]);
}

function useTableMaterial() {
  const [map, normalMap, ormMap] = useLoader(THREE.TextureLoader, [TEXTURE_BASE, TEXTURE_NORMAL, TEXTURE_ORM]);
  return useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map,
      normalMap,
      roughnessMap: ormMap,
      metalnessMap: ormMap,
      roughness: 1,
      metalness: 1,
      side: THREE.DoubleSide
    });
  }, [map, normalMap, ormMap]);
}

// Places a table so its top touches `topY` (e.g. a photo's bottom edge) while its base is
// guaranteed to sink at least `sinkMargin` below the actual (uneven) terrain at (x, z) —
// growing taller than `minScale` if the local ground dips lower than expected.
export default function SideTable({ x, z, topY, minScale = 1, sinkMargin = 0.2, rotation = [0, 0, 0] }) {
  const geometry = useTableGeometry();
  const material = useTableMaterial();
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
    <mesh geometry={geometry} material={material} position={[worldX, groundY, z]} rotation={rotation} scale={scale} />
  );
}
