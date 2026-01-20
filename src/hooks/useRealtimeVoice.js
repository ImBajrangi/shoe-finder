import { useState, useRef, useCallback, useEffect } from "react";

const SHOE_ASSISTANT_PROMPT = `You are a chill sneaker sales rep. Friendly, brief, helpful.

Collections: Nike (filterable: Jordan, Dunk, and by color), New Balance, Budget (under $150)

Available colors for Nike: black, white, gray, red, orange, blue, green, purple, pink, yellow, teal

RULES:
- Use tools immediately
- MAX 5-6 words. Examples: "Here's the blue ones", "Jordans, nice choice", "New Balance for you", "Budget picks right here"
- Never use punctuation like question marks or exclamation points
- Chill and confident tone`;

// Tool definitions for the AI
const TOOLS = [
  {
    type: "function",
    name: "switch_collection",
    description: "Switch to a different shoe collection",
    parameters: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          enum: ["nike", "new_balance", "budget"],
          description: "The collection to switch to",
        },
      },
      required: ["collection"],
    },
  },
  {
    type: "function",
    name: "apply_filter",
    description:
      "Apply a filter to the current Nike collection. Only works when viewing Nike shoes.",
    parameters: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          enum: ["all", "jordan", "dunk"],
          description: "The filter to apply",
        },
      },
      required: ["filter"],
    },
  },
  {
    type: "function",
    name: "set_zoom",
    description: "Zoom in to see shoes closer or zoom out for overview",
    parameters: {
      type: "object",
      properties: {
        level: {
          type: "string",
          enum: ["in", "out"],
          description: "Zoom in for detail or out for overview",
        },
      },
      required: ["level"],
    },
  },
  {
    type: "function",
    name: "filter_by_color",
    description:
      "Filter shoes by their primary color. Only works when viewing Nike collection.",
    parameters: {
      type: "object",
      properties: {
        color: {
          type: "string",
          enum: ["all", "black", "white", "gray", "red", "orange", "blue", "green", "purple", "pink", "yellow", "teal"],
          description: "The color to filter by, or 'all' to clear the filter",
        },
      },
      required: ["color"],
    },
  },
  {
    type: "function",
    name: "go_back",
    description:
      "Go back to the overview - zooms out and clears all filters. Use when user says 'go back', 'reset', 'start over', 'show everything', etc.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

/**
 * useRealtimeVoice - WebRTC connection hook for OpenAI Realtime API
 * Uses tool calling for structured commands
 */
export function useRealtimeVoice({ systemPrompt, onCommand } = {}) {
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Keep callback ref current to avoid stale closures
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setAudioLevel(0);
    setTranscript("");
  }, []);

  const startAudioLevelMonitoring = useCallback((stream) => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(Math.min(1, average / 128));
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();
  }, []);

  // Execute tool and return result
  const executeTool = useCallback((name, args) => {
    console.log(`[Tool Call] ${name}:`, args);

    switch (name) {
      case "switch_collection": {
        const collectionMap = { nike: 0, new_balance: 1, budget: 2 };
        const value = collectionMap[args.collection];
        if (value !== undefined) {
          onCommandRef.current?.({ type: "collection", value });
          return { success: true, message: `Switched to ${args.collection}` };
        }
        return { success: false, message: "Unknown collection" };
      }

      case "apply_filter": {
        onCommandRef.current?.({ type: "filter", value: args.filter });
        return { success: true, message: `Applied ${args.filter} filter` };
      }

      case "set_zoom": {
        onCommandRef.current?.({ type: "zoom", value: args.level });
        return { success: true, message: `Zoomed ${args.level}` };
      }

      case "filter_by_color": {
        onCommandRef.current?.({ type: "colorFilter", value: args.color });
        return { success: true, message: `Filtered by ${args.color}` };
      }

      case "go_back": {
        onCommandRef.current?.({ type: "goBack" });
        return { success: true, message: "Back to overview" };
      }

      default:
        return { success: false, message: "Unknown tool" };
    }
  }, []);

  // Handle data channel messages
  const handleDataChannelMessage = useCallback(
    (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "session.created":
            setStatus("listening");
            break;

          case "input_audio_buffer.speech_started":
            setStatus("listening");
            setTranscript(""); // Clear previous response when user starts speaking
            break;

          case "input_audio_buffer.speech_stopped":
            setStatus("speaking");
            break;

          case "response.audio_transcript.delta":
            // Ignore streaming deltas - wait for final
            break;

          case "response.audio_transcript.done":
            if (message.transcript) {
              console.log("[Voice Assistant]", message.transcript);
              setTranscript(message.transcript);
            }
            break;

          // Handle tool calls
          case "response.function_call_arguments.done": {
            const { call_id, name, arguments: argsJson } = message;
            let args = {};
            try {
              args = JSON.parse(argsJson);
            } catch {
              args = {};
            }

            const result = executeTool(name, args);

            // Send tool result back
            if (dataChannelRef.current?.readyState === "open") {
              dataChannelRef.current.send(
                JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: call_id,
                    output: JSON.stringify(result),
                  },
                })
              );
              // Trigger response after tool result
              dataChannelRef.current.send(
                JSON.stringify({ type: "response.create" })
              );
            }
            break;
          }

          case "response.done":
            setStatus("listening");
            // Don't clear transcript immediately - let UI components handle display timing
            break;

          case "error":
            console.error("Realtime API error:", message);
            setStatus("error");
            break;

          default:
            break;
        }
      } catch (err) {
        console.error("Error parsing data channel message:", err);
      }
    },
    [executeTool]
  );

  const startSession = useCallback(async () => {
    try {
      setStatus("connecting");
      cleanup();

      const tokenResponse = await fetch("/api/realtime-session", {
        method: "POST",
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get session token");
      }

      const sessionData = await tokenResponse.json();
      const ephemeralKey = sessionData.client_secret?.value;

      if (!ephemeralKey) {
        throw new Error("No client secret in response");
      }

      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      startAudioLevelMonitoring(localStreamRef.current);

      peerConnectionRef.current = new RTCPeerConnection();

      localStreamRef.current.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });

      // Muted - text responses only
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.muted = true;

      peerConnectionRef.current.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      dataChannelRef.current =
        peerConnectionRef.current.createDataChannel("oai-events");
      dataChannelRef.current.onmessage = handleDataChannelMessage;
      dataChannelRef.current.onopen = () => {
        // Configure session with tools
        const sessionUpdate = {
          type: "session.update",
          session: {
            instructions: systemPrompt || SHOE_ASSISTANT_PROMPT,
            voice: "alloy",
            tools: TOOLS,
            tool_choice: "auto",
            input_audio_transcription: {
              model: "whisper-1",
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        };
        dataChannelRef.current.send(JSON.stringify(sessionUpdate));
      };

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error("Failed to exchange SDP with OpenAI");
      }

      const answerSdp = await sdpResponse.text();

      await peerConnectionRef.current.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setStatus("listening");
    } catch (error) {
      console.error("Error starting voice session:", error);
      setStatus("error");
      cleanup();
    }
  }, [cleanup, handleDataChannelMessage, startAudioLevelMonitoring, systemPrompt]);

  const endSession = useCallback(() => {
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    status,
    transcript,
    audioLevel,
    startSession,
    endSession,
  };
}

export default useRealtimeVoice;
