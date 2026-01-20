import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CONFIG } from "./useGridConfig";
import {
  AudioWaveform,
  VoicePulse,
  MicButton,
  VoiceCloseButton,
} from "./VoiceModeUI";

// 1. THE PHYSICS
// High stiffness, moderate damping = "Snappy but smooth" (Apple feel)
const islandTransition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1,
};

export function UnifiedControlBar({
  currentCollection,
  onSwitch,
  setZoomTrigger,
  isZoomedIn,
  hasActiveSelection,
  nikeFilter,
  onFilterChange,
  voiceMode,
  onVoiceModeToggle,
}) {
  const collections = [
    "Nike",
    "New Balance",
    "Under $150",
  ];

  const nikeFilters = [
    { id: "all", label: "All" },
    { id: "jordan", label: "Jordan" },
    { id: "dunk", label: "Dunk" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "40px",
        left: "0",
        right: "0",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {/* 
        THE ISLAND CONTAINER
        - layout: Animates width/height changes
        - borderRadius: 32px is standard for pill shapes
      */}
      <motion.div
        layout
        transition={islandTransition}
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 240, 235, 0.4) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(245, 235, 255, 0.4) 100%)", // Very subtle orange to purple gradient for glassy depth
          backdropFilter: "blur(40px) saturate(200%)", // Increased blur for more glassy feel
          WebkitBackdropFilter: "blur(40px) saturate(200%)", // Safari support
          borderRadius: "32px",
          border: "1px solid rgba(255, 255, 255, 0.3)", // Subtle white border for glass edge
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)", // Soft shadow + inner highlight
          padding: "6px",
          display: "flex",
          alignItems: "center",
          pointerEvents: "auto",
          height: "56px",
          overflow: "hidden", // Crucial for clipping content during resize
        }}
      >
        {/* 
          mode="popLayout" is CRITICAL. 
          It lets the outgoing component "pop" out of the layout flow 
          so the container can instantly shrink/grow to the new content's size.
        */}
        <AnimatePresence mode="popLayout" initial={false}>
          {voiceMode?.isActive ? (
            /* ---------------- STATE 0: VOICE MODE (Highest Priority) ---------------- */
            <motion.div
              key="voice-mode"
              initial={{
                opacity: 0,
                scale: 0.5,
                filter: "blur(8px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                filter: "blur(8px)",
              }}
              transition={{
                ...islandTransition,
                opacity: { duration: 0.2 },
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "0 8px",
              }}
            >
              <VoiceCloseButton onClick={onVoiceModeToggle} />
              <VoicePulse status={voiceMode.status} />
              {voiceMode.status === "listening" && (
                <AudioWaveform level={voiceMode.audioLevel} barCount={5} />
              )}
            </motion.div>
          ) : hasActiveSelection ? (
            /* ---------------- STATE 1: BUY NOW (Active Selection) ---------------- */
            <motion.button
              key="buy-now-mode"
              initial={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(4px)",
              }}
              transition={{
                ...islandTransition,
                opacity: { duration: 0.2 },
              }}
              onClick={() => {
                // Handle buy now action
                console.log("Buy Now clicked");
              }}
              style={{
                background: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "24px",
                padding: "0 24px",
                height: "44px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Buy Now
            </motion.button>
          ) : isZoomedIn ? (
            /* ---------------- STATE 2: COMPACT (Zoomed In) ---------------- */
            <motion.div
              key="compact-mode"
              initial={{
                opacity: 0,
                scale: 0.5,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                filter: "blur(4px)",
              }}
              transition={{
                ...islandTransition,
                opacity: { duration: 0.2 },
              }}
              style={{ display: "flex" }}
            >
              <ControlButton
                icon="remove"
                onClick={() => setZoomTrigger("OUT")}
                label="Zoom Out"
              />
            </motion.div>
          ) : (
            /* ---------------- STATE 2: EXPANDED (Zoomed Out) ---------------- */
            <motion.div
              key="expanded-mode"
              initial={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(4px)",
              }}
              transition={{
                ...islandTransition,
                opacity: { duration: 0.2 },
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ControlButton
                icon="add"
                onClick={() =>
                  setZoomTrigger(CONFIG.zoomIn)
                }
                label="Zoom In"
              />

              {/* Vertical Divider */}
              <motion.div
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "24px" }}
                transition={{ delay: 0.1 }}
                style={{
                  width: "1px",
                  background: "rgba(0,0,0,0.08)",
                  margin: "0 2px",
                  boxShadow:
                    "0 0 1px rgba(255, 255, 255, 0.3)", // Subtle highlight for glassy feel
                }}
              />

              {/* Collection Tabs Group */}
              <div style={{ display: "flex", gap: "2px" }}>
                {collections.map((name, index) => {
                  const isActive =
                    currentCollection === index;
                  return (
                    <TabButton
                      key={name}
                      isActive={isActive}
                      onClick={() => onSwitch(index)}
                    >
                      {name}
                    </TabButton>
                  );
                })}
              </div>

              {/* Nike Filters - only show when Nike collection is active */}
              {currentCollection === 0 && (
                <>
                  {/* Vertical Divider */}
                  <motion.div
                    layout
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={islandTransition}
                    style={{
                      width: "1px",
                      height: "24px",
                      background: "rgba(0,0,0,0.08)",
                      margin: "0 6px",
                      transformOrigin: "center",
                    }}
                  />

                  {/* Filter Chips */}
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={islandTransition}
                    style={{ display: "flex", gap: "4px" }}
                  >
                    {nikeFilters.map((filter) => (
                      <FilterChip
                        key={filter.id}
                        isActive={nikeFilter === filter.id}
                        onClick={() => onFilterChange(filter.id)}
                      >
                        {filter.label}
                      </FilterChip>
                    ))}
                  </motion.div>
                </>
              )}

              {/* Vertical Divider before mic button */}
              {/* <motion.div
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "24px" }}
                transition={{ delay: 0.1 }}
                style={{
                  width: "1px",
                  background: "rgba(0,0,0,0.08)",
                  margin: "0 2px",
                  boxShadow: "0 0 1px rgba(255, 255, 255, 0.3)",
                }}
              />

              <MicButton onClick={onVoiceModeToggle} /> */}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// --- Sub-components for cleaner code & isolated animations ---

function ControlButton({ onClick, icon, label }) {
  return (
    <motion.button
      layout="position" // Prevents icon distortion during resize
      onClick={onClick}
      whileHover={{
        scale: 1.05,
        backgroundColor: "rgba(0,0,0,0.05)",
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        outline: "none",
      }}
      aria-label={label}
    >
      {/* Simple SVG Icons instead of text for a sharper look */}
      {icon === "add" ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      )}
    </motion.button>
  );
}

function TabButton({ children, isActive, onClick }) {
  return (
    <motion.button
      layout
      onClick={onClick}
      style={{
        position: "relative",
        border: "none",
        background: "transparent",
        color: isActive ? "#000" : "#666",
        padding: "8px 16px",
        borderRadius: "20px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        whiteSpace: "nowrap", // Prevents text wrapping during resize
        zIndex: 1,
        transition: "color 0.2s ease",
      }}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          transition={islandTransition}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255, 255, 255, 0.6)", // Solid background for active state
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
            zIndex: -1,
          }}
        />
      )}
    </motion.button>
  );
}

function FilterChip({ children, isActive, onClick }) {
  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={islandTransition}
      style={{
        position: "relative",
        border: "none",
        background: "transparent",
        color: isActive ? "#fff" : "#555",
        padding: "6px 12px",
        borderRadius: "14px",
        fontSize: "12px",
        fontWeight: "500",
        cursor: "pointer",
        whiteSpace: "nowrap",
        zIndex: 1,
      }}
    >
      {/* Animated background pill */}
      {isActive && (
        <motion.div
          layoutId="activeFilterIndicator"
          transition={islandTransition}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            borderRadius: "14px",
            zIndex: -1,
          }}
        />
      )}
      {!isActive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.05)",
            borderRadius: "14px",
            zIndex: -1,
          }}
        />
      )}
      {children}
    </motion.button>
  );
}
