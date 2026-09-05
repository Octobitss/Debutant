export const CAMERA_STOPS = [
  { t: 0.0, pos: [0, 0, 8], look: [0, 0, 0], fov: 42 },
  { t: 0.09, pos: [0, 0, 1.5], look: [0, 0, 0], fov: 42 },
  { t: 0.14, pos: [0, 0, -2], look: [0, 0, -8], fov: 60 },
  { t: 0.21, pos: [0, -0.3, -9], look: [0, -0.3, -16], fov: 50 },
  { t: 0.302, pos: [1.3, -0.1, -16], look: [0.3, -0.1, -22], fov: 50 },
  { t: 0.37, pos: [0, 0, -20], look: [0, 0, -27], fov: 50 },
  { t: 0.45, pos: [-1.3, 0.1, -25], look: [-0.3, 0.1, -31], fov: 50 },
  { t: 0.47, pos: [0.8, 0.15, -30], look: [0.2, 0.15, -37], fov: 49 },
  { t: 0.62, pos: [-0.8, 0.2, -35], look: [-0.2, 0.2, -42], fov: 48 },
  { t: 0.787, pos: [0.8, 0.25, -40], look: [0.2, 0.25, -47], fov: 48 },
  { t: 0.83, pos: [-1.3, 0.3, -45], look: [-0.3, 0.3, -52], fov: 47 },
  { t: 0.887, pos: [0, 0.35, -49], look: [0, 0.35, -56], fov: 46 },
  { t: 0.94, pos: [0, 0.7, -56], look: [0, 0.5, -63], fov: 42 },
  { t: 1.0, pos: [0, 1.6, -66], look: [0, 0.9, -74], fov: 38 }
];

// Mobile-only: on a narrow viewport the stock path above yaws away from the dress-code
// photos right as it passes closest to them, so they only ever show as a cropped sliver
// at the frame edge. These replace the t=0.787/0.83/0.887 stops with a pass that keeps
// the camera farther from each photo (so a smaller, gentler turn still frames it) and
// spreads the turn between them over more scroll distance, instead of a fast whip-pan
// that swings far enough to glimpse the (mirrored) back of a photo plane.
const MOBILE_DRESSCODE_STOPS = [
  { t: 0.787, pos: [0.6, 0.25, -41], look: [-0.2, 0.22, -46], fov: 50 },
  { t: 0.83, pos: [-0.6, 0.3, -44], look: [-0.9, 0.27, -48], fov: 54 },
  { t: 0.887, pos: [0.5, 0.35, -45.5], look: [0.7, 0.33, -52], fov: 52 }
];

const REPLACED_TS = new Set([0.787, 0.83, 0.887]);

export const CAMERA_STOPS_MOBILE = [...CAMERA_STOPS.filter((s) => !REPLACED_TS.has(s.t)), ...MOBILE_DRESSCODE_STOPS].sort(
  (a, b) => a.t - b.t
);

export const DEPTHS = {
  mirror: 0,
  gardenStart: -4,
  gardenEnd: -18,
  venue: [-23, -26.5],
  entourage: [-30, -40],
  dresscode: [-46, -49],
  outroMirror: -64
};
