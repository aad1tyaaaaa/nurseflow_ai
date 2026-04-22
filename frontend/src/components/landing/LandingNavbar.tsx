"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

export const LandingNavbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 w-full px-6 py-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 group">
          <motion.div 
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xl shadow-primary/10 border border-border transition-transform group-hover:scale-110 overflow-hidden"
          >
            <Image 
              src="/logo.png" 
              alt="NurseFlow Logo" 
              width={128} 
              height={128} 
              quality={100}
              className="object-contain w-full h-full"
            />
          </motion.div>
          <span className="font-display text-xl font-black tracking-tight text-text-primary">
            NurseFlow <span className="text-primary-deep italic">AI</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          <LandingNavLink href="#features" label="Features" />
          <LandingNavLink href="#about" label="About" />
          <LandingNavLink href="#testimonials" label="Impact" />
        </div>

        {/* Auth CTA */}
        <div className="flex items-center gap-4">
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 rounded-2xl text-text-primary font-bold hover:bg-surface-raised transition-all text-sm"
            >
              Portal Login
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary-deep text-white font-bold px-8 py-3 rounded-2xl shadow-xl shadow-primary-deep/10 hover:translate-y-[-2px] transition-all text-sm"
            >
              Start Your Shift
            </motion.button>
          </Link>
          <button className="md:hidden text-text-primary">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

const LandingNavLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="font-body text-sm font-bold text-text-secondary hover:text-primary-deep transition-colors tracking-wide"
  >
    {label}
  </Link>
);
