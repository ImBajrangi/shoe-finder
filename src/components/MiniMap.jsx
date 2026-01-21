import React, { useRef, useEffect, useState } from "react";

export default function MiniMap({
  gridDims,
  rigState,
  config,
  totalItems,
  isZoomedIn,
}) {
  const containerRef = useRef();
  const canvasRef = useRef();
  const zoomRef = useRef(1);
  const centerRef = useRef({ x: 0.5, y: 0.5 });
  const opacityRef = useRef(0);

  // Use relative sizing (percentage of viewport) - larger on mobile
  const [mapWidthPercent, setMapWidthPercent] = useState(8);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const aspectRatio = gridDims.width / gridDims.height;
  const dpr =
    typeof window !== "undefined"
      ? window.devicePixelRatio || 1
      : 1;

  // Calculate actual pixel dimensions from percentage, responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      // Larger minimap on mobile
      let widthPercent = 8; // Desktop default
      if (window.innerWidth < 480) {
        widthPercent = 20; // Phone
      } else if (window.innerWidth < 768) {
        widthPercent = 15; // Tablet
      }
      setMapWidthPercent(widthPercent);

      const width = (window.innerWidth * widthPercent) / 100;
      const height = width / aspectRatio;
      setDimensions({ width, height });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [aspectRatio]);

  const cols = config.gridCols;
  const rows = Math.ceil(totalItems / cols);

  useEffect(() => {
    let rafId;

    const draw = () => {
      if (!containerRef.current || !canvasRef.current) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      // Show when dragging OR when an item is active
      // On mobile, only show when zoomed in
      const isMobile = window.innerWidth < 768;
      const isActive =
        rigState.isDragging || rigState.activeId !== null;
      const shouldShow = isMobile ? (isActive && isZoomedIn) : isActive;
      const targetOp = shouldShow ? 1 : 0;
      opacityRef.current +=
        (targetOp - opacityRef.current) * 0.1;
      containerRef.current.style.opacity =
        opacityRef.current;

      if (opacityRef.current < 0.02) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      // Calculate zoom and center targets
      const isFocused = rigState.activeId !== null;
      const targetZoom = isFocused ? 2.5 : 1;

      let targetCenterX = 0.5;
      let targetCenterY = 0.5;

      if (isFocused) {
        const col = rigState.activeId % cols;
        const row = Math.floor(rigState.activeId / cols);
        targetCenterX = (col + 0.5) / cols;
        targetCenterY = (row + 0.5) / rows;
      }

      // Smooth interpolation
      zoomRef.current +=
        (targetZoom - zoomRef.current) * 0.08;
      centerRef.current.x +=
        (targetCenterX - centerRef.current.x) * 0.08;
      centerRef.current.y +=
        (targetCenterY - centerRef.current.y) * 0.08;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Apply zoom transform
      ctx.save();
      const zoom = zoomRef.current;
      const cx = centerRef.current.x * w;
      const cy = centerRef.current.y * h;

      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-cx, -cy);

      // Draw dots - size relative to canvas
      const baseDotSize = Math.max(w, h) * 0.015; // 1.5% of larger dimension
      for (let i = 0; i < totalItems; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const nX = (c + 0.5) / cols;
        const nY = (r + 0.5) / rows;

        const isSelected = rigState.activeId === i;
        const dotSize = isSelected ? baseDotSize * 2 : baseDotSize;

        ctx.beginPath();
        ctx.arc(nX * w, nY * h, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? "#FFB000"
          : "rgba(255, 255, 255, 0.4)";
        ctx.fill();
      }

      // Viewport Rect (only show when not focused)
      if (!isFocused) {
        const offPctX =
          -rigState.current.x / gridDims.width;
        const offPctY =
          rigState.current.y / gridDims.height;

        const vFov = (45 * Math.PI) / 180;
        const viewHeight = 2 * Math.tan(vFov / 2) * 10;
        const viewWidth =
          viewHeight *
          (window.innerWidth / window.innerHeight);

        const rectW =
          Math.min(viewWidth / gridDims.width, 1) * w;
        const rectH =
          Math.min(viewHeight / gridDims.height, 1) * h;
        const rectX = (0.5 + offPctX) * w - rectW / 2;
        const rectY = (0.5 + offPctY) * h - rectH / 2;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1.5 / zoom;
        ctx.strokeRect(rectX, rectY, rectW, rectH);
      }

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [gridDims, cols, rows, rigState, config, totalItems, isZoomedIn]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        bottom: "2vh",
        right: "2vw",
        width: `${mapWidthPercent}vw`,
        aspectRatio: aspectRatio,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(10px)",
        borderRadius: 0,
        opacity: 0,
        border: "1px solid rgba(255,255,255,0.2)",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width * dpr}
        height={dimensions.height * dpr}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
