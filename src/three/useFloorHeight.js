import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";

const OCEAN_URL = "/assets/3d/ocean-decimated.obj";
const OCEAN_SCALE_X = 1.3;
const OCEAN_SCALE_Y = 0.16;
const OCEAN_NEAR_Z = 6;
const OCEAN_FAR_Z = -100;
const OCEAN_Y = -2;

export default function useFloorHeightSampler() {
  const obj = useLoader(OBJLoader, OCEAN_URL);
  return useMemo(() => {
    let sourceGeometry = null;
    obj.traverse((child) => {
      if (child.isMesh && !sourceGeometry) sourceGeometry = child.geometry;
    });
    if (!sourceGeometry) return () => OCEAN_Y;

    const geo = sourceGeometry.clone();
    geo.computeBoundingBox();
    const nativeSizeZ = geo.boundingBox.max.z - geo.boundingBox.min.z;
    const span = OCEAN_NEAR_Z - OCEAN_FAR_Z;
    const scaleZ = span / nativeSizeZ;
    const centerZ = (OCEAN_NEAR_Z + OCEAN_FAR_Z) / 2;

    const floorMesh = new THREE.Mesh(geo);
    floorMesh.position.set(0, OCEAN_Y, centerZ);
    floorMesh.scale.set(OCEAN_SCALE_X, OCEAN_SCALE_Y, scaleZ);
    floorMesh.updateMatrixWorld(true);

    const raycaster = new THREE.Raycaster();
    const origin = new THREE.Vector3();
    const down = new THREE.Vector3(0, -1, 0);

    return (x, z) => {
      origin.set(x, 20, z);
      raycaster.set(origin, down);
      const hits = raycaster.intersectObject(floorMesh, false);
      return hits.length ? hits[0].point.y : OCEAN_Y;
    };
  }, [obj]);
}
