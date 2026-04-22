"use client";

import React, { useState } from "react";
// import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Activity, 
  Clock, 
  History, 
  FileText, 
  Pill, 
  ChevronLeft,
  Calendar,
  User,
  ShieldPlus,
  Stethoscope,
  TrendingUp,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AIInsightPanel } from "@/components/ui/AIInsightPanel";

type NavTab = "overview" | "history" | "meds" | "notes";

const PatientDetailPage = () => {
  // const { id } = useParams(); // Commenting out if unused
  const [activeTab, setActiveTab] = useState<NavTab>("overview");

  // Mock patient data - would be fetched by ID in a real app
  const patient = {
    name: "Robert Miller",
    age: 68,
    mrn: "482-991-ICU",
    room: "ICU Bed 7",
    admitted: "Apr 19, 2026",
    diagnosis: "Acute Respiratory Distress (COPD Exacerbation)",
    acuity: "critical" as const,
    vitals: {
      hr: 112,
      bp: "142/91",
      spo2: 92,
      rr: 24,
      temp: 99.2
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between animate-stagger-up">
        <Link href="/patients" className="flex items-center gap-2 text-text-secondary hover:text-primary-deep transition-colors group">
          <div className="p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
            <ChevronLeft size={20} />
          </div>
          <span className="font-bold text-sm">Back to Patient Registry</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Acuity Status</span>
          <StatusBadge status={patient.acuity} label="Critical Attention Required" />
        </div>
      </div>

      {/* Patient Header Card */}
      <Card className="relative overflow-hidden bg-white/80 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary-deep shadow-lg shadow-primary/20">
              <User size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">{patient.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                 <div className="flex items-center gap-1.5 text-text-secondary">
                    <Calendar size={14} className="text-primary-deep" />
                    <span className="text-sm font-body font-medium">{patient.age} years • {patient.admitted}</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-text-secondary border-l border-border pl-4">
                    <span className="text-sm font-mono font-bold text-text-primary uppercase tracking-tighter">{patient.mrn}</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-text-secondary border-l border-border pl-4">
                    <ShieldPlus size={14} className="text-secondary" />
                    <span className="text-sm font-bold text-secondary">{patient.room}</span>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="px-6 py-2.5 rounded-2xl border border-border bg-white text-text-secondary font-bold text-sm hover:bg-surface-raised transition-all">Export Chart</button>
             <button className="btn-primary px-8 py-2.5 text-sm">Assign Order</button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Vitals & Content */}
        <div className="lg:col-span-8 space-y-8">
           {/* Real-time Vitals Bar */}
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <VitalCard label="Heart Rate" value={patient.vitals.hr} unit="bpm" status="warning" icon={<Activity size={16} />} />
              <VitalCard label="Blood Pressure" value={patient.vitals.bp} unit="mmHg" status="warning" icon={<Heart size={16} />} />
              <VitalCard label="SpO2" value={patient.vitals.spo2} unit="%" status="critical" icon={<Activity size={16} />} />
              <VitalCard label="Resp Rate" value={patient.vitals.rr} unit="pm" status="warning" icon={<Activity size={16} />} />
              <VitalCard label="Temp" value={patient.vitals.temp} unit="°F" status="safe" icon={<Stethoscope size={16} />} />
           </div>

           {/* Content Tabs */}
           <div className="bg-surface-raised rounded-[2rem] p-2 flex gap-1 border border-border shadow-sm">
              <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<FileText size={18} />} label="Overview" />
              <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={18} />} label="History" />
              <TabButton active={activeTab === "meds"} onClick={() => setActiveTab("meds")} icon={<Pill size={18} />} label="Medications" />
              <TabButton active={activeTab === "notes"} onClick={() => setActiveTab("notes")} icon={<Clock size={18} />} label="Clinical Notes" />
           </div>

           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="clay-card min-h-[400px] p-8"
              >
                {activeTab === "overview" && <OverviewTab diagnosis={patient.diagnosis} />}
                {activeTab === "meds" && <MedicationsTab />}
                {activeTab === "history" && <HistoryTab />}
                {activeTab === "notes" && <NotesTab />}
              </motion.div>
           </AnimatePresence>
        </div>

        {/* Right Column - AI Panel */}
        <div className="lg:col-span-4 space-y-8">
           <AIInsightPanel 
              title="Predictive AI Insights"
              insights={[
                "Respiratory fatigue predicted within 4-6 hours if current RR trend continues.",
                "Patient responds well to 2L CPAP intervention; SpO2 stabilized by 1.5% in 30 mins.",
                "Risk of sepsis: LOW (Score 2.4/10 based on WBC and procalcitonin)."
              ]}
           />

           <Card className="bg-secondary/10 border border-secondary/20 shadow-none">
              <h3 className="font-display font-bold text-secondary-deep flex items-center gap-2 mb-4">
                 <TrendingUp size={18} />
                 Unit Benchmark
              </h3>
              <p className="text-sm font-body text-secondary-deep/80 leading-relaxed mb-6">
                Compared to unit average, therapy response for Bed 7 is in the top 20th percentile.
              </p>
              <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "80%" }}
                    className="h-full bg-secondary" 
                 />
              </div>
              <p className="mt-2 text-[10px] font-bold text-secondary-deep/60 uppercase tracking-widest text-right">Therapy Response Score: 80</p>
           </Card>

           <Card className="bg-primary-deep text-white border-0 shadow-lg shadow-primary/20">
              <div className="flex items-center gap-2 mb-4 opacity-70">
                 <Sparkles size={16} />
                 <span className="text-xs font-bold uppercase tracking-widest">Next Recommended Action</span>
              </div>
              <p className="text-lg font-bold leading-tight mb-6 italic">&quot;Schedule ABG review in 2 hours to confirm ventilation adequacy.&quot;</p>
              <button className="w-full bg-white text-primary-deep font-bold py-3 rounded-2xl shadow-lg shadow-black/10 hover:bg-white/90 transition-all">Submit Order to MD</button>
           </Card>
        </div>
      </div>
    </div>
  );
};

