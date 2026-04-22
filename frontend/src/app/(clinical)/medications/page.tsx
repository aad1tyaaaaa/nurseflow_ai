"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Pill, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical, 
  User, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  List
} from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";
import Card from "@/components/ui/Card";
import { AIInsightPanel } from "@/components/ui/AIInsightPanel";

const medications = [
  { id: 1, name: "Insulin Aspart", patient: "Robert Miller", bed: "Bed 7", dose: "6 units", route: "Subcut", time: "14:00", urgency: "critical", status: "due" },
  { id: 2, name: "Heparin Infusion", patient: "Sarah Chen", bed: "Bed 3", dose: "1000 u/hr", route: "IV", time: "14:15", urgency: "warning", status: "ready" },
  { id: 3, name: "Albuterol Nebr.", patient: "Robert Miller", bed: "Bed 7", dose: "2.5mg", route: "Inhalt", time: "14:30", urgency: "warning", status: "ready" },
  { id: 4, name: "Lisinopril", patient: "James Wilson", bed: "Bed 12", dose: "10mg", route: "Oral", time: "15:00", urgency: "safe", status: "future" },
  { id: 5, name: "Ceftriaxone", patient: "Michael Scott", bed: "Bed 9", dose: "1g", route: "IVPB", time: "15:30", urgency: "safe", status: "future" },
  { id: 6, name: "Furosemide", patient: "David Goggins", bed: "Bed 2", dose: "40mg", route: "IV Push", time: "16:00", urgency: "safe", status: "future" },
];

const MedicationsPage = () => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-stagger-up">
        <div>
           <h1 className="text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
             Medication <span className="text-primary-deep">Priority Queue</span>
             <Pill className="text-primary-deep" size={28} />
           </h1>
           <p className="mt-2 font-body text-text-secondary">
             Centralized unit medication management sorted by AI-predicted urgency.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-surface-raised p-1 rounded-xl border border-border flex gap-1">
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-primary-deep" : "text-text-muted hover:text-text-primary"}`}
              >
                 <List size={18} />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-primary-deep" : "text-text-muted hover:text-text-primary"}`}
              >
                 <LayoutGrid size={18} />
              </button>
           </div>
           <button className="btn-primary px-8 py-2.5">Scan Med Barcode</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
         <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
               type="text" 
               placeholder="Search by medication or patient..." 
               className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-body text-sm"
            />
         </div>
         <button className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-border bg-white text-text-secondary font-bold hover:bg-surface-raised transition-all">
            <Filter size={18} />
            All Units
         </button>
         <button className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-border bg-white text-text-secondary font-bold hover:bg-surface-raised transition-all">
            <Clock size={18} />
            Chronological
         </button>
      </div>

      <BentoGrid>
         {/* 1. Main Queue Tile - Wide (8 cols) */}
         <BentoGridItem span={8}>
            <Card className="h-full p-0 flex flex-col">
               <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
                  <h3 className="font-display font-bold text-text-primary text-xl flex items-center gap-2">
                     <List size={20} className="text-primary-deep" />
                     Active Medication Queue
                  </h3>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-border">Acuity-Sorted</span>
               </div>
               
               <div className="p-6 space-y-4 flex-grow overflow-y-auto max-h-[600px] custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                     {medications.map((med) => (
                        <motion.div
                           key={med.id}
                           layout
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, scale: 0.98 }}
                           className={`group relative overflow-hidden p-5 rounded-3xl border bg-bg transition-all hover:shadow-xl hover:shadow-primary/5 ${
                              med.urgency === 'critical' ? 'border-critical/30 ring-1 ring-critical/5' : 'border-border'
                           }`}
                        >
                           {med.urgency === 'critical' && (
                              <div className="absolute top-0 left-0 bottom-0 w-1 bg-critical" />
                           )}
                           
                           <div className="flex items-center justify-between gap-6">
                              <div className="flex items-center gap-4 flex-grow">
                                 <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                                    med.urgency === 'critical' ? 'bg-critical/10 text-critical shadow-sm shadow-critical/10' : 
                                    med.urgency === 'warning' ? 'bg-warning/10 text-amber-600 shadow-sm shadow-warning/10' : 'bg-primary/10 text-primary-deep shadow-sm shadow-primary/10'
                                 }`}>
                                    <Pill size={24} />
                                 </div>
                                 <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2">
                                       <h3 className="font-display font-bold text-text-primary text-lg truncate">{med.name}</h3>
                                       <span className="text-xs text-text-muted font-body truncate">• {med.dose} {med.route}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                       <User size={12} className="text-primary-deep" />
                                       <span className="text-sm font-bold text-text-secondary">{med.patient}</span>
                                       <span className="text-xs text-text-muted font-mono bg-surface px-2 py-0.5 rounded-lg border border-border">{med.bed}</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-6">
                                 <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Target</span>
                                    <span className={`text-lg font-mono font-bold ${med.urgency === 'critical' ? 'text-critical' : 'text-text-primary'}`}>{med.time}</span>
                                 </div>
                                 <button className="h-10 px-6 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                    Administer
                                 </button>
                                 <button className="p-2 rounded-xl hover:bg-surface text-text-muted transition-colors transition-transform active:scale-90">
                                    <MoreVertical size={18} />
                                 </button>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </AnimatePresence>
               </div>
            </Card>
         </BentoGridItem>

         {/* 2. Pharmacology Insights - Med (4 cols) */}
         <BentoGridItem span={4}>
            <div className="flex flex-col gap-6 h-full">
               <AIInsightPanel 
                  title="Pharmacology Analysis"
                  insights={[
                    "Bed 7 Insulin dose adjusted based on 13:45 Glucose reading (242 mg/dL).",
                    "Interaction Alert: Bed 3 Heparin rate matches current PTT trend.",
                    "Stock Check: Unit B Pyxis is low on Albuterol vials (3 remaining)."
                  ]}
               />

               <Card className="bg-primary-deep text-white border-0 shadow-lg shadow-primary-deep/20 overflow-hidden relative">
                  <div className="absolute top-[-20%] right-[-10%] opacity-10 rotate-12"><Pill size={120} /></div>
                  <h3 className="font-display font-bold flex items-center gap-2 mb-6">
                     <TrendingUp size={18} />
                     Shift Productivity
                  </h3>
                  <div className="space-y-6 relative z-10">
                     <StatLine label="Compliance" value="100%" progress={100} />
                     <StatLine label="Response Time" value="4.2m" progress={80} />
                  </div>
               </Card>

               <Card className="bg-critical text-white border-0 shadow-xl shadow-critical/20 flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                     <AlertTriangle size={20} className="text-white/80" />
                     <h3 className="font-display font-bold text-lg">Urgent Stock</h3>
                  </div>
                  <p className="text-sm font-body text-white/90 leading-relaxed mb-6">
                    Bed 7 requires specialized IV pump. Unit stock: 0. Requisitioning from Supply...
                  </p>
                  <button className="w-full bg-white/10 backdrop-blur-md text-white font-bold py-3.5 rounded-2xl hover:bg-white/20 border border-white/20 transition-all flex items-center justify-center gap-2 text-sm">
                     Confirm Order <ChevronRight size={18} />
                  </button>
               </Card>
            </div>
         </BentoGridItem>
      </BentoGrid>
    </div>
  );
};

const StatLine = ({ label, value, progress }: { label: string, value: string, progress: number }) => (
  <div className="space-y-1.5">
     <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase tracking-widest">
        <span>{label}</span>
        <span>{value}</span>
     </div>
     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full bg-white rounded-full`} style={{ width: `${progress}%` }} />
     </div>
  </div>
);

export default MedicationsPage;
