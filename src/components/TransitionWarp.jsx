import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { easing } from "maath";
import * as THREE from "three";

// Warp effect that activates during collection transitions
export function TransitionWarp({ isTransitioning }) {
  const chromaticRef = useRef();
  const vignetteRef = useRef();
  const intensity = useRef(0);

  useFrame((state, delta) => {
    // Animate intensity based on transition state
    const target = isTransitioning ? 1 : 0;
    easing.damp(intensity, "current", target, 0.15, delta);

    // Apply chromatic aberration - subtle color fringing for speed effect
    if (chromaticRef.current) {
      const offset = intensity.current * 0.004; // Max offset when transitioning
      chromaticRef.current.offset.set(offset, offset);
    }

    // Intensify vignette during transition
    if (vignetteRef.current) {
      vignetteRef.current.darkness = 0.3 + intensity.current * 0.4;
    }
  });

  return (
    <EffectComposer>
      <ChromaticAberration
        ref={chromaticRef}
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0, 0)}
        radialModulation={true}
        modulationOffset={0.2}
      />
      <Vignette
        ref={vignetteRef}
        darkness={0.3}
        offset={0.3}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
