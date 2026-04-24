"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, VideoOff, Activity, AlertTriangle, Camera } from "lucide-react";
import Card from "@/components/ui/Card";
import { api } from "@/lib/api";

export type MobilityState =
  | "lying"
  | "sitting"
  | "standing"
  | "unstable_standing"
  | "bed_exit_attempt"
  | "unsteady_gait"
  | "repositioning";

interface MobilityEvent {
  event_type: MobilityState;
  confidence: number;
  timestamp: string;
}

interface MobilityAssessment {
  id: string;
  score: number;
  risk_level: string;
  mobility_event_type: string | null;
  mobility_event_detected: boolean;
  contributing_factors: Record<string, number> | null;
  assessed_at: string;
}

interface Props {
  patientId: string | null;
  patientName?: string;
  onAssessmentUpdate?: (assessment: MobilityAssessment) => void;
}

const STATE_META: Record<
  MobilityState,
  { label: string; tone: "safe" | "warning" | "critical" }
> = {
  lying: { label: "Lying", tone: "safe" },
  sitting: { label: "Sitting", tone: "safe" },
  standing: { label: "Standing", tone: "warning" },
  repositioning: { label: "Repositioning", tone: "safe" },
  unstable_standing: { label: "Unstable Standing", tone: "critical" },
  bed_exit_attempt: { label: "Bed Exit Attempt", tone: "critical" },
  unsteady_gait: { label: "Unsteady Gait", tone: "critical" },
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

// MediaPipe Pose landmark indices
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_ELBOW = 13;
const R_ELBOW = 14;
const L_WRIST = 15;
const R_WRIST = 16;
const L_HIP = 23;
const R_HIP = 24;
const L_KNEE = 25;
const R_KNEE = 26;
const L_ANKLE = 27;
const R_ANKLE = 28;

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// ---------- MediaPipe loader (CDN, no npm install needed) ----------

interface PoseLandmarkerInstance {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number
  ) => { landmarks: Landmark[][] };
  close: () => void;
}

interface VisionModule {
  FilesetResolver: {
    forVisionTasks: (wasm: string) => Promise<unknown>;
  };
  PoseLandmarker: {
    createFromOptions: (
      fileset: unknown,
      options: Record<string, unknown>
    ) => Promise<PoseLandmarkerInstance>;
  };
}

let _visionPromise: Promise<VisionModule> | null = null;

function loadVision(): Promise<VisionModule> {
  if (_visionPromise) return _visionPromise;
  // Use a Function-wrapped dynamic import so the bundler doesn't try to resolve
  // the remote URL at build time. The browser performs the module fetch natively.
  const dynImport = new Function(
    "url",
    "return import(url)"
  ) as (url: string) => Promise<VisionModule>;
  _visionPromise = dynImport(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
  );
  return _visionPromise;
}

async function createPoseLandmarker(): Promise<PoseLandmarkerInstance> {
  const vision = await loadVision();
  const fileset = await vision.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  return vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

// ---------- Classifier ----------

class PoseClassifier {
  private torsoAngles: number[] = [];
  private hipYs: number[] = [];
  private readonly window = 15;
  private lastState: MobilityState = "lying";

  reset() {
    this.torsoAngles = [];
    this.hipYs = [];
    this.lastState = "lying";
  }

  classify(lm: Landmark[]): { state: MobilityState; confidence: number } {
    const mid = (a: Landmark, b: Landmark) => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      vis: ((a.visibility ?? 1) + (b.visibility ?? 1)) / 2,
    });

    const sh = mid(lm[L_SHOULDER], lm[R_SHOULDER]);
    const hp = mid(lm[L_HIP], lm[R_HIP]);
    const an = mid(lm[L_ANKLE], lm[R_ANKLE]);

    const dx = hp.x - sh.x;
    const dy = hp.y - sh.y;
    const torsoAngle =
      (Math.atan2(Math.abs(dx), Math.abs(dy) + 1e-6) * 180) / Math.PI;

    this.torsoAngles.push(torsoAngle);
    if (this.torsoAngles.length > this.window) this.torsoAngles.shift();
    this.hipYs.push(hp.y);
    if (this.hipYs.length > this.window) this.hipYs.shift();

    let sway = 0;
    if (this.torsoAngles.length >= 5) {
      const mean =
        this.torsoAngles.reduce((a, b) => a + b, 0) / this.torsoAngles.length;
      sway = Math.sqrt(
        this.torsoAngles.reduce((s, a) => s + (a - mean) ** 2, 0) /
          this.torsoAngles.length
      );
    }

    const confidence = Math.min(1, Math.max(0, (sh.vis + hp.vis + an.vis) / 3));

    let state: MobilityState;
    if (torsoAngle > 55) {
      state = this.torsoAngles.length >= 5 && sway > 4 ? "repositioning" : "lying";
    } else if (torsoAngle > 30) {
      state = "sitting";
    } else {
      const standing = an.y > hp.y + 0.15;
      if (standing && sway > 8) state = "unstable_standing";
      else if (standing && (this.lastState === "sitting" || this.lastState === "lying"))
        state = "bed_exit_attempt";
      else if (standing) state = "standing";
      else state = "sitting";
    }

    if (state === "standing" && this.hipYs.length >= 10) {
      const hipRange = Math.max(...this.hipYs) - Math.min(...this.hipYs);
      if (hipRange > 0.08 && sway > 5) state = "unsteady_gait";
    }

    this.lastState = state;
    return { state, confidence };
  }
}

