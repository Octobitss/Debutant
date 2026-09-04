import { useFrame } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MIRROR_VERTEX_SHADER, MIRROR_FRAGMENT_SHADER } from "./shaders.js";

function createHeartShape() {
  const shape = new THREE.Shape();
  shape.moveTo(5, -5);
  shape.bezierCurveTo(5, -5, 4, 0, 0, 0);
  shape.bezierCurveTo(-6, 0, -6, -7, -6, -7);
  shape.bezierCurveTo(-6, -11, -3, -15.4, 5, -19);
  shape.bezierCurveTo(12, -15.4, 16, -11, 16, -7);
  shape.bezierCurveTo(16, -7, 16, 0, 10, 0);
  shape.bezierCurveTo(7, 0, 5, -5, 5, -5);
  return shape;
}

function createHeartGeometry(width, height, imageAspect, focus = { x: 0.5, y: 0.5 }) {
  const geometry = new THREE.ShapeGeometry(createHeartShape(), 32);
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const bw = bbox.max.x - bbox.min.x;
  const bh = bbox.max.y - bbox.min.y;
  const cx = (bbox.max.x + bbox.min.x) / 2;
  const cy = (bbox.max.y + bbox.min.y) / 2;
  const sx = width / bw;
  const sy = height / bh;

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

function createHeartBackingGeometry(width, height, scale) {
  const geometry = new THREE.ShapeGeometry(createHeartShape(), 32);
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const bw = bbox.max.x - bbox.min.x;
  const bh = bbox.max.y - bbox.min.y;
  const cx = (bbox.max.x + bbox.min.x) / 2;
  const cy = (bbox.max.y + bbox.min.y) / 2;
  const sx = (width / bw) * scale;
  const sy = (height / bh) * scale;

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    pos.setXY(i, (pos.getX(i) - cx) * sx, (pos.getY(i) - cy) * sy);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export default function MirrorGlass({ progressRef, computeState, size = [0.34, 0.3] }) {
  const texture = useLoader(THREE.TextureLoader, "/assets/images/loading-hero.webp");
  texture.colorSpace = THREE.SRGBColorSpace;
  const materialRef = useRef(null);
  const backingRef = useRef(null);
  const imageAspect = texture.image.width / texture.image.height;
  const geometry = useMemo(
    () => createHeartGeometry(size[0], size[1], imageAspect, { x: 0.5, y: 0.64 }),
    [size[0], size[1], imageAspect]
  );
  const backingGeometry = useMemo(() => createHeartBackingGeometry(size[0], size[1], 1.12), [size[0], size[1]]);

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
    if (backingRef.current) {
      backingRef.current.opacity = opacity;
      backingRef.current.visible = opacity > 0.01;
    }
  });

  return (
    <group>
      <mesh position={[0, 0.05, 0.01]} geometry={backingGeometry}>
        <meshBasicMaterial ref={backingRef} color="#92344a" transparent opacity={1} />
      </mesh>
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
    </group>
  );
}
