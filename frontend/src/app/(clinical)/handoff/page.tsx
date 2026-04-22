"use client";

import React from "react";
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

const HandoffPage = () => {
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
             AI has prepared <span className="font-bold text-text-primary">6 shift summaries</span> based on your documentation.
          </p>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-surface-raised border border-border shadow-sm min-w-[240px]">
           <div className="flex-grow">
              <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                 <span>Shift Progress</span>
                 <span>75%</span>
              </div>
              <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                 <div className="h-full bg-primary w-3/4" />
              </div>
           </div>
        </div>
      </div>

      <BentoGrid>
        {/* 1. Situation (S) - Med (4 cols) */}
        <BentoGridItem span={4}>
           <SBARCard 
              label="Situation" 
              acronym="S"
              content="Robert Miller (Bed 7) is a 68yo male admitted with acute respiratory distress. Currently stable but respiratory rate slightly elevated at 24pm."
              color="bg-primary/10"
              icon={<Activity size={20} className="text-primary-deep" />}
           />
        </BentoGridItem>

        {/* 2. Background (B) - Med (4 cols) */}
        <BentoGridItem span={4}>
           <SBARCard 
              label="Background" 
              acronym="B"
              content="History of COPD and HTN. Admitted 2 days ago. Intubated on arrival, extubated 4 hours ago. NKDA noted in chart."
              color="bg-secondary/10"
              icon={<History size={20} className="text-secondary-deep" />}
           />
        </BentoGridItem>

        {/* 3. Shift Queue - Tall (4 cols) */}
        <BentoGridItem span={4} rowSpan={2}>
          <Card className="h-full flex flex-col">
             <div className="flex items-center justify-between mb-8">
                <h3 className="font-display font-bold text-text-primary text-xl">Shift Queue</h3>
                <div className="p-2 rounded-xl bg-surface-raised border border-border text-text-muted transition-transform hover:scale-105">
                   <Search size={18} />
                </div>
             </div>
             
             <div className="space-y-3 flex-grow overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                <QueueItem name="Robert Miller" bed="Bed 7" status="active" />
                <QueueItem name="Sarah Chen" bed="Bed 3" status="draft" />
                <QueueItem name="James Wilson" bed="Bed 12" status="draft" />
                <QueueItem name="Emily Blunt" bed="Bed 5" status="pending" />
                <QueueItem name="Michael Scott" bed="Bed 9" status="pending" />
             </div>

             <div className="mt-8 p-6 rounded-[2rem] bg-accent-deep text-white shadow-xl shadow-accent-deep/20 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] opacity-20 rotate-12">
                   <Sparkles size={80} />
                </div>
                <h4 className="text-sm font-bold mb-2">AI-SBAR Draft</h4>
                <p className="text-xs text-white/80 font-body leading-relaxed mb-4">
                   Ready for Bed 12 based on recent vital trends.
                </p>
                <button className="w-full bg-white text-accent-deep font-extrabold py-3 rounded-2xl shadow-lg transition-transform active:scale-95 text-xs">Review Draft</button>
             </div>
          </Card>
        </BentoGridItem>

        {/* 4. Assessment (A) - Med (4 cols) */}
        <BentoGridItem span={4}>
           <SBARCard 
              label="Assessment" 
              acronym="A"
              content="Lung sounds diminished in bases. SpO2 92% on 2L NC. Patient conscious and oriented x3. Mild anxiety noted."
              color="bg-accent/10"
              icon={<FileText size={20} className="text-accent-deep" />}
           />
        </BentoGridItem>

        {/* 5. Recommendation (R) - Med (4 cols) */}
        <BentoGridItem span={4}>
           <SBARCard 
              label="Recommendation" 
              acronym="R"
              content="Continue O2 at 2L. Monitor RR every hour. Administer scheduled Albuterol at 16:00. Encourage spirometry."
              color="bg-success/10"
              icon={<UserCheck size={20} className="text-success-deep" />}
           />
        </BentoGridItem>

        {/* 6. Voice Input & Capture - Med (4 cols) */}
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

        {/* 7. Action Control Tile - Wide (8 cols) */}
        <BentoGridItem span={8}>
           <Card className="h-full bg-surface text-text-primary shadow-lg shadow-primary/5 flex flex-col md:flex-row items-center justify-between p-8">
              <div className="mb-6 md:mb-0">
                 <h3 className="text-2xl font-extrabold tracking-tight">Bed 7 Portal Ready</h3>
                 <p className="text-sm font-body opacity-80 mt-1">SBAR authorization will sync to clinical server immediately.</p>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                 <button className="h-12 px-6 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/10 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">Export PDF</button>
                 <button className="h-12 px-10 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/10 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                    <UserCheck size={20} />
                    Sign & Transfer
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

const QueueItem = ({ name, bed, status }: { name: string, bed: string, status: "active" | "draft" | "pending" }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
    status === "active" ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20 shadow-sm" : "bg-bg border-border hover:border-primary/30"
  }`}>
    <div className="flex items-center gap-3">
       <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
         status === "active" ? "bg-primary text-text-primary shadow-sm" : "bg-surface text-text-muted border border-border"
       }`}>
          {bed.split(" ")[1]}
       </div>
       <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary">{name}</span>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-tighter">{bed}</span>
       </div>
    </div>
    {status === "draft" && <Sparkles size={14} className="text-primary-deep" />}
    {status === "active" && <div className="h-2 w-2 rounded-full bg-primary-deep animate-pulse" />}
  </div>
);

export default HandoffPage;
