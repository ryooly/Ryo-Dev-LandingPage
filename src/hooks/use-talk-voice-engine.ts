import { useEffect, useRef, useState, useCallback } from "react";

export type TalkEngineStatus =
  | "idle"
  | "connecting"
  | "recording"
  | "processing"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "error";

interface UseTalkVoiceEngineOptions {
  active: boolean;
  url?: string;
  silenceThresholdMs?: number;
}

export function useTalkVoiceEngine({
  active,
  url = "ws://localhost:8000/ws/audio",
  silenceThresholdMs = 1200,
}: UseTalkVoiceEngineOptions) {
  const [status, setStatus] = useState<TalkEngineStatus>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isStartedRef = useRef<boolean>(false);
  const speechDetectedRef = useRef<boolean>(false);
  const lastSpeechTimeRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  // Play audio chunks received from Edge-TTS or backend
  const playNextChunk = useCallback(async () => {
    if (playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const chunk = playbackQueueRef.current.shift()!;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const decodedBuffer = await ctx.decodeAudioData(chunk.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        playNextChunk();
      };
      source.start(0);
    } catch {
      playNextChunk();
    }
  }, []);

  const queueAudioForPlayback = useCallback((arrayBuffer: ArrayBuffer) => {
    playbackQueueRef.current.push(arrayBuffer);
    if (!isPlayingRef.current) {
      playNextChunk();
    }
  }, [playNextChunk]);

  // Stop recording and tell backend we finished utterance
  const stopUtterance = useCallback(() => {
    if (!isStartedRef.current || !socketRef.current) return;
    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "stop" }));
      setStatus("processing");
    }
    isStartedRef.current = false;
    speechDetectedRef.current = false;
  }, []);

  // Start new recording turn
  const startUtterance = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: "start",
        format: {
          encoding: "pcm_s16le",
          sampleRate: 16000,
          channels: 1,
        },
      })
    );
  }, []);

  // Connect & mic handling
  useEffect(() => {
    if (!active) {
      // Teardown
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (socketRef.current) {
        try {
          if (isStartedRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "stop" }));
          }
          socketRef.current.close();
        } catch {}
        socketRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
      isStartedRef.current = false;
      playbackQueueRef.current = [];
      isPlayingRef.current = false;
      setStatus("idle");
      return;
    }

    let isCancelled = false;
    setStatus("connecting");
    setErrorMessage(null);

    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    socketRef.current = ws;

    ws.onopen = () => {
      if (isCancelled) return;
    };

    ws.onmessage = (event) => {
      if (isCancelled) return;

      if (typeof event.data !== "string") {
        // Binary TTS audio chunk (MP3)
        queueAudioForPlayback(event.data);
        setStatus("speaking");
        return;
      }

      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "ready": {
            // Backend is ready, negotiate start
            ws.send(
              JSON.stringify({
                type: "start",
                format: {
                  encoding: "pcm_s16le",
                  sampleRate: 16000,
                  channels: 1,
                },
              })
            );
            break;
          }
          case "started": {
            isStartedRef.current = true;
            speechDetectedRef.current = false;
            setStatus("recording");
            break;
          }
          case "processing": {
            setStatus("processing");
            break;
          }
          case "transcribing": {
            setStatus("transcribing");
            break;
          }
          case "transcript": {
            setTranscript(msg.text || "");
            break;
          }
          case "thinking": {
            setStatus("thinking");
            break;
          }
          case "speaking": {
            setStatus("speaking");
            break;
          }
          case "llm_response": {
            setResponse((prev) => (prev ? prev + " " + msg.text : msg.text));
            break;
          }
          case "turn_complete": {
            // Once turn complete, resume recording after current audio playback finishes
            const checkPlaybackDone = setInterval(() => {
              if (!isPlayingRef.current && playbackQueueRef.current.length === 0) {
                clearInterval(checkPlaybackDone);
                if (!isCancelled && active && ws.readyState === WebSocket.OPEN) {
                  startUtterance();
                }
              }
            }, 300);
            break;
          }
          case "error": {
            if (msg.code === "empty_transcript" || msg.code === "too_short") {
              // Non-fatal, just start listening again
              if (!isCancelled && active && ws.readyState === WebSocket.OPEN) {
                startUtterance();
              }
            } else {
              setErrorMessage(msg.message || "Engine error");
            }
            break;
          }
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.onerror = () => {
      if (isCancelled) return;
      setStatus("error");
      setErrorMessage("Could not connect to voice engine backend (ws://localhost:8000/ws/audio)");
    };

    ws.onclose = () => {
      if (isCancelled) return;
      setStatus("idle");
    };

    // Initialize microphone streaming
    async function startMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        mediaStreamRef.current = stream;
        setMicPermissionGranted(true);

        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        // ScriptProcessor with 2048 buffer size = ~128ms frames at 16kHz
        const processor = audioCtx.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (!isStartedRef.current || !ws || ws.readyState !== WebSocket.OPEN) {
            return;
          }

          // Do not send audio if bot is currently speaking
          if (isPlayingRef.current) {
            return;
          }

          const inputData = e.inputBuffer.getChannelData(0);

          // Convert Float32Array [-1.0, 1.0] to PCM 16-bit Int16Array
          const pcm16 = new Int16Array(inputData.length);
          let sumSquares = 0;
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            sumSquares += s * s;
          }

          const rms = Math.sqrt(sumSquares / inputData.length);
          const now = Date.now();

          // Threshold for speech detection
          if (rms > 0.02) {
            speechDetectedRef.current = true;
            lastSpeechTimeRef.current = now;
          }

          ws.send(pcm16.buffer);
        };

        // Silence check interval to auto-send "stop" when user pauses speaking
        silenceTimerRef.current = setInterval(() => {
          if (
            isStartedRef.current &&
            speechDetectedRef.current &&
            Date.now() - lastSpeechTimeRef.current > silenceThresholdMs
          ) {
            stopUtterance();
          }
        }, 150);
      } catch (err) {
        console.error("Microphone access failed", err);
        if (!isCancelled) {
          setStatus("error");
          setErrorMessage("Microphone access denied or unavailable.");
        }
      }
    }

    startMic();

    return () => {
      isCancelled = true;
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (ws) {
        try {
          if (isStartedRef.current && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "stop" }));
          }
          ws.close();
        } catch {}
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
    };
  }, [active, url, silenceThresholdMs, playNextChunk, queueAudioForPlayback, startUtterance, stopUtterance]);

  const requestMicAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setMicPermissionGranted(true);
      setErrorMessage(null);

      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        const ws = socketRef.current;
        if (!isStartedRef.current || !ws || ws.readyState !== WebSocket.OPEN) {
          return;
        }

        if (isPlayingRef.current) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          sumSquares += s * s;
        }

        const rms = Math.sqrt(sumSquares / inputData.length);
        const now = Date.now();

        if (rms > 0.02) {
          speechDetectedRef.current = true;
          lastSpeechTimeRef.current = now;
        }

        ws.send(pcm16.buffer);
      };
    } catch (err) {
      console.error("Microphone access failed", err);
      setStatus("error");
      setErrorMessage("Microphone access blocked. Click the lock icon in your browser URL bar to allow microphone.");
    }
  }, []);

  return {
    status,
    transcript,
    response,
    errorMessage,
    micPermissionGranted,
    requestMicAccess,
    stopUtterance,
    startUtterance,
  };
}
