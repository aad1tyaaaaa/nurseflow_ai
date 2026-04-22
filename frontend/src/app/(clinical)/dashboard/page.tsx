"use client";

import React from "react";
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

const DashboardPage = () => {
  return (
    <div className="space-y-10 pb-12">
      {/* Header with Nurse Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-stagger-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">
            Good afternoon, <span className="text-primary-deep italic underline decoration-primary/30 underline-offset-8">Priya</span>
          </h1>
          <p className="mt-4 font-body text-lg text-text-secondary">
            You&apos;re managing <span className="font-bold text-text-primary">8 patients</span> in ICU Unit B. Shift ends in 4h 20m.
          </p>
        </div>
        <div className="flex items-center gap-4 p-2 pl-4 rounded-3xl bg-surface-raised border border-border shadow-sm">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Shift Supervisor</span>
              <span className="text-sm font-bold text-text-primary">Marcus Davids, RN</span>
           </div>
           <div className="h-10 w-10 rounded-2xl bg-primary/20 text-primary-deep flex items-center justify-center font-bold">M</div>
        </div>
      </div>

      {/* Main Bento Grid */}
      <BentoGrid>
        {/* 1. AI Summary & Insights - Wide (8 cols) */}
        <BentoGridItem span={8}>
           <AIInsightPanel 
              title="Autonomous Shift Summary"
              insights={[
                "Robert Miller (Bed 7) showing signs of respiratory distress; RR increased from 18 to 24 pm.",
                "Medication compliance: 100%. No missed doses logged in the last 4 hours.",
                "Unit capacity at 85%. Next scheduled intake at 16:30 (Bed 14)."
              ]}
              className="h-full"
           />
        </BentoGridItem>

        {/* 2. Critical Alert - Wide (8 cols) */}
        <BentoGridItem span={8}>
          <Card isCritical className="h-full flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-critical/5 blur-3xl rounded-full" />
            
            <div className="flex items-start justify-between relative">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-critical/20 text-critical shadow-lg shadow-critical/10">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-text-primary">Critical Attention: Bed 7</h3>
                  <p className="font-body text-sm text-text-secondary">Robert Miller • MRN: 482-991 • COPD Exacerbation</p>
                </div>
              </div>
              <StatusBadge status="critical" label="High Fall Risk" />
            </div>

            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
              <VitalStat label="Heart Rate" value="112" unit="bpm" status="warning" />
              <VitalStat label="SpO2" value="92" unit="%" status="critical" />
              <VitalStat label="BP" value="142/91" unit="mmHg" status="warning" />
              <VitalStat label="RR" value="24" unit="pm" status="warning" />
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <div className="flex items-center gap-2 text-text-secondary">
                <Activity size={16} className="text-secondary" />
                <span className="text-xs font-medium">Real-time vital frequency: 1s polling active</span>
              </div>
              <Link href="/patients/7">
                 <button className="btn-primary flex items-center gap-2 text-sm px-8 py-3">
                   View Full Chart <ArrowUpRight size={18} />
                 </button>
              </Link>
            </div>
          </Card>
        </BentoGridItem>

        {/* 3. Tasks & Priority - Tall (4 cols) */}
        <BentoGridItem span={4} rowSpan={2}>
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-primary/20 text-primary-deep">
                    <Clock size={20} />
                 </div>
                 <h3 className="font-display font-bold text-text-primary text-xl">Shift Queue</h3>
              </div>
              <span className="text-xs font-bold text-text-muted bg-surface-raised px-2 py-1 rounded-lg">4 Pending</span>
            </div>
            
            <div className="space-y-5 flex-grow">
              <TaskItem label="14:00 Med Rounds" status="due" time="Due Now" />
              <TaskItem label="Bed 4 Fluid Check" status="pending" time="14:15" />
              <TaskItem label="Bed 9 Handoff Draft" status="pending" time="14:30" />
              <TaskItem label="Vitals Round Unit B" status="done" time="Completed" />
              <TaskItem label="Patient Discharge: Bed 12" status="pending" time="15:00" />
            </div>

            <div className="mt-8 p-5 rounded-3xl bg-secondary/10 border border-secondary/20">
              <div className="flex items-center gap-2 text-secondary-deep">
                <TrendingUp size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Productivity AI</span>
              </div>
              <p className="mt-2 text-sm text-secondary-deep/80 leading-relaxed font-body italic">
                &quot;You&apos;re tracking 15% faster than average today. Recommended break: 15:45.&quot;
              </p>
            </div>
          </Card>
        </BentoGridItem>

        {/* 4. Medication Priority - Med (4 cols) */}
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
              <MedItem label="Insulin Aspart" patient="Miller, R. (Bed 7)" urgency="critical" />
              <MedItem label="Heparin Infusion" patient="Chen, S. (Bed 3)" urgency="warning" />
            </div>
          </Card>
        </BentoGridItem>

        {/* 5. Alerts Summary - Med (4 cols) */}
        <BentoGridItem span={4}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-50 text-red-600">
                   <AlertTriangle size={20} />
                  </div>
                  <h3 className="font-display font-bold text-text-primary">Live Alerts</h3>
               </div>
               <Link href="/alerts" className="text-xs font-bold text-critical hover:underline">1 Critical</Link>
            </div>
            <div className="space-y-4">
               <div className="p-3 rounded-2xl bg-red-50/50 border border-red-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-red-700">Fall Risk Triggered</span>
                  <span className="text-xs font-mono text-red-600">Bed 5</span>
               </div>
               <div className="p-3 rounded-2xl bg-surface-raised border border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">Vitals Anomaly</span>
                  <span className="text-xs font-mono text-text-muted">Bed 2</span>
               </div>
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
