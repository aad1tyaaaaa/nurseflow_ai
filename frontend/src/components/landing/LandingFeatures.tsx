"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clipboard, Pill, AlertTriangle, ShieldCheck, Zap, Mic } from "lucide-react";

const features = [
  {
    title: "AI SBAR Handoff",
    description: "Generate structured, clinical handoff summaries in seconds using bedside data and voice notes.",
    icon: <Image src="/icons/lungs.svg" alt="Lungs Analysis" width={32} height={32} className="opacity-80" />,
    color: "bg-secondary/10",
    size: "md:col-span-8",
  },
  {
    title: "Medication Queue",
    description: "Real-time triage rankings based on clinical urgency.",
    icon: <Pill className="text-primary" size={24} />,
    color: "bg-primary/10",
    size: "md:col-span-4",
  },
  {
    title: "Predictive Fall Risk",
    description: "Computer vision and mobility analytics to prevent patient injuries before they happen.",
    icon: <AlertTriangle className="text-warning" size={24} />,
    color: "bg-warning/10",
    size: "md:col-span-4",
  },
  {
    title: "Voice Docs",
    description: "Hands-free clinical documentation with smart NLP parsing.",
    icon: <Mic className="text-accent" size={24} />,
    color: "bg-accent/10",
    size: "md:col-span-4",
  },
  {
    title: "Clinical Safety",
    description: "HIPAA compliant, EHR-integrated, and clinically validated co-pilot.",
    icon: <ShieldCheck className="text-success" size={24} />,
    color: "bg-success/10",
    size: "md:col-span-4",
  },
];

export const LandingFeatures = () => {
  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-text-primary mb-4"
        >
          Designed for the <span className="text-primary-deep">modern nurse</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-text-secondary text-lg max-w-2xl mx-auto"
        >
          Everything you need to manage your shift with precision and focus, all in one intelligent interface.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`clay-card p-8 flex flex-col justify-between ${feature.size} group active:scale-[0.98] transition-transform`}
          >
            <div>
              <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-3">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed font-body">{feature.description}</p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Learn more</span>
              <Zap size={14} className="text-primary-deep" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
