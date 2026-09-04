// Shared GLSL for the mirror's glass-distortion effect — used both for the
// near mirror (approach + crossing) and, at low intensity, the distant one
// that reappears in the outro.

export const MIRROR_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  uniform float uProgress;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.x += sin(uv.y * 10.0 + uTime * 1.6) * 0.09 * uProgress;
    pos.z += sin(uv.x * 8.0 + uTime * 1.2) * 0.07 * uProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const MIRROR_FRAGMENT_SHADER = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uProgress;
  uniform float uOpacity;

  void main() {
    vec2 uv = vUv;
    uv.x += sin(uv.y * 22.0 + uProgress * 7.0) * 0.025 * uProgress;
    uv.y += cos(uv.x * 18.0 + uProgress * 5.0) * 0.02 * uProgress;
    // Geometries that map uv using "contain" (fit the image without
    // stretching it) deliberately produce uv outside [0,1] in the
    // letterboxed margin — render that margin transparent rather than
    // the default clamped/smeared edge pixel.
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      discard;
    }
    vec4 tex = texture2D(uMap, uv);
    gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
  }
`;
