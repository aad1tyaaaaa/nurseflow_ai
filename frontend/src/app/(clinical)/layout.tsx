"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { VoiceNavigator } from "@/components/ui/VoiceNavigator";
import { useAuth } from "@/context/AuthContext";

export default function ClinicalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [useSidebar] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-sm text-text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg selection:bg-primary selection:text-text-primary">
      {useSidebar ? (
        <>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
             {/* Simple mobile/header bar when using sidebar */}
             <header className="lg:hidden p-4 border-b border-border bg-white sticky top-0 z-40">
                <Navbar />
             </header>
             <main className="flex-1 p-6 md:p-10 lg:p-12 xl:p-16 transition-all mx-auto w-full max-w-[1600px]">
                {children}
             </main>
          </div>
        </>
      ) : (
        <div className="w-full">
          <Navbar />
          <main className="mx-auto max-w-7xl p-6 md:p-10 lg:p-12 xl:p-16">
            {children}
          </main>
        </div>
      )}
      <VoiceNavigator />
    </div>
  );
}
