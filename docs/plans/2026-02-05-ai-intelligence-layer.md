# AI Intelligence Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the voice assistant from "voice-controlled filters" into an AI that shops with you — visible responses, context awareness, and proactive behavior.

**Architecture:** Three-layer approach. (1) Rich tool results: `handleVoiceCommand` returns context objects that `executeTool` sends back to the AI, giving it awareness of what's on screen. (2) Proactive greeting: `response.create` fires on session connect to trigger an immediate AI greeting. (3) Transcript display: a glassmorphic `VoiceTranscript` component floats above the control bar, auto-fading after 4s.

**Tech Stack:** React, Framer Motion, OpenAI Realtime API (WebRTC data channel)

---

### Task 1: Context-aware tool results — handleVoiceCommand returns context

**Files:**
- Modify: `src/components/ShoeGrid.jsx` (handleVoiceCommand, lines 983-1052)

**What:** Each `case` in `handleVoiceCommand` returns a context object `{ message: string }` describing what the user now sees. The hook uses this as the tool result sent back to the AI.

**Details:**
- `filterShoes`: compute filtered count and pick 2-3 notable shoe names from results
- `selectShoe`: return the shoe's full title and price
- `collection`: return collection name and count
- `goBack`: return total count
- `zoom`: return simple confirmation

---

### Task 2: executeTool uses onCommand return values

**Files:**
- Modify: `src/hooks/useRealtimeVoice.js` (executeTool, lines 192-234)

**What:** Each tool case calls `onCommandRef.current?.(cmd)` and captures the return value. Use the returned `message` as the tool result's `message` field, falling back to the existing generic message.

---

### Task 3: Proactive greeting on voice session connect

**Files:**
- Modify: `src/hooks/useRealtimeVoice.js` (dataChannelRef.onopen, lines 367-388)

**What:** After sending `session.update`, send a `response.create` event with instructions for the AI to greet the user. This triggers an immediate AI response before the user speaks.

**Greeting prompt:** "The user just activated voice mode on a sneaker browsing site. Give a brief, chill greeting and let them know you can help find shoes. Remember MAX 5-6 words."

---

### Task 4: VoiceTranscript floating display component

**Files:**
- Modify: `src/components/VoiceModeUI.jsx` (add new export)

**What:** New `VoiceTranscript` component — a glassmorphic pill that floats above the control bar showing the AI's text responses.

**Behavior:**
- Appears when transcript is non-empty via AnimatePresence
- Spring-animated slide up + fade in
- Auto-hides after 4 seconds (timer resets on new transcript)
- Glassmorphic style matching the control bar aesthetic
- Positioned fixed, centered, ~110px from bottom

---

### Task 5: Wire VoiceTranscript into ShoeGrid

**Files:**
- Modify: `src/components/ShoeGrid.jsx` (return JSX, around line 1097)

**What:** Render `<VoiceTranscript>` in ShoeGrid's return, passing `voice.transcript` and `voiceActive`. Position it above the control bar.

---

### Task 6: Enhance system prompt for personality and context use

**Files:**
- Modify: `src/hooks/useRealtimeVoice.js` (SHOE_ASSISTANT_PROMPT, lines 2-19)

**What:** Update the system prompt to instruct the AI to:
- Reference specific shoe names from tool results when possible
- Add brief personality/opinion ("fire pick", "classic right there")
- Use context from tool results naturally
- Keep the MAX 5-6 word constraint but make words count
