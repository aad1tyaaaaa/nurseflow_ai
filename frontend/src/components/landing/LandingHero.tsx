"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";
import Link from "next/link";

export const LandingHero = () => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-6">
      <div className="relative max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border text-text-primary text-sm font-bold mb-8 shadow-sm"
        >
          <Sparkles size={16} className="text-primary-deep" />
          <span>The world&apos;s first AI Clinical Co-pilot</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-5xl md:text-8xl font-black text-text-primary leading-[1.05] tracking-tight mb-8"
        >
          Empowering nurses, <br />
          <span className="text-primary-deep drop-shadow-[0_0_15px_rgba(255,180,180,0.3)]">saving lives</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-text-secondary font-body max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Streamline your shift with intelligent SBAR generation, predictive fall risks, and a dynamic medication queue.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05, translateY: -4 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary-deep text-white font-extrabold px-10 py-5 rounded-[24px] text-lg shadow-xl shadow-primary-deep/20 transition-all flex items-center gap-2 group"
            >
              Start Your Shift
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
            </motion.button>
          </Link>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDemoOpen(true)}
            className="bg-white border border-border text-text-primary font-bold px-10 py-5 rounded-[24px] text-lg hover:bg-surface-raised transition-all shadow-sm"
          >
            Watch Demo
          </motion.button>
        </motion.div>
      </div>

      {isDemoOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
          <div className="w-full max-w-2xl rounded-[2rem] border border-border bg-white shadow-2xl p-8 text-left relative">
            <button
              onClick={() => setIsDemoOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl hover:bg-surface-raised transition-colors text-text-muted"
              aria-label="Close demo"
            >
              <X size={18} />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary-deep text-xs font-bold mb-4">
              <Sparkles size={14} /> Product Walkthrough
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight text-text-primary mb-4">
              See the shift flow in under a minute
            </h3>
            <div className="space-y-3 text-sm text-text-secondary font-body leading-relaxed">
              <p>• Capture bedside notes with voice documentation and structured NLP.</p>
              <p>• Prioritize medication administration with AI-assisted urgency sorting.</p>
              <p>• Generate polished SBAR handoffs for faster, safer transitions of care.</p>
              <p>• Monitor fall risk and unit alerts from one clinical command dashboard.</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-deep text-white font-bold">
                Launch Demo Workspace <ArrowRight size={16} />
              </Link>
              <Link href="#features" onClick={() => setIsDemoOpen(false)} className="inline-flex items-center justify-center px-6 py-3 rounded-2xl border border-border text-text-primary font-bold hover:bg-surface-raised transition-colors">
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/20 blur-[150px] rounded-full z-15 pointer-events-none" />
    </section>
  );
};
