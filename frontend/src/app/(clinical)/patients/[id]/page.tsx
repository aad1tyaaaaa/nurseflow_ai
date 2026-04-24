"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { api } from "@/lib/api";

type NavTab = "overview" | "history" | "meds" | "notes";

interface PatientDetail {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  room_number: string | null;
  bed_number: string | null;
  primary_diagnosis: string | null;
  allergies: string[] | null;
  acuity_score: number | null;
  fall_risk_score: number | null;
  news2_score: number | null;
  admission_date: string | null;
}

interface Vital {
  id: string;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  recorded_at: string;
}

interface Medication {
  id: string;
  drug_name: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduled_time: string;
  status: string;
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function acuityToStatus(acuity: number | null): "safe" | "warning" | "critical" {
  if (!acuity) return "safe";
  if (acuity >= 4.0) return "critical";
  if (acuity >= 3.0) return "warning";
  return "safe";
}

function formatAdmissionDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const PatientDetailPage = () => {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.patients.get(id),
      api.patients.vitals(id),
      api.medications.forPatient(id),
    ])
      .then(([p, v, m]) => {
        setPatient(p as PatientDetail);
        setVitals(v as Vital[]);
        setMedications(m as Medication[]);
      })
      .catch((err) => console.error("Failed to load patient data", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-text-muted font-body">
        Loading patient data...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-text-muted font-body">
        Patient not found.
      </div>
    );
  }

  const latestVital = vitals[0] ?? null;
  const acuityStatus = acuityToStatus(patient.acuity_score);
  const age = calcAge(patient.date_of_birth);

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
          <StatusBadge status={acuityStatus} label={acuityStatus === "critical" ? "Critical Attention Required" : acuityStatus === "warning" ? "Monitor Closely" : "Stable"} />
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
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">{patient.first_name} {patient.last_name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                 <div className="flex items-center gap-1.5 text-text-secondary">
                    <Calendar size={14} className="text-primary-deep" />
                    <span className="text-sm font-body font-medium">{age} years • {formatAdmissionDate(patient.admission_date)}</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-text-secondary border-l border-border pl-4">
                    <span className="text-sm font-mono font-bold text-text-primary uppercase tracking-tighter">{patient.mrn}</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-text-secondary border-l border-border pl-4">
                    <ShieldPlus size={14} className="text-secondary" />
                    <span className="text-sm font-bold text-secondary">Room {patient.room_number} · Bed {patient.bed_number}</span>
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
              <VitalCard label="Heart Rate" value={latestVital?.heart_rate ?? "—"} unit="bpm" status={latestVital?.heart_rate && latestVital.heart_rate > 100 ? "warning" : "safe"} icon={<Activity size={16} />} />
              <VitalCard label="Blood Pressure" value={latestVital ? `${latestVital.blood_pressure_systolic}/${latestVital.blood_pressure_diastolic}` : "—"} unit="mmHg" status={latestVital?.blood_pressure_systolic && latestVital.blood_pressure_systolic > 140 ? "warning" : "safe"} icon={<Heart size={16} />} />
              <VitalCard label="SpO2" value={latestVital?.spo2 ?? "—"} unit="%" status={latestVital?.spo2 && latestVital.spo2 < 95 ? "critical" : "safe"} icon={<Activity size={16} />} />
              <VitalCard label="Resp Rate" value={latestVital?.respiratory_rate ?? "—"} unit="pm" status={latestVital?.respiratory_rate && latestVital.respiratory_rate > 20 ? "warning" : "safe"} icon={<Activity size={16} />} />
              <VitalCard label="Temp" value={latestVital?.temperature ?? "—"} unit="°C" status={latestVital?.temperature && latestVital.temperature > 37.5 ? "warning" : "safe"} icon={<Stethoscope size={16} />} />
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
                {activeTab === "overview" && <OverviewTab patient={patient} />}
                {activeTab === "meds" && <MedicationsTab medications={medications} />}
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
                `NEWS2 score: ${patient.news2_score ?? "N/A"} — ${(patient.news2_score ?? 0) >= 7 ? "Red Zone — immediate review recommended." : "Within monitoring range."}`,
                `Fall risk score: ${patient.fall_risk_score ?? "N/A"} — ${(patient.fall_risk_score ?? 0) >= 7 ? "High risk — bed rails and supervision advised." : "Low to moderate risk."}`,
                `Acuity level: ${patient.acuity_score?.toFixed(1) ?? "N/A"} — continue ${(patient.acuity_score ?? 0) >= 4 ? "Q1H vitals and escalation readiness." : "standard monitoring protocol."}`
              ]}
           />

           <Card className="bg-secondary/10 border border-secondary/20 shadow-none">
              <h3 className="font-display font-bold text-secondary-deep flex items-center gap-2 mb-4">
                 <TrendingUp size={18} />
                 Unit Benchmark
              </h3>
              <p className="text-sm font-body text-secondary-deep/80 leading-relaxed mb-6">
                Compared to unit average, therapy response for this patient is being monitored continuously.
              </p>
              <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (patient.acuity_score ?? 1) * 20)}%` }}
                    className="h-full bg-secondary" 
                 />
              </div>
              <p className="mt-2 text-[10px] font-bold text-secondary-deep/60 uppercase tracking-widest text-right">Acuity Score: {patient.acuity_score?.toFixed(1) ?? "—"}</p>
           </Card>

           <Card className="bg-primary-deep text-white border-0 shadow-lg shadow-primary/20">
              <div className="flex items-center gap-2 mb-4 opacity-70">
                 <Sparkles size={16} />
                 <span className="text-xs font-bold uppercase tracking-widest">Next Recommended Action</span>
              </div>
              <p className="text-lg font-bold leading-tight mb-6 italic">&quot;{(patient.news2_score ?? 0) >= 5 ? "Review escalation protocol and notify attending physician." : "Continue standard monitoring. Reassess vitals per schedule."}&quot;</p>
              <button className="w-full bg-white text-primary-deep font-bold py-3 rounded-2xl shadow-lg shadow-black/10 hover:bg-white/90 transition-all">Submit Order to MD</button>
           </Card>
        </div>
      </div>
    </div>
  );
};

// Sub-components for Tabs
const OverviewTab = ({ patient }: { patient: PatientDetail }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Primary Diagnosis</h3>
      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
         <p className="text-xl font-bold text-text-primary underline decoration-primary/40 underline-offset-4">{patient.primary_diagnosis ?? "Not specified"}</p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-6">
       <div>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Allergies</h3>
          <div className="flex flex-wrap gap-2">
             {patient.allergies && patient.allergies.length > 0 ? patient.allergies.map((allergy, i) => (
               <span key={i} className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-bold border border-red-200">{allergy}</span>
             )) : (
               <span className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-xs font-bold border border-green-200">NKDA</span>
             )}
          </div>
       </div>
       <div>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Precautions</h3>
          <div className="flex flex-wrap gap-2">
             {(patient.fall_risk_score ?? 0) >= 5 && <span className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200">High Fall Risk</span>}
             <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">Contact Precautions</span>
          </div>
       </div>
    </div>
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

const MedicationsTab = ({ medications }: { medications: Medication[] }) => (
  <div className="space-y-6">
    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Current Active Medications</h3>
    {medications.length === 0 ? (
      <p className="text-text-muted font-body italic py-8 text-center">No medications on record.</p>
    ) : (
      <div className="space-y-3">
         {medications.map((med) => (
           <div key={med.id} className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/40 transition-colors bg-white shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Pill size={20} />
                 </div>
                 <div>
                    <p className="text-sm font-bold text-text-primary">{med.drug_name}</p>
                    <p className="text-xs text-text-muted font-body">{med.dosage} · {med.route} · {med.frequency}</p>
                 </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Scheduled</span>
                 <span className="text-sm font-mono font-bold text-primary-deep">{formatTime(med.scheduled_time)}</span>
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${
                   med.status === "overdue" ? "text-critical" :
                   med.status === "administered" ? "text-success" :
                   "text-warning"
                 }`}>{med.status}</span>
              </div>
           </div>
         ))}
      </div>
    )}
  </div>
);

const HistoryTab = () => (
  <div className="flex flex-col items-center justify-center h-full py-12">
     <History size={40} className="text-text-muted mb-4 opacity-30" />
     <p className="text-text-muted font-body italic">&quot;Accessing centralized Hospital EMR history...&quot;</p>
  </div>
);

const NotesTab = () => (
  <div className="space-y-4">
     <div className="p-4 rounded-2xl bg-surface-raised border border-border">
        <div className="flex items-center justify-between mb-2">
           <span className="text-xs font-bold text-text-primary">Clinical Notes</span>
        </div>
        <p className="text-sm text-text-secondary font-body italic">&quot;Notes are captured via Voice Studio and structured automatically.&quot;</p>
     </div>
     <button className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-text-muted text-sm font-bold hover:border-primary/40 hover:text-primary-deep transition-all">+ Add New Clinical Note</button>
  </div>
);

export default PatientDetailPage;
