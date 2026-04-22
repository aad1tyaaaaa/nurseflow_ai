"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Pill, 
  ShieldAlert, 
  Activity, 
  Search, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  Sparkles
} from "lucide-react";
import Card from "@/components/ui/Card";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Alert {
  id: number;
  type: string;
  patient: string;
  bed: string;
  title: string;
  detail: string;
  time: string;
  priority: "safe" | "warning" | "critical";
  status: string;
}

const alerts: Alert[] = [
  { id: 1, type: "vitals", patient: "Robert Miller", bed: "Bed 7", title: "Critical SpO2 Drop", detail: "Oxygen saturation dropped to 82% over 3 minutes. Automated O2 adjustment failed.", time: "2m ago", priority: "critical", status: "unresolved" },
  { id: 2, type: "fall", patient: "Michael Scott", bed: "Bed 9", title: "Bed Exit Alarm", detail: "Unassigned bed exit protocol triggered. Vision-AI detected patient attempting to stand.", time: "8m ago", priority: "critical", status: "unresolved" },
  { id: 3, type: "meds", patient: "Sarah Chen", bed: "Bed 3", title: "Pending Insulin Dose", detail: "High priority Insulin Aspart dose due in 15 minutes. Pre-check vitals required.", time: "12m ago", priority: "warning", status: "unresolved" },
  { id: 4, type: "vitals", patient: "James Wilson", bed: "Bed 12", title: "HR Anomaly Detected", detail: "Sustained Tachycardia (105 bpm) noted over the last 15 minutes. Patient resting.", time: "25m ago", priority: "warning", status: "unresolved" },
  { id: 5, type: "meds", patient: "David Goggins", bed: "Bed 2", title: "Medication Administered", detail: "40mg Furosemide administered successfully. Tracking therapeutic response.", time: "1h ago", priority: "safe", status: "resolved" },
];

