import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";

const OCEAN_URL = "/assets/3d/ocean-decimated.obj";
// Source "Plane" is ~36 units square with ~6.5 units of wave height (see
// scripts/decimate-obj.mjs) — flattened hard in Y so it reads as gentle
// rippling water, not mountains.
const SCALE_X = 1.3;
const SCALE_Y = 0.16;

/**
 * A continuous floor spanning the entire camera path (mirror through
 * outro) so there's always ground underfoot while scrolling. This is a
 * single mesh stretched in Z to cover the whole span — tiling multiple
 * copies back-to-back left a visible seam wherever the decimated mesh's
 * edge geometry didn't line up perfectly with the next copy's edge.
 * Stretching does elongate the wave pattern along Z, but the waves are
 * already flattened enough that it isn't noticeable, and it guarantees
 * there's no seam at all.
 */
export default function OceanFloor({ nearZ = 6, farZ = -66, y = -2 }) {
  const obj = useLoader(OBJLoader, OCEAN_URL);

  const { geometry, nativeSizeZ } = useMemo(() => {
    let geo = null;
    obj.traverse((child) => {
      if (child.isMesh && !geo) geo = child.geometry;
    });
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox.getSize(size);
    return { geometry: geo, nativeSizeZ: size.z };
  }, [obj]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // Light pink water.
        color: "#e7b8c4",
        emissive: "#5c3440",
        emissiveIntensity: 0.25,
        roughness: 0.5,
        metalness: 0.15,
        side: THREE.DoubleSide
      }),
    []
  );

  const span = nearZ - farZ;
  const scaleZ = span / nativeSizeZ;
  const centerZ = (nearZ + farZ) / 2;

  return (
    <group position={[0, y, centerZ]} scale={[SCALE_X, SCALE_Y, scaleZ]}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}
