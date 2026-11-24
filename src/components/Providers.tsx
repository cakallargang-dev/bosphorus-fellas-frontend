"use client";

import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";
import { PushNotificationProvider } from "@/components/PushNotificationProvider";
import { LocationTracker } from "@/components/LocationTracker";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { PERSIST_KEY, persistOptions, persistStorage } from "@/lib/offline";

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
   * Cache'i localStorage'a yazan persister. Uçak modunda uygulama açıldığında
   * son görülen etkinlik/ekip/sohbet verisi diskten okunur.
   */
  const [persister] = useState(() =>
    typeof window === "undefined"
      ? null
      : createAsyncStoragePersister({
          storage: persistStorage,
          key: PERSIST_KEY,
          throttleTime: 1500,
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

  const body = (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <PushNotificationProvider />
        <LocationTracker />
        <OfflineBanner />
        <div className="pb-16">{children}</div>
        <BottomNav />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </AuthProvider>
  );

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{body}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, ...persistOptions }}
    >
      {body}
    </PersistQueryClientProvider>
  );
}
