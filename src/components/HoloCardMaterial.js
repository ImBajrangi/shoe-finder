import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import vertexShader from "@/shaders/holocard.vert";
import fragmentShader from "@/shaders/holocard.frag";

// --- HOLOGRAPHIC CARD SHADER MATERIAL ---
const HoloCardMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: new THREE.Texture(),
    uOpacity: 1,
    uActive: 0, // 0 = normal, 1 = active/selected
  },
  vertexShader,
  fragmentShader
);

// Extend so R3F recognizes <holoCardMaterial />
extend({ HoloCardMaterial });

export default HoloCardMaterial;
