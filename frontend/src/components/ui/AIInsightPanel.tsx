"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

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

      <div className="mt-5 flex justify-end">
        <button className="text-xs font-bold text-accent flex items-center gap-1.5 hover:gap-2 transition-all">
          View Detail Analysis <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
