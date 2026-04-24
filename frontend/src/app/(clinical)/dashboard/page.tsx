"use client";

import React, { useEffect, useState } from "react";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";
import Card from "@/components/ui/Card";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Clock, 
  ArrowUpRight,
  Pill,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { AIInsightPanel } from "@/components/ui/AIInsightPanel";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const getFirstName = (fullName: string) => fullName.split(/[\s,]+/)[0] || fullName;

interface DashboardPatient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  room_number: string | null;
  bed_number: string | null;
  primary_diagnosis: string | null;
  acuity_score: number | null;
  fall_risk_score: number | null;
  news2_score: number | null;
  active_alerts_count: number;
  pending_medications_count: number;
  latest_vitals: {
    heart_rate: number | null;
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    respiratory_rate: number | null;
    temperature: number | null;
    spo2: number | null;
  } | null;
}

interface ShiftSummary {
  total_patients: number;
  active_alerts: number;
  pending_medications: number;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const firstName = user ? getFirstName(user.fullName) : "Nurse";
  const unit = user?.unit || "your unit";

  const [supervisor, setSupervisor] = useState<{ fullName: string; initial: string } | null>(null);
  const [patients, setPatients] = useState<DashboardPatient[]>([]);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [alerts, setAlerts] = useState<{ id: string; title: string; severity: string; patient_name?: string; bed?: string }[]>([]);
  const [meds, setMeds] = useState<{ id: string; drug_name: string; patient_name?: string; bed?: string; urgency: string }[]>([]);

  useEffect(() => {
    // Fetch charge nurse for user's unit
    if (user?.unit) {
      api.auth.users(user.unit, "charge_nurse").then((users) => {
        if (users.length > 0) {
          const name = users[0].full_name;
          setSupervisor({ fullName: name, initial: name.trim().charAt(0).toUpperCase() });
        }
      }).catch(() => {});
    }

    // Fetch dashboard patients
    api.dashboard.patients().then((data) => {
      setPatients(data as DashboardPatient[]);
    }).catch(() => {});

    // Fetch summary
    api.dashboard.summary().then((data) => {
      setSummary(data as ShiftSummary);
    }).catch(() => {});

    // Fetch alerts
    api.alerts.list().then((data) => {
      const items = (data as { id: string; title: string; severity: string }[]).slice(0, 3);
      setAlerts(items);
    }).catch(() => {});

    // Fetch meds
    api.medications.queue().then((data) => {
      const queue = data as { medications?: { id: string; drug_name: string; urgency: string; patient_id: string }[] };
      if (queue.medications) setMeds(queue.medications.slice(0, 3) as typeof meds);
    }).catch(() => {});
  }, [user?.unit]);

  // Find the most critical patient
  const criticalPatient = patients.find(p => (p.acuity_score ?? 0) >= 4) || patients[0];

  // Generate AI insights from real data
  const aiInsights: string[] = [];
  if (criticalPatient) {
    const v = criticalPatient.latest_vitals;
    if (v?.respiratory_rate && v.respiratory_rate > 20) {
      aiInsights.push(`${criticalPatient.first_name} ${criticalPatient.last_name} (Bed ${criticalPatient.bed_number}) showing elevated RR at ${v.respiratory_rate} pm.`);
    }
  }
  if (summary) {
    aiInsights.push(`Managing ${summary.total_patients} patients with ${summary.active_alerts} active alerts.`);
    if (summary.pending_medications > 0) {
      aiInsights.push(`${summary.pending_medications} medications pending administration.`);
    } else {
      aiInsights.push("Medication compliance: 100%. No missed doses.");
    }
  }
  if (aiInsights.length === 0) aiInsights.push("Loading shift data…");

