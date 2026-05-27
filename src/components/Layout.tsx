"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-mancave-bg">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
