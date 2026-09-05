import PhotoPlane from "./PhotoPlane.jsx";
import ObjPillar from "./ObjPillar.jsx";

const PORTRAIT = { w: 1.15, h: 1.15 / 0.667 };
const LANDSCAPE = { w: 1.7, h: 1.7 / 1.499 };
const TABLE_SCALE = 1.52;
const PILLAR_GAP = 0.2;

const GALLERY = [
  { file: "debutant-gallery-1.webp", size: PORTRAIT, z: -5, x: -2.6, rotY: 0.25 },
  { file: "debutant-gallery-2.webp", size: LANDSCAPE, z: -7, x: 2.4, rotY: -0.25 },
  { file: "debutant-gallery-3.webp", size: PORTRAIT, z: -9, x: -2.6, rotY: 0.25 },
  { file: "debutant-gallery-4.webp", size: PORTRAIT, z: -11, x: 2.6, rotY: -0.25 },
  { file: "debutant-gallery-5.webp", size: LANDSCAPE, z: -13, x: -2.4, rotY: 0.25 },
  { file: "debutant-gallery-6.webp", size: PORTRAIT, z: -15, x: 2.6, rotY: -0.25 },
  { file: "debutant-gallery-7.webp", size: PORTRAIT, z: -17, x: -2.6, rotY: 0.25 }
];

const PHOTO_Y = 0.15;

export default function DebutanteGallery() {
  return (
    <group>
      {GALLERY.map((item) => {
        const topY = PHOTO_Y - item.size.h / 2 - PILLAR_GAP;

        return (
          <group key={item.file}>
            <ObjPillar x={item.x} z={item.z} topY={topY} minScale={TABLE_SCALE} />
            <PhotoPlane
              textureUrl={`/assets/images/${item.file}`}
              position={[item.x, PHOTO_Y, item.z]}
              rotation={[0, item.rotY, 0]}
              size={[item.size.w, item.size.h]}
            />
          </group>
        );
      })}
    </group>
  );
}