const AlertsPage = () => {
  const [filter, setFilter] = useState<string>("all");

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-stagger-up">
        <div>
           <h1 className="text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
             Unit <span className="text-primary-deep italic">Command</span> Alerts
             <Bell className="text-primary-deep" size={28} />
           </h1>
           <p className="mt-2 font-body text-text-secondary">
             Centralized real-time notification stream for all assigned clinical activities.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-6 py-2.5 rounded-2xl border border-border bg-white text-text-secondary font-bold text-sm hover:bg-surface-raised transition-all">
              <CheckCircle2 size={18} />
              Resolve All
           </button>
           <button className="h-12 px-8 rounded-2xl bg-primary text-text-primary font-bold text-sm shadow-lg shadow-primary/10 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">Alert History</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
         <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
               type="text" 
               placeholder="Search alerts by patient or type..." 
               className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-body text-sm"
            />
         </div>
         <div className="flex bg-surface-raised p-1 rounded-2xl border border-border">
            {['all', 'critical', 'warning', 'resolved'].map((f) => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                   filter === f ? "bg-white text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
                 }`}
               >
                  {f}
               </button>
            ))}
         </div>
      </div>

      <BentoGrid>
         {/* 1. Live Notification Feed - Wide (8 cols) */}
         <BentoGridItem span={8}>
            <Card className="h-full p-0 flex flex-col">
               <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
                  <h3 className="font-display font-bold text-text-primary text-xl flex items-center gap-2">
                     <Bell size={20} className="text-primary-deep" />
                     Live Activity Stream
                  </h3>
                  <div className="flex items-center gap-2">
                     <span className="flex h-2 w-2 rounded-full bg-critical animate-pulse" />
                     <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest transition-all">2 New Criticals</span>
                  </div>
               </div>
               
               <div className="p-6 space-y-4 flex-grow overflow-y-auto max-h-[700px] custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                     {alerts
                        .filter(a => filter === 'all' || a.priority === filter || (filter === 'resolved' && a.status === 'resolved'))
                        .map((alert) => (
                        <motion.div
                           key={alert.id}
                           layout
                           initial={{ opacity: 0, y: 5 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.98 }}
                           className={`group relative overflow-hidden p-6 rounded-3xl border bg-bg transition-all hover:shadow-xl hover:shadow-primary/5 ${
                              alert.priority === 'critical' ? 'border-critical/30 ring-1 ring-critical/5' : 'border-border'
                           }`}
                        >
                           <div className="flex items-start justify-between gap-6">
                              <div className="flex gap-4 flex-grow">
                                 <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                    alert.type === 'vitals' ? 'bg-indigo-50 text-indigo-600' : 
                                    alert.type === 'fall' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                 }`}>
                                    {alert.type === 'vitals' && <Activity size={28} />}
                                    {alert.type === 'fall' && <ShieldAlert size={28} />}
                                    {alert.type === 'meds' && <Pill size={28} />}
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-3 mb-1">
                                       <h3 className="font-display font-bold text-text-primary text-lg leading-tight transition-colors group-hover:text-primary-deep">{alert.title}</h3>
                                       <StatusBadge status={alert.priority as "safe" | "warning" | "critical"} />
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                       <span className="text-sm font-bold text-text-primary">{alert.patient}</span>
                                       <span className="text-xs text-text-muted font-mono bg-surface px-2 py-0.5 rounded-lg border border-border">{alert.bed}</span>
                                       <span className="text-[10px] text-text-muted flex items-center gap-1 font-body uppercase tracking-wider">
                                          <Clock size={12} />
                                          {alert.time}
                                       </span>
                                    </div>
                                    <p className="text-sm text-text-secondary font-body leading-relaxed max-w-2xl">{alert.detail}</p>
                                 </div>
                              </div>
                              
                              <div className="flex flex-col gap-2 items-end">
                                 {alert.status === 'resolved' ? (
                                    <div className="flex items-center gap-2 text-success font-bold text-[10px] uppercase tracking-widest bg-success/10 px-3 py-1.5 rounded-xl border border-success/20">
                                       <CheckCircle2 size={14} />
                                       Resolved
                                    </div>
                                 ) : (
                                    <button className="h-10 px-6 rounded-xl bg-primary text-text-primary font-bold text-xs shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all whitespace-nowrap">
                                       Acknowledge
                                    </button>
                                 )}
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

         {/* 2. Stats & Analytics - Med (4 cols) */}
         <BentoGridItem span={4}>
            <div className="flex flex-col gap-6 h-full">
               <Card className="bg-primary-deep text-white border-0 shadow-xl shadow-primary-deep/20 p-8 relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-[-10%] right-[-10%] opacity-10 rotate-12 transition-transform hover:scale-110 duration-1000"><Bell size={120} /></div>
                  <div className="flex items-center justify-between mb-8 relative z-10">
                     <h3 className="font-display font-bold text-xl">Command Stats</h3>
                     <Sparkles size={20} className="text-white/40" />
                  </div>
                  
                  <div className="space-y-8 relative z-10">
                     <StatItem label="Response Time" value="4.2m" trend="-12%" isGood />
                     <StatItem label="Active Crit. Cases" value="2" subValue="Beds 7, 9" />
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/20 relative z-10">
                     <p className="text-[11px] font-body italic opacity-80 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                       &quot;AI prediction: Alert clustering in Unit B requires supervisor presence.&quot;
                     </p>
                  </div>
               </Card>

               <Card className="flex-grow bg-white">
                  <h3 className="font-display font-bold text-text-primary text-lg mb-6 flex items-center gap-2">
                     <Activity size={18} className="text-primary-deep" />
                     Distribution
                  </h3>
                  <div className="space-y-6">
                     <CategoryProgress label="Critical Vitals" value={65} color="bg-indigo-500" />
                     <CategoryProgress label="Medication Alarms" value={25} color="bg-amber-500" />
                     <CategoryProgress label="Fall Prevention" value={10} color="bg-red-500" />
                  </div>
               </Card>
            </div>
         </BentoGridItem>
      </BentoGrid>
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: string;
  trend?: string;
  isGood?: boolean;
  subValue?: string;
}

const StatItem = ({ label, value, trend, isGood, subValue }: StatItemProps) => (
  <div>
     <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">{label}</p>
     <div className="flex items-baseline gap-3">
        <span className="text-3xl font-extrabold tracking-tight">{value}</span>
        {trend && (
           <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isGood ? 'bg-success/20 text-emerald-300' : 'bg-critical/20 text-red-300'}`}>
              {trend}
           </span>
        )}
     </div>
     {subValue && <p className="text-xs text-white/50 font-body mt-1">{subValue}</p>}
  </div>
);

interface CategoryProgressProps {
  label: string;
  value: number;
  color: string;
}

const CategoryProgress = ({ label, value, color }: CategoryProgressProps) => (
  <div className="space-y-2">
     <div className="flex justify-between text-xs font-bold text-text-muted">
        <span>{label}</span>
        <span>{value}%</span>
     </div>
     <div className="h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
        <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${value}%` }}
           className={`h-full ${color}`} 
        />
     </div>
  </div>
);

export default AlertsPage;
