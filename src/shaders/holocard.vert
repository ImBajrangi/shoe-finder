varying vec2 vUv;
uniform float uTime;
uniform float uActive;

void main() {
  vUv = uv;
  vec3 pos = position;

  // "Breathing" - only when active
  float breath = sin(uTime * 2.0) * 0.015 * uActive;
  float scale = 1.0 + breath;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos * scale, 1.0);
}
