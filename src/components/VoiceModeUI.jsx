import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AudioWaveform - Real-time bars visualization for voice activity
 */
export function AudioWaveform({ level = 0, barCount = 5 }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3px",
        height: "24px",
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Create varying heights based on audio level and position
        const centerIndex = (barCount - 1) / 2;
        const distanceFromCenter = Math.abs(i - centerIndex);
        const positionMultiplier = 1 - distanceFromCenter / centerIndex * 0.4;

        // Use stable offset based on index for natural feel
        const indexOffset = Math.sin(i * 1.5) * 0.15 + 0.85;
        const heightPercent =
          Math.max(0.2, level * positionMultiplier * indexOffset) * 100;

        return (
          <motion.div
            key={i}
            animate={{
              height: `${Math.max(20, heightPercent)}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 800,
              damping: 20,
            }}
            style={{
              width: "4px",
              background: "linear-gradient(to top, #000, #333)",
              borderRadius: "2px",
              minHeight: "4px",
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * VoicePulse - Pulsing circle indicator when listening
 */
export function VoicePulse({ status }) {
  const isListening = status === "listening";
  const isSpeaking = status === "speaking";
  const isConnecting = status === "connecting";

  return (
    <div
      style={{
        position: "relative",
        width: "12px",
        height: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer pulse ring */}
      {(isListening || isSpeaking) && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: isListening ? 1.5 : 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: isSpeaking ? "#4F46E5" : "#10B981",
          }}
        />
      )}

      {/* Core dot */}
      <motion.div
        animate={{
          scale: isConnecting ? [1, 1.2, 1] : 1,
          background: isConnecting
            ? "#F59E0B"
            : isSpeaking
              ? "#4F46E5"
              : isListening
                ? "#10B981"
                : "#9CA3AF",
        }}
        transition={
          isConnecting
            ? { duration: 0.6, repeat: Infinity }
            : { duration: 0.3 }
        }
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          zIndex: 1,
        }}
      />
    </div>
  );
}

/**
 * MicButton - Toggle button to enter voice mode
 */
export function MicButton({ onClick, disabled }) {
  return (
    <motion.button
      layout="position"
      onClick={onClick}
      disabled={disabled}
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
        color: disabled ? "#9CA3AF" : "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        opacity: disabled ? 0.5 : 1,
      }}
      aria-label="Voice Assistant"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    </motion.button>
  );
}

/**
 * VoiceStatusText - Shows current status or transcript
 */
export function VoiceStatusText({ status, transcript }) {
  const getStatusText = () => {
    switch (status) {
      case "connecting":
        return "Connecting";
      case "listening":
        return ""; // Silent when listening - the pulse indicator shows state
      case "speaking":
        return transcript || "";
      case "error":
        return "Error occurred";
      default:
        return "";
    }
  };

  const displayText = transcript || getStatusText();

  // Don't render anything if there's no text to show
  if (!displayText) return null;

  return (
    <motion.span
      key={displayText}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        fontSize: "14px",
        fontWeight: "500",
        color: status === "error" ? "#EF4444" : "#111",
        maxWidth: "200px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {displayText}
    </motion.span>
  );
}

/**
 * VoiceCloseButton - Close button for voice mode
 */
export function VoiceCloseButton({ onClick }) {
  return (
    <motion.button
      layout="position"
      onClick={onClick}
      whileHover={{
        scale: 1.1,
        backgroundColor: "rgba(0,0,0,0.1)",
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        border: "none",
        background: "rgba(0,0,0,0.05)",
        color: "#666",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        outline: "none",
      }}
      aria-label="Close Voice Mode"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </motion.button>
  );
}

/**
 * VoiceTranscript - Floating glassmorphic display for AI responses
 * Pure presentational component — parent manages visibility and text.
 */
export function VoiceTranscript({ text, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="transcript-container"
          initial={{ opacity: 0, y: 16, scale: 0.95, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 1,
            opacity: { duration: 0.2 },
          }}
          style={{
            position: "fixed",
            bottom: "105px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 101,
            pointerEvents: "none",
          }}
        >
          <motion.div
            layout
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 240, 235, 0.35) 0%, rgba(255, 255, 255, 0.25) 50%, rgba(245, 235, 255, 0.35) 100%)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 0 0 0.5px rgba(0, 0, 0, 0.03)",
              padding: "10px 20px",
              maxWidth: "360px",
              overflow: "hidden",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={text}
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.15 }}
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#555",
                  textAlign: "center",
                  lineHeight: "1.4",
                  letterSpacing: "-0.01em",
                }}
              >
                {text}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Named exports are the primary way to import these components
// e.g., import { AudioWaveform, MicButton } from "./VoiceModeUI"
