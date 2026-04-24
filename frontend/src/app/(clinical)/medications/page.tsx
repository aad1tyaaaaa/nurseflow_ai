"use client";

import React, { useState, useEffect } from "react";
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
import { api } from "@/lib/api";

interface Med {
  id: string;
  drug_name: string;
  dose: string;
  route: string;
  scheduled_time: string;
  urgency: string;
  status: string;
  patient_id: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  bed_number: string | null;
}

const MedicationsPage = () => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [medications, setMedications] = useState<Med[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    api.medications.queue().then((data) => {
      const queue = data as { medications?: Med[] };
      if (queue.medications) setMedications(queue.medications);
    }).catch(() => {});

    api.patients.list().then((data) => {
      setPatients(data as Patient[]);
    }).catch(() => {});
  }, []);

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const handleAdminister = async (medId: string) => {
    try {
      await api.medications.administer(medId);
      setMedications(prev => prev.filter(m => m.id !== medId));
    } catch {
      // error
    }
  };

  const filtered = medications.filter(m => {
    if (!searchTerm) return true;
    const p = getPatient(m.patient_id);
    const pName = p ? `${p.first_name} ${p.last_name}` : "";
    return m.drug_name.toLowerCase().includes(searchTerm.toLowerCase()) || pName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Generate insights from real data
  const criticalCount = medications.filter(m => m.urgency === "critical").length;
  const dueCount = medications.filter(m => m.status === "due" || m.status === "overdue").length;
  const insights = [
    `${medications.length} medications in queue. ${criticalCount} critical priority.`,
    dueCount > 0 ? `${dueCount} medication(s) currently due or overdue.` : "All medications on schedule.",
    `Compliance tracking active for ${patients.length} patients.`,
  ];

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
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
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
         {/* Main Queue Tile */}
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
                     {filtered.length === 0 && (
                       <p className="text-sm text-text-muted italic text-center py-8">No medications in queue.</p>
                     )}
                     {filtered.map((med) => {
                        const patient = getPatient(med.patient_id);
                        const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "Unknown";
                        const bed = patient?.bed_number ? `Bed ${patient.bed_number}` : "";
                        const timeStr = med.scheduled_time ? new Date(med.scheduled_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

                        return (
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
                                    med.urgency === 'high' ? 'bg-warning/10 text-amber-600 shadow-sm shadow-warning/10' : 'bg-primary/10 text-primary-deep shadow-sm shadow-primary/10'
                                 }`}>
                                    <Pill size={24} />
                                 </div>
                                 <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2">
                                       <h3 className="font-display font-bold text-text-primary text-lg truncate">{med.drug_name}</h3>
                                       <span className="text-xs text-text-muted font-body truncate">• {med.dose} {med.route}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                       <User size={12} className="text-primary-deep" />
                                       <span className="text-sm font-bold text-text-secondary">{patientName}</span>
                                       {bed && <span className="text-xs text-text-muted font-mono bg-surface px-2 py-0.5 rounded-lg border border-border">{bed}</span>}
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-6">
                                 <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Target</span>
                                    <span className={`text-lg font-mono font-bold ${med.urgency === 'critical' ? 'text-critical' : 'text-text-primary'}`}>{timeStr}</span>
                                 </div>
                                 <button
                                    onClick={() => handleAdminister(med.id)}
                                    className="h-10 px-6 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                 >
                                    Administer
                                 </button>
                                 <button className="p-2 rounded-xl hover:bg-surface text-text-muted transition-colors transition-transform active:scale-90">
                                    <MoreVertical size={18} />
                                 </button>
                              </div>
                           </div>
                        </motion.div>
                        );
                     })}
                  </AnimatePresence>
               </div>
            </Card>
         </BentoGridItem>

         {/* Pharmacology Insights */}
         <BentoGridItem span={4}>
            <div className="flex flex-col gap-6 h-full">
               <AIInsightPanel 
                  title="Pharmacology Analysis"
                  insights={insights}
               />

               <Card className="bg-primary-deep text-white border-0 shadow-lg shadow-primary-deep/20 overflow-hidden relative">
                  <div className="absolute top-[-20%] right-[-10%] opacity-10 rotate-12"><Pill size={120} /></div>
                  <h3 className="font-display font-bold flex items-center gap-2 mb-6">
                     <TrendingUp size={18} />
                     Shift Productivity
                  </h3>
                  <div className="space-y-6 relative z-10">
                     <StatLine label="Queue Remaining" value={`${medications.length}`} progress={medications.length > 0 ? Math.max(10, 100 - (medications.length * 10)) : 100} />
                     <StatLine label="Critical" value={`${criticalCount}`} progress={criticalCount > 0 ? Math.min(100, criticalCount * 25) : 0} />
                  </div>
               </Card>

               {criticalCount > 0 && (
               <Card className="bg-critical text-white border-0 shadow-xl shadow-critical/20 flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                     <AlertTriangle size={20} className="text-white/80" />
                     <h3 className="font-display font-bold text-lg">Critical Priority</h3>
                  </div>
                  <p className="text-sm font-body text-white/90 leading-relaxed mb-6">
                    {criticalCount} medication(s) require immediate attention.
                  </p>
                  <button className="w-full bg-white/10 backdrop-blur-md text-white font-bold py-3.5 rounded-2xl hover:bg-white/20 border border-white/20 transition-all flex items-center justify-center gap-2 text-sm">
                     View Critical <ChevronRight size={18} />
                  </button>
               </Card>
               )}
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
