import * as THREE from "three";
import { CONFIG } from "./gridConfig";

// --- GLOBAL STATE ---
export const rigState = {
    target: new THREE.Vector3(0, 2, 0),
    current: new THREE.Vector3(0, 2, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    zoom: CONFIG.zoomOut,
    isDragging: false,
    activeId: null,
};

// --- HELPER: Grid Dimensions ---
export const calculateGridDimensions = (count) => {
    const rows = Math.ceil(count / CONFIG.gridCols);
    const spacing = CONFIG.itemSize + CONFIG.gap;
    return {
        width: CONFIG.gridCols * spacing,
        height: rows * spacing,
    };
};

// Stable empty array to avoid unnecessary re-renders
export const EMPTY_COLORS = [];

// --- HELPER: Check if item matches filter ---
export const matchesFilter = (item, filter, colorFilter = EMPTY_COLORS) => {
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
