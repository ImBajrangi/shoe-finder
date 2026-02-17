import React, { useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial, Plane } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";
import vertexShader from "@/shaders/topography.vert";
import fragmentShader from "@/shaders/topography.frag";

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
  vertexShader,
  fragmentShader
);

extend({ TopographyMaterial });

export function TopologyBackground({
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