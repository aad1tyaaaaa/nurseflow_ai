"use client";

import React, { useEffect, useState } from "react";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";
import Card from "@/components/ui/Card";
import { 
  Mic, 
  History, 
  Sparkles,
  Search,
  FileText,
  UserCheck,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface Handoff {
  id: string;
  patient_id: string;
  situation: string | null;
  background: string | null;
  assessment: string | null;
  recommendation: string | null;
  status: string;
  outgoing_signed: boolean;
  incoming_signed: boolean;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  bed_number: string | null;
}

const HandoffPage = () => {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeHandoff, setActiveHandoff] = useState<Handoff | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.handoffs.list().then((data) => {
      const items = data as Handoff[];
      setHandoffs(items);
      if (items.length > 0) setActiveHandoff(items[0]);
    }).catch(() => {});

    api.patients.list().then((data) => {
      setPatients(data as Patient[]);
    }).catch(() => {});
  }, []);

  const getPatientName = (patientId: string) => {
    const p = patients.find(pt => pt.id === patientId);
    return p ? `${p.first_name} ${p.last_name}` : "Unknown";
  };

  const getPatientBed = (patientId: string) => {
    const p = patients.find(pt => pt.id === patientId);
    return p?.bed_number ? `Bed ${p.bed_number}` : "";
  };

  const handleGenerate = async (patientId: string) => {
    setGenerating(true);
    try {
      const result = await api.handoffs.generate({
        patient_id: patientId,
        shift_date: new Date().toISOString(),
      });
      const newHandoff = result as Handoff;
      setHandoffs((prev) => [newHandoff, ...prev]);
      setActiveHandoff(newHandoff);
    } catch {
      // error handling
    } finally {
      setGenerating(false);
    }
  };

  const handleSign = async (handoffId: string) => {
    try {
      const result = await api.handoffs.sign(handoffId);
      const updated = result as Handoff;
      setHandoffs((prev) => prev.map(h => h.id === updated.id ? updated : h));
      if (activeHandoff?.id === updated.id) setActiveHandoff(updated);
    } catch {
      // error
    }
  };

  const completedCount = handoffs.filter(h => h.outgoing_signed).length;
  const totalCount = handoffs.length || 1;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-10 pb-12">
      {/* Header with Progress */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-stagger-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
            Intelligent <span className="text-primary-deep italic">SBAR</span> Handoff
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent ring-1 ring-accent/30 shadow-sm">
               <Sparkles size={16} />
            </div>
          </h1>
          <p className="mt-2 font-body text-text-secondary">
             AI has prepared <span className="font-bold text-text-primary">{handoffs.length} shift summaries</span> based on your documentation.
          </p>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-surface-raised border border-border shadow-sm min-w-[240px]">
           <div className="flex-grow">
              <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                 <span>Shift Progress</span>
                 <span>{progressPct}%</span>
              </div>
              <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                 <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
              </div>
           </div>
        </div>
      </div>

      <BentoGrid>
        {/* S — Situation */}
        <BentoGridItem span={4}>
           <SBARCard 
              label="Situation" 
              acronym="S"
              content={activeHandoff?.situation || "Select a patient to generate SBAR…"}
              color="bg-primary/10"
              icon={<Activity size={20} className="text-primary-deep" />}
           />
        </BentoGridItem>

        {/* B — Background */}
        <BentoGridItem span={4}>
           <SBARCard 
              label="Background" 
              acronym="B"
              content={activeHandoff?.background || "Background will appear here…"}
              color="bg-secondary/10"
              icon={<History size={20} className="text-secondary-deep" />}
           />
        </BentoGridItem>

        {/* Shift Queue */}
        <BentoGridItem span={4} rowSpan={2}>
          <Card className="h-full flex flex-col">
             <div className="flex items-center justify-between mb-8">
                <h3 className="font-display font-bold text-text-primary text-xl">Shift Queue</h3>
                <div className="p-2 rounded-xl bg-surface-raised border border-border text-text-muted transition-transform hover:scale-105">
                   <Search size={18} />
                </div>
             </div>
             
             <div className="space-y-3 flex-grow overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {handoffs.map((h) => (
                  <QueueItem
                    key={h.id}
                    name={getPatientName(h.patient_id)}
                    bed={getPatientBed(h.patient_id)}
                    status={activeHandoff?.id === h.id ? "active" : h.outgoing_signed ? "done" : "draft"}
                    onClick={() => setActiveHandoff(h)}
                  />
                ))}
                {patients
                  .filter(p => !handoffs.some(h => h.patient_id === p.id))
                  .map((p) => (
                    <QueueItem
                      key={p.id}
                      name={`${p.first_name} ${p.last_name}`}
                      bed={p.bed_number ? `Bed ${p.bed_number}` : ""}
                      status="pending"
                      onClick={() => handleGenerate(p.id)}
                    />
                  ))
                }
             </div>

             <div className="mt-8 p-6 rounded-[2rem] bg-accent-deep text-white shadow-xl shadow-accent-deep/20 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] opacity-20 rotate-12">
                   <Sparkles size={80} />
                </div>
                <h4 className="text-sm font-bold mb-2">AI-SBAR Draft</h4>
                <p className="text-xs text-white/80 font-body leading-relaxed mb-4">
                   {generating ? "Generating SBAR draft…" : `${patients.filter(p => !handoffs.some(h => h.patient_id === p.id)).length} patients without handoff.`}
                </p>
                <button
                  disabled={generating || patients.filter(p => !handoffs.some(h => h.patient_id === p.id)).length === 0}
                  onClick={() => {
                    const next = patients.find(p => !handoffs.some(h => h.patient_id === p.id));
                    if (next) handleGenerate(next.id);
                  }}
                  className="w-full bg-white text-accent-deep font-extrabold py-3 rounded-2xl shadow-lg transition-transform active:scale-95 text-xs disabled:opacity-50"
                >
                  {generating ? "Generating…" : "Generate Next Draft"}
                </button>
             </div>
          </Card>
        </BentoGridItem>

        {/* A — Assessment */}
        <BentoGridItem span={4}>
           <SBARCard 
              label="Assessment" 
              acronym="A"
              content={activeHandoff?.assessment || "Assessment will appear here…"}
              color="bg-accent/10"
              icon={<FileText size={20} className="text-accent-deep" />}
           />
        </BentoGridItem>

        {/* R — Recommendation */}
        <BentoGridItem span={4}>
           <SBARCard 
              label="Recommendation" 
              acronym="R"
              content={activeHandoff?.recommendation || "Recommendation will appear here…"}
              color="bg-success/10"
              icon={<UserCheck size={20} className="text-success-deep" />}
           />
        </BentoGridItem>

        {/* Voice Input */}
        <BentoGridItem span={4}>
           <Card className="h-full bg-surface-raised/50 border-dashed border-2 flex flex-col items-center justify-center p-8 group hover:border-primary/40 transition-all cursor-pointer">
              <motion.div 
                 whileHover={{ scale: 1.1 }}
                 className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-text-primary shadow-lg shadow-primary/20 mb-3"
              >
                 <Mic size={24} />
              </motion.div>
              <p className="text-sm font-bold text-text-primary">Voice Dictation</p>
              <p className="text-[10px] text-text-muted mt-1 font-body"> HIPAA-Secure Ambient Capture</p>
           </Card>
        </BentoGridItem>

        {/* Action Control */}
        <BentoGridItem span={8}>
           <Card className="h-full bg-surface text-text-primary shadow-lg shadow-primary/5 flex flex-col md:flex-row items-center justify-between p-8">
              <div className="mb-6 md:mb-0">
                 <h3 className="text-2xl font-extrabold tracking-tight">
                   {activeHandoff ? `${getPatientName(activeHandoff.patient_id)} — ${activeHandoff.status.replace(/_/g, " ")}` : "Select a handoff"}
                 </h3>
                 <p className="text-sm font-body opacity-80 mt-1">SBAR authorization will sync to clinical server immediately.</p>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                 <button className="h-12 px-6 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/10 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">Export PDF</button>
                 <button
                   onClick={() => activeHandoff && handleSign(activeHandoff.id)}
                   disabled={!activeHandoff || activeHandoff.outgoing_signed}
                   className="h-12 px-10 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/10 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    <UserCheck size={20} />
                    {activeHandoff?.outgoing_signed ? "Signed" : "Sign & Transfer"}
                 </button>
              </div>
           </Card>
        </BentoGridItem>
      </BentoGrid>
    </div>
  );
};

