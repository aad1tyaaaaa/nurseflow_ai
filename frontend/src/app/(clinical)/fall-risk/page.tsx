"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Activity, 
  Map as MapIcon, 
  User, 
  ArrowRight
} from "lucide-react";
import Card from "@/components/ui/Card";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AIInsightPanel } from "@/components/ui/AIInsightPanel";
import { api } from "@/lib/api";

interface DashboardPatient {
  id: string;
  first_name: string;
  last_name: string;
  bed_number: string | null;
  acuity_score: number | null;
  fall_risk_score: number | null;
  active_alerts_count: number;
  latest_vitals: {
    heart_rate: number | null;
    respiratory_rate: number | null;
    spo2: number | null;
  } | null;
}

interface PatientRisk {
  id: string;
  name: string;
  bed: string;
  score: number;
  trend: "up" | "down" | "stable";
  status: "safe" | "warning" | "critical";
  lastCheck: string;
}

const riskStatus = (score: number): "safe" | "warning" | "critical" => {
  if (score >= 70) return "critical";
  if (score >= 30) return "warning";
  return "safe";
};

const FallRiskPage = () => {
  const [patientsRisk, setPatientsRisk] = useState<PatientRisk[]>([]);
  const [selectedBed, setSelectedBed] = useState<PatientRisk | null>(null);
  const [fallAssessment, setFallAssessment] = useState<{ risk_level: string; score: number; factors: string[]; recommendations: string[] } | null>(null);

  useEffect(() => {
    api.dashboard.patients().then((data) => {
      const pts = data as DashboardPatient[];
      const mapped: PatientRisk[] = pts.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        bed: p.bed_number ? `Bed ${p.bed_number}` : "—",
        score: p.fall_risk_score ?? (p.acuity_score ? p.acuity_score * 15 : 10),
        trend: (p.fall_risk_score ?? 0) >= 50 ? "up" : "stable",
        status: riskStatus(p.fall_risk_score ?? (p.acuity_score ? p.acuity_score * 15 : 10)),
        lastCheck: "Recent",
      }));
      setPatientsRisk(mapped);
      if (mapped.length > 0) setSelectedBed(mapped[0]);
    }).catch(() => {});
  }, []);

  // Fetch fall risk assessment when selected bed changes
  useEffect(() => {
    if (!selectedBed) return;
    api.fallRisk.forPatient(selectedBed.id).then((data) => {
      const assessments = data as { risk_level: string; score: number; factors: string[]; recommendations: string[] }[];
      if (assessments.length > 0) setFallAssessment(assessments[0]);
      else setFallAssessment(null);
    }).catch(() => setFallAssessment(null));
  }, [selectedBed?.id]);

  const handleAssess = async () => {
    if (!selectedBed) return;
    try {
      const result = await api.fallRisk.assess(selectedBed.id, { mobility_event: "routine_check" });
      setFallAssessment(result as typeof fallAssessment);
    } catch {
      // error
    }
  };

  const criticalCount = patientsRisk.filter(p => p.status === "critical").length;
  const insights = fallAssessment?.factors?.length
    ? fallAssessment.factors
    : selectedBed
      ? [`Fall risk score: ${selectedBed.score}. Status: ${selectedBed.status}.`]
      : ["Select a patient to view fall risk details."];

  return (
    <div className="space-y-8 pb-12">
      <BentoGrid>
        {/* Unit Map / Heatmap */}
        <BentoGridItem span={8}>
           <Card className="p-0 overflow-hidden relative min-h-[400px] h-full flex flex-col bg-white">
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
                 <h3 className="font-display font-bold text-text-primary text-xl flex items-center gap-2">
                    <MapIcon size={20} className="text-primary-deep" />
                    Unit Behavioral Heatmap
                 </h3>
                 <div className="flex gap-4">
                    <LegendItem color="bg-critical" label="High Risk" />
                    <LegendItem color="bg-warning" label="Moderate" />
                 </div>
              </div>
              
              <div className="flex-grow p-8 bg-surface-raised/30 relative flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
                 
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl relative z-10">
                    {patientsRisk.map((p) => (
                       <motion.div
                          key={p.id}
                          whileHover={{ scale: 1.05, y: -4 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedBed(p)}
                          className={`relative aspect-square rounded-3xl border-2 transition-all cursor-pointer shadow-sm flex flex-col items-center justify-center p-4 bg-white ${
                             selectedBed?.id === p.id 
                                ? "border-primary ring-4 ring-primary/10 shadow-xl shadow-primary/5" 
                                : "border-border hover:border-primary/40"
                          }`}
                       >
                          <div className={`text-xl font-mono font-black mb-1 ${
                             p.status === 'critical' ? 'text-critical' : p.status === 'warning' ? 'text-amber-600' : 'text-text-muted/40'
                          }`}>
                             {p.bed.split(" ")[1] || "?"}
                          </div>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 truncate w-full text-center">{p.name.split(" ").pop()}</span>
                          
                          <div className="relative h-12 w-12 flex items-center justify-center">
                             <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="24" cy="24" r="20" className="fill-none stroke-border/20" strokeWidth="3" />
                                <motion.circle 
                                   initial={{ strokeDasharray: 0 }}
                                   animate={{ strokeDasharray: `${(p.score / 100) * 125.6} 125.6` }}
                                   cx="24" cy="24" r="20" 
                                   className={`fill-none ${p.status === 'critical' ? 'stroke-critical' : p.status === 'warning' ? 'stroke-warning' : 'stroke-success'}`}
                                   strokeWidth="4" strokeLinecap="round"
                                />
                             </svg>
                             <span className="text-[10px] font-bold">{p.score}</span>
                          </div>
                       </motion.div>
                    ))}
                 </div>
              </div>

              <div className="p-6 bg-surface border-t border-border mt-auto flex items-center justify-between">
                 <div className="flex items-center gap-2 text-text-secondary">
                    <Activity size={16} className="text-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">AI Predictive Fall Scoring Active</span>
                 </div>
                 <span className="text-[10px] font-bold text-success uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck size={14} /> {criticalCount} high-risk patients
                 </span>
              </div>
           </Card>
        </BentoGridItem>

        {/* Detailed Monitoring Console */}
        <BentoGridItem span={4}>
           <div className="flex flex-col gap-6 h-full">
              <AnimatePresence mode="wait">
                 {selectedBed && (
                 <motion.div
                    key={selectedBed.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex-grow"
                 >
                    <Card className="h-full bg-white flex flex-col p-8 relative overflow-hidden">
                       {selectedBed.status === 'critical' && <div className="absolute inset-0 bg-critical opacity-[0.03] animate-pulse pointer-events-none" />}
                       
                       <div className="flex items-center justify-between mb-8 relative z-10">
                          <h3 className="font-display font-bold text-text-primary text-xl">Monitor: {selectedBed.bed}</h3>
                          <StatusBadge status={selectedBed.status} />
                       </div>

                       <div className="space-y-8 relative z-10 flex-grow">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-text-primary"><User size={24} /></div>
                             <div>
                                <p className="font-bold text-text-primary">{selectedBed.name}</p>
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                                  Risk Level: {fallAssessment?.risk_level || selectedBed.status}
                                </p>
                             </div>
                          </div>

                          <div className="p-6 rounded-3xl bg-bg border border-border">
                             <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Fall Risk Score</span>
                                <span className={`text-xl font-mono font-bold ${selectedBed.status === 'critical' ? 'text-critical' : 'text-text-primary'}`}>
                                  {fallAssessment?.score ?? selectedBed.score}
                                </span>
                             </div>
                             <div className="h-2 w-full bg-surface-raised rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${fallAssessment?.score ?? selectedBed.score}%` }} className={`h-full ${selectedBed.status === 'critical' ? 'bg-critical' : 'bg-primary'}`} />
                             </div>
                          </div>

                          <AIInsightPanel 
                             title={fallAssessment?.recommendations?.length ? "Recommendations" : "Risk Factors"}
                             insights={fallAssessment?.recommendations?.length ? fallAssessment.recommendations : insights}
                             className="bg-transparent border-none p-0"
                          />

                          <div className="pt-6 border-t border-border mt-auto space-y-3">
                             <button
                               onClick={handleAssess}
                               className="w-full h-12 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/10 hover:translate-y-[-2px] transition-all"
                             >
                               Run AI Assessment
                             </button>
                             <button className="w-full h-12 rounded-2xl bg-bg border border-border text-text-secondary font-bold text-sm hover:bg-white transition-all flex items-center justify-center gap-2">View History <ArrowRight size={16} /></button>
                          </div>
                       </div>
                    </Card>
                 </motion.div>
                 )}
              </AnimatePresence>

              <Card className="bg-secondary text-white border-0 shadow-lg shadow-secondary/20 p-6">
                 <h3 className="font-display font-bold flex items-center gap-2 mb-3">
                    <ShieldCheck size={18} />
                    Unit Safety
                 </h3>
                 <p className="text-sm font-body opacity-90 leading-relaxed">
                   {criticalCount} high-risk patients. {patientsRisk.length - criticalCount} within safe thresholds.
                 </p>
              </Card>
           </div>
        </BentoGridItem>
      </BentoGrid>
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
     <div className={`h-2 w-2 rounded-full ${color}`} />
     <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
  </div>
);

export default FallRiskPage;
