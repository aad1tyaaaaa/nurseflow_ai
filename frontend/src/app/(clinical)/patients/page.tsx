"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";
import Card from "@/components/ui/Card";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Activity,
  Thermometer,
  Wind,
  ShieldPlus,
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  bed_number: string | null;
  room_number: string | null;
  acuity_score: number | null;
  news2_score: number | null;
  primary_diagnosis: string | null;
  date_of_birth: string;
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function acuityToStatus(acuity: number | null): { label: string; badge: string } {
  if (!acuity) return { label: "Stable", badge: "safe" };
  if (acuity >= 4.0) return { label: "Critical", badge: "critical" };
  if (acuity >= 3.0) return { label: "Warning", badge: "warning" };
  if (acuity >= 2.0) return { label: "Stable", badge: "safe" };
  return { label: "Safe", badge: "safe" };
}

const PatientsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.patients.list()
      .then((data) => setPatients(data as Patient[]))
      .catch((err) => console.error("Failed to load patients", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    if (!searchQuery) return true;
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    const bed = (p.bed_number ?? "").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || bed.includes(searchQuery.toLowerCase());
  });

  const criticalCount = patients.filter((p) => (p.acuity_score ?? 0) >= 4.0).length;
  const warningCount = patients.filter((p) => (p.acuity_score ?? 0) >= 3.0 && (p.acuity_score ?? 0) < 4.0).length;
  const stableCount = patients.filter((p) => (p.acuity_score ?? 0) >= 2.0 && (p.acuity_score ?? 0) < 3.0).length;
  const safeCount = patients.filter((p) => (p.acuity_score ?? 0) < 2.0).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="animate-stagger-up">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
          Patient <span className="text-primary-deep">Registry</span>
          <Users className="text-primary-deep" size={28} />
        </h1>
        <div className="mt-4 flex items-center gap-4">
           <div className="relative flex-grow max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search by name or bed..." 
                 className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-body text-sm"
              />
           </div>
           <button className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-border bg-surface text-text-secondary font-bold hover:bg-surface-raised transition-all">
              <Filter size={18} />
              Filter
           </button>
        </div>
      </div>

      <BentoGrid>
        {/* 1. Main Patient List - Wide (12 cols) */}
        <BentoGridItem span={12}>
          <Card className="p-0 overflow-hidden">
             <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                <h3 className="font-display font-bold text-text-primary text-xl">Active Patient List</h3>
                <div className="flex gap-2">
                   {criticalCount > 0 && <div className="px-3 py-1 rounded-full bg-critical/10 text-critical text-xs font-bold uppercase tracking-wider ring-1 ring-critical/20">{criticalCount} Critical</div>}
                   {warningCount > 0 && <div className="px-3 py-1 rounded-full bg-warning/10 text-amber-700 text-xs font-bold uppercase tracking-wider ring-1 ring-amber-600/20">{warningCount} High Risk</div>}
                </div>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-surface-raised/50 border-b border-border">
                         <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Patient</th>
                         <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">Bed</th>
                         <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Acuity</th>
                         <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Diagnosis</th>
                         <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Status</th>
                         <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {loading ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-text-muted font-body">Loading patients...</td></tr>
                      ) : filtered.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-text-muted font-body italic">No patients found.</td></tr>
                      ) : filtered.map((patient) => {
                        const { label: statusLabel, badge } = acuityToStatus(patient.acuity_score);
                        const age = calcAge(patient.date_of_birth);
                        return (
                         <tr key={patient.id} className="hover:bg-surface-raised/30 transition-colors group">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary-deep font-bold">
                                     {patient.first_name.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-text-primary">{patient.first_name} {patient.last_name}</p>
                                     <p className="text-xs text-text-muted font-body italic">{age} years old</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <span className="font-mono text-xs font-bold text-text-secondary bg-surface-raised px-2 py-1 rounded-lg border border-border">Bed {patient.bed_number}</span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="h-2 w-16 bg-border rounded-full overflow-hidden">
                                     <div className={`h-full rounded-full ${
                                        badge === 'critical' ? 'bg-critical w-full' : 
                                        badge === 'warning' ? 'bg-warning w-2/3' : 'bg-success w-1/3'
                                     }`} />
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm font-body text-text-secondary">{patient.primary_diagnosis ?? "—"}</p>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`badge badge--${badge}`}>{statusLabel}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <Link href={`/patients/${patient.id}`}>
                                 <button className="p-2 rounded-xl hover:bg-surface-raised text-text-muted transition-colors">
                                    <MoreVertical size={18} />
                                 </button>
                               </Link>
                            </td>
                         </tr>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </Card>
        </BentoGridItem>

        {/* 2. Acuity Distribution - Wide (8 cols) */}
        <BentoGridItem span={8}>
          <Card className="h-full">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-primary/20 text-primary-deep shadow-sm">
                   <Activity size={20} />
                </div>
                <h3 className="font-display font-bold text-text-primary text-xl">Unit Acuity Distribution</h3>
             </div>
             
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AcuityMetric icon={<AlertTriangle className="text-critical" />} label="Critical" value={String(criticalCount)} color="bg-critical/10" />
                <AcuityMetric icon={<Activity className="text-amber-600" />} label="Moderate" value={String(warningCount)} color="bg-warning/10" />
                <AcuityMetric icon={<Thermometer className="text-secondary" />} label="Stable" value={String(stableCount)} color="bg-secondary/10" />
                <AcuityMetric icon={<ShieldPlus className="text-success" />} label="Safe" value={String(safeCount)} color="bg-success/10" />
             </div>
             
             <div className="mt-8 flex items-end gap-2 h-32">
                <Bar height="h-full" label="Critical" color="bg-critical" />
                <Bar height="h-2/3" label="Mod" color="bg-warning" />
                <Bar height="h-1/2" label="Stable" color="bg-secondary" />
                <Bar height="h-1/3" label="Safe" color="bg-success" />
             </div>
          </Card>
        </BentoGridItem>

        {/* 3. Real-time Highlights - Med (4 cols) */}
        <BentoGridItem span={4}>
           <Card className="h-full bg-primary-deep text-white shadow-primary/20">
              <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
                 <Wind size={20} />
                 Unit Snapshot
              </h3>
              <div className="space-y-6">
                 <div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Total Assigned</p>
                    <p className="text-3xl font-extrabold tracking-tight">{patients.length} <span className="text-sm font-normal text-white/70">patients</span></p>
                 </div>
                 <div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Missed Medications</p>
                    <p className="text-3xl font-extrabold tracking-tight">0 <span className="text-sm font-normal text-white/70">this shift</span></p>
                 </div>
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-sm font-body italic">&quot;Unit B is currently at 85% capacity. Predicted turnover: 2 patients in 4 hours.&quot;</p>
                  </div>
              </div>
           </Card>
        </BentoGridItem>

      </BentoGrid>
    </div>
  );
};

const AcuityMetric = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className={`p-4 rounded-2xl ${color} flex flex-col gap-2`}>
     {icon}
     <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-extrabold text-text-primary">{value}</p>
     </div>
  </div>
);

const Bar = ({ height, label, color }: { height: string, label: string, color: string }) => (
  <div className="flex-grow flex flex-col items-center gap-2">
     <div className={`w-full ${height} ${color} rounded-t-xl opacity-80 hover:opacity-100 transition-opacity`} />
     <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">{label}</span>
  </div>
);

export default PatientsPage;
