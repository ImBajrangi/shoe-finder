import { useEffect } from "react";
import { useControls } from "leva";

// --- CONFIGURATION ---
// Default values - will be overridden by controls
export const DEFAULT_CONFIG = {
  gridCols: 8,
  itemSize: 2.5,
  gap: 0.4,

  // Physics
  dragSpeed: 2.2,
  dampFactor: 0.2,
  tiltFactor: 0.08,
  clickThreshold: 5,
  dragResistance: 0.25,

  // Camera / Zoom
  zoomIn: 12,
  zoomOut: 31, // Starting zoom level (configurable via Leva)
  zoomDamp: 0.25,

  // Visuals
  focusScale: 1.5,
  dimScale: 0.5,
  dimOpacity: 0.15,

  // 3D Curvature Effect
  curvatureStrength: 0.06, // How much it curves back
  rotationStrength: 0, // How much tiles rotate to face center

  // Culling
  cullDistance: 14,

  // Minimap
  mapWidth: 120,
  mapDotSize: 2,

  // Fog
  fogNear: 19,
  fogFar: 100,

  // Animation
  enterStartOpacity: 0.0,
  enterStartZ: -50,
  exitEndZ: 20,
  transitionZDamp: 0.25,
  enterOpacityDamp: 0.85,
  exitOpacityDamp: 0.15,
  enterStaggerDelay: 400,
  exitStaggerDelay: 300,
  cleanupTimeout: 700,
  exitSpreadY: 0.5, // How far top/bottom items spread vertically when exiting
  enterSpreadY: 1, // How far items start spread when entering (then settle to 0)
  transitionYDamp: 0.08, // Y spread animates faster than Z (lower = faster)
  filterOpacityDamp: 0.06, // Filter fade out (lower = faster, used when filtering within collection)
  filterScaleTarget: 0.5, // Scale target when filtered out (smaller = more dramatic shrink)

  // Tech Background
  bgColor: "#e0e0e0",
  bgOpacity: 0.4,
  bgSpeed: 0.05,
  bgScale: 3.0,
  bgLineThickness: 0.03,
};

// Create a ref to hold the current config so it can be updated
export let CONFIG = { ...DEFAULT_CONFIG };

// Initialize CONFIG with defaults
Object.assign(CONFIG, DEFAULT_CONFIG);

