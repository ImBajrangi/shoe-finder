import React, { useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial, Plane } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";
import { simplexNoise2D } from "@/lib/glsl";

// --- 1. SHADER: FLUID TOPOGRAPHY ---
const TopographyMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#e0e0e0"),
    uResolution: new THREE.Vector2(1, 1),
    uOpacity: 1.0,
    uLineOpacity: 0.4,
    uScale: 3.0,
    uLineThickness: 0.03,
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
    uniform float uLineOpacity;
    uniform float uScale;
    uniform float uLineThickness;
    varying vec2 vUv;

    ${simplexNoise2D}

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
  `
);

extend({ TopographyMaterial });

export function TechBackground({
  isZoomedIn = false,
  quality = 1,
  color = "#e0e0e0",
  opacity = 0.4,
  speed = 0.05,
  scale = 3.0,
  lineThickness = 0.03,
}) {
  const materialRef = useRef();

  // Fixed world-space dimensions (doesn't change with camera zoom)
  const planeWidth = 90;
  const planeHeight = 40;

  useFrame((_, delta) => {
    if (!materialRef.current) return;

    materialRef.current.uTime += delta * (speed / 0.05); // Normalize speed
    materialRef.current.uResolution.set(planeWidth, planeHeight);
    materialRef.current.uColor.set(color);
    materialRef.current.uLineOpacity = opacity;
    materialRef.current.uScale = scale;
    materialRef.current.uLineThickness = lineThickness;

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