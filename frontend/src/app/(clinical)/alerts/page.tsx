"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { api } from "@/lib/api";

interface Alert {
  id: string;
  alert_type: string;
  patient_id: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  created_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
}

function severityToPriority(severity: string): "safe" | "warning" | "critical" {
  if (severity === "critical" || severity === "urgent") return "critical";
  if (severity === "warning") return "warning";
  return "safe";
}

function alertTypeToCategory(type: string): string {
  if (type.includes("fall")) return "fall";
  if (type.includes("medication") || type.includes("med")) return "meds";
  return "vitals";
}

function timeAgo(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const AlertsPage = () => {
  const [filter, setFilter] = useState<string>("all");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadAlerts = useCallback(async () => {
    try {
      const data = await api.alerts.list();
      setAlerts(data as Alert[]);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.alerts.acknowledge(id);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "acknowledged", acknowledged_at: new Date().toISOString() } : a
        )
      );
    } catch (err) {
      console.error("Failed to acknowledge alert", err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.alerts.resolve(id, { resolution_notes: "Resolved by nurse" });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "resolved", resolved_at: new Date().toISOString() } : a
        )
      );
    } catch (err) {
      console.error("Failed to resolve alert", err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const priority = severityToPriority(a.severity);
    const isResolved = a.status === "resolved";
    const matchesFilter =
      filter === "all" ||
      (filter === "critical" && priority === "critical") ||
      (filter === "warning" && priority === "warning") ||
      (filter === "resolved" && isResolved);
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const criticalCount = alerts.filter(
    (a) => severityToPriority(a.severity) === "critical" && a.status !== "resolved"
  ).length;

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
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
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
                     {criticalCount > 0 && (
                       <>
                         <span className="flex h-2 w-2 rounded-full bg-critical animate-pulse" />
                         <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest transition-all">{criticalCount} New Critical{criticalCount > 1 ? "s" : ""}</span>
                       </>
                     )}
                  </div>
               </div>
               
               <div className="p-6 space-y-4 flex-grow overflow-y-auto max-h-[700px] custom-scrollbar">
                  {loading ? (
                    <div className="flex items-center justify-center py-20 text-text-muted font-body">Loading alerts...</div>
                  ) : filteredAlerts.length === 0 ? (
                    <div className="flex items-center justify-center py-20 text-text-muted font-body italic">No alerts found.</div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                       {filteredAlerts.map((alert) => {
                         const priority = severityToPriority(alert.severity);
                         const category = alertTypeToCategory(alert.alert_type);
                         const isResolved = alert.status === "resolved";
                         return (
                           <motion.div
                              key={alert.id}
                              layout
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              className={`group relative overflow-hidden p-6 rounded-3xl border bg-bg transition-all hover:shadow-xl hover:shadow-primary/5 ${
                                 priority === 'critical' ? 'border-critical/30 ring-1 ring-critical/5' : 'border-border'
                              }`}
                           >
                              <div className="flex items-start justify-between gap-6">
                                 <div className="flex gap-4 flex-grow">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                       category === 'vitals' ? 'bg-indigo-50 text-indigo-600' : 
                                       category === 'fall' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                       {category === 'vitals' && <Activity size={28} />}
                                       {category === 'fall' && <ShieldAlert size={28} />}
                                       {category === 'meds' && <Pill size={28} />}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-3 mb-1">
                                          <h3 className="font-display font-bold text-text-primary text-lg leading-tight transition-colors group-hover:text-primary-deep">{alert.title}</h3>
                                          <StatusBadge status={priority} />
                                       </div>
                                       <div className="flex items-center gap-3 mb-3">
                                          <span className="text-[10px] text-text-muted flex items-center gap-1 font-body uppercase tracking-wider">
                                             <Clock size={12} />
                                             {timeAgo(alert.created_at)}
                                          </span>
                                       </div>
                                       <p className="text-sm text-text-secondary font-body leading-relaxed max-w-2xl">{alert.message}</p>
                                    </div>
                                 </div>
                                 
                                 <div className="flex flex-col gap-2 items-end">
                                    {isResolved ? (
                                       <div className="flex items-center gap-2 text-success font-bold text-[10px] uppercase tracking-widest bg-success/10 px-3 py-1.5 rounded-xl border border-success/20">
                                          <CheckCircle2 size={14} />
                                          Resolved
                                       </div>
                                    ) : alert.status === "acknowledged" ? (
                                       <div className="flex flex-col gap-2 items-end">
                                          <div className="flex items-center gap-2 text-warning font-bold text-[10px] uppercase tracking-widest bg-warning/10 px-3 py-1.5 rounded-xl border border-warning/20">
                                             <CheckCircle2 size={14} />
                                             Acknowledged
                                          </div>
                                          <button
                                             onClick={() => handleResolve(alert.id)}
                                             className="h-9 px-5 rounded-xl bg-success/10 text-success font-bold text-xs border border-success/20 hover:bg-success/20 transition-all whitespace-nowrap"
                                          >
                                             Resolve
                                          </button>
                                       </div>
                                    ) : (
                                       <button
                                          onClick={() => handleAcknowledge(alert.id)}
                                          className="h-10 px-6 rounded-xl bg-primary text-text-primary font-bold text-xs shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all whitespace-nowrap"
                                       >
                                          Acknowledge
                                       </button>
                                    )}
                                    <button className="p-2 rounded-xl hover:bg-surface text-text-muted transition-colors transition-transform active:scale-90">
                                       <MoreVertical size={18} />
                                    </button>
                                 </div>
                              </div>
                           </motion.div>
                         );
                       })}
                    </AnimatePresence>
                  )}
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
                     <StatItem 
                       label="Active Crit. Cases" 
                       value={String(criticalCount)} 
                       subValue={`${alerts.filter(a => a.status !== "resolved").length} total active`} 
                     />
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