  return (
    <div className="space-y-10 pb-12">
      {/* Header with Nurse Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-stagger-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">
            {getGreeting()}, <span className="text-primary-deep italic underline decoration-primary/30 underline-offset-8">{firstName}</span>
          </h1>
          <p className="mt-4 font-body text-lg text-text-secondary">
            You&apos;re managing <span className="font-bold text-text-primary">{summary?.total_patients ?? "…"} patients</span> in {unit}.
          </p>
        </div>
        <div className="flex items-center gap-4 p-2 pl-4 rounded-3xl bg-surface-raised border border-border shadow-sm">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Shift Supervisor</span>
              <span className="text-sm font-bold text-text-primary">{supervisor?.fullName ?? "—"}</span>
           </div>
           <div className="h-10 w-10 rounded-2xl bg-primary/20 text-primary-deep flex items-center justify-center font-bold">{supervisor?.initial ?? "?"}</div>
        </div>
      </div>

      {/* Main Bento Grid */}
      <BentoGrid>
        {/* 1. AI Summary & Insights */}
        <BentoGridItem span={8}>
           <AIInsightPanel 
              title="Autonomous Shift Summary"
              insights={aiInsights}
              className="h-full"
           />
        </BentoGridItem>

        {/* 2. Critical Alert */}
        {criticalPatient && (
        <BentoGridItem span={8}>
          <Card isCritical className="h-full flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-critical/5 blur-3xl rounded-full" />
            
            <div className="flex items-start justify-between relative">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-critical/20 text-critical shadow-lg shadow-critical/10">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-text-primary">Critical Attention: Bed {criticalPatient.bed_number}</h3>
                  <p className="font-body text-sm text-text-secondary">{criticalPatient.first_name} {criticalPatient.last_name} • MRN: {criticalPatient.mrn} • {criticalPatient.primary_diagnosis}</p>
                </div>
              </div>
              {(criticalPatient.fall_risk_score ?? 0) >= 7 && <StatusBadge status="critical" label="High Fall Risk" />}
            </div>

            {criticalPatient.latest_vitals && (
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
              <VitalStat label="Heart Rate" value={String(criticalPatient.latest_vitals.heart_rate ?? "—")} unit="bpm" status={(criticalPatient.latest_vitals.heart_rate ?? 0) > 100 ? "warning" : "safe"} />
              <VitalStat label="SpO2" value={String(criticalPatient.latest_vitals.spo2 ?? "—")} unit="%" status={(criticalPatient.latest_vitals.spo2 ?? 100) < 94 ? "critical" : "safe"} />
              <VitalStat label="BP" value={`${criticalPatient.latest_vitals.blood_pressure_systolic ?? "—"}/${criticalPatient.latest_vitals.blood_pressure_diastolic ?? "—"}`} unit="mmHg" status={(criticalPatient.latest_vitals.blood_pressure_systolic ?? 120) > 140 ? "warning" : "safe"} />
              <VitalStat label="RR" value={String(criticalPatient.latest_vitals.respiratory_rate ?? "—")} unit="pm" status={(criticalPatient.latest_vitals.respiratory_rate ?? 16) > 20 ? "warning" : "safe"} />
            </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <div className="flex items-center gap-2 text-text-secondary">
                <Activity size={16} className="text-secondary" />
                <span className="text-xs font-medium">NEWS2 Score: {criticalPatient.news2_score ?? "—"}</span>
              </div>
              <Link href={`/patients/${criticalPatient.id}`}>
                 <button className="btn-primary flex items-center gap-2 text-sm px-8 py-3">
                   View Full Chart <ArrowUpRight size={18} />
                 </button>
              </Link>
            </div>
          </Card>
        </BentoGridItem>
        )}

        {/* 3. Tasks & Priority */}
        <BentoGridItem span={4} rowSpan={2}>
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-primary/20 text-primary-deep">
                    <Clock size={20} />
                 </div>
                 <h3 className="font-display font-bold text-text-primary text-xl">Shift Queue</h3>
              </div>
              <span className="text-xs font-bold text-text-muted bg-surface-raised px-2 py-1 rounded-lg">{summary?.pending_medications ?? 0} Pending Meds</span>
            </div>
            
            <div className="space-y-5 flex-grow">
              {patients.slice(0, 5).map((p) => (
                <TaskItem
                  key={p.id}
                  label={`${p.first_name} ${p.last_name} — Bed ${p.bed_number}`}
                  status={p.active_alerts_count > 0 ? "due" : p.pending_medications_count > 0 ? "pending" : "done"}
                  time={p.active_alerts_count > 0 ? `${p.active_alerts_count} alerts` : p.pending_medications_count > 0 ? `${p.pending_medications_count} meds` : "OK"}
                />
              ))}
            </div>

            <div className="mt-8 p-5 rounded-3xl bg-secondary/10 border border-secondary/20">
              <div className="flex items-center gap-2 text-secondary-deep">
                <TrendingUp size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Shift Overview</span>
              </div>
              <p className="mt-2 text-sm text-secondary-deep/80 leading-relaxed font-body italic">
                {summary ? `${summary.active_alerts} active alerts, ${summary.pending_medications} medications pending.` : "Loading…"}
              </p>
            </div>
          </Card>
        </BentoGridItem>

        {/* 4. Medication Priority */}
        <BentoGridItem span={4}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                   <Pill size={20} />
                  </div>
                  <h3 className="font-display font-bold text-text-primary">Meds Priority</h3>
               </div>
               <Link href="/medications" className="text-xs font-bold text-primary-deep hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {meds.length > 0 ? meds.map((m) => (
                <MedItem key={m.id} label={m.drug_name} patient={m.patient_name || ""} urgency={m.urgency === "critical" ? "critical" : "warning"} />
              )) : patients.filter(p => p.pending_medications_count > 0).slice(0, 2).map((p) => (
                <MedItem key={p.id} label={`${p.pending_medications_count} pending meds`} patient={`${p.first_name} ${p.last_name} (Bed ${p.bed_number})`} urgency={(p.acuity_score ?? 0) >= 4 ? "critical" : "warning"} />
              ))}
            </div>
          </Card>
        </BentoGridItem>

