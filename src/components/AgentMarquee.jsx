import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AgentMarquee - Seamless infinite scrolling marquee
 * New messages append to the stream without jumping
 */
export function AgentMarquee({ text, isActive }) {
  const [messages, setMessages] = useState(["How can I help you?"]);
  const lastTextRef = useRef("");

  // Append new messages to the queue (no jump, just adds to the stream)
  useEffect(() => {
    if (isActive && text && text !== lastTextRef.current) {
      lastTextRef.current = text;
      setMessages(prev => [...prev, text]);
    }
  }, [text, isActive]);

  // Reset when voice mode activates
  useEffect(() => {
    if (isActive) {
      setMessages(["How can I help you?"]);
      lastTextRef.current = "";
    }
  }, [isActive]);

  const separator = " ✦ ";

  // Build content: repeat entire message sequence for seamless loop
  const renderMessages = () => {
    const items = [];
    // Repeat the full sequence twice for seamless scrolling
    for (let repeat = 0; repeat < 2; repeat++) {
      messages.forEach((msg, msgIdx) => {
        // Repeat each message a few times before moving to next
        for (let i = 0; i < 3; i++) {
          items.push(
            <span
              key={`${repeat}-${msgIdx}-${i}`}
              style={{
                fontSize: "13px",
                fontWeight: "500",
                letterSpacing: "0.03em",
                color: "#000",
                fontFamily: "system-ui, -apple-system, sans-serif",
                padding: "0 4px",
                textTransform: "uppercase",
              }}
            >
              {msg}
              <span style={{
                opacity: 0.3,
                margin: "0 16px",
                fontSize: "8px",
                verticalAlign: "middle",
              }}>
                {separator}
              </span>
            </span>
          );
        }
      });
    }
    return items;
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            bottom: "100px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 99,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "600px",
              height: "28px",
              overflow: "hidden",
              maskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)",
            }}
          >
            <div
              style={{
                position: "absolute",
                display: "flex",
                alignItems: "center",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  animation: "marqueeScroll 45s linear infinite",
                  whiteSpace: "nowrap",
                }}
              >
                {renderMessages()}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes marqueeScroll {
              0% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AgentMarquee;
