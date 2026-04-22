"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export const LandingHero = () => {
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
            className="bg-white border border-border text-text-primary font-bold px-10 py-5 rounded-[24px] text-lg hover:bg-surface-raised transition-all shadow-sm"
          >
            Watch Demo
          </motion.button>
        </motion.div>
      </div>

      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/20 blur-[150px] rounded-full z-15 pointer-events-none" />
    </section>
  );
};
