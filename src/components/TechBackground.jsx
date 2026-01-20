import React, { useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial, Plane } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";

// --- 1. SHADER: FLUID TOPOGRAPHY ---
const TopographyMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#e0e0e0"),
    uResolution: new THREE.Vector2(1, 1),
    uOpacity: 1.0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec2 uResolution;
    uniform float uOpacity;
    varying vec2 vUv;

    // --- Noise Functions ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    // Rounded rectangle SDF
    float roundedBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

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
      float scale = 3.0;
      float n = snoise(noiseUv * scale + uTime * 0.05);

      // Isolines
      float lines = fract(n * 5.0);
      float lineThickness = 0.03;
      float pattern = smoothstep(0.5 - lineThickness, 0.5, lines) - smoothstep(0.5, 0.5 + lineThickness, lines);

      // Opacity
      float opacity = 0.4;

      // Grain
      float grain = (fract(sin(dot(vUv, vec2(12.9898, 78.233) * 2.0)) * 43758.5453) - 0.5) * 0.15;

      vec3 finalColor = uColor + grain;

      gl_FragColor = vec4(finalColor, pattern * opacity * mask * uOpacity);
    }
  `
);

extend({ TopographyMaterial });

export function TechBackground({ isZoomedIn = false, quality = 1 }) {
  const materialRef = useRef();

  // Fixed world-space dimensions (doesn't change with camera zoom)
  const planeWidth = 90;
  const planeHeight = 40;

  useFrame((_, delta) => {
    if (!materialRef.current) return;

    materialRef.current.uTime += delta;
    materialRef.current.uResolution.set(planeWidth, planeHeight);

    // Tween opacity based on zoom state
    const targetOpacity = isZoomedIn ? 0.25 : 1.0;
    easing.damp(materialRef.current, "uOpacity", targetOpacity, 0.3, delta);
  });

  // Low quality mode: render simple solid color plane (no shader)
  if (quality < 0.5) {
    return (
      <Plane args={[planeWidth, planeHeight]} position={[0, 0, -15]} renderOrder={-1}>
        <meshBasicMaterial color="#e8e8e8" />
      </Plane>
    );
  }

  return (
    // Pass the calculated Width/Height to the geometry
    <Plane args={[planeWidth, planeHeight]} position={[0, 0, -15]} renderOrder={-1}>
      <topographyMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
      />
    </Plane>
  );
}