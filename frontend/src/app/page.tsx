import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";

export const metadata = {
  title: "NurseFlow AI | Your Intelligent Clinical Co-pilot",
  description: "Empowering nurses with AI-driven SBAR handoffs, predictive fall risks, and dynamic medication queuing.",
};

export default function Home() {
  return (
    <main className="min-h-screen relative selection:bg-primary selection:text-text-primary overflow-x-hidden">
      {/* Global Background Image */}
      {/* Global Background Layer */}
      <div className="fixed inset-0 z-0 bg-white" />
      
      {/* Floating Animated Icons Background */}
      <div className="fixed inset-0 z-[5] overflow-hidden pointer-events-none opacity-[0.04]">
         {[
            { top: "10%", left: "5%", delay: "0s", rotate: "15deg" },
            { top: "25%", left: "85%", delay: "1.2s", rotate: "-30deg" },
            { top: "50%", left: "15%", delay: "2.4s", rotate: "45deg" },
            { top: "70%", left: "90%", delay: "3.5s", rotate: "-15deg" },
            { top: "85%", left: "20%", delay: "0.8s", rotate: "60deg" },
            { top: "40%", left: "60%", delay: "1.9s", rotate: "-60deg" },
            { top: "15%", left: "45%", delay: "4.1s", rotate: "0deg" },
            { top: "90%", left: "70%", delay: "2.8s", rotate: "-90deg" },
         ].map((style, i) => (
            <div 
               key={i}
               style={{
                  position: "absolute",
                  top: style.top,
                  left: style.left,
                  animation: `pulse 8s infinite alternate`,
                  animationDelay: style.delay,
                  transform: `rotate(${style.rotate})`
               }}
            >
               <img src="/icons/lungs.svg" width={64} height={64} alt="" />
            </div>
         ))}
      </div>

      {/* Global Frost Overlay */}
      <div className="fixed inset-0 z-10 bg-gradient-to-b from-primary/10 via-bg/40 to-bg backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-20">
        <LandingNavbar />
        <LandingHero />
        <LandingFeatures />
        
        {/* Footer-lite */}
        <footer className="py-20 border-t border-border bg-white/40 backdrop-blur-md flex flex-col items-center justify-center gap-6 text-text-muted text-sm font-body">
          <p className="font-bold">© 2026 NurseFlow AI. Built for the future of clinical care.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary-deep transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-deep transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary-deep transition-colors">Contact Support</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
