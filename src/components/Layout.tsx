"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter }: LayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-mancave-bg selection:bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/30">
      {/* Global marka arka plani */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.16]"
          style={{ backgroundImage: "url('/brand-bg-wide.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030711]/80 via-[#030711]/65 to-[#030711]" />
      </div>

      <main className="relative flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
