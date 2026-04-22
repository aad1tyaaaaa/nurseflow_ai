"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Clipboard, 
  Users, 
  Pill, 
  Mic, 
  AlertTriangle, 
  Bell, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const menuItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
  { icon: <Clipboard size={20} />, label: "Handoff", href: "/handoff" },
  { icon: <Users size={20} />, label: "Patients", href: "/patients" },
  { icon: <Pill size={20} />, label: "Meds Queue", href: "/medications" },
  { icon: <Mic size={20} />, label: "Voice Docs", href: "/voice" },
  { icon: <AlertTriangle size={20} />, label: "Fall Risk", href: "/fall-risk" },
  { icon: <Bell size={20} />, label: "Alerts", href: "/alerts" },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <motion.aside
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={(e, info) => {
        if (info.offset.x < -30) setIsCollapsed(true);
        if (info.offset.x > 30) setIsCollapsed(false);
      }}
      initial={false}
      animate={{ width: isCollapsed ? "80px" : "280px" }}
      className="hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-border py-8 px-4 z-50 overflow-hidden shadow-sm"
    >
      {/* Sidebar Logo */}
      <Link href="/" className="flex items-center gap-1.5 px-3 mb-10 group no-underline">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-md transition-transform group-hover:scale-110">
          <Image 
            src="/logo.png" 
            alt="NurseFlow AI Logo" 
            width={128} 
            height={128} 
            quality={100}
            className="object-contain w-full h-full"
          />
        </div>
        {!isCollapsed && (
          <span className="font-display text-2xl font-bold tracking-tight text-text-primary whitespace-nowrap">
            NurseFlow <span className="text-primary-deep italic">AI</span>
          </span>
        )}
      </Link>

      {/* Navigation Links */}
      <nav className="flex-grow space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 px-3 py-3 rounded-2xl transition-all cursor-pointer group ${
                  isActive 
                    ? "bg-primary/10 text-primary-deep font-bold" 
                    : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                }`}
              >
                <div className={`flex-shrink-0 ${isActive ? "text-primary-deep" : "group-hover:text-primary-deep"}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className="text-sm font-body tracking-wide whitespace-nowrap">{item.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <motion.div 
                    layoutId="activeBar"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-deep shadow-[0_0_8px_rgba(242,139,130,0.4)]" 
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Settings & Toggle */}
      <div className="mt-auto space-y-2 pt-6 border-t border-border">
        <Link href="/settings">
          <div className={`flex items-center gap-4 px-3 py-3 rounded-2xl transition-all cursor-pointer group ${
            pathname === "/settings" ? "bg-primary/10 text-primary-deep font-bold" : "text-text-secondary hover:text-text-primary"
          }`}>
            <Settings size={20} className="flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-body">Settings</span>}
          </div>
        </Link>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="text-sm font-body">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
};
