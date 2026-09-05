import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useIsMobileViewport } from "../hooks/useIsMobileViewport.js";
import { CAMERA_STOPS, CAMERA_STOPS_MOBILE } from "./cameraPath.js";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleStops(stops, progress) {
  if (progress <= stops[0].t) return { a: stops[0], b: stops[0], localT: 0 };
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const localT = (progress - a.t) / (b.t - a.t || 1);
      return { a, b, localT };
    }
  }
  const last = stops[stops.length - 1];
  return { a: last, b: last, localT: 0 };
}

const tmpLook = new THREE.Vector3();
const tmpPos = new THREE.Vector3();

function widenFovForNarrowAspect(fov, aspect) {
  if (aspect >= 1) return fov;
  const widen = THREE.MathUtils.clamp((1 - aspect) * 35, 0, 30);
  return Math.min(fov + widen, 82);
}

export default function CameraRig({ progressRef, reducedMotion }) {
  const { camera } = useThree();
  const isMobile = useIsMobileViewport();
  const stops = isMobile ? CAMERA_STOPS_MOBILE : CAMERA_STOPS;

  useFrame(() => {
    const progress = reducedMotion ? 0 : progressRef.current;
    const { a, b, localT } = sampleStops(stops, progress);

    const posX = lerp(a.pos[0], b.pos[0], localT);
    const posY = lerp(a.pos[1], b.pos[1], localT);
    const posZ = lerp(a.pos[2], b.pos[2], localT);
    const lookX = lerp(a.look[0], b.look[0], localT);
    const lookY = lerp(a.look[1], b.look[1], localT);
    const lookZ = lerp(a.look[2], b.look[2], localT);
    const fov = widenFovForNarrowAspect(lerp(a.fov, b.fov, localT), camera.aspect);

    tmpPos.set(posX, posY, posZ);
    camera.position.lerp(tmpPos, 0.12);
    tmpLook.set(lookX, lookY, lookZ);
    camera.lookAt(tmpLook);

    if (camera.fov !== fov) {
      camera.fov = lerp(camera.fov, fov, 0.08);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
