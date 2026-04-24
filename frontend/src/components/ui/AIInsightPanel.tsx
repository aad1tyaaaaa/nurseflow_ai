"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ChevronUp } from "lucide-react";

interface AIInsightPanelProps {
  title: string;
  insights: string[];
  className?: string;
}

export const AIInsightPanel = ({ 
  title, 
  insights, 
  className = "" 
}: AIInsightPanelProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const summary = useMemo(() => {
    if (insights.length === 0) return "No insights available yet.";
    if (insights.length === 1) return insights[0];
    return `${insights.length} insight${insights.length === 1 ? "" : "s"} available. Top signal: ${insights[0]}`;
  }, [insights]);

  return (
    <div className={`p-5 rounded-3xl bg-accent/5 border border-accent/20 relative overflow-hidden group ${className}`}>
      {/* Decorative Lavender Glow */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/10 blur-3xl rounded-full" />
      
      <div className="relative flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
          <Sparkles size={16} />
        </div>
        <h3 className="font-display font-bold text-text-primary">{title}</h3>
      </div>

      <ul className="space-y-3 relative">
        {insights.map((insight, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-2xl bg-white/50 border border-white/50 hover:border-accent/30 transition-all font-body text-sm text-text-secondary leading-relaxed"
          >
            <div className="mt-1 flex-shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            </div>
            {insight}
          </motion.li>
        ))}
      </ul>

      {showDetails && (
        <div className="mt-5 rounded-2xl border border-accent/20 bg-white/70 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-2">Detail analysis</p>
          <p className="text-sm text-text-secondary font-body leading-relaxed mb-3">{summary}</p>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={`${insight}-${index}`} className="flex gap-2 text-sm text-text-secondary font-body">
                <span className="text-accent font-bold">{index + 1}.</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={() => setShowDetails((prev) => !prev)}
          className="text-xs font-bold text-accent flex items-center gap-1.5 hover:gap-2 transition-all"
        >
          {showDetails ? "Hide Detail Analysis" : "View Detail Analysis"}
          {showDetails ? <ChevronUp size={14} /> : <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  );
};
