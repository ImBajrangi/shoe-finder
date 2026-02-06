import React, {
    useRef,
    useMemo,
    useState,
    useEffect,
    useLayoutEffect,
    Suspense,
} from "react";
import {
    Canvas,
    useFrame,
    useThree,
} from "@react-three/fiber";
import {
    useTexture,
    Text,
} from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";
import { Leva } from "leva";
// --- REAL DATA IMPORT ---
import shoes from "../../backend/shoes.json";
import MiniMap from "./MiniMap";
import {
    DEFAULT_CONFIG,
    CONFIG,
    useGridConfig,
} from "./useGridConfig";
import { UnifiedControlBar } from "./GridUI";
import { CloseButton } from "./CloseButton";
import Header from "./Header";
import { TechBackground } from "./TechBackground";
import { useRealtimeVoice } from "../hooks/useRealtimeVoice";
import { VoiceTranscript } from "./VoiceModeUI";
import "./HoloCardMaterial"; // Registers <holoCardMaterial /> with R3F

// --- PRELOAD ALL TEXTURES ---
// This ensures all shoe images are cached before switching collections
shoes.forEach((shoe) => {
    useTexture.preload(shoe.image_url);
});

// --- GLOBAL STATE ---
const rigState = {
    target: new THREE.Vector3(0, 2, 0),
    current: new THREE.Vector3(0, 2, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    zoom: CONFIG.zoomOut,
    isDragging: false,
    activeId: null,
};

// --- HELPER: Grid Dimensions ---
const calculateGridDimensions = (count) => {
    const rows = Math.ceil(count / CONFIG.gridCols);
    const spacing = CONFIG.itemSize + CONFIG.gap;
    return {
        width: CONFIG.gridCols * spacing,
        height: rows * spacing,
    };
};

// --- OPTIMIZED COMPONENT: SHOE TILE ---
function ShoeTile({
    data,
    index,
    basePos,
    gridVisible,
    transitionStartTime,
    interactive,
    matchesFilter = true,
    gridHeight,
}) {
    const ref = useRef();
    const imageRef = useRef();
    const titleRef = useRef();
    const priceRef = useRef();
    const [hovered, setHovered] = useState(false);
    const texture = useTexture(data.image_url);
    // Animation Refs
    const focusZ = useRef(0);
    const rotationX = useRef(0);
    const rotationY = useRef(0);
    const curveZ = useRef(0);
    const transitionZ = useRef(0);
    const transitionY = useRef(0);
    const breathScale = useRef(1);
    // Animated position for filter transitions
    const animatedPos = useRef({
        x: basePos.x,
        y: basePos.y,
    });
    const filterOpacity = useRef(1);
    const filterScale = useRef(1);
    // State to track if we should stop processing entirely (optimization)
    const isSleep = useRef(false);
    // Track if this item was dimmed due to focus mode (for fast recovery)
    const wasDimmedByFocus = useRef(false);
    // RESET ANIMATION STATE ON MOUNT

    useLayoutEffect(() => {
        const normalizedY =
            gridHeight > 0 ? basePos.y / (gridHeight / 2) : 0;
        if (gridVisible) {
            transitionZ.current = CONFIG.enterStartZ;
            transitionY.current =
                normalizedY * CONFIG.enterSpreadY;
            if (imageRef.current)
                imageRef.current.material.uOpacity =
                    CONFIG.enterStartOpacity;
            isSleep.current = false;
        } else {
            transitionZ.current = 0;
            transitionY.current = 0;
            if (imageRef.current)
                imageRef.current.material.uOpacity = 1;
        }
    }, []);
    const imageDims = useMemo(() => {
        const maxSize = CONFIG.itemSize * 0.9;
        if (!texture.image)
            return { width: maxSize, height: maxSize };
        const imgAspect =
            texture.image.width / texture.image.height;
        return imgAspect > 1
            ? { width: maxSize, height: maxSize / imgAspect }
            : { width: maxSize * imgAspect, height: maxSize };
    }, [texture]);
    useFrame((state, delta) => {
        // OPTIMIZATION 1: If sleeping or ref missing, stop immediately.
        if (!ref.current || isSleep.current) return;
        // --- 0. Filter Animation ---
        easing.damp(
            animatedPos.current,
            "x",
            basePos.x,
            0.2,
            delta
        );
        easing.damp(
            animatedPos.current,
            "y",
            basePos.y,
            0.2,
            delta
        );
        const targetFilterOpacity = matchesFilter ? 1 : 0;
        const targetFilterScale = matchesFilter ? 1 : CONFIG.filterScaleTarget;
        easing.damp(
            filterOpacity,
            "current",
            targetFilterOpacity,
            CONFIG.filterOpacityDamp,
            delta
        );
        easing.damp(
            filterScale,
            "current",
            targetFilterScale,
            CONFIG.filterOpacityDamp,
            delta
        );
        // Sleep check: If filtered out and visually invisible, stop processing
        // Check actual material opacity, not filterOpacity ref, to avoid popping
        const actualOpacity = imageRef.current?.material?.uOpacity ?? 1;
        if (actualOpacity < 0.01 && !matchesFilter) {
            ref.current.visible = false;
            return;
        }
        // --- 1. Stagger Logic ---
        const now = Date.now();
        const timeSinceTrigger = now - transitionStartTime;
        const staggerDelay = data.randomDelay || 0;
        const canTransition = timeSinceTrigger > staggerDelay;

        // --- 2. Calculate Targets ---
        let targetTransitionOpacity = 1.0;
        let targetTransitionZ = 0;
        const normalizedY =
            gridHeight > 0 ? basePos.y / (gridHeight / 2) : 0;
        let targetTransitionY = 0;
        if (gridVisible) {
            // ENTERING
            if (canTransition) {
                targetTransitionOpacity = 1.0;
                targetTransitionZ = 0;
                targetTransitionY = 0;
            } else {
                targetTransitionOpacity = CONFIG.enterStartOpacity;
                targetTransitionZ = CONFIG.enterStartZ;
                targetTransitionY =
                    normalizedY * CONFIG.enterSpreadY;
            }
        } else {
            // EXITING
            if (canTransition) {
                targetTransitionOpacity = 0.0;
                targetTransitionZ = CONFIG.exitEndZ;
                targetTransitionY =
                    normalizedY * CONFIG.exitSpreadY;
            } else {
                targetTransitionOpacity = 1.0;
                targetTransitionZ = 0;
                targetTransitionY = 0;
            }
        }
        // --- 3. Base Position ---
        const x = animatedPos.current.x + rigState.current.x;
        const y = animatedPos.current.y + rigState.current.y;
        // --- 4. Dynamic Culling ---
        const currentCull =
            CONFIG.cullDistance * (rigState.zoom / 8);
        const isPositionVisible =
            Math.abs(x) < currentCull &&
            Math.abs(y) < currentCull;
        // OPTIMIZATION 2: Strict Visibility Culling
        // If exiting and invisible, stop running this loop forever
        if (
            !gridVisible &&
            targetTransitionOpacity < 0.01 &&
            filterOpacity.current < 0.01
        ) {
            ref.current.visible = false;
            isSleep.current = true;
            return;
        }
        // Standard view culling
        if (
            !isPositionVisible &&
            !(!gridVisible && canTransition)
        ) {
            ref.current.visible = false;
            return;
        }
        // If opacity is effectively 0, hide mesh to save GPU rasterization
        if (
            imageRef.current?.material.uOpacity < 0.01 &&
            targetTransitionOpacity < 0.01
        ) {
            ref.current.visible = false;
            return;
        }
        ref.current.visible = true;
        // --- 5. Curvature & Zoom ---
        const isZoomedIn = rigState.zoom <= CONFIG.zoomIn + 0.5;
        const maxZoom = CONFIG.zoomOut || 50;
        const zoomRatio = isZoomedIn
            ? 0
            : THREE.MathUtils.clamp(
                (rigState.zoom - CONFIG.zoomIn) /
                (maxZoom - CONFIG.zoomIn),
                0,
                1
            );
        const smoothRatio = easing.cubic.inOut(zoomRatio);
        const distSq = x * x + y * y;
        const dist = Math.sqrt(distSq);
        const targetCurveZ =
            -distSq * CONFIG.curvatureStrength * smoothRatio;
        // Optimization: Skip complex rotation math if fading out
        let rotX = 0,
            rotY = 0;
        if (targetTransitionOpacity > 0.1) {
            const rotationIntensity =
                Math.min(dist * 0.4, 2.0) * smoothRatio;
            rotX =
                y *
                CONFIG.curvatureStrength *
                CONFIG.rotationStrength *
                rotationIntensity;
            rotY =
                -x *
                CONFIG.curvatureStrength *
                CONFIG.rotationStrength *
                rotationIntensity;
        }
        // --- 6. Interaction State ---
        const isFocusMode = rigState.activeId !== null;
        const isActive = rigState.activeId === index;
        const isHovered = hovered && interactive;
        let interactionScale = 1.0;
        let interactionOpacity = 1.0;
        let targetTextOpacity = 0;
        let targetFocusZ = 0;
        if (isFocusMode) {
            if (isActive) {
                interactionScale = CONFIG.focusScale;
                interactionOpacity = 1.0;
                targetTextOpacity = 1.0;
                targetFocusZ = 2;
            } else {
                interactionScale = CONFIG.dimScale;
                interactionOpacity = CONFIG.dimOpacity;
                targetTextOpacity = 0;
                targetFocusZ = -0.5;
                // Track that this item was dimmed
                wasDimmedByFocus.current = true;
            }
        } else {
            interactionScale =
                isHovered && !rigState.isDragging ? 1.05 : 1.0;
            targetFocusZ =
                isHovered && !rigState.isDragging ? 0.5 : 0;
        }
        const finalOpacity =
            interactionOpacity *
            targetTransitionOpacity *
            filterOpacity.current;
        const combinedScale =
            interactionScale * filterScale.current;
        // --- 7. Apply Animations ---
        easing.damp(
            ref.current.scale,
            "x",
            combinedScale,
            0.15,
            delta
        );
        easing.damp(
            ref.current.scale,
            "y",
            combinedScale,
            0.15,
            delta
        );
        easing.damp(
            focusZ,
            "current",
            targetFocusZ,
            0.2,
            delta
        );
        easing.damp(
            curveZ,
            "current",
            targetCurveZ,
            0.2,
            delta
        );
        easing.damp(
            transitionZ,
            "current",
            targetTransitionZ,
            CONFIG.transitionZDamp,
            delta
        );
        easing.damp(
            transitionY,
            "current",
            targetTransitionY,
            CONFIG.transitionYDamp,
            delta
        );
        ref.current.position.set(
            x,
            y + transitionY.current,
            curveZ.current + focusZ.current + transitionZ.current
        );
        easing.damp(rotationX, "current", rotX, 0.2, delta);
        easing.damp(rotationY, "current", rotY, 0.2, delta);
        ref.current.rotation.set(
            rotationX.current,
            rotationY.current,
            0
        );
        if (imageRef.current) {
            // Update shader uniforms
            imageRef.current.material.uTime =
                state.clock.elapsedTime;
            // Smoothly animate active state for shader effects
            const isActive = rigState.activeId === index;
            const activeDamp = isActive ? 0.6 : 0.15; // Slow open, fast close
            easing.damp(
                imageRef.current.material,
                "uActive",
                isActive ? 1 : 0,
                activeDamp,
                delta
            );
            // Animate opacity via shader uniform
            // Use faster damp for filter transitions and focus recovery, slower for grid enter/exit
            let opacityDamp;
            const isFilterTransition = !matchesFilter || filterOpacity.current < 0.99;
            // Focus recovery: item was dimmed and is now recovering
            const isFocusRecovery = !isFocusMode && wasDimmedByFocus.current;
            if (isFilterTransition && gridVisible) {
                // Filtering in or out - use filter damp for faster fade
                opacityDamp = CONFIG.filterOpacityDamp;
            } else if (isFocusRecovery && gridVisible) {
                // Recovering from dimmed state after deselection - use faster damp
                opacityDamp = CONFIG.filterOpacityDamp;
                // Reset flag once opacity is recovered
                if (imageRef.current.material.uOpacity > 0.95) {
                    wasDimmedByFocus.current = false;
                }
            } else if (gridVisible) {
                opacityDamp = CONFIG.enterOpacityDamp;
            } else {
                opacityDamp = CONFIG.exitOpacityDamp;
            }
            easing.damp(
                imageRef.current.material,
                "uOpacity",
                finalOpacity,
                opacityDamp,
                delta
            );
        }
        // Only update text opacity if text is actually rendered
        if (gridVisible) {
            const textTarget =
                targetTransitionOpacity < 0.8
                    ? 0
                    : targetTextOpacity;
            if (titleRef.current)
                easing.damp(
                    titleRef.current,
                    "fillOpacity",
                    textTarget,
                    0.1,
                    delta
                );
            if (priceRef.current)
                easing.damp(
                    priceRef.current,
                    "fillOpacity",
                    textTarget,
                    0.1,
                    delta
                );
            // Breathing animation for text when active
            const isActiveItem = rigState.activeId === index;
            const targetBreath = isActiveItem
                ? 1 +
                Math.sin(state.clock.elapsedTime * 2.0) * 0.035
                : 1;
            easing.damp(
                breathScale,
                "current",
                targetBreath,
                0.1,
                delta
            );
            // Apply breathing scale to text
            if (titleRef.current) {
                titleRef.current.scale.setScalar(
                    breathScale.current
                );
            }
            if (priceRef.current) {
                priceRef.current.scale.setScalar(
                    breathScale.current
                );
            }
        }
    });

    const handleClick = (e) => {
        if (!interactive) return;
        if (rigState.isDragging) {
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        if (rigState.activeId === index) {
            rigState.activeId = null;
        } else {
            const isZoomedOut = rigState.zoom > CONFIG.zoomIn + 2;
            rigState.target.set(-basePos.x, -basePos.y, 0);
            if (isZoomedOut) {
                rigState.activeId = index;
                rigState.zoom = CONFIG.zoomIn;
            } else {
                rigState.activeId = index;
            }
        }
    };
    const textY = -(imageDims.height / 2) - 0.25;
    const isActive = rigState.activeId === index;
    return (
        <group ref={ref}>
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={handleClick}
            >
                <planeGeometry
                    args={[
                        imageDims.width * 1.1,
                        imageDims.height * 1.1,
                    ]}
                />
                <meshBasicMaterial visible={false} />
            </mesh>
            <mesh ref={imageRef}>
                <planeGeometry
                    args={[imageDims.width, imageDims.height, 16, 16]}
                />
                <holoCardMaterial
                    transparent={true}
                    uTexture={texture}
                />
            </mesh>
            {/* OPTIMIZATION 3: CONDITIONAL TEXT RENDERING */}
            {/* Do NOT render text if the grid is exiting. Saves massive CPU overhead. */}
            {gridVisible && (
                <>
                    <Text
                        ref={titleRef}
                        position={[0, textY, 0.01]}
                        fontSize={0.1}
                        color="#000"
                        anchorY="top"
                        anchorX="center"
                        maxWidth={2.5}
                        fillOpacity={0}
                    >
                        {data.title}
                    </Text>
                    {data.price && (
                        <Text
                            ref={priceRef}
                            position={[0, textY - 0.22, 0.01]}
                            fontSize={0.09}
                            color="#555"
                            anchorY="top"
                            anchorX="center"
                            fillOpacity={0}
                        >
                            {data.price}
                        </Text>
                    )}
                </>
            )}
            <CloseButton
                isActive={isActive}
                position={[
                    imageDims.width / 2 - 0.15,
                    imageDims.height / 2 - 0.15,
                    0.02,
                ]}
                onClose={() => {
                    rigState.activeId = null;
                }}
            />
        </group>
    );
}

// --- COMPONENT: RIG ---
// Controls the camera. Moved OUT of GridCanvas so it is persistent.
function Rig({ gridW, gridH }) {
    const { camera, gl } = useThree();
    const prevPos = useRef(new THREE.Vector3());
    const hasSetInitialZoom = useRef(false);
    useEffect(() => {
        if (!hasSetInitialZoom.current && rigState.zoom) {
            camera.position.z = rigState.zoom;
            hasSetInitialZoom.current = true;
        }
    }, [camera]);
    const getBounds = () => {
        const dist = camera.position.z;
        const vFov = (camera.fov * Math.PI) / 180;
        const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
        const visibleWidth = visibleHeight * camera.aspect;
        const xLimit = Math.max(
            0,
            (gridW - visibleWidth) / 2 + 2
        );
        const yLimit = Math.max(
            0,
            (gridH - visibleHeight) / 2 + 2
        );
        return { x: xLimit, y: yLimit, visibleHeight };
    };

    useEffect(() => {
        const canvas = gl.domElement;
        let isDown = false;
        let startX = 0;
        let startY = 0;
        let initialRigX = 0;
        let initialRigY = 0;
        let maxDragDistance = 0; // Track max distance for click detection
        const onDown = (e) => {
            isDown = true;
            startX = e.clientX;
            startY = e.clientY;
            initialRigX = rigState.target.x;
            initialRigY = rigState.target.y;
            maxDragDistance = 0;
            rigState.isDragging = false; // Reset on new gesture
            canvas.style.cursor = "grabbing";
        };
        const onMove = (e) => {
            if (!isDown) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            maxDragDistance = Math.max(maxDragDistance, distance);
            // Use higher threshold for mobile (touch is less precise)
            const threshold =
                "ontouchstart" in window
                    ? 15
                    : CONFIG.clickThreshold;
            if (maxDragDistance > threshold) {
                rigState.isDragging = true;
                rigState.activeId = null;
            }
            const { x: bx, y: by, visibleHeight } = getBounds();
            const sensitivity =
                (visibleHeight / window.innerHeight) *
                CONFIG.dragSpeed;
            let rawTargetX = initialRigX + dx * sensitivity;
            let rawTargetY = initialRigY - dy * sensitivity;
            // Apply resistance when dragging past bounds
            if (rawTargetX > bx)
                rawTargetX =
                    bx + (rawTargetX - bx) * CONFIG.dragResistance;
            if (rawTargetX < -bx)
                rawTargetX =
                    -bx + (rawTargetX + bx) * CONFIG.dragResistance;
            if (rawTargetY > by)
                rawTargetY =
                    by + (rawTargetY - by) * CONFIG.dragResistance;
            if (rawTargetY < -by)
                rawTargetY =
                    -by + (rawTargetY + by) * CONFIG.dragResistance;
            // Hard limit on overshoot for snappier mobile feel
            const maxOvershoot = 3;
            rawTargetX = Math.max(
                -bx - maxOvershoot,
                Math.min(bx + maxOvershoot, rawTargetX)
            );
            rawTargetY = Math.max(
                -by - maxOvershoot,
                Math.min(by + maxOvershoot, rawTargetY)
            );
            rigState.target.set(rawTargetX, rawTargetY, 0);
        };
        const onUp = () => {
            if (!isDown) return; // Ignore spurious events
            isDown = false;
            rigState.isDragging = false;
            canvas.style.cursor = "grab";
            if (rigState.activeId !== null) return;
            const { x: bx, y: by } = getBounds();
            // When zoomed out, snap to center. When zoomed in, allow panning.
            const isZoomedOut =
                camera.position.z > CONFIG.zoomIn + 2;
            let snapX = isZoomedOut
                ? 0
                : Math.max(-bx, Math.min(bx, rigState.target.x));
            let snapY = isZoomedOut
                ? 2
                : Math.max(-by, Math.min(by, rigState.target.y));
            rigState.target.set(snapX, snapY, 0);
        };
        canvas.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp); // Handle interrupted touch
        return () => {
            canvas.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
    }, [gl, camera, gridW, gridH]);

    useFrame((state, delta) => {
        easing.damp3(
            rigState.current,
            rigState.target,
            CONFIG.dampFactor,
            delta
        );
        easing.damp(
            camera.position,
            "z",
            rigState.zoom,
            CONFIG.zoomDamp,
            delta
        );
        rigState.velocity
            .copy(rigState.current)
            .sub(prevPos.current);
        prevPos.current.copy(rigState.current);
        const zoomFactor = Math.min(
            1,
            CONFIG.zoomIn / rigState.zoom
        );
        const tiltX =
            rigState.velocity.y * CONFIG.tiltFactor * zoomFactor;
        const tiltY =
            -rigState.velocity.x * CONFIG.tiltFactor * zoomFactor;
        easing.damp(camera.rotation, "x", tiltX, 0.2, delta);
        easing.damp(camera.rotation, "y", tiltY, 0.2, delta);
    });
    return null;
}

// Stable empty array to avoid unnecessary re-renders
const EMPTY_COLORS = [];

// --- HELPER: Check if item matches filter ---
const matchesFilter = (item, filter, colorFilter = EMPTY_COLORS) => {
    // Check type filter (jordan/dunk)
    let matchesType = true;
    if (filter !== "all") {
        const title = item.title.toLowerCase();
        if (filter === "jordan") matchesType = title.includes("jordan");
        else if (filter === "dunk") matchesType = title.includes("dunk");
    }

    // Check color filter (array - OR logic across colors)
    let matchesColor = true;
    if (colorFilter.length > 0) {
        const shoeColor = item.primary_color || "";
        matchesColor = colorFilter.some((c) => {
            // Match gray variants (gray, dark_gray, light_gray) when "gray" is selected
            if (c === "gray") return shoeColor.includes("gray");
            return shoeColor === c;
        });
    }

    return matchesType && matchesColor;
};

// --- OPTIMIZED COMPONENT: GRID CANVAS ---
// Renders a single set of items with Time-Sliced mounting
function GridCanvas({
    items,
    gridVisible,
    transitionStartTime,
    interactive,
    filter = "all",
    colorFilter = EMPTY_COLORS,
}) {
    // Calculate filtered items and their new positions
    const { mappedItems, filteredGridDims } = useMemo(() => {
        const spacing = CONFIG.itemSize + CONFIG.gap;
        const filteredItems = items.filter((item) =>
            matchesFilter(item, filter, colorFilter)
        );
        const filteredCount = filteredItems.length;
        const filteredDims =
            calculateGridDimensions(filteredCount);
        const maxDelay = gridVisible
            ? CONFIG.enterStaggerDelay
            : CONFIG.exitStaggerDelay;
        let filteredIdx = 0;
        const mapped = items.map((shoe, i) => {
            const matches = matchesFilter(shoe, filter, colorFilter);
            let targetPos;
            if (matches) {
                const col = filteredIdx % CONFIG.gridCols;
                const row = Math.floor(
                    filteredIdx / CONFIG.gridCols
                );
                targetPos = {
                    x:
                        col * spacing -
                        filteredDims.width / 2 +
                        spacing / 2,
                    y:
                        -(row * spacing) +
                        filteredDims.height / 2 -
                        spacing / 2,
                };
                filteredIdx++;
            } else {
                const col = i % CONFIG.gridCols;
                const row = Math.floor(i / CONFIG.gridCols);
                const originalDims = calculateGridDimensions(
                    items.length
                );
                targetPos = {
                    x:
                        col * spacing -
                        originalDims.width / 2 +
                        spacing / 2,
                    y:
                        -(row * spacing) +
                        originalDims.height / 2 -
                        spacing / 2,
                };
            }
            return {
                ...shoe,
                index: i,
                randomDelay: Math.random() * maxDelay,
                basePos: targetPos,
                matchesFilter: matches,
            };
        });
        return {
            mappedItems: mapped,
            filteredGridDims: filteredDims,
        };
    }, [items, filter, colorFilter, gridVisible]);
    // --- TIME-SLICED MOUNTING ---
    // Start with 0 items rendered for entering grids.
    // Every frame, add more items to prevent GPU texture upload spike.
    // If EXITING, render everything immediately (no need to stagger out).
    const [mountedCount, setMountedCount] = useState(
        gridVisible ? 0 : items.length
    );
    useFrame(() => {
        // 5 items per frame @ 60fps = ~12 frames (200ms) to load 60 items.
        // Fast enough to be invisible, slow enough to fix the lag.
        if (mountedCount < mappedItems.length) {
            setMountedCount((prev) =>
                Math.min(prev + 5, mappedItems.length)
            );
        }
    });
    return (
        <>
            {mappedItems.map((item, i) => {
                // Only render if within the mounted count
                if (i > mountedCount) return null;
                return (
                    <ShoeTile
                        key={item.product_url || item.index}
                        data={item}
                        index={item.index}
                        basePos={item.basePos}
                        gridVisible={gridVisible}
                        transitionStartTime={transitionStartTime}
                        interactive={interactive && item.matchesFilter}
                        matchesFilter={item.matchesFilter}
                        gridHeight={filteredGridDims.height}
                    />
                );
            })}
        </>
    );
}

// --- MAIN EXPORT ---
export default function ShoeGrid() {
    const [zoomTarget, setZoomTarget] = useState(null);
    const [initialZoom] = useState(DEFAULT_CONFIG.zoomOut);
    const [currentZoom, setCurrentZoom] = useState(
        rigState.zoom
    );
    const controls = useGridConfig();
    // Track zoom state for UI components
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentZoom(rigState.zoom);
        }, 50); // Update every 50ms
        return () => clearInterval(interval);
    }, []);
    // Track active selection state
    const [hasActiveSelection, setHasActiveSelection] =
        useState(false);
    useEffect(() => {
        const interval = setInterval(() => {
            setHasActiveSelection(rigState.activeId !== null);
        }, 16); // Update every frame (60fps) for smoother updates
        return () => clearInterval(interval);
    }, []);
    const isZoomedIn = currentZoom <= CONFIG.zoomIn + 0.5;

    // Responsive zoom for mobile viewports
    useEffect(() => {
        const updateResponsiveZoom = () => {
            const width = window.innerWidth;
            let newZoomOut;
            if (width < 480) {
                newZoomOut = 48; // Phone
            } else if (width < 768) {
                newZoomOut = 38; // Tablet portrait
            } else {
                newZoomOut = DEFAULT_CONFIG.zoomOut; // Desktop default (31)
            }
            CONFIG.zoomOut = newZoomOut;
            // Only update current zoom if we're in zoomed-out state
            if (rigState.zoom > CONFIG.zoomIn + 2) {
                rigState.zoom = newZoomOut;
                setCurrentZoom(newZoomOut);
            }
        };
        updateResponsiveZoom();
        window.addEventListener("resize", updateResponsiveZoom);
        return () => window.removeEventListener("resize", updateResponsiveZoom);
    }, []);

    // Filter state for Nike collection
    const [nikeFilter, setNikeFilter] = useState("all"); // 'all' | 'jordan' | 'dunk'
    const [colorFilter, setColorFilter] = useState(EMPTY_COLORS); // [] = all, ['blue','green'] = blue OR green

    // --- Voice Assistant State ---
    const [voiceActive, setVoiceActive] = useState(false);

    // Collections - Nike (all, unfiltered), New Balance, Under $150
    const collectionsData = useMemo(() => {
        // All Nike shoes (filtering happens in GridCanvas)
        const nike = shoes.filter((s) => s.brand === "Nike");
        // New Balance shoes - take half and double to make 30+ items
        const newBalanceFull = shoes.filter(
            (s) => s.brand === "New Balance"
        );
        const newBalanceHalf = newBalanceFull.slice(0, Math.ceil(newBalanceFull.length / 2));
        const newBalance = [
            ...newBalanceHalf,
            ...newBalanceHalf.map((s, i) => ({
                ...s,
                product_url: `${s.product_url}-dup-${i}`,
            })),
        ];
        // Under $150 (all brands)
        const budget = shoes.filter((s) => {
            const price = parseInt(
                s.price?.replace(/[$,]/g, "") || "999"
            );
            return price < 150;
        });
        return [nike, newBalance, budget];
    }, []);
    // --- Grid Stack State ---
    // Instead of one list of items, we keep a stack of "Rendered Layers".
    // This allows us to have one layer exiting and one layer entering simultaneously.
    // Initial grid uses Nike collection (index 0)
    const [gridLayers, setGridLayers] = useState(() => [
        {
            id: "init",
            items: shoes.filter((s) => s.brand === "Nike"),
            mode: "enter", // 'enter' | 'exit'
            startTime: 0,
        },
    ]);
    const [activeCollectionIdx, setActiveCollectionIdx] =
        useState(0);
    const handleCollectionSwitch = (index) => {
        if (index === activeCollectionIdx) return;
        const now = Date.now();
        setGridLayers((prev) => {
            // 1. Mark existing 'enter' layers as 'exit'
            const exitingLayers = prev.map((layer) =>
                layer.mode === "enter"
                    ? { ...layer, mode: "exit", startTime: now }
                    : layer
            );
            // 2. Add new 'enter' layer
            const newLayer = {
                id: `grid-${index}-${now}`, // Unique ID for key
                items: collectionsData[index],
                mode: "enter",
                startTime: now,
            };
            return [...exitingLayers, newLayer];
        });
        setActiveCollectionIdx(index);
        // Clear Nike filters when leaving Nike collection
        setNikeFilter("all");
        setColorFilter(EMPTY_COLORS);
        rigState.target.set(0, 2, 0);
        rigState.activeId = null;
        // 3. Cleanup old layers after transition time
        setTimeout(() => {
            setGridLayers((prev) =>
                prev.filter((layer) => layer.mode === "enter")
            );
        }, CONFIG.cleanupTimeout);
    };
    // Handle filter change (for Nike collection) - just update filter state
    // The grid will animate items in place
    const handleFilterChange = (filter) => {
        if (filter === nikeFilter) return;
        setNikeFilter(filter);
        rigState.activeId = null;
    };

    // Handle color filter change (accepts array of colors)
    const handleColorFilterChange = (colors) => {
        setColorFilter(colors.length > 0 ? colors : EMPTY_COLORS);
        rigState.activeId = null;
    };

    // Helper: get short display names from shoe titles
    const shortName = (title) =>
        title.replace(/^Nike (Dunk|Air Jordan) (Low|High|Mid|Retro|1|4) /i, "").replace(/['']/g, "");

    // Helper: pick notable shoes from a list (shorter, interesting names first)
    const pickNotable = (items, max = 3) =>
        items
            .map((s) => shortName(s.title))
            .filter((n) => n.length < 30)
            .slice(0, max);

    // Helper: compute a shoe's visual position in the current (possibly filtered) grid
    const getFilteredShoePosition = (items, originalIndex, typeFilter, colFilter) => {
        const effectiveColors = colFilter.length > 0 ? colFilter : EMPTY_COLORS;
        // Count how many filtered items appear before this one
        let filteredIdx = 0;
        for (let i = 0; i < originalIndex; i++) {
            if (matchesFilter(items[i], typeFilter, effectiveColors)) filteredIdx++;
        }
        const filteredCount = items.filter((item) =>
            matchesFilter(item, typeFilter, effectiveColors)
        ).length;
        const spacing = CONFIG.itemSize + CONFIG.gap;
        const gridDims = calculateGridDimensions(filteredCount);
        const col = filteredIdx % CONFIG.gridCols;
        const row = Math.floor(filteredIdx / CONFIG.gridCols);
        return {
            x: col * spacing - gridDims.width / 2 + spacing / 2,
            y: -(row * spacing) + gridDims.height / 2 - spacing / 2,
        };
    };

    // Voice command handler - returns context objects for AI tool results
    const handleVoiceCommand = (cmd) => {
        const collectionNames = ["Nike", "New Balance", "Budget"];

        switch (cmd.type) {
            case "collection": {
                handleCollectionSwitch(cmd.value);
                const name = collectionNames[cmd.value];
                const count = collectionsData[cmd.value].length;
                return { message: `Switched to ${name} collection. ${count} shoes to browse.` };
            }
            case "filterShoes": {
                // Only apply filters on Nike collection
                if (activeCollectionIdx !== 0) return { message: "Filters only work on Nike collection." };
                const { types, colors } = cmd.value;
                const hasTypes = types !== undefined;
                const hasColors = colors !== undefined;

                let newType = nikeFilter;
                let newColors = colorFilter;

                if (!hasTypes && !hasColors) {
                    newType = "all";
                    newColors = [];
                    handleFilterChange("all");
                    handleColorFilterChange([]);
                } else {
                    if (hasTypes) {
                        newType = types.length === 1 ? types[0] : "all";
                        handleFilterChange(newType);
                    }
                    if (hasColors) {
                        newColors = colors;
                        handleColorFilterChange(colors);
                    }
                }

                // Compute what the user will see
                const allItems = collectionsData[0];
                const effectiveColors = newColors.length > 0 ? newColors : EMPTY_COLORS;
                const filtered = allItems.filter((item) =>
                    matchesFilter(item, newType, effectiveColors)
                );

                // Auto-select if exactly one result
                if (filtered.length === 1) {
                    const shoe = filtered[0];
                    const originalIndex = allItems.indexOf(shoe);
                    const pos = getFilteredShoePosition(allItems, originalIndex, newType, effectiveColors);
                    rigState.target.set(-pos.x, -pos.y, 0);
                    rigState.activeId = originalIndex;
                    rigState.zoom = CONFIG.zoomIn;
                    setCurrentZoom(CONFIG.zoomIn);
                    return { message: `Found 1 shoe: ${shoe.title}. Price: ${shoe.price || "N/A"}.` };
                }

                const notable = pickNotable(filtered);
                const notableStr = notable.length > 0 ? ` Highlights: ${notable.join(", ")}.` : "";
                return { message: `Showing ${filtered.length} shoes.${notableStr}` };
            }
            case "zoom":
                if (cmd.value === "in") {
                    setZoomTarget(CONFIG.zoomIn);
                } else if (cmd.value === "out") {
                    setZoomTarget("OUT");
                }
                return { message: `Zoomed ${cmd.value}.` };
            case "goBack": {
                // Reset everything: zoom out and clear all filters
                setZoomTarget("OUT");
                setNikeFilter("all");
                setColorFilter(EMPTY_COLORS);
                rigState.activeId = null;
                const count = collectionsData[activeCollectionIdx].length;
                return { message: `Reset to overview. Showing all ${count} shoes.` };
            }
            case "selectShoe": {
                // Search for a shoe by name in the current collection
                const searchTerm = cmd.value.toLowerCase();
                const currentItems = collectionsData[activeCollectionIdx];
                const foundIndex = currentItems.findIndex((shoe) =>
                    shoe.title.toLowerCase().includes(searchTerm)
                );
                if (foundIndex !== -1) {
                    const shoe = currentItems[foundIndex];
                    // Calculate position in the filtered grid (accounts for active filters)
                    const typeFilter = activeCollectionIdx === 0 ? nikeFilter : "all";
                    const colFilter = activeCollectionIdx === 0 ? colorFilter : EMPTY_COLORS;
                    const pos = getFilteredShoePosition(currentItems, foundIndex, typeFilter, colFilter);
                    rigState.target.set(-pos.x, -pos.y, 0);
                    rigState.activeId = foundIndex;
                    rigState.zoom = CONFIG.zoomIn;
                    setCurrentZoom(CONFIG.zoomIn);
                    return { message: `Selected: ${shoe.title}. Price: ${shoe.price || "N/A"}.` };
                }
                return { message: `No shoe found matching "${cmd.value}".` };
            }
            default:
                return { message: "Done." };
        }
    };

    // Voice assistant hook
    const voice = useRealtimeVoice({
        onCommand: handleVoiceCommand,
    });

    // Transcript display — persists until replaced by new message or voice deactivation
    const [transcriptDisplay, setTranscriptDisplay] = useState(null);
    useEffect(() => {
        if (voice.transcript && voiceActive) {
            setTranscriptDisplay(voice.transcript);
        }
        if (!voiceActive) setTranscriptDisplay(null);
    }, [voice.transcript, voiceActive]);

    // Toggle voice mode
    const handleVoiceModeToggle = () => {
        if (voiceActive) {
            voice.endSession();
            setVoiceActive(false);
        } else {
            voice.startSession();
            setVoiceActive(true);
        }
    };

    useEffect(() => {
        if (zoomTarget === "OUT") {
            rigState.zoom = CONFIG.zoomOut;
            setCurrentZoom(CONFIG.zoomOut);
            rigState.target.set(0, 2, 0);
        } else if (typeof zoomTarget === "number") {
            rigState.zoom = zoomTarget;
            setCurrentZoom(zoomTarget);
        }
        setZoomTarget(null);
    }, [zoomTarget]);
    // Determine active grid dimensions for the Rig
    // We use the dimensions of the LAST layer (the incoming one)
    const activeLayer = gridLayers[gridLayers.length - 1];
    // Calculate filtered item count for Nike collection
    const filteredItemCount = useMemo(() => {
        if (activeCollectionIdx !== 0)
            return activeLayer.items.length;
        return activeLayer.items.filter((item) =>
            matchesFilter(item, nikeFilter, colorFilter)
        ).length;
    }, [activeLayer.items, activeCollectionIdx, nikeFilter, colorFilter]);

    const activeDims = calculateGridDimensions(
        filteredItemCount
    );

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                backgroundColor: "#f0f0f0",
                position: "relative",
                overflow: "hidden",
                touchAction: "none", // Prevent mobile browser touch gestures
            }}
        >
            <Leva collapsed={true} />
            <Header />
            <Canvas
                camera={{ position: [0, 0, initialZoom], fov: 45 }}
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    toneMapping: THREE.NoToneMapping,
                }}
            >
                {/* Rig is now shared, based on the dimensions of the active grid */}
                <Rig
                    gridW={activeDims.width}
                    gridH={activeDims.height}
                />
                {/* Tech Background - geometric lines and crosshairs for CAD/architectural feel */}
                <TechBackground
                    isZoomedIn={isZoomedIn}
                    color={CONFIG.bgColor}
                    opacity={CONFIG.bgOpacity}
                    speed={CONFIG.bgSpeed}
                    scale={CONFIG.bgScale}
                    lineThickness={CONFIG.bgLineThickness}
                />
                <fog
                    attach="fog"
                    args={[
                        "#f0f0f0",
                        controls?.fogNear ?? DEFAULT_CONFIG.fogNear,
                        controls?.fogFar ?? DEFAULT_CONFIG.fogFar,
                    ]}
                />
                {/* Suspense boundary for texture loading */}
                <Suspense fallback={null}>
                    {/* Render all active layers (Entering + Exiting) */}
                    {gridLayers.map((layer, layerIdx) => (
                        <GridCanvas
                            key={layer.id} // Essential for React to treat them as different trees
                            items={layer.items}
                            gridVisible={layer.mode === "enter"}
                            transitionStartTime={layer.startTime}
                            interactive={layer.mode === "enter"} // Only entering grid is clickable
                            filter={
                                activeCollectionIdx === 0
                                    ? nikeFilter
                                    : "all"
                            }
                            colorFilter={
                                activeCollectionIdx === 0
                                    ? colorFilter
                                    : EMPTY_COLORS
                            }
                        />
                    ))}
                </Suspense>
            </Canvas>
            <MiniMap
                gridDims={activeDims}
                rigState={rigState}
                config={CONFIG}
                totalItems={filteredItemCount}
                isZoomedIn={isZoomedIn}
            />
            <UnifiedControlBar
                currentCollection={activeCollectionIdx}
                onSwitch={handleCollectionSwitch}
                setZoomTrigger={setZoomTarget}
                isZoomedIn={isZoomedIn}
                hasActiveSelection={hasActiveSelection}
                nikeFilter={nikeFilter}
                onFilterChange={handleFilterChange}
                voiceMode={
                    voiceActive
                        ? {
                            isActive: true,
                            status: voice.status,
                            transcript: voice.transcript,
                            audioLevel: voice.audioLevel,
                        }
                        : null
                }
                onVoiceModeToggle={handleVoiceModeToggle}
            />
            <VoiceTranscript
                text={transcriptDisplay}
                visible={voiceActive && !!transcriptDisplay}
            />
        </div>
    );
}
