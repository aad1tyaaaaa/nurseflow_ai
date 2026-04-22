import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";


export const metadata: Metadata = {
  title: "NurseFlow AI",
  description: "Unified Intelligent Workflow Assistant for Nurses",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-bg selection:bg-primary/30 text-text-primary">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

