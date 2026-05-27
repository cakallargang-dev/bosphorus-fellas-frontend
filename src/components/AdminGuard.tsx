"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageLoading } from "@/components/LoadingSpinner";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return fallback ?? <PageLoading />;
  }

  if (!isAuthenticated) {
    return fallback ?? <PageLoading />;
  }

  if (!isAdmin) {
    return (
      fallback ?? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <ShieldAlert className="w-16 h-16 text-red-500/50" />
          <h2 className="text-xl text-white font-semibold">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-500">
            Bu sayfaya erişmek için yönetici yetkisine sahip olmalısınız.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-mancave-gold hover:underline text-sm mt-2"
          >
            Panele Dön
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
}
