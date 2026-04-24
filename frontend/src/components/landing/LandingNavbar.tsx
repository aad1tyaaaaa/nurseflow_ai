"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export const LandingNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#about", label: "About" },
    { href: "#impact", label: "Impact" },
  ];

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
          {navLinks.map((link) => (
            <LandingNavLink key={link.href} href={link.href} label={link.label} />
          ))}
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
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden text-text-primary p-2 rounded-xl hover:bg-white/70 transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 mx-auto max-w-7xl rounded-3xl border border-border bg-white/95 backdrop-blur-md shadow-xl p-4">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-2xl text-sm font-bold text-text-primary hover:bg-surface-raised transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-2xl bg-primary-deep text-white text-sm font-bold text-center"
            >
              Start Your Shift
            </Link>
          </div>
        </div>
      )}
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
