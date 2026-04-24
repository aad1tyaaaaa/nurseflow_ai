"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  FileText,
  Sparkles,
  RotateCcw,
  Save,
  Activity,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Eye,
  ListChecks,
  Stethoscope,
  ShieldAlert,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";
import { api } from "@/lib/api";

// ---------- Types ---------------------------------------------------------

interface VoiceNote {
  id: string;
  patient_id: string;
  transcript: string | null;
  structured_data:
    | {
        symptoms?: string[];
        observations?: string[];
        actions_needed?: string[];
        error?: string;
      }
    | null;
  actionable_items: string[] | null;
  flagged_concerns: string[] | null;
  recorded_at: string;
  duration_seconds: number | null;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  bed_number: string | null;
}

interface StructuredPreview {
  structured_data: {
    symptoms: string[];
    observations: string[];
    actions_needed: string[];
  };
  actionable_items: string[];
  flagged_concerns: string[];
}

// ---------- Web Speech API typings ----------------------------------------

interface SpeechRecognitionResultAlt {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly 0: SpeechRecognitionResultAlt;
  readonly isFinal: boolean;
  readonly length: number;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
interface SpeechRecognitionCtor {
  new (): SpeechRecognitionInstance;
}
function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ---------- Utils ---------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return "audio/webm";
}

// ---------- Page ----------------------------------------------------------

