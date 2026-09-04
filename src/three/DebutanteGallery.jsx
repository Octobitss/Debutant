import PhotoPlane from "./PhotoPlane.jsx";

const PORTRAIT = { w: 1.15, h: 1.15 / 0.667 };
const LANDSCAPE = { w: 1.7, h: 1.7 / 1.499 };

const GALLERY = [
  { file: "debutant-gallery-1.webp", size: PORTRAIT, z: -5, peak: 0.185, x: -2.6, rotY: 0.25 },
  { file: "debutant-gallery-2.webp", size: LANDSCAPE, z: -7, peak: 0.215, x: 2.4, rotY: -0.25 },
  { file: "debutant-gallery-3.webp", size: PORTRAIT, z: -9, peak: 0.245, x: -2.6, rotY: 0.25 },
  { file: "debutant-gallery-4.webp", size: PORTRAIT, z: -11, peak: 0.275, x: 2.6, rotY: -0.25 },
  { file: "debutant-gallery-5.webp", size: LANDSCAPE, z: -13, peak: 0.305, x: -2.4, rotY: 0.25 },
  { file: "debutant-gallery-6.webp", size: PORTRAIT, z: -15, peak: 0.335, x: 2.6, rotY: -0.25 },
  { file: "debutant-gallery-7.webp", size: PORTRAIT, z: -17, peak: 0.365, x: -2.6, rotY: 0.25 }
];

export default function DebutanteGallery({ progressRef }) {
  return (
    <group>
      {GALLERY.map((item) => (
        <PhotoPlane
          key={item.file}
          textureUrl={`/assets/images/${item.file}`}
          position={[item.x, 0.15, item.z]}
          rotation={[0, item.rotY, 0]}
          size={[item.size.w, item.size.h]}
          progressRef={progressRef}
          peak={item.peak}
          fadeWidth={0.045}
        />
      ))}
    </group>
  );
}