// ---------- Component ----------

export function CVMobilityMonitor({
  patientId,
  patientName,
  onAssessmentUpdate,
}: Props) {
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentState, setCurrentState] = useState<MobilityState | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [events, setEvents] = useState<MobilityEvent[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarkerInstance | null>(null);
  const classifierRef = useRef(new PoseClassifier());
  const rafRef = useRef<number | null>(null);
  const lastEmitRef = useRef(0);
  const lastStateRef = useRef<MobilityState | null>(null);

  // Load historical events on patient change
  useEffect(() => {
    if (!patientId) {
      setEvents([]);
      return;
    }
    api.fallRisk
      .mobilityEvents(patientId)
      .then((rows) => {
        const list = rows as MobilityAssessment[];
        const mapped: MobilityEvent[] = list
          .filter((r) => r.mobility_event_type)
          .slice(0, 8)
          .map((r) => ({
            event_type: (r.mobility_event_type as MobilityState) || "lying",
            confidence: (r.contributing_factors?.mobility_event ?? 0) / 30,
            timestamp: r.assessed_at,
          }));
        setEvents(mapped);
      })
      .catch(() => {});
  }, [patientId]);

  const reportEvent = useCallback(
    async (event_type: MobilityState, confidence: number) => {
      if (!patientId) return;
      const newEvent: MobilityEvent = {
        event_type,
        confidence,
        timestamp: new Date().toISOString(),
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 10));
      try {
        const result = (await api.fallRisk.mobilityEvent({
          patient_id: patientId,
          event_type,
          confidence,
          timestamp: newEvent.timestamp,
        })) as MobilityAssessment;
        setLastError(null);
        onAssessmentUpdate?.(result);
      } catch (err) {
        setLastError(err instanceof Error ? err.message : "Failed to report event");
      }
    },
    [patientId, onAssessmentUpdate]
  );

  const drawOverlay = useCallback((landmarks: Landmark[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const connections: [number, number][] = [
      [L_SHOULDER, R_SHOULDER],
      [L_SHOULDER, L_HIP],
      [R_SHOULDER, R_HIP],
      [L_HIP, R_HIP],
      [L_HIP, L_KNEE],
      [R_HIP, R_KNEE],
      [L_KNEE, L_ANKLE],
      [R_KNEE, R_ANKLE],
      [L_SHOULDER, L_ELBOW],
      [R_SHOULDER, R_ELBOW],
      [L_ELBOW, L_WRIST],
      [R_ELBOW, R_WRIST],
    ];

    ctx.strokeStyle = "#00e5a8";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (const [a, b] of connections) {
      const la = landmarks[a];
      const lb = landmarks[b];
      if (!la || !lb) continue;
      ctx.beginPath();
      ctx.moveTo(la.x * canvas.width, la.y * canvas.height);
      ctx.lineTo(lb.x * canvas.width, lb.y * canvas.height);
      ctx.stroke();
    }

    ctx.fillStyle = "#00e5a8";
    for (let i = 11; i <= 28; i++) {
      const lm = landmarks[i];
      if (!lm) continue;
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, []);

  const predict = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(predict);
      return;
    }

    try {
      const result = landmarker.detectForVideo(video, performance.now());
      const pose = result.landmarks?.[0];
      if (pose && pose.length >= 29) {
        drawOverlay(pose);
        const { state, confidence } = classifierRef.current.classify(pose);
        setCurrentState(state);
        setCurrentConfidence(confidence);

        const now = performance.now();
        const changed = state !== lastStateRef.current;
        const interval = now - lastEmitRef.current >= 4000;
        if (changed || interval) {
          lastStateRef.current = state;
          lastEmitRef.current = now;
          reportEvent(state, confidence);
        }
      } else {
        const canvas = canvasRef.current;
        canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch (err) {
      console.error("pose detect error", err);
    }

    rafRef.current = requestAnimationFrame(predict);
  }, [drawOverlay, reportEvent]);

  const stopStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    classifierRef.current.reset();
    lastStateRef.current = null;
    setStreaming(false);
    setCurrentState(null);
  }, []);

  const startStream = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setLastError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Video element not ready");
      video.srcObject = stream;
      await video.play();

      if (!landmarkerRef.current) {
        landmarkerRef.current = await createPoseLandmarker();
      }

      classifierRef.current.reset();
      lastEmitRef.current = 0;
      lastStateRef.current = null;
      setStreaming(true);
      rafRef.current = requestAnimationFrame(predict);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start camera";
      setLastError(msg);
      stopStream();
    } finally {
      setLoading(false);
    }
  }, [patientId, predict, stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
      try {
        landmarkerRef.current?.close();
      } catch {
        /* ignore */
      }
      landmarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleStream = () => {
    if (streaming) stopStream();
    else startStream();
  };

  const meta = currentState ? STATE_META[currentState] : null;
  const toneClass =
    meta?.tone === "critical"
      ? "text-critical"
      : meta?.tone === "warning"
      ? "text-amber-600"
      : "text-success";

  return (
    <Card className="p-0 overflow-hidden bg-white border border-border">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
        <div className="flex items-center gap-2">
          <Video size={18} className="text-primary-deep" />
          <h3 className="font-display font-bold text-text-primary text-base">
            CV Mobility Monitor
          </h3>
          {streaming && (
            <span className="flex items-center gap-1.5 ml-2">
              <span className="h-2 w-2 rounded-full bg-critical animate-pulse" />
              <span className="text-[10px] font-bold text-critical uppercase tracking-widest">
                Live
              </span>
            </span>
          )}
        </div>
        <button
          onClick={toggleStream}
          disabled={!patientId || loading}
          className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
            streaming
              ? "bg-critical text-white"
              : "bg-primary text-text-primary hover:translate-y-[-1px]"
          }`}
        >
          {loading ? (
            <>
              <Camera size={14} className="animate-pulse" /> Loading...
            </>
          ) : streaming ? (
            <>
              <VideoOff size={14} /> Stop
            </>
          ) : (
            <>
              <Video size={14} /> Start Camera
            </>
          )}
        </button>
      </div>

      {/* Live webcam feed + pose overlay */}
      <div className="relative h-72 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
            streaming ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {!streaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
            <Camera size={40} className="mb-3 opacity-40" />
            <p className="text-xs font-mono tracking-widest uppercase">
              {patientId ? "Camera offline" : "Select a patient"}
            </p>
            <p className="text-[10px] font-mono text-white/30 mt-1">
              MediaPipe Pose · browser inference
            </p>
          </div>
        )}

        {streaming && (
          <motion.div
            initial={{ y: -200 }}
            animate={{ y: 400 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-primary/10 to-transparent pointer-events-none"
          />
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          <span className="text-[9px] font-mono text-white/80 tracking-widest uppercase bg-black/50 px-2 py-0.5 rounded">
            CAM 01 · {patientName ?? "—"}
          </span>
          <span className="text-[9px] font-mono text-white/60 tracking-widest bg-black/50 px-2 py-0.5 rounded w-fit">
            POSE · MEDIAPIPE
          </span>
        </div>

        {meta && streaming && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentState}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 right-3 flex flex-col items-end gap-1 z-10 bg-black/60 backdrop-blur px-3 py-2 rounded-lg"
            >
              <span className={`text-sm font-bold ${toneClass}`}>
                {meta.label}
              </span>
              <span className="text-[10px] font-mono text-white/70">
                conf {(currentConfidence * 100).toFixed(0)}%
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Manual event triggers */}
      <div className="p-4 border-b border-border bg-bg/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Manual Trigger
          </span>
          {lastError && (
            <span className="text-[10px] text-critical font-bold flex items-center gap-1">
              <AlertTriangle size={10} /> {lastError}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "bed_exit_attempt",
              "unstable_standing",
              "unsteady_gait",
              "standing",
              "sitting",
              "lying",
            ] as MobilityState[]
          ).map((s) => (
            <button
              key={s}
              onClick={() => reportEvent(s, 0.85)}
              disabled={!patientId}
              className="text-[10px] font-bold px-3 h-7 rounded-lg bg-surface border border-border text-text-secondary hover:bg-white hover:text-text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {STATE_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div className="p-4 max-h-48 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-3">
          <Activity size={12} className="text-text-muted" />
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Recent Events
          </span>
        </div>
        {events.length === 0 ? (
          <p className="text-xs text-text-muted italic">No mobility events yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((e, i) => {
              const m = STATE_META[e.event_type];
              const tone =
                m.tone === "critical"
                  ? "text-critical"
                  : m.tone === "warning"
                  ? "text-amber-600"
                  : "text-text-secondary";
              return (
                <li
                  key={`${e.timestamp}-${i}`}
                  className="flex items-center justify-between text-xs font-mono"
                >
                  <span className="text-text-muted">{formatTime(e.timestamp)}</span>
                  <span className={`font-bold ${tone}`}>{m.label}</span>
                  <span className="text-text-muted">
                    {(e.confidence * 100).toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
