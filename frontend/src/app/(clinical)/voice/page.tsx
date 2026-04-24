"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  FileText, 
  Sparkles,
  RotateCcw, 
  Save, 
  Activity,
  ArrowRight,
  Clock
} from "lucide-react";
import Card from "@/components/ui/Card";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";
import { api } from "@/lib/api";

interface VoiceNote {
  id: string;
  patient_id: string;
  transcript: string | null;
  structured_data: Record<string, unknown> | null;
  actionable_items: string[] | null;
  recorded_at: string;
  duration_seconds: number | null;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  bed_number: string | null;
}

const VoicePage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  useEffect(() => {
    api.patients.list()
      .then((data) => {
        const list = data as Patient[];
        setPatients(list);
        if (list.length > 0) setSelectedPatientId(list[0].id);
      })
      .catch(() => {});

    api.voiceNotes.list()
      .then((data) => setNotes(data as VoiceNote[]))
      .catch(() => {})
      .finally(() => setLoadingNotes(false));
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    setTranscript("Patient Robert Miller in Bed 7... monitoring respiratory rate... lung sounds improved but still diminished at the base... patient is awake and oriented though complaining of mild chest tightness...");
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  const handleSave = async () => {
    if (!transcript || !selectedPatientId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const form = new FormData();
      // Send audio as a webm blob (accepted content type)
      const blob = new Blob([new ArrayBuffer(0)], { type: "audio/webm" });
      form.append("audio", blob, "voice-note.webm");
      form.append("patient_id", selectedPatientId);
      form.append("duration_seconds", "0");
      await api.voiceNotes.upload(form);
      const updated = await api.voiceNotes.list();
      setNotes(updated as VoiceNote[]);
      setTranscript("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="text-center space-y-4 animate-stagger-up">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">
          Clinical <span className="text-primary-deep">Voice Studio</span>
        </h1>
        <p className="text-lg text-text-secondary font-body max-w-2xl mx-auto">
          Secure, ambient documentation. Speak your observations naturally; NurseFlow AI will structure them into clinical notes.
        </p>
      </div>

      <BentoGrid>
        {/* 1. Main Recording Studio - Wide (8 cols) */}
        <BentoGridItem span={8}>
           <Card className="h-full p-10 flex flex-col items-center justify-center relative min-h-[480px] bg-white overflow-hidden">
              {/* Background pulse effect when recording */}
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
                 {/* Record Button */}
                 <div className="relative mb-10">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`h-28 w-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
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

                 {/* Transcript Display */}
                 <div className="w-full">
                    <div className="flex items-center justify-between mb-4 px-2">
                       <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${isRecording ? 'bg-critical animate-pulse' : 'bg-text-muted/30'}`} />
                          {isRecording ? "Live Capture" : "Transcription Preview"}
                       </span>
                       <button onClick={() => setTranscript("")} className="text-[10px] font-bold text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5">
                          <RotateCcw size={12} /> Clear
                       </button>
                    </div>
                    
                    <div className="p-8 rounded-3xl bg-surface/50 border border-border min-h-[140px] relative group overflow-hidden">
                       <p className={`text-xl font-body leading-relaxed transition-all ${isRecording ? "text-text-primary" : "text-text-secondary italic"}`}>
                         {transcript || "Speak naturally to generate clinical observations..."}
                       </p>
                       {isProcessing && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center gap-3">
                             <div className="flex gap-1">
                                {[0, 0.2, 0.4].map((delay) => (
                                   <motion.div key={delay} animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 1, delay }} className="w-1 bg-accent rounded-full" />
                                ))}
                             </div>
                             <span className="text-sm font-bold text-accent">Structuring Note...</span>
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="mt-8 space-y-3 w-full">
                    {patients.length > 0 && (
                      <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full h-12 px-4 rounded-2xl border border-border bg-surface font-body text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.first_name} {p.last_name}{p.bed_number ? ` · Bed ${p.bed_number}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    {saveError && (
                      <p className="text-xs text-critical font-body px-2">{saveError}</p>
                    )}
                    <div className="flex gap-3">
                       <button
                          onClick={handleSave}
                          disabled={isSaving || !transcript || !selectedPatientId}
                          className="flex-[2] h-12 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/10 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          <Save size={16} /> {isSaving ? "Saving..." : "Finalize to EMR"}
                       </button>
                    </div>
                 </div>
              </div>
           </Card>
        </BentoGridItem>

        {/* 2. Side Previews - Med (4 cols) */}
        <BentoGridItem span={4}>
           <div className="flex flex-col gap-6 h-full">
              <SectionPreview 
                 icon={<FileText size={20} className="text-primary-deep" />} 
                 label="Observation Draft" 
                 content="Patient exhibits increased work of breathing. Breath sounds coarse bilaterally."
              />
              <SectionPreview 
                 icon={<Activity size={20} className="text-critical" />} 
                 label="Vital Trends" 
                 content="Chest tightness localized to upper quadrant. 4/10 pain scale reported." 
              />
              <Card className="bg-accent-deep text-white border-0 shadow-lg shadow-accent-deep/20 p-6 flex flex-col justify-center flex-grow">
                 <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={18} className="text-white/80" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">AI Interpreter</span>
                 </div>
                 <p className="text-sm font-body leading-relaxed mb-4">Recommended intervention: Prioritize SpO2 check on next vital round based on respiratory notes.</p>
                 <button className="text-xs font-bold text-white/80 hover:text-white flex items-center gap-1.5 mt-auto">
                    Apply to Care Plan <ArrowRight size={14} />
                 </button>
              </Card>
           </div>
        </BentoGridItem>
      </BentoGrid>

      {/* Recent Voice Notes */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Clock size={20} className="text-primary-deep" />
          Recent Notes
        </h2>
        {loadingNotes ? (
          <p className="text-text-muted font-body italic">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-text-muted font-body italic">No voice notes recorded yet.</p>
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
                          <span key={i} className="px-2 py-1 rounded-lg bg-primary/10 text-primary-deep text-xs font-bold">{item}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-text-muted font-body">{timeAgo(note.recorded_at)}</p>
                    {note.duration_seconds && (
                      <p className="text-[10px] text-text-muted font-body">{note.duration_seconds.toFixed(0)}s</p>
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

interface SectionPreviewProps {
  icon: React.ReactNode;
  label: string;
  content: string;
}

const SectionPreview = ({ icon, label, content }: SectionPreviewProps) => (
  <Card className="flex flex-col gap-3 p-6 bg-white/50 border-border/60">
    <div className="flex items-center gap-2">
       {icon}
       <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-sm font-body text-text-primary leading-relaxed truncate-3-lines">{content}</p>
    <button className="mt-auto text-xs font-bold text-primary-deep flex items-center gap-1.5 hover:gap-2 transition-all pt-2">
       Refine Section <ArrowRight size={14} />
    </button>
  </Card>
);

export default VoicePage;
