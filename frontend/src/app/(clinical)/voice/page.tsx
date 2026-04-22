"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  FileText, 
  Sparkles,
  RotateCcw, 
  Save, 
  Activity,
  ArrowRight
} from "lucide-react";
import Card from "@/components/ui/Card";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";

const VoicePage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    setTranscript("Patient Robert Miller in Bed 7... monitoring respiratory rate... lung sounds improved but still diminished at the base... patient is awake and oriented though complaining of mild chest tightness...");
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
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

                 <div className="mt-8 flex gap-3 w-full">
                    <button className="flex-1 h-12 rounded-2xl border border-border bg-white text-text-secondary font-bold text-sm hover:bg-surface transition-all">Assign to Bed 7</button>
                    <button className="flex-[2] h-12 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/10 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                       <Save size={16} /> Finalize to EMR
                    </button>
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
