"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Stethoscope, Clipboard, LayoutDashboard, User, Pill, Mic, ShieldAlert, Bell, LogOut, Settings } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="glass-nav sticky top-0 z-50 w-full px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md transition-transform group-hover:scale-110 overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="NurseFlow Logo" 
              width={128} 
              height={128} 
              quality={100}
              className="object-contain w-full h-full"
            />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-text-primary">
            NurseFlow <span className="text-primary-deep">AI</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-6">
          <NavLink 
            href="/dashboard" 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={pathname === "/dashboard"} 
          />
          <NavLink 
            href="/handoff" 
            icon={<Clipboard size={18} />} 
            label="Handoff" 
            active={pathname.includes("/handoff")} 
          />
          <NavLink 
            href="/patients" 
            icon={<Stethoscope size={18} />} 
            label="Patients" 
            active={pathname.includes("/patients")} 
          />
          <NavLink 
            href="/medications" 
            icon={<Pill size={18} />} 
            label="Meds" 
            active={pathname === "/medications"} 
          />
          <NavLink 
            href="/voice" 
            icon={<Mic size={18} />} 
            label="Voice" 
            active={pathname === "/voice"} 
          />
          <NavLink 
            href="/fall-risk" 
            icon={<ShieldAlert size={18} />} 
            label="Fall Risk" 
            active={pathname === "/fall-risk"} 
          />
          <NavLink 
            href="/alerts" 
            icon={<Bell size={18} />} 
            label="Alerts" 
            active={pathname === "/alerts"} 
            showPulse
          />
        </div>

        {/* User Profile / Auth */}
        <div className="flex items-center gap-4">
          <div className="relative group flex items-center">
            <label tabIndex={0} className="flex items-center gap-2 sm:gap-3 pl-2 hover:bg-surface-raised p-1 rounded-xl transition-colors cursor-pointer min-h-[44px]">
              <div className="hidden lg:block text-right">
                <div className="text-sm font-bold text-text-primary">Nikhil Gupta</div>
                <div className="text-xs text-text-secondary font-medium">Patient</div>
              </div>
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-surface">NG</div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface shadow-[0_0_8px_rgba(95,180,156,0.5)]"></div>
              </div>
            </label>

            {/* Simple CSS hover dropdown */}
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto transform translate-y-2 group-hover:translate-y-0 z-50">
               <div className="p-2 flex flex-col">
                  <Link href="/settings" className="px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-surface-raised rounded-xl transition-colors text-left flex items-center gap-2">
                     <Settings size={16} /> 
                     Profile Settings
                  </Link>
               </div>
            </div>
          </div>
          
          <div className="hidden sm:block h-8 w-px bg-border mx-2" />
          
          <Link href="/login" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-critical font-bold text-sm bg-white hover:bg-critical/5 transition-colors shadow-sm">
             <LogOut size={16} /> 
             <span className="hidden sm:inline">Sign Out</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ 
  href, 
  icon, 
  label, 
  active = false, 
  showPulse = false 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  showPulse?: boolean;
}) => (
  <Link
    href={href}
    className={`relative flex items-center gap-2 font-body text-sm font-semibold transition-colors hover:text-primary-deep ${
      active ? "text-primary-deep font-bold" : "text-text-secondary"
    }`}
  >
    <div className={active ? "text-primary-deep" : ""}>{icon}</div>
    {label}
    {showPulse && (
       <span className="absolute -top-1 -right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-critical"></span>
       </span>
    )}
  </Link>
);

export default Navbar;
