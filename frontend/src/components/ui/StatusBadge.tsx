"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

type AcuityStatus = "safe" | "warning" | "critical";

interface StatusBadgeProps {
  status: AcuityStatus;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge = ({ 
  status, 
  label, 
  showIcon = true, 
  className = "" 
}: StatusBadgeProps) => {
  const configs = {
    safe: {
      color: "bg-success/10 text-emerald-700 ring-success/30",
      icon: <CheckCircle2 size={12} />,
      defaultLabel: "Safe",
      glow: ""
    },
    warning: {
      color: "bg-warning/10 text-amber-700 ring-warning/30",
      icon: <Info size={12} />,
      defaultLabel: "Warning",
      glow: ""
    },
    critical: {
      color: "bg-critical/10 text-critical ring-critical/30",
      icon: <AlertTriangle size={12} />,
      defaultLabel: "Critical",
      glow: "shadow-[0_0_12px_rgba(242,139,130,0.4)]"
    }
  };

  const current = configs[status];

  return (
    <motion.div
      initial={status === "critical" ? { scale: 0.95 } : {}}
      animate={status === "critical" ? { 
        scale: [1, 1.05, 1],
        transition: { repeat: Infinity, duration: 2 } 
      } : {}}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${current.color} ${current.glow} ${className}`}
    >
      {showIcon && current.icon}
      <span>{label || current.defaultLabel}</span>
    </motion.div>
  );
};
