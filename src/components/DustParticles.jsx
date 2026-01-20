// --- COMPONENT: 3D BOKEH DUST ---
import React, { useRef, useMemo } from "react";
import { useFrame, extend, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// 1. The "Bokeh" Shader
const BokehDustMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#202020"), // Dark grey/black
    uOpacity: 0.6,
    uResolution: new THREE.Vector2(1, 1), // Screen aspect ratio fix
  },
  // Vertex Shader
  `
    uniform float uTime;
    attribute float aScale;
    attribute vec3 aRandom; // x=speed, y=offset, z=drift
    varying float vAlpha;
    varying float vBlur;
    
    void main() {
      vec3 pos = position;
      
      // 1. Vertical Drift (Rising slowly)
      // We use mod() to wrap them around so they never run out
      float riseSpeed = 0.2 + (aRandom.z * 0.3); 
      pos.y += uTime * riseSpeed;
      pos.y = mod(pos.y + 20.0, 40.0) - 20.0; // Loop y between -20 and 20

      // 2. Horizontal Wander (Sine waves)
      pos.x += sin(uTime * aRandom.x + aRandom.y) * 0.5;
      pos.z += cos(uTime * aRandom.x * 0.5 + aRandom.y) * 0.5;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // 3. DEPTH OF FIELD LOGIC
      // Calculate distance from camera to particle
      float dist = length(mvPosition.xyz);
      
      // Define a "Focus Distance" (where shoes are, roughly z=0)
      // Shoes are at 0, Camera is at ~50. So focus dist is approx 40-50.
      // But in view space, negative z is forward.
      float focusDist = 45.0; // Adjust this to match your camera zoom roughly
      
      // Calculate blur factor based on how far we are from focus
      float blur = abs(dist - focusDist) / 20.0;
      blur = clamp(blur, 0.0, 1.0);
      vBlur = blur;

      // 4. Size Attenuation
      // Particles closer = Bigger. 
      // We add 'blur * 30.0' to make out-of-focus particles visibly larger (bokeh effect)
      float baseSize = 80.0 * aScale;
      gl_PointSize = (baseSize + (blur * 450.0)) / -mvPosition.z;
      
      // 5. Opacity fade
      // Fade out if very close to prevent jarring clipping
      // Fade out if very far
      float edgeFade = smoothstep(1.0, 10.0, dist) * smoothstep(100.0, 80.0, dist);
      
      // Make blurred particles more transparent
      vAlpha = edgeFade * (1.0 - (blur * 0.7)); 
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;
    varying float vBlur;
    
    void main() {
      // Get distance from center of point
      float r = length(gl_PointCoord - vec2(0.5));
      if (r > 0.5) discard;

      // Create the "Orb" look
      // Sharp center if in focus (vBlur low)
      // Soft diffuse if out of focus (vBlur high)
      float softness = 0.05 + (vBlur * 0.8);
      
      // Smooth circle edge
      float strength = 1.0 - smoothstep(0.5 - softness, 0.5, r);
      
      // Output color
      gl_FragColor = vec4(uColor, strength * uOpacity * vAlpha);
    }
  `
);

extend({ BokehDustMaterial });

function DustParticles({ count = 600 }) {
  const mesh = useRef();
  const { viewport } = useThree(); // Get screen dims if needed

  const { positions, randoms, scales } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // SPREAD THEM DEEP IN Z
      // This is the key to 3D parallax. 
      // Camera is at z=+50 (zoomed out) to z=+10 (zoomed in).
      // We place particles from z=-20 to z=+40.
      positions[i * 3] = (Math.random() - 0.5) * 60;     // X spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60; // Y spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60; // Z spread (Deep!)

      randoms[i * 3] = Math.random();
      randoms[i * 3 + 1] = Math.random() * 10;
      randoms[i * 3 + 2] = Math.random(); // Used for rise speed

      scales[i] = Math.random() * 0.5 + 0.5;
    }
    return { positions, randoms, scales };
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length / 3}
          array={randoms}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={scales.length}
          array={scales}
          itemSize={1}
        />
      </bufferGeometry>
      {/* depthWrite=false is essential for particles. 
         blending=CustomBlending could be used for fancier lights, 
         but NormalBlending is best for dark dust on light background.
      */}
      <bokehDustMaterial
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

export default DustParticles;