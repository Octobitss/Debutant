import { useFrame } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MIRROR_VERTEX_SHADER, MIRROR_FRAGMENT_SHADER } from "./shaders.js";

// A heart-shaped portrait outline instead of a plain rectangle, so it
// reads as a deliberate keepsake shape rather than a photo pasted over
// the frame. Classic two-lobe bezier heart, recentered/rescaled to the
// requested width/height, with the image mapped "cover" style (fills the
// whole shape, cropping excess, never stretched) and `focus` choosing
// which part of the source image lands at the shape's own center.
//
// The commonly-used bezier heart curve is authored point-up/lobes-down —
// every Y here is negated from the textbook version so the point ends up
// at the bottom and the cleft at the top, like an actual heart.
function createHeartGeometry(width, height, imageAspect, focus = { x: 0.5, y: 0.5 }) {
  const shape = new THREE.Shape();
  shape.moveTo(5, -5);
  shape.bezierCurveTo(5, -5, 4, 0, 0, 0);
  shape.bezierCurveTo(-6, 0, -6, -7, -6, -7);
  shape.bezierCurveTo(-6, -11, -3, -15.4, 5, -19);
  shape.bezierCurveTo(12, -15.4, 16, -11, 16, -7);
  shape.bezierCurveTo(16, -7, 16, 0, 10, 0);
  shape.bezierCurveTo(7, 0, 5, -5, 5, -5);

  const geometry = new THREE.ShapeGeometry(shape, 32);
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const bw = bbox.max.x - bbox.min.x;
  const bh = bbox.max.y - bbox.min.y;
  const cx = (bbox.max.x + bbox.min.x) / 2;
  const cy = (bbox.max.y + bbox.min.y) / 2;
  const sx = width / bw;
  const sy = height / bh;

  // "Cover": scale the image's own aspect ratio up to fully fill the
  // (width,height) box, cropping the excess, instead of stretching it
  // (distorts) or letterboxing it (contain — leaves transparent margin).
  const boxAspect = width / height;
  const renderedW = imageAspect < boxAspect ? width : height * imageAspect;
  const renderedH = imageAspect < boxAspect ? width / imageAspect : height;

  const uv = geometry.attributes.uv;
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const localX = (pos.getX(i) - cx) * sx;
    const localY = (pos.getY(i) - cy) * sy;
    uv.setXY(i, focus.x + localX / renderedW, focus.y + localY / renderedH);
    pos.setXY(i, localX, localY);
  }
  uv.needsUpdate = true;
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * The glass-distortion portrait, sized to sit inside the mirror model's
 * frame opening (this is a child of MirrorModel's scaled group, so these
 * dimensions are in the mirror model's own local units).
 */
export default function MirrorGlass({ progressRef, computeState, size = [0.34, 0.3] }) {
  const texture = useLoader(THREE.TextureLoader, "/assets/images/loading-hero.webp");
  texture.colorSpace = THREE.SRGBColorSpace;
  const materialRef = useRef(null);
  const imageAspect = texture.image.width / texture.image.height;
  // The face in loading-hero.webp sits well above the image's own
  // vertical center — bias the crop's focus upward in the source so the
  // face lands in the heart's wide/round middle instead of being pushed
  // up into the narrow cleft between the lobes.
  const geometry = useMemo(
    () => createHeartGeometry(size[0], size[1], imageAspect, { x: 0.5, y: 0.64 }),
    [size[0], size[1], imageAspect]
  );

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uProgress: { value: 0 },
      uOpacity: { value: 1 },
      uTime: { value: 0 }
    }),
    [texture]
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    const { distortion, opacity } = computeState(progressRef.current);
    uniforms.uProgress.value = distortion;
    uniforms.uOpacity.value = opacity;
    if (materialRef.current) materialRef.current.visible = opacity > 0.01;
  });

  return (
    <mesh position={[0, 0.05, 0.02]} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={MIRROR_VERTEX_SHADER}
        fragmentShader={MIRROR_FRAGMENT_SHADER}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
