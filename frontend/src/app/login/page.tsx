"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (activeTab === "signup") {
        await register({ email, password, full_name: fullName });
      } else {
        await login(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : activeTab === "signup"
          ? "Sign up failed"
          : "Sign in failed";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-stretch overflow-hidden bg-bg">
      {/* Background Image spanning the entire back */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login.png"
          alt="Login Background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Subtle overlay so the left panel blends nicely and the image isn't too overpowering */}
        <div className="absolute inset-0 bg-transparent sm:bg-bg/10"></div>
      </div>

      {/* Left Panel */}
      <div className="relative z-10 w-full md:w-[480px] lg:w-[540px] xl:w-[600px] min-h-screen bg-bg/95 backdrop-blur-2xl flex flex-col justify-between py-8 px-6 md:px-12 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.15)] border-r border-border/40 overflow-y-auto">
        
        {/* Quick Logo Top Row */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex items-center gap-3 mt-2"
        >
          <div className="bg-white rounded-xl shadow-sm border border-border/50 flex items-center justify-center w-8 h-8 overflow-hidden">
            <Image src="/logo.png" alt="NurseFlow Logo" width={128} height={128} quality={100} className="object-contain w-full h-full" />
          </div>
          <span className="font-extrabold text-text-primary tracking-tight">NurseFlow <span className="text-primary-deep italic font-normal">AI</span></span>
        </motion.div>

        {/* Central Form Area */}
        <div className="flex-grow flex flex-col justify-center my-10 max-w-[420px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col w-full"
            >
              <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-normal text-text-primary mb-3">
                  {activeTab === "signup" ? "Create an account" : "Welcome back"}
                </h1>
                <p className="text-sm text-text-secondary">
                  {activeTab === "signup" ? "Sign up and get 30 day free trial" : "Enter your details to access the clinical dashboard"}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {activeTab === "signup" && (
                  <div>
                    <label className="block text-xs text-text-muted mb-2 ml-4">Full name</label>
                    <input 
                      type="text" 
                      placeholder="Amélie Laurent" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-6 py-4 rounded-full bg-white/70 backdrop-blur-sm border border-transparent focus:border-border/80 focus:bg-white transition-all outline-none text-text-primary text-sm shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] w-full text-ellipsis placeholder:text-text-muted" 
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs text-text-muted mb-2 ml-4">Email</label>
                  <input 
                    type="email" 
                    placeholder="amelielaurent7622@gmail.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-full bg-white/70 backdrop-blur-sm border border-transparent focus:border-border/80 focus:bg-white transition-all outline-none text-text-primary text-sm shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] w-full text-ellipsis placeholder:text-text-muted" 
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs text-text-muted mb-2 ml-4">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-6 py-4 pr-12 rounded-full bg-white/70 backdrop-blur-sm border border-transparent focus:border-border/80 focus:bg-white transition-all outline-none text-text-primary text-sm shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] w-full text-ellipsis placeholder:text-text-muted tracking-widest" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={submitting}
                  className="w-full mt-2 bg-primary hover:bg-primary-deep text-text-primary font-medium py-4 rounded-full shadow-lg shadow-primary/20 transition-all text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Please wait…"
                    : activeTab === "signup"
                    ? "Submit"
                    : "Sign in"}
                </motion.button>

                {formError && (
                  <p className="text-center text-xs text-critical mt-2">{formError}</p>
                )}
              </form>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  type="button"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-full border border-border/80 hover:bg-white/60 transition-all text-[13px] font-medium text-text-primary bg-white/30 backdrop-blur-sm"
                >
                  <svg viewBox="0 0 384 512" width="16" height="16" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  Apple
                </button>
                <button 
                  type="button"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-full border border-border/80 hover:bg-white/60 transition-all text-[13px] font-medium text-text-primary bg-white/30 backdrop-blur-sm"
                >
                  <Image src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" width={16} height={16} />
                  Google
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Footer Area */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[13px] text-text-muted gap-4 mt-2">
          <p>
            {activeTab === "signup" ? "Have any account? " : "Don't have an account? "}
            <button 
              onClick={() => setActiveTab(activeTab === "signup" ? "login" : "signup")}
              className="text-text-primary underline font-medium underline-offset-[3px] decoration-border hover:decoration-text-primary transition-all pb-0.5"
            >
              {activeTab === "signup" ? "Sign in" : "Sign up"}
            </button>
          </p>
          <Link href="#" className="underline font-medium underline-offset-[3px] decoration-border hover:text-text-primary hover:decoration-text-primary transition-all pb-0.5">
            Terms & Conditions
          </Link>
        </div>

      </div>
    </main>
  );
}