// Hook to set up Leva controls and sync them to CONFIG
export function useGridConfig() {
  // Controls for main config values
  const controls = useControls(
    "Shoe Grid",
    {
      curvatureStrength: {
        value: DEFAULT_CONFIG.curvatureStrength,
        min: 0,
        max: 0.2,
        step: 0.001,
        label: "Curvature Strength",
      },
      rotationStrength: {
        value: DEFAULT_CONFIG.rotationStrength,
        min: 0,
        max: 5,
        step: 0.1,
        label: "Rotation Strength",
      },
      focusScale: {
        value: DEFAULT_CONFIG.focusScale,
        min: 1,
        max: 3,
        step: 0.1,
        label: "Focus Scale",
      },
      dimScale: {
        value: DEFAULT_CONFIG.dimScale,
        min: 0,
        max: 1,
        step: 0.05,
        label: "Dim Scale",
      },
      dimOpacity: {
        value: DEFAULT_CONFIG.dimOpacity,
        min: 0,
        max: 1,
        step: 0.05,
        label: "Dim Opacity",
      },
      dragSpeed: {
        value: DEFAULT_CONFIG.dragSpeed,
        min: 0.1,
        max: 3,
        step: 0.1,
        label: "Drag Speed",
      },
      dampFactor: {
        value: DEFAULT_CONFIG.dampFactor,
        min: 0.05,
        max: 0.5,
        step: 0.05,
        label: "Damp Factor",
      },
      tiltFactor: {
        value: DEFAULT_CONFIG.tiltFactor,
        min: 0,
        max: 0.2,
        step: 0.01,
        label: "Tilt Factor",
      },
      zoomIn: {
        value: DEFAULT_CONFIG.zoomIn,
        min: 5,
        max: 30,
        step: 1,
        label: "Zoom In",
      },
      zoomDamp: {
        value: DEFAULT_CONFIG.zoomDamp,
        min: 0.05,
        max: 0.5,
        step: 0.05,
        label: "Zoom Damp",
      },
      zoomOut: {
        value: DEFAULT_CONFIG.zoomOut,
        min: 10,
        max: 100,
        step: 1,
        label: "Zoom Out",
      },
    },
    { collapsed: true, order: 0 }
  );
  // Animation controls

  const animationControls = useControls(
    "Transition",
    {
      enterStartOpacity: {
        value: DEFAULT_CONFIG.enterStartOpacity,
        min: 0,
        max: 1,
        step: 0.05,
        label: "Enter Start Opacity",
      },
      enterStartZ: {
        value: DEFAULT_CONFIG.enterStartZ,
        min: -50,
        max: 0,
        step: 1,
        label: "Enter Start Z",
      },
      exitEndZ: {
        value: DEFAULT_CONFIG.exitEndZ,
        min: 0,
        max: 50,
        step: 1,
        label: "Exit End Z",
      },
      transitionZDamp: {
        value: DEFAULT_CONFIG.transitionZDamp,
        min: 0.05,
        max: 1,
        step: 0.05,
        label: "Transition Z Damp",
      },
      enterOpacityDamp: {
        value: DEFAULT_CONFIG.enterOpacityDamp,
        min: 0.05,
        max: 1,
        step: 0.05,
        label: "Enter Opacity Damp",
      },
      exitOpacityDamp: {
        value: DEFAULT_CONFIG.exitOpacityDamp,
        min: 0.05,
        max: 1,
        step: 0.05,
        label: "Exit Opacity Damp",
      },
      enterStaggerDelay: {
        value: DEFAULT_CONFIG.enterStaggerDelay,
        min: 0,
        max: 2000,
        step: 50,
        label: "Enter Stagger Delay (ms)",
      },
      exitStaggerDelay: {
        value: DEFAULT_CONFIG.exitStaggerDelay,
        min: 0,
        max: 1000,
        step: 50,
        label: "Exit Stagger Delay (ms)",
      },
      cleanupTimeout: {
        value: DEFAULT_CONFIG.cleanupTimeout,
        min: 500,
        max: 3000,
        step: 100,
        label: "Cleanup Timeout (ms)",
      },
      exitSpreadY: {
        value: DEFAULT_CONFIG.exitSpreadY,
        min: 0,
        max: 10,
        step: 0.5,
        label: "Exit Spread Y",
      },
      enterSpreadY: {
        value: DEFAULT_CONFIG.enterSpreadY,
        min: 0,
        max: 10,
        step: 0.5,
        label: "Enter Spread Y",
      },
      transitionYDamp: {
        value: DEFAULT_CONFIG.transitionYDamp,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        label: "Y Damp (lower=faster)",
      },
      filterOpacityDamp: {
        value: DEFAULT_CONFIG.filterOpacityDamp,
        min: 0.01,
        max: 0.3,
        step: 0.01,
        label: "Filter Opacity Damp",
      },
    },
    { collapsed: true, order: 1 }
  );

  // TechBackground controls
  const techBgControls = useControls(
    "BG Shader",
    {
      bgColor: {
        value: "#e0e0e0",
        label: "Color",
      },
      bgOpacity: {
        value: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
        label: "Opacity",
      },
      bgSpeed: {
        value: 0.05,
        min: 0,
        max: 0.2,
        step: 0.01,
        label: "Speed",
      },
      bgScale: {
        value: 3.0,
        min: 1,
        max: 10,
        step: 0.5,
        label: "Scale",
      },
      bgLineThickness: {
        value: 0.03,
        min: 0.01,
        max: 0.1,
        step: 0.01,
        label: "Thickness",
      },
    },
    { collapsed: true, order: 2 }
  );

  // Update CONFIG object when controls change
  useEffect(() => {
    if (controls) {
      CONFIG.curvatureStrength =
        controls.curvatureStrength ??
        DEFAULT_CONFIG.curvatureStrength;
      CONFIG.rotationStrength =
        controls.rotationStrength ??
        DEFAULT_CONFIG.rotationStrength;
      CONFIG.fogNear =
        controls.fogNear ?? DEFAULT_CONFIG.fogNear;
      CONFIG.fogFar =
        controls.fogFar ?? DEFAULT_CONFIG.fogFar;
      CONFIG.focusScale =
        controls.focusScale ?? DEFAULT_CONFIG.focusScale;
      CONFIG.dimScale =
        controls.dimScale ?? DEFAULT_CONFIG.dimScale;
      CONFIG.dimOpacity =
        controls.dimOpacity ?? DEFAULT_CONFIG.dimOpacity;
      CONFIG.dragSpeed =
        controls.dragSpeed ?? DEFAULT_CONFIG.dragSpeed;
      CONFIG.dampFactor =
        controls.dampFactor ?? DEFAULT_CONFIG.dampFactor;
      CONFIG.tiltFactor =
        controls.tiltFactor ?? DEFAULT_CONFIG.tiltFactor;
      CONFIG.zoomIn =
        controls.zoomIn ?? DEFAULT_CONFIG.zoomIn;
      CONFIG.zoomDamp =
        controls.zoomDamp ?? DEFAULT_CONFIG.zoomDamp;
      CONFIG.zoomOut =
        controls.zoomOut ?? DEFAULT_CONFIG.zoomOut;
    }
    if (animationControls) {
      CONFIG.enterStartOpacity =
        animationControls.enterStartOpacity ??
        DEFAULT_CONFIG.enterStartOpacity;
      CONFIG.enterStartZ =
        animationControls.enterStartZ ??
        DEFAULT_CONFIG.enterStartZ;
      CONFIG.exitEndZ =
        animationControls.exitEndZ ??
        DEFAULT_CONFIG.exitEndZ;
      CONFIG.transitionZDamp =
        animationControls.transitionZDamp ??
        DEFAULT_CONFIG.transitionZDamp;
      CONFIG.enterOpacityDamp =
        animationControls.enterOpacityDamp ??
        DEFAULT_CONFIG.enterOpacityDamp;
      CONFIG.exitOpacityDamp =
        animationControls.exitOpacityDamp ??
        DEFAULT_CONFIG.exitOpacityDamp;
      CONFIG.enterStaggerDelay =
        animationControls.enterStaggerDelay ??
        DEFAULT_CONFIG.enterStaggerDelay;
      CONFIG.exitStaggerDelay =
        animationControls.exitStaggerDelay ??
        DEFAULT_CONFIG.exitStaggerDelay;
      CONFIG.cleanupTimeout =
        animationControls.cleanupTimeout ??
        DEFAULT_CONFIG.cleanupTimeout;
      CONFIG.exitSpreadY =
        animationControls.exitSpreadY ??
        DEFAULT_CONFIG.exitSpreadY;
      CONFIG.enterSpreadY =
        animationControls.enterSpreadY ??
        DEFAULT_CONFIG.enterSpreadY;
      CONFIG.transitionYDamp =
        animationControls.transitionYDamp ??
        DEFAULT_CONFIG.transitionYDamp;
      CONFIG.filterOpacityDamp =
        animationControls.filterOpacityDamp ??
        DEFAULT_CONFIG.filterOpacityDamp;
    }
    if (techBgControls) {
      CONFIG.bgColor = techBgControls.bgColor ?? "#e0e0e0";
      CONFIG.bgOpacity = techBgControls.bgOpacity ?? 0.4;
      CONFIG.bgSpeed = techBgControls.bgSpeed ?? 0.05;
      CONFIG.bgScale = techBgControls.bgScale ?? 3.0;
      CONFIG.bgLineThickness =
        techBgControls.bgLineThickness ?? 0.03;
    }
  }, [controls, animationControls, techBgControls]);

  return controls;
}
