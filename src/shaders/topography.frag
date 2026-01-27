#pragma glslify: snoise = require('glsl-noise/simplex/2d')

uniform float uTime;
uniform vec3 uColor;
uniform vec2 uResolution;
uniform float uOpacity;
uniform float uLineOpacity;
uniform float uScale;
uniform float uLineThickness;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Correct aspect ratio based on the plane dimensions
  float aspect = uResolution.x / uResolution.y;
  vec2 noiseUv = uv;
  noiseUv.x *= aspect;

  // Circle mask (aspect-corrected to stay perfectly round)
  vec2 centeredUv = uv - 0.5;
  centeredUv.x *= aspect;
  float dist = length(centeredUv);
  float radius = 0.6;
  float mask = 1.0 - smoothstep(radius - 0.01, radius + 0.01, dist);

  // Noise Generation
  float n = snoise(noiseUv * uScale + uTime * 0.05);

  // Isolines
  float lines = fract(n * 5.0);
  float pattern = smoothstep(0.5 - uLineThickness, 0.5, lines) - smoothstep(0.5, 0.5 + uLineThickness, lines);

  // Opacity
  float opacity = uLineOpacity;

  // Grain
  float grain = (fract(sin(dot(vUv, vec2(12.9898, 78.233) * 2.0)) * 43758.5453) - 0.5) * 0.15;

  vec3 finalColor = uColor + grain;

  gl_FragColor = vec4(finalColor, pattern * opacity * mask * uOpacity);
}
