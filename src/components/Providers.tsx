"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ProvidersInner>{children}</ProvidersInner>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function ProvidersInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/chat";

  return (
    <>
      <div className={hideNav ? "" : "pb-16"}>{children}</div>
      {!hideNav && <BottomNav />}
      <Toaster richColors position="top-right" />
    </>
  );
}
