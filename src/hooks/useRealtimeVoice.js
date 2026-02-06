import { useState, useRef, useCallback, useEffect } from "react";

const SHOE_ASSISTANT_PROMPT = `You are a chill sneaker sales rep with deep sneaker knowledge. You can SEE the shoe grid and know exactly what's showing.

Collections: Nike (filterable by type and color), New Balance, Budget (under $150)

Nike types: Jordan, Dunk
Nike colors: black, white, gray, red, orange, blue, green, purple, pink, yellow, teal

You can combine filters: "blue Jordans", "red and black Dunks", "green and teal shoes"
Multiple colors use OR logic: "blue and green" shows blue OR green shoes.

You can select specific shoes by name: Travis Scott Dunks, Orange Lobster, Grey Fog, Panda, Powerpuff Girls Bubbles, Undefeated Dunks, various Jordan 1s/4s.

CONTEXT AWARENESS:
- Tool results tell you exactly what the user sees (shoe count, names, prices)
- Reference specific shoe names from tool results when they're interesting
- React to what's on screen like you can see it
- If a notable shoe appears in results, mention it naturally

PERSONALITY:
- You have opinions. Some shoes are "heat", some are "classics", some are "slept on"
- Be a knowledgeable friend, not a generic assistant
- Show genuine enthusiasm for good picks

RULES:
- Use tools immediately for any request
- MAX 5-6 words in your spoken response
- Examples: "Travis Scotts in there too", "Those are heat honestly", "Good eye on those", "Solid collection right here"
- Never use punctuation like question marks or exclamation points
- Chill and confident tone, like talking to a friend`;

// Tool definitions for the AI
const TOOLS = [
  {
    type: "function",
    name: "switch_collection",
    description:
      "Switch to a different shoe collection. Nike has type/color filtering, New Balance is a curated set, Budget shows all shoes under $150.",
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
    name: "filter_shoes",
    description:
      "Filter Nike shoes by type and/or color. Supports multiple colors (OR logic) for queries like 'blue and green shoes' or 'red or black Jordans'. Only works on the Nike collection. Omit a field to leave that filter unchanged. Call with no parameters to clear all filters.",
    parameters: {
      type: "object",
      properties: {
        types: {
          type: "array",
          items: {
            type: "string",
            enum: ["jordan", "dunk"],
          },
          description:
            "Shoe types to show. ['jordan'] for Jordans, ['dunk'] for Dunks. Omit to leave type filter unchanged.",
        },
        colors: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "black",
              "white",
              "gray",
              "red",
              "orange",
              "blue",
              "green",
              "purple",
              "pink",
              "yellow",
              "teal",
            ],
          },
          description:
            "Colors to show (OR logic). ['blue','green'] shows blue OR green shoes. Omit to leave color filter unchanged.",
        },
      },
    },
  },
  {
    type: "function",
    name: "set_zoom",
    description: "Zoom in to see shoes closer or zoom out for the full grid overview.",
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
    name: "go_back",
    description:
      "Reset everything: zoom out to overview, clear all filters, and deselect any shoe. Use for 'go back', 'reset', 'start over', 'show everything'.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    type: "function",
    name: "select_shoe",
    description:
      "Select and zoom into a specific shoe by name. Searches the current collection by title keywords. Use for 'show me the Travis Scotts' or 'I want to see the Orange Lobster'.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description:
            "Keywords to match against shoe titles (e.g. 'travis scott', 'orange lobster', 'grey fog', 'panda')",
        },
      },
      required: ["search"],
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

  // Execute tool and return result — onCommand returns context for richer AI responses
  const executeTool = useCallback((name, args) => {
    console.log(`[Tool Call] ${name}:`, args);

    const dispatch = (cmd) => {
      const ctx = onCommandRef.current?.(cmd);
      return ctx?.message || null;
    };

    switch (name) {
      case "switch_collection": {
        const collectionMap = { nike: 0, new_balance: 1, budget: 2 };
        const value = collectionMap[args.collection];
        if (value !== undefined) {
          const msg = dispatch({ type: "collection", value });
          return { success: true, message: msg || `Switched to ${args.collection}` };
        }
        return { success: false, message: "Unknown collection" };
      }

      case "filter_shoes": {
        const msg = dispatch({ type: "filterShoes", value: { types: args.types, colors: args.colors } });
        return { success: true, message: msg || "Filters applied" };
      }

      case "set_zoom": {
        const msg = dispatch({ type: "zoom", value: args.level });
        return { success: true, message: msg || `Zoomed ${args.level}` };
      }

      case "go_back": {
        const msg = dispatch({ type: "goBack" });
        return { success: true, message: msg || "Back to overview" };
      }

      case "select_shoe": {
        const msg = dispatch({ type: "selectShoe", value: args.search });
        return { success: true, message: msg || `Searching for ${args.search}` };
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
            setTranscript("");
            break;

          case "input_audio_buffer.speech_stopped":
            setStatus("speaking");
            setTranscript("...");
            break;

          case "response.audio_transcript.delta":
            // Wait for final transcript
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

        // Proactive greeting — AI speaks first
        setTimeout(() => {
          if (dataChannelRef.current?.readyState === "open") {
            dataChannelRef.current.send(
              JSON.stringify({
                type: "response.create",
                response: {
                  instructions:
                    "The user just activated voice mode on a sneaker browsing site. They're viewing a grid of Nike shoes. Give a brief, welcoming greeting. Remember: MAX 5-6 words, chill tone, no punctuation.",
                },
              })
            );
          }
        }, 300);
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