const VoicePage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [duration, setDuration] = useState(0);
  const [micSupported, setMicSupported] = useState(true);
  const [sttSupported, setSttSupported] = useState(true);
  const [recordError, setRecordError] = useState<string | null>(null);

  const [preview, setPreview] = useState<StructuredPreview | null>(null);
  const [isStructuring, setIsStructuring] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");
  const recordStartRef = useRef(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioMimeRef = useRef<string>("audio/webm");

  useEffect(() => {
    api.patients
      .list()
      .then((data) => {
        const list = data as Patient[];
        setPatients(list);
        if (list.length > 0) setSelectedPatientId(list[0].id);
      })
      .catch(() => {});

    api.voiceNotes
      .list()
      .then((data) => setNotes(data as VoiceNote[]))
      .catch(() => {})
      .finally(() => setLoadingNotes(false));
  }, []);

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof MediaRecorder === "undefined"
    ) {
      setMicSupported(false);
    }
    if (!getSpeechRecognition()) setSttSupported(false);
  }, []);

  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    setRecordError(null);
    setSaveError(null);
    setStructureError(null);
    setPreview(null);
    setSavedFlash(false);
    setTranscript("");
    setInterim("");
    finalTranscriptRef.current = "";
    audioChunksRef.current = [];
    audioBlobRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      audioMimeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioBlobRef.current = blob;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.start(250);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      setRecordError(msg);
      return;
    }

    const Ctor = getSpeechRecognition();
    if (Ctor) {
      const recog = new Ctor();
      recog.lang = "en-US";
      recog.continuous = true;
      recog.interimResults = true;
      recog.maxAlternatives = 1;
      recog.onresult = (e) => {
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalTranscriptRef.current += r[0].transcript + " ";
          else interimText += r[0].transcript;
        }
        setTranscript(finalTranscriptRef.current.trim());
        setInterim(interimText);
      };
      recog.onerror = (e) => {
        if (e.error !== "no-speech" && e.error !== "aborted") {
          setRecordError(`Speech recognition: ${e.error}`);
        }
      };
      recog.onend = () => {
        if (mediaRecorderRef.current?.state === "recording") {
          try {
            recog.start();
          } catch {
            /* already started */
          }
        }
      };
      recognitionRef.current = recog;
      try {
        recog.start();
      } catch {
        /* ignore */
      }
    }

    recordStartRef.current = performance.now();
    setDuration(0);
    durationTimerRef.current = setInterval(() => {
      setDuration((performance.now() - recordStartRef.current) / 1000);
    }, 200);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    setInterim("");
  }, []);

  const runStructure = useCallback(async () => {
    if (!transcript.trim()) return;
    setIsStructuring(true);
    setStructureError(null);
    try {
      const result = await api.voiceNotes.structure({ transcript });
      setPreview(result);
    } catch (err) {
      setStructureError(err instanceof Error ? err.message : "AI structuring failed");
    } finally {
      setIsStructuring(false);
    }
  }, [transcript]);

  const handleSave = useCallback(async () => {
    if (!transcript.trim() || !selectedPatientId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const form = new FormData();
      let audioBlob = audioBlobRef.current;
      let filename = "voice-note.webm";
      let mime = audioMimeRef.current || "audio/webm";
      if (!audioBlob || audioBlob.size === 0) {
        audioBlob = new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])], { type: "audio/webm" });
        mime = "audio/webm";
      }
      if (mime.includes("mp4")) filename = "voice-note.mp4";
      else if (mime.includes("ogg")) filename = "voice-note.ogg";

      form.append("audio", audioBlob, filename);
      form.append("patient_id", selectedPatientId);
      form.append("duration_seconds", String(duration.toFixed(1)));
      form.append("transcript", transcript);

      await api.voiceNotes.upload(form);

      const updated = await api.voiceNotes.list();
      setNotes(updated as VoiceNote[]);

      setTranscript("");
      setInterim("");
      setPreview(null);
      setDuration(0);
      audioBlobRef.current = null;
      audioChunksRef.current = [];
      finalTranscriptRef.current = "";

      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  }, [transcript, selectedPatientId, duration]);

  const clearDraft = () => {
    if (isRecording) return;
    setTranscript("");
    setInterim("");
    setPreview(null);
    setStructureError(null);
    setDuration(0);
    audioBlobRef.current = null;
    audioChunksRef.current = [];
    finalTranscriptRef.current = "";
  };

  const formatDuration = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <div className="text-center space-y-4 animate-stagger-up">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">
          Clinical <span className="text-primary-deep">Voice Studio</span>
        </h1>
        <p className="text-lg text-text-secondary font-body max-w-2xl mx-auto">
          Real-time speech capture, browser transcription, and AI-structured
          clinical notes.
        </p>
      </div>

      {!micSupported && (
        <div className="rounded-2xl border border-critical bg-critical/5 p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-critical mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-critical">Microphone not available</p>
            <p className="text-xs text-text-secondary mt-1">
              Your browser does not support MediaRecorder. Try a recent Chrome,
              Edge, or Safari build on HTTPS / localhost.
            </p>
          </div>
        </div>
      )}

      <BentoGrid>
        <BentoGridItem span={8}>
          <Card className="h-full p-10 flex flex-col items-center justify-center relative min-h-[520px] bg-white overflow-hidden">
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-primary z-0"
                />
              )}
            </AnimatePresence>

            <div className="relative z-10 flex flex-col items-center w-full">
              <div className="relative mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!micSupported}
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`h-28 w-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isRecording
                      ? "bg-critical text-white shadow-critical/40 ring-4 ring-critical/20"
                      : "bg-primary text-text-primary shadow-primary/20 hover:shadow-primary/40 ring-4 ring-primary/10"
                  }`}
                >
                  {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
                </motion.button>
                {isRecording && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-critical"></span>
                  </span>
                )}
              </div>

              <div className="mb-8 font-mono text-2xl font-bold text-text-primary tabular-nums">
                {formatDuration(duration)}
              </div>

              <div className="w-full">
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isRecording
                          ? "bg-critical animate-pulse"
                          : transcript
                          ? "bg-success"
                          : "bg-text-muted/30"
                      }`}
                    />
                    {isRecording
                      ? "Live Capture"
                      : transcript
                      ? "Ready to structure"
                      : "Transcription Preview"}
                  </span>
                  <button
                    onClick={clearDraft}
                    disabled={isRecording || !transcript}
                    className="text-[10px] font-bold text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={12} /> Clear
                  </button>
                </div>

                <div className="p-8 rounded-3xl bg-surface/50 border border-border min-h-[140px] relative overflow-hidden">
                  <p
                    className={`text-xl font-body leading-relaxed transition-all ${
                      transcript || interim
                        ? "text-text-primary"
                        : "text-text-secondary italic"
                    }`}
                  >
                    {transcript ? (
                      <>
                        {transcript}
                        {interim && (
                          <span className="text-text-muted italic"> {interim}</span>
                        )}
                      </>
                    ) : interim ? (
                      <span className="text-text-muted italic">{interim}</span>
                    ) : (
                      "Speak naturally to generate clinical observations..."
                    )}
                  </p>
                  {!sttSupported && (
                    <p className="mt-3 text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                      Live transcription unavailable in this browser â€” audio still records.
                    </p>
                  )}
                </div>
              </div>

              {(recordError || saveError || structureError) && (
                <div className="mt-4 w-full text-xs text-critical font-body flex items-start gap-2 px-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{recordError || saveError || structureError}</span>
                </div>
              )}

              {savedFlash && (
                <div className="mt-4 w-full text-xs text-success font-bold flex items-center gap-2 px-2">
                  <CheckCircle2 size={14} /> Saved to EMR
                </div>
              )}

              <div className="mt-6 space-y-3 w-full">
                {patients.length > 0 && (
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    disabled={isRecording}
                    className="w-full h-12 px-4 rounded-2xl border border-border bg-surface font-body text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                        {p.bed_number ? ` \u00b7 Bed ${p.bed_number}` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={runStructure}
                    disabled={
                      isRecording ||
                      isStructuring ||
                      isSaving ||
                      !transcript.trim()
                    }
                    className="flex-1 h-12 rounded-2xl bg-accent-deep text-white font-bold text-sm shadow-lg shadow-accent-deep/10 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isStructuring ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Structuring...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Structure with AI
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={
                      isRecording ||
                      isSaving ||
                      !transcript.trim() ||
                      !selectedPatientId
                    }
                    className="flex-[2] h-12 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/10 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Finalize to EMR
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </BentoGridItem>

        <BentoGridItem span={4}>
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <Card className="h-full min-h-[520px] flex flex-col items-center justify-center gap-6 p-8 bg-surface/40 border-dashed border-border">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Sparkles size={28} className="text-primary-deep" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-text-primary">AI Summary</p>
                    <p className="text-xs font-body text-text-secondary leading-relaxed">
                      Record your observation and click
                      <span className="font-bold text-text-primary"> Structure with AI</span>{" "}
                      to generate a formatted clinical note.
                    </p>
                  </div>
                  <div className="w-full space-y-2.5">
                    {["Symptoms", "Observations", "Actions Needed", "Actionable Items", "Flagged Concerns"].map((s) => (
                      <div key={s} className="h-7 rounded-lg bg-border/50 animate-pulse" />
                    ))}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="filled"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="h-full"
              >
                <Card className="h-full min-h-[520px] flex flex-col gap-0 p-0 overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
                  {/* Header */}
                  <div className="flex items-center gap-2.5 px-5 py-4 bg-primary/5 border-b border-border">
                    <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-primary-deep" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary leading-none">AI Clinical Summary</p>
                      <p className="text-[10px] text-text-muted mt-0.5">Structured from your narration</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {/* Symptoms */}
                    {preview.structured_data.symptoms.length > 0 && (
                      <SummarySection
                        icon={<Activity size={13} className="text-critical" />}
                        label="Symptoms"
                        items={preview.structured_data.symptoms}
                        chipClass="bg-critical/10 text-critical"
                      />
                    )}

                    {/* Observations */}
                    {preview.structured_data.observations.length > 0 && (
                      <SummarySection
                        icon={<Eye size={13} className="text-blue-500" />}
                        label="Observations"
                        items={preview.structured_data.observations}
                        chipClass="bg-blue-50 text-blue-700"
                      />
                    )}

                    {/* Actions Needed */}
                    {preview.structured_data.actions_needed.length > 0 && (
                      <SummarySection
                        icon={<ListChecks size={13} className="text-success" />}
                        label="Actions Needed"
                        items={preview.structured_data.actions_needed}
                        chipClass="bg-success/10 text-success"
                      />
                    )}

                    {/* Actionable Items */}
                    {preview.actionable_items.length > 0 && (
                      <div className="px-5 py-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <Stethoscope size={13} className="text-accent-deep" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Actionable Items</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {preview.actionable_items.map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-deep/10 text-accent-deep text-[11px] font-bold">
                              <span className="h-1 w-1 rounded-full bg-accent-deep" />
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flagged Concerns */}
                    {preview.flagged_concerns.length > 0 && (
                      <div className="px-5 py-4 bg-critical/5">
                        <div className="flex items-center gap-1.5 mb-3">
                          <ShieldAlert size={13} className="text-critical" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-critical">Flagged Concerns</span>
                        </div>
                        <ul className="space-y-2">
                          {preview.flagged_concerns.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle size={11} className="text-critical mt-0.5 shrink-0" />
                              <span className="text-xs font-body text-critical leading-relaxed">{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </BentoGridItem>
      </BentoGrid>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Clock size={20} className="text-primary-deep" />
          Recent Notes
        </h2>
        {loadingNotes ? (
          <p className="text-text-muted font-body italic">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-text-muted font-body italic">
            No voice notes recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id} className="p-5 bg-white border border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <p className="text-sm font-body text-text-primary leading-relaxed italic">
                      &quot;{note.transcript ?? "No transcript available"}&quot;
                    </p>
                    {note.actionable_items && note.actionable_items.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {note.actionable_items.map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-lg bg-primary/10 text-primary-deep text-xs font-bold"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                    {note.flagged_concerns && note.flagged_concerns.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {note.flagged_concerns.map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-lg bg-critical/10 text-critical text-xs font-bold flex items-center gap-1"
                          >
                            <AlertTriangle size={10} /> {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-text-muted font-body">
                      {timeAgo(note.recorded_at)}
                    </p>
                    {note.duration_seconds != null && note.duration_seconds > 0 && (
                      <p className="text-[10px] text-text-muted font-body">
                        {note.duration_seconds.toFixed(0)}s
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface SummarySectionProps {
  icon: React.ReactNode;
  label: string;
  items: string[];
  chipClass: string;
}

const SummarySection = ({ icon, label, items, chipClass }: SummarySectionProps) => (
  <div className="px-5 py-4">
    <div className="flex items-center gap-1.5 mb-3">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
    </div>
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className={`inline-flex items-start gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg mr-1 mb-1 ${chipClass}`}>
          <span className="mt-0.5 h-1 w-1 rounded-full bg-current shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default VoicePage;