// Sub-components for Tabs
const OverviewTab = ({ diagnosis }: { diagnosis: string }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Primary Diagnosis</h3>
      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
         <p className="text-xl font-bold text-text-primary underline decoration-primary/40 underline-offset-4">{diagnosis}</p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-6">
       <div>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Allergies</h3>
          <div className="flex flex-wrap gap-2">
             <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-bold border border-red-200">Penicillin (Anaphylaxis)</span>
             <span className="px-3 py-1.5 rounded-xl bg-orange-100 text-amber-800 text-xs font-bold border border-orange-200">Latex (Rash)</span>
          </div>
       </div>
       <div>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Precautions</h3>
          <div className="flex flex-wrap gap-2">
             <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">Contact Precautions</span>
             <span className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200">High Fall Risk</span>
          </div>
       </div>
    </div>
  </div>
);

const MedicationsTab = () => (
  <div className="space-y-6">
    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Current Active Medications</h3>
    <div className="space-y-3">
       {[
         { name: "Albuterol Sulfate", dose: "2.5mg/3mL Nebr", freq: "Q4h", next: "16:00" },
         { name: "Methylprednisolone", dose: "40mg IV Push", freq: "Q8h", next: "18:00" },
         { name: "Heparin", dose: "5000 units SQ", freq: "Q12h", next: "20:00" }
       ].map((med, i) => (
         <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/40 transition-colors bg-white shadow-sm">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Pill size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold text-text-primary">{med.name}</p>
                  <p className="text-xs text-text-muted font-body">{med.dose} • {med.freq}</p>
               </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Next Due</span>
               <span className="text-sm font-mono font-bold text-primary-deep">{med.next}</span>
            </div>
         </div>
       ))}
    </div>
  </div>
);

const HistoryTab = () => (
  <div className="flex flex-col items-center justify-center h-full py-12">
     <History size={40} className="text-text-muted mb-4 opacity-30" />
     <p className="text-text-muted font-body italic">&quot;Accessing centralized Hospital EMR history for Robert Miller...&quot;</p>
  </div>
);

const NotesTab = () => (
  <div className="space-y-4">
     <div className="p-4 rounded-2xl bg-surface-raised border border-border">
        <div className="flex items-center justify-between mb-2">
           <span className="text-xs font-bold text-text-primary">Shift Entry - Sarah, RN</span>
           <span className="text-[10px] text-text-muted">Today, 11:20 AM</span>
        </div>
        <p className="text-sm text-text-secondary font-body italic">&quot;Patient resting comfortably. Lung sounds slightly improved in the left base. Incentive spirometry completed with 1200mL output.&quot;</p>
     </div>
     <button className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-text-muted text-sm font-bold hover:border-primary/40 hover:text-primary-deep transition-all">+ Add New Clinical Note</button>
  </div>
);

interface VitalCardProps {
  label: string;
  value: string | number;
  unit: string;
  status: "safe" | "warning" | "critical";
  icon: React.ReactNode;
}

const VitalCard = ({ label, value, unit, status, icon }: VitalCardProps) => {
  const colors: Record<string, string> = {
    safe: "text-emerald-600",
    warning: "text-amber-600",
    critical: "text-red-600"
  };
  return (
    <Card className="flex flex-col gap-2 p-4 pt-4 shadow-sm group hover:scale-[1.02] transition-transform">
      <div className="flex items-center gap-2 text-text-muted uppercase tracking-tighter text-[10px] font-bold">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1 relative overflow-hidden">
        <span className={`text-2xl font-mono font-bold ${colors[status]}`}>{value}</span>
        <span className="text-xs text-text-muted">{unit}</span>
      </div>
    </Card>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton = ({ active, onClick, icon, label }: TabButtonProps) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-sm font-bold transition-all ${
      active ? "bg-white text-text-primary shadow-lg shadow-black/5" : "text-text-secondary hover:text-text-primary"
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default PatientDetailPage;
