"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, Mic, MicOff, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface DiaryEntry {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  text: string;
  tag: "observation" | "alert" | "handoff" | "general";
}

const TAG_STYLES: Record<DiaryEntry["tag"], string> = {
  observation: "bg-blue-50 text-blue-700 border-blue-200",
  alert:       "bg-red-50 text-red-700 border-red-200",
  handoff:     "bg-amber-50 text-amber-700 border-amber-200",
  general:     "bg-surface-raised text-text-secondary border-border",
};

const TAG_LABELS: Record<DiaryEntry["tag"], string> = {
  observation: "Observation",
  alert:       "Alert",
  handoff:     "Handoff",
  general:     "General",
};

const STORAGE_KEY = "nurseflow_diary_entries";

export const NurseDiary: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState<DiaryEntry["tag"]>("general");
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setEntries(JSON.parse(stored) as DiaryEntry[]);
    } catch {
      // ignore parse errors
    }
  }, []);

  const persistEntries = (updated: DiaryEntry[]) => {
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addEntry = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      text,
      tag,
    };
    persistEntries([entry, ...entries]);
    setDraft("");
    textareaRef.current?.focus();
  };

  const deleteEntry = (id: string) => {
    persistEntries(entries.filter((e) => e.id !== id));
  };

  // Voice recognition
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as Window & typeof globalThis & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as Window & typeof globalThis & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser.");
      return;
    }

    setMicError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    let finalTranscript = draft;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setDraft(finalTranscript + (interim ? " " + interim : ""));
    };

    recognition.onerror = () => {
      setMicError("Microphone access denied or unavailable.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setDraft(finalTranscript);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [draft]);

  const toggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // Group entries by date
  const groupedEntries = entries.reduce<Record<string, DiaryEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-text-primary text-lg leading-tight">Nurse&apos;s Diary</h3>
            <p className="text-xs text-text-muted font-body">{entries.length} {entries.length === 1 ? "entry" : "entries"} this session</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-surface-raised"
          aria-label="Toggle diary"
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Compose area */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 mb-5 shadow-inner">
            {/* Tag selector */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {(Object.keys(TAG_LABELS) as DiaryEntry["tag"][]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                    tag === t
                      ? TAG_STYLES[t] + " ring-2 ring-offset-1 ring-indigo-300"
                      : "bg-white text-text-muted border-border hover:border-indigo-200"
                  }`}
                >
                  {TAG_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addEntry();
              }}
              rows={3}
              placeholder={
                isListening
                  ? "Listening… speak your note…"
                  : "Write a clinical note, observation, or handoff remark… (Ctrl+Enter to save)"
              }
              className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-body leading-relaxed ${
                isListening ? "border-indigo-400 ring-2 ring-indigo-200 animate-pulse" : "border-border"
              }`}
            />

            {micError && (
              <p className="text-xs text-critical mt-1">{micError}</p>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={toggleVoice}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isListening
                    ? "bg-critical/10 border-critical/30 text-critical hover:bg-critical/20"
                    : "bg-white border-border text-text-secondary hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff size={14} className="animate-pulse" />
                    Stop Voice
                  </>
                ) : (
                  <>
                    <Mic size={14} />
                    Voice Input
                  </>
                )}
              </button>
              <button
                onClick={addEntry}
                disabled={!draft.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <Plus size={14} />
                Add Entry
              </button>
            </div>
          </div>

          {/* Diary entries */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 max-h-[420px] scrollbar-thin scrollbar-thumb-indigo-100">
            {Object.keys(groupedEntries).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-text-muted">
                <BookOpen size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-body italic">No entries yet.</p>
                <p className="text-xs mt-1">Start typing or use voice input above.</p>
              </div>
            ) : (
              Object.entries(groupedEntries).map(([date, dayEntries]) => (
                <div key={date}>
                  {/* Date divider */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-indigo-100" />
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest whitespace-nowrap">{date}</span>
                    <div className="h-px flex-1 bg-indigo-100" />
                  </div>

                  <div className="space-y-3">
                    {dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="group relative rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-all"
                      >
                        {/* Left accent bar */}
                        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${
                          entry.tag === "alert" ? "bg-critical" :
                          entry.tag === "observation" ? "bg-blue-400" :
                          entry.tag === "handoff" ? "bg-amber-400" :
                          "bg-indigo-200"
                        }`} />
                        <div className="pl-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-indigo-600">{entry.time}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${TAG_STYLES[entry.tag]}`}>
                                {TAG_LABELS[entry.tag]}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-critical p-1 rounded-lg"
                              aria-label="Delete entry"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-text-primary font-body leading-relaxed">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
