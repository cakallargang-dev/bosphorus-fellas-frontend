"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { ScreenshotProtection } from "@/components/ScreenshotProtection";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <ScreenshotProtection />
      <main className="max-w-[430px] mx-auto px-4 pt-4 pb-28">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
