"use client";

import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";
import { PushNotificationProvider } from "@/components/PushNotificationProvider";
import { LocationTracker } from "@/components/LocationTracker";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Veri "taze" sayılsa bile sayfaya dönüşte/sekme odağa gelince yeniden çekilir.
            staleTime: 15 * 1000,
            refetchOnMount: "always",
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  );

  /**
   * iOS PWA (ana ekrana eklenmiş) "visibilitychange" olayını tetikler ama
   * "focus" olayını tetiklemez → react-query kendiliğinden yenilemez.
   * Bu köprü, uygulama tekrar görünür olduğunda sorguları tazeler.
   */
  useEffect(() => {
    focusManager.setEventListener((handleFocus) => {
      if (typeof window === "undefined") return;
      const onVisible = () => {
        if (document.visibilityState === "visible") handleFocus(true);
        else handleFocus(false);
      };
      const onFocus = () => handleFocus(true);
      window.addEventListener("visibilitychange", onVisible, false);
      window.addEventListener("focus", onFocus, false);
      return () => {
        window.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", onFocus);
      };
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <PushNotificationProvider />
          <LocationTracker />
          <div className="pb-16">{children}</div>
          <BottomNav />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