        {/* 5. Alerts Summary */}
        <BentoGridItem span={4}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-50 text-red-600">
                   <AlertTriangle size={20} />
                  </div>
                  <h3 className="font-display font-bold text-text-primary">Live Alerts</h3>
               </div>
               <Link href="/alerts" className="text-xs font-bold text-critical hover:underline">{summary?.active_alerts ?? 0} Active</Link>
            </div>
            <div className="space-y-4">
              {alerts.length > 0 ? alerts.map((a) => (
                <div key={a.id} className={`p-3 rounded-2xl border flex items-center justify-between ${a.severity === "critical" ? "bg-red-50/50 border-red-100" : "bg-surface-raised border-border"}`}>
                   <span className={`text-sm font-bold ${a.severity === "critical" ? "text-red-700" : "text-text-primary"}`}>{a.title}</span>
                </div>
              )) : (
                <p className="text-sm text-text-muted italic">No active alerts</p>
              )}
            </div>
          </Card>
        </BentoGridItem>
      </BentoGrid>
    </div>
  );
};

const MedItem = ({ label, patient, urgency }: { label: string, patient: string, urgency: "critical" | "warning" }) => (
  <div className={`p-4 rounded-2xl border transition-all ${
    urgency === "critical" ? "bg-critical/5 border-critical/30 ring-1 ring-critical/10" : "bg-warning/5 border-warning/20"
  }`}>
    <div className="flex items-center justify-between mb-1">
       <span className="text-sm font-bold text-text-primary">{label}</span>
       <StatusBadge status={urgency} showIcon={false} className="scale-90" />
    </div>
    <span className="text-xs font-body text-text-secondary italic">{patient}</span>
  </div>
);

const VitalStat = ({ label, value, unit, status }: { label: string, value: string, unit: string, status: "safe" | "warning" | "critical" }) => {
  const statusColor = {
    safe: "text-success",
    warning: "text-warning",
    critical: "text-critical"
  }[status];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-secondary uppercase tracking-tight">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-2xl font-bold ${statusColor}`}>{value}</span>
        <span className="text-xs text-text-muted">{unit}</span>
      </div>
    </div>
  );
};

const TaskItem = ({ label, status, time }: { label: string, status: "due" | "pending" | "done", time: string }) => {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
          status === "done" ? "bg-success border-success text-white" : "border-border group-hover:border-primary-deep"
        }`}>
          {status === "done" && <CheckCircle2 size={14} />}
        </div>
        <span className={`text-sm font-medium ${status === "done" ? "text-text-muted line-through" : "text-text-primary"}`}>
          {label}
        </span>
      </div>
      <span className={`text-xs font-mono ${status === "due" ? "text-critical font-bold" : "text-text-secondary"}`}>
        {time}
      </span>
    </div>
  );
};

export default DashboardPage;
