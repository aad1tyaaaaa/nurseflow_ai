"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Sparkles, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

// ---------- Web Speech API typings (browser-only, not in default TS lib) ----

interface SpeechRecognitionResult {
  readonly 0: { transcript: string; confidence: number };
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

// ---------- Patient cache for client-side name resolution -------------------

interface PatientLite {
  id: string;
  first_name: string;
  last_name: string;
  bed_number: string | null;
  room_number?: string | null;
}

function matchPatient(query: string, patients: PatientLite[]): PatientLite | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 1. bed number ("bed 7", "bed number 7", just "7")
  const bedMatch = q.match(/bed\s*(?:number|no\.?)?\s*(\w+)/) || q.match(/^(\d+)$/);
  if (bedMatch) {
    const bed = bedMatch[1];
    const hit = patients.find(
      (p) => (p.bed_number ?? "").toString().toLowerCase() === bed.toLowerCase()
    );
    if (hit) return hit;
  }

  // 2. full / partial name
  const tokens = q.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  let best: { p: PatientLite; score: number } | null = null;
  for (const p of patients) {
    const full = `${p.first_name} ${p.last_name}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (full.includes(t)) score += t.length;
    }
    if (score > 0 && (!best || score > best.score)) best = { p, score };
  }
  return best?.p ?? null;
}

// ---------- Component ------------------------------------------------------

type AssistantState = "idle" | "listening" | "thinking" | "done" | "error";

export function VoiceNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AssistantState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [patients, setPatients] = useState<PatientLite[]>([]);

  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");

  // Lazy-load patients on first open (for name resolution)
  useEffect(() => {
    if (!open || patients.length > 0) return;
    api.patients
      .list()
      .then((data) => setPatients(data as PatientLite[]))
      .catch(() => {});
  }, [open, patients.length]);

  // Feature detection
  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1.0;
      u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }, []);

  const handleUtterance = useCallback(
    async (utterance: string) => {
      if (!utterance.trim()) {
        setState("idle");
        return;
      }
      setState("thinking");
      setError(null);
      try {
        const result = await api.ai.navigate({
          utterance,
          current_route: pathname,
        });
        setResponse(result.speech_response);
        speak(result.speech_response);

        if (result.intent === "navigate" && result.route) {
          setTimeout(() => {
            router.push(result.route!);
            setOpen(false);
          }, 800);
        } else if (result.intent === "search_patient") {
          // Prefer LLM-provided patient_query, fall back to original utterance
          const q = result.patient_query || utterance;
          const hit = matchPatient(q, patients);
          if (hit) {
            setTimeout(() => {
              router.push(`/patients/${hit.id}`);
              setOpen(false);
            }, 800);
          } else if (result.route) {
            setTimeout(() => {
              router.push(result.route!);
              setOpen(false);
            }, 800);
          }
        }
        setState("done");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Voice assistant failed";
        setError(msg);
        setState("error");
      }
    },
    [pathname, router, patients, speak]
  );

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setError(null);
    setResponse(null);
    setTranscript("");
    setInterim("");
    finalTranscriptRef.current = "";

    const recog = new Ctor();
    recog.lang = "en-US";
    recog.continuous = false;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onstart = () => setState("listening");
    recog.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalTranscriptRef.current += r[0].transcript;
        } else {
          interimText += r[0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current);
      setInterim(interimText);
    };
    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      setError(e.error === "not-allowed" ? "Microphone permission denied." : `Speech error: ${e.error}`);
      setState("error");
    };
    recog.onend = () => {
      setInterim("");
      const final = finalTranscriptRef.current.trim();
      if (final) {
        setTranscript(final);
        handleUtterance(final);
      } else if (state !== "error") {
        setState("idle");
      }
    };

    recogRef.current = recog;
    try {
      recog.start();
    } catch {
      /* already started */
    }
  }, [handleUtterance, state]);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + Shift + V
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reset when panel closes
  useEffect(() => {
    if (!open) {
      stopListening();
      setState("idle");
      setTranscript("");
      setInterim("");
      setResponse(null);
      setError(null);
    }
  }, [open, stopListening]);

  return (
    <>
      {/* Floating action button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
          open
            ? "bg-critical text-white shadow-critical/30"
            : "bg-primary-deep text-white shadow-primary/30 hover:shadow-primary/50"
        }`}
        aria-label="AI voice navigation"
        title="AI voice navigation (Ctrl+Shift+V)"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span
              key="mic"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="relative"
            >
              <Mic size={22} />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[min(92vw,380px)] rounded-3xl bg-white border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-border bg-surface/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-primary/20 flex items-center justify-center text-primary-deep">
                <Sparkles size={18} />
              </div>
              <div className="flex-grow">
                <h3 className="font-display font-bold text-text-primary text-base leading-tight">
                  Voice Navigation
                </h3>
                <p className="text-[10px] font-mono text-text-muted tracking-widest uppercase">
                  Groq · llama3
                </p>
              </div>
              {state === "listening" && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-critical animate-pulse" />
                  <span className="text-[10px] font-bold text-critical uppercase tracking-widest">
                    Live
                  </span>
                </span>
              )}
            </div>

            {/* Body */}
            <div className="p-5 min-h-[180px] flex flex-col gap-4">
              {!supported ? (
                <div className="flex items-start gap-2 text-xs text-critical">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Your browser does not support the Web Speech API. Try Chrome, Edge, or Safari.
                  </span>
                </div>
              ) : (
                <>
                  {/* Transcript */}
                  <div className="rounded-2xl border border-border bg-bg p-4 min-h-[70px]">
                    {transcript || interim ? (
                      <p className="text-sm font-body text-text-primary leading-relaxed">
                        {transcript}
                        <span className="text-text-muted italic">
                          {interim ? ` ${interim}` : ""}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm font-body italic text-text-muted">
                        Try: &quot;open alerts&quot;, &quot;take me to medications&quot;, or &quot;show me Robert Miller&quot;.
                      </p>
                    )}
                  </div>

                  {/* Assistant response */}
                  <AnimatePresence>
                    {(response || state === "thinking") && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl bg-accent-deep text-white p-4"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Sparkles size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                            Assistant
                          </span>
                        </div>
                        <p className="text-sm font-body leading-relaxed">
                          {state === "thinking" ? (
                            <span className="inline-flex gap-1 items-center">
                              <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                              >
                                Thinking
                              </motion.span>
                              <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                              >
                                .
                              </motion.span>
                              <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                              >
                                .
                              </motion.span>
                              <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1, delay: 0.6 }}
                              >
                                .
                              </motion.span>
                            </span>
                          ) : (
                            response
                          )}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <div className="flex items-start gap-2 text-xs text-critical">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer controls */}
            <div className="p-4 border-t border-border bg-surface/40 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={state === "listening" ? stopListening : startListening}
                disabled={!supported || state === "thinking"}
                className={`flex-grow h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  state === "listening"
                    ? "bg-critical text-white shadow-lg shadow-critical/20"
                    : "bg-primary text-text-primary shadow-lg shadow-primary/20"
                }`}
              >
                {state === "listening" ? (
                  <>
                    <MicOff size={16} /> Stop
                  </>
                ) : state === "thinking" ? (
                  <>Processing…</>
                ) : (
                  <>
                    <Mic size={16} /> Hold to Speak
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
