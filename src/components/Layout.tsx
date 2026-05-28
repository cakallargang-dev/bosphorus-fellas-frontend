"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { ScreenshotProtection } from "@/components/ScreenshotProtection";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-mancave-bg">
      <ScreenshotProtection />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
