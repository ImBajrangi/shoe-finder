import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

// --- HOLOGRAPHIC CARD SHADER MATERIAL ---
const HoloCardMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: new THREE.Texture(),
    uOpacity: 1,
    uActive: 0, // 0 = normal, 1 = active/selected
  },
  // VERTEX SHADER (Breathing only when active)
  `
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
  `,
  // FRAGMENT SHADER (Light band sweep only when active + ambient occlusion)
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uOpacity;
    uniform float uActive;
    varying vec2 vUv;

    void main() {
      vec4 texColor = texture2D(uTexture, vUv);
      vec3 baseColor = texColor.rgb;

      // --- AMBIENT OCCLUSION ---
      // Soft edge shadow based on distance from center
      vec2 center = vUv - 0.5;
      float edgeDist = length(center) * 1.4; // Scale for effect reach

      // Vignette shadow - darker at edges
      float vignette = 1.0 - smoothstep(0.3, 0.9, edgeDist);
      vignette = mix(0.85, 1.0, vignette); // Subtle darkening (15% max)

      // Edge-aware AO using alpha gradient detection
      // Sample neighboring pixels to detect edges
      float pixelSize = 0.008;
      float alphaLeft = texture2D(uTexture, vUv - vec2(pixelSize, 0.0)).a;
      float alphaRight = texture2D(uTexture, vUv + vec2(pixelSize, 0.0)).a;
      float alphaUp = texture2D(uTexture, vUv + vec2(0.0, pixelSize)).a;
      float alphaDown = texture2D(uTexture, vUv - vec2(0.0, pixelSize)).a;

      // Detect edges where alpha changes
      float edgeDetect = abs(texColor.a - alphaLeft) + abs(texColor.a - alphaRight) +
                         abs(texColor.a - alphaUp) + abs(texColor.a - alphaDown);
      edgeDetect = smoothstep(0.0, 0.5, edgeDetect);

      // Subtle inner shadow near edges
      float innerShadow = mix(1.0, 0.92, edgeDetect * texColor.a);

      // Combine AO effects
      float ao = vignette * innerShadow;
      baseColor *= ao;

      if (uActive < 0.01) {
        gl_FragColor = vec4(baseColor, texColor.a * uOpacity);
        return;
      }

      // Light band sweep - driven by uActive transition (0->1)
      // Plays once as the shoe opens, then stays off
      float diagonal = (vUv.x * 0.8) + vUv.y;

      // Map uActive (0-1) to sheen position (0 to 2.0 to sweep across)
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
  `
);

// Extend so R3F recognizes <holoCardMaterial />
extend({ HoloCardMaterial });

export default HoloCardMaterial;
