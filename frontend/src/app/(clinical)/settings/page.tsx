"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Monitor, 
  Layout, 
  LogOut, 
  Save, 
  CheckCircle2
} from "lucide-react";
import Card from "@/components/ui/Card";
import { BentoGrid, BentoGridItem } from "@/components/layout/BentoGrid";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface ProfileDraft {
  full_name: string;
  unit: string;
}

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);

  const handleSave = async () => {
    if (activeSection !== "profile" || !profileDraft) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.settings.update(profileDraft);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="animate-stagger-up">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
          System <span className="text-primary-deep">Preferences</span>
          <Settings className="text-primary-deep" size={28} />
        </h1>
        <p className="mt-2 font-body text-text-secondary">
          Configure your clinical workspace and personal security settings.
        </p>
      </div>

      <BentoGrid>
        {/* 1. Navigation Bento (3 cols) */}
        <BentoGridItem span={3}>
           <Card className="h-full space-y-2 p-6 bg-white">
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 px-2">Navigation</h3>
              <SettingsNavButton 
                 active={activeSection === "profile"} 
                 onClick={() => setActiveSection("profile")}
                 icon={<User size={18} />} 
                 label="Nurse Profile" 
              />
              <SettingsNavButton 
                 active={activeSection === "navigation"} 
                 onClick={() => setActiveSection("navigation")}
                 icon={<Layout size={18} />} 
                 label="UI / Navigation" 
              />
              <SettingsNavButton 
                 active={activeSection === "notifications"} 
                 onClick={() => setActiveSection("notifications")}
                 icon={<Bell size={18} />} 
                 label="Notifications" 
              />
              <SettingsNavButton 
                 active={activeSection === "security"} 
                 onClick={() => setActiveSection("security")}
                 icon={<Shield size={18} />} 
                 label="Security & Privacy" 
              />
           </Card>
        </BentoGridItem>

        {/* 2. Content Bento (9 cols) */}
        <BentoGridItem span={9}>
           <Card className="h-full min-h-[600px] p-10 bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 h-full flex flex-col">
                 <div className="flex-grow">
                    {activeSection === "profile" && <ProfileSettings onDraftChange={setProfileDraft} />}
                    {activeSection === "navigation" && <NavigationSettings />}
                    {activeSection === "notifications" && <NotificationSettings />}
                    {activeSection === "security" && <SecuritySettings />}
                 </div>

                 {/* Bottom Actions */}
                 <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                    <button className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-critical transition-all uppercase tracking-widest">
                       <LogOut size={16} />
                       Terminate All Sessions
                    </button>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                       <button
                          onClick={() => setProfileDraft(null)}
                          className="flex-1 md:flex-none px-8 py-3.5 rounded-2xl border border-border text-text-secondary font-bold text-sm hover:bg-surface transition-all"
                       >
                         Cancel
                       </button>
                       <button
                          onClick={handleSave}
                          disabled={saving || activeSection !== "profile"}
                          className="flex-1 md:flex-none btn-primary px-10 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                       >
                          {saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                          {saving ? "Saving..." : saveSuccess ? "Saved!" : "Finalize Changes"}
                       </button>
                    </div>
                 </div>
              </div>
           </Card>
        </BentoGridItem>
      </BentoGrid>
    </div>
  );
};

const ProfileSettings = ({ onDraftChange }: { onDraftChange: (draft: { full_name: string; unit: string }) => void }) => {
  const { user } = useAuth();
  const fullName = user?.fullName || "Nurse";
  const initial = fullName.trim().charAt(0).toUpperCase() || "N";
  const email = user?.email || "—";
  const unit = user?.unit || "";
  const roleLabel = user?.role
    ? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Clinician";

  const [nameVal, setNameVal] = useState(fullName);
  const [unitVal, setUnitVal] = useState(unit);

  const handleChange = (field: "full_name" | "unit", value: string) => {
    const updated = { full_name: field === "full_name" ? value : nameVal, unit: field === "unit" ? value : unitVal };
    if (field === "full_name") setNameVal(value);
    else setUnitVal(value);
    onDraftChange(updated);
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex items-center gap-6 mb-10">
          <div className="h-24 w-24 rounded-[2.5rem] bg-primary/20 text-primary-deep flex items-center justify-center font-bold text-3xl shadow-lg ring-4 ring-white">{initial}</div>
          <div>
             <h3 className="text-2xl font-bold text-text-primary">{fullName}</h3>
             <p className="text-text-secondary font-body">{roleLabel} • ID: {user?.id?.slice(0, 8) ?? "—"}</p>
             <button className="mt-2 text-xs font-bold text-primary-deep hover:underline">Change Profile photo</button>
          </div>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField label="Full Name" value={nameVal} onChange={(v) => handleChange("full_name", v)} />
          <SettingField label="Role" value={roleLabel} />
          <EditableField label="Assigned Unit" value={unitVal} onChange={(v) => handleChange("unit", v)} />
          <SettingField label="Hospital Email" value={email} />
       </div>
    </div>
  );
};

