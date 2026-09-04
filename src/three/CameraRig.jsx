import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_STOPS } from "./cameraPath.js";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleStops(progress) {
  if (progress <= CAMERA_STOPS[0].t) return { a: CAMERA_STOPS[0], b: CAMERA_STOPS[0], localT: 0 };
  for (let i = 0; i < CAMERA_STOPS.length - 1; i += 1) {
    const a = CAMERA_STOPS[i];
    const b = CAMERA_STOPS[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const localT = (progress - a.t) / (b.t - a.t || 1);
      return { a, b, localT };
    }
  }
  const last = CAMERA_STOPS[CAMERA_STOPS.length - 1];
  return { a: last, b: last, localT: 0 };
}

const tmpLook = new THREE.Vector3();

export default function CameraRig({ progressRef, reducedMotion }) {
  const { camera } = useThree();

  useFrame(() => {
    const progress = reducedMotion ? 0 : progressRef.current;
    const { a, b, localT } = sampleStops(progress);

    const posX = lerp(a.pos[0], b.pos[0], localT);
    const posY = lerp(a.pos[1], b.pos[1], localT);
    const posZ = lerp(a.pos[2], b.pos[2], localT);
    const lookX = lerp(a.look[0], b.look[0], localT);
    const lookY = lerp(a.look[1], b.look[1], localT);
    const lookZ = lerp(a.look[2], b.look[2], localT);
    const fov = lerp(a.fov, b.fov, localT);

    camera.position.lerp(new THREE.Vector3(posX, posY, posZ), 0.12);
    tmpLook.set(lookX, lookY, lookZ);
    camera.lookAt(tmpLook);

    if (camera.fov !== fov) {
      camera.fov = lerp(camera.fov, fov, 0.08);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
