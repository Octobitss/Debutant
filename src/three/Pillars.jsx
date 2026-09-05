import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";

const CAPITAL_URL = "/assets/3d/pillar-decimated.obj";
const SHAFT_RADIUS = 0.42;
const SHAFT_HEIGHT = 6.4;
const X_OFFSET = 9;

function createFlutedShaftGeometry(radius, height, fluteCount = 20, fluteDepth = 0.05) {
  const geo = new THREE.CylinderGeometry(radius, radius * 1.06, height, 96, 1, true);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    const theta = Math.atan2(v.z, v.x);
    const r = Math.sqrt(v.x * v.x + v.z * v.z);
    const groove = (Math.cos(theta * fluteCount) * 0.5 + 0.5) * fluteDepth;
    const newR = r - fluteDepth + groove;
    const scale = newR / r;
    pos.setX(i, v.x * scale);
    pos.setZ(i, v.z * scale);
  }
  geo.computeVertexNormals();
  return geo;
}

function useCapitalGeometry() {
  const obj = useLoader(OBJLoader, CAPITAL_URL);
  return useMemo(() => {
    let geo = null;
    obj.traverse((child) => {
      if (child.isMesh && !geo) geo = child.geometry;
    });
    geo.computeVertexNormals();
    return geo;
  }, [obj]);
}

export default function Pillars({ nearZ = 4, farZ = -62, spacing = 11, groundY = -1.5 }) {
  const capitalGeometry = useCapitalGeometry();
  const shaftGeometry = useMemo(() => createFlutedShaftGeometry(SHAFT_RADIUS, SHAFT_HEIGHT), []);

  const stoneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f6f2ea",
        roughness: 0.75,
        metalness: 0.02,
        side: THREE.DoubleSide
      }),
    []
  );

  const capitalScale = (SHAFT_RADIUS * 2.3) / 40;
  const shaftCenterY = groundY + SHAFT_HEIGHT / 2;
  const capitalY = groundY + SHAFT_HEIGHT + 15.6 * capitalScale * 0.5;
  const baseY = groundY - 0.18;

  const count = Math.max(1, Math.floor((nearZ - farZ) / spacing));
  const positions = Array.from({ length: count }, (_, i) => nearZ - i * spacing);

  return (
    <group>
      {positions.map((z) => (
        <group key={z}>
          {[-X_OFFSET, X_OFFSET].map((x) => (
            <group key={x} position={[x, 0, z]}>
              <mesh geometry={shaftGeometry} material={stoneMaterial} position={[0, shaftCenterY, 0]} />
              <mesh
                geometry={capitalGeometry}
                material={stoneMaterial}
                position={[0, capitalY, 0]}
                scale={capitalScale}
              />
              <mesh position={[0, baseY, 0]}>
                <cylinderGeometry args={[SHAFT_RADIUS * 1.35, SHAFT_RADIUS * 1.5, 0.36, 32]} />
                <meshStandardMaterial color="#f6f2ea" roughness={0.75} metalness={0.02} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
