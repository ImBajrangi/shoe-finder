uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uActive;
varying vec2 vUv;

void main() {
  vec4 texColor = texture2D(uTexture, vUv);
  vec3 baseColor = texColor.rgb;

  if (uActive < 0.01) {
    gl_FragColor = vec4(baseColor, texColor.a * uOpacity);
    return;
  }

  // Light band sweep - driven by uActive transition (0->1)
  float diagonal = (vUv.x * 0.8) + vUv.y;
  float sheenPos = uActive * 2.5;
  float sheenWidth = 0.5;

  float dist = abs(diagonal - sheenPos);
  float intensity = 1.0 - smoothstep(0.0, sheenWidth, dist);
  intensity = pow(intensity, 3.0);

  // Fade out the sheen as uActive approaches 1 (sweep complete)
  float sheenFade = 1.0 - smoothstep(0.7, 1.0, uActive);

  vec3 sheenColor = vec3(0.85, 0.92, 1.0) * intensity * 0.9 * sheenFade;
  vec3 finalColor = baseColor + sheenColor * texColor.a;

  gl_FragColor = vec4(finalColor, texColor.a * uOpacity);
}