const NavigationSettings = () => (
  <div className="space-y-8 animate-fade-in">
     <h3 className="text-xl font-bold text-text-primary">Workspace Layout</h3>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LayoutOption 
           label="Sidebar Navigation" 
           desc="Traditional left-side menu for power users." 
           icon={<Layout size={24} />} 
           active 
        />
        <LayoutOption 
           label="Top Navbar" 
           desc="Minimal, focused view for tablet users." 
           icon={<Monitor size={24} />} 
        />
     </div>

     <div className="pt-8">
        <h3 className="text-xl font-bold text-text-primary mb-6">Accessibility</h3>
        <div className="space-y-4">
           <ToggleOption label="Enable High Contrast Mode" desc="Optimizes readability for low-light environments." />
           <ToggleOption label="Large UI Elements" desc="Increases size of buttons and touch targets." />
           <ToggleOption label="Haptic Feedback" desc="Vibration on critical alert acknowledgement." active />
        </div>
     </div>
  </div>
);

const NotificationSettings = () => (
  <div className="space-y-8 animate-fade-in">
     <h3 className="text-xl font-bold text-text-primary mb-6">Clinical Alert Routing</h3>
     <div className="space-y-6">
        <ToggleOption label="Critical Vitals (Audio)" desc="Play distinct siren on SpO2 / HR anomalies." active />
        <ToggleOption label="Fall Risk Vision AI" desc="Receive notification on predicted patient exit." active />
        <ToggleOption label="Medication Queue (Desktop)" desc="Gentle reminder when meds are within 15m of scheduled time." active />
        <ToggleOption label="AI Handoff Ready" desc="Notify when SBAR drafts have been finalized." />
     </div>
  </div>
);

const SecuritySettings = () => (
  <div className="space-y-8 animate-fade-in">
     <h3 className="text-xl font-bold text-text-primary mb-6">Account & Privacy</h3>
     <div className="space-y-6">
        <ToggleOption label="Two-Factor Authentication" desc="Require mobile app confirmation for new logins." active />
        <ToggleOption label="Shift Auto-Lock" desc="Automatically lock terminal after 5 minutes of inactivity." active />
        <div className="p-6 rounded-3xl bg-surface-raised border border-border flex items-center justify-between">
           <div className="space-y-1">
              <p className="font-bold text-text-primary">Encryption Protocol</p>
              <p className="text-xs text-text-muted font-body">Current: AES-256 Bit HIPAA-Ready Tunnel</p>
           </div>
           <CheckCircle2 className="text-success" size={24} />
        </div>
     </div>
  </div>
);

interface SettingFieldProps {
  label: string;
  value: string;
}

const SettingField = ({ label, value }: SettingFieldProps) => (
  <div className="space-y-2">
     <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">{label}</label>
     <input 
        type="text" 
        defaultValue={value}
        readOnly
        className="w-full px-5 py-3.5 rounded-2xl bg-surface-raised border border-border outline-none font-body text-sm font-medium text-text-muted cursor-not-allowed"
     />
  </div>
);

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const EditableField = ({ label, value, onChange }: EditableFieldProps) => (
  <div className="space-y-2">
     <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">{label}</label>
     <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-5 py-3.5 rounded-2xl bg-surface-raised border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-body text-sm font-medium"
     />
  </div>
);

interface SettingsNavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const SettingsNavButton = ({ active, onClick, icon, label }: SettingsNavButtonProps) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
      active 
        ? "bg-primary text-text-primary shadow-lg shadow-primary/20" 
        : "text-text-secondary hover:bg-surface-raised"
    }`}
  >
     {icon}
     {label}
  </button>
);

interface LayoutOptionProps {
  label: string;
  desc: string;
  icon: React.ReactNode;
  active?: boolean;
}

const LayoutOption = ({ label, desc, icon, active }: LayoutOptionProps) => (
  <div className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col gap-4 ${
    active ? "bg-primary/5 border-primary shadow-xl shadow-primary/5" : "border-border hover:border-primary/30"
  }`}>
     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${active ? "bg-primary text-text-primary shadow-lg" : "bg-surface-raised text-text-muted"}`}>
        {icon}
     </div>
     <div>
        <h4 className="font-bold text-text-primary">{label}</h4>
        <p className="text-xs text-text-muted font-body mt-1">{desc}</p>
     </div>
  </div>
);

interface ToggleOptionProps {
  label: string;
  desc: string;
  active?: boolean;
}

const ToggleOption = ({ label, desc, active = false }: ToggleOptionProps) => {
  const [isOn, setIsOn] = useState(active);
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-raised transition-all group">
       <div className="space-y-0.5">
          <p className="font-bold text-text-primary text-sm">{label}</p>
          <p className="text-xs text-text-muted font-body">{desc}</p>
       </div>
       <button 
         onClick={() => setIsOn(!isOn)}
         className={`h-7 w-12 rounded-full transition-all relative ${isOn ? 'bg-primary' : 'bg-border'}`}
       >
          <motion.div 
            animate={{ x: isOn ? 20 : 4 }}
            className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm" 
          />
       </button>
    </div>
  );
};

export default SettingsPage;