interface SBARCardProps {
  label: string;
  acronym: string;
  content: string;
  color: string;
  icon: React.ReactNode;
}

const SBARCard = ({ label, acronym, content, color, icon }: SBARCardProps) => (
  <Card className="h-full flex flex-col p-6 transition-all hover:bg-surface-raised/50 active:scale-[0.98] group">
     <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
           <div className={`p-2 rounded-xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>
              {icon}
           </div>
           <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-2xl font-display font-black text-text-muted/20">{acronym}</span>
     </div>
     <p className="text-text-primary text-sm leading-relaxed font-body italic flex-grow">
        &quot;{content}&quot;
     </p>
     <div className="mt-4 flex justify-end">
        <button className="text-[10px] font-bold text-primary-deep hover:underline uppercase tracking-widest">Edit Section</button>
     </div>
  </Card>
);

const QueueItem = ({ name, bed, status, onClick }: { name: string, bed: string, status: "active" | "draft" | "pending" | "done", onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
    status === "active" ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20 shadow-sm" : "bg-bg border-border hover:border-primary/30"
  }`}>
    <div className="flex items-center gap-3">
       <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
         status === "active" ? "bg-primary text-text-primary shadow-sm" : status === "done" ? "bg-success/20 text-success" : "bg-surface text-text-muted border border-border"
       }`}>
          {bed.split(" ")[1] || "?"}
       </div>
       <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary">{name}</span>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-tighter">{bed}</span>
       </div>
    </div>
    {status === "draft" && <Sparkles size={14} className="text-primary-deep" />}
    {status === "active" && <div className="h-2 w-2 rounded-full bg-primary-deep animate-pulse" />}
    {status === "done" && <span className="text-[10px] text-success font-bold">Signed</span>}
  </div>
);

export default HandoffPage;
