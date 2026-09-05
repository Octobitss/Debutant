import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import { useIsMobileViewport } from "../hooks/useIsMobileViewport.js";

const OCEAN_URL = "/assets/3d/ocean-decimated.obj";
const SCALE_X = 1.3;
const SCALE_Y = 0.16;

export default function OceanFloor({ nearZ, farZ = -100, y = -2 }) {
  const obj = useLoader(OBJLoader, OCEAN_URL);
  const isMobile = useIsMobileViewport();
  // Mobile-only: a widened FOV can look down past the floor's near edge into empty space,
  // so the floor needs to extend further toward the camera's starting position there.
  const effectiveNearZ = nearZ ?? (isMobile ? 30 : 6);

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
      isMobile
        ? new THREE.MeshLambertMaterial({
            color: "#e7b8c4",
            emissive: "#5c3440",
            emissiveIntensity: 0.25,
            side: THREE.DoubleSide
          })
        : new THREE.MeshStandardMaterial({
            color: "#e7b8c4",
            emissive: "#5c3440",
            emissiveIntensity: 0.25,
            roughness: 0.5,
            metalness: 0.15,
            side: THREE.DoubleSide
          }),
    [isMobile]
  );

  const span = effectiveNearZ - farZ;
  const scaleZ = span / nativeSizeZ;
  const centerZ = (effectiveNearZ + farZ) / 2;

  return (
    <group position={[0, y, centerZ]} scale={[SCALE_X, SCALE_Y, scaleZ]}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}
