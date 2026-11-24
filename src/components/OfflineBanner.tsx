"use client";

import { WifiOff } from "lucide-react";
import { useNetState } from "@/lib/useNetState";

/**
 * Çevrimdışıyken içeriğin üstünde duran ince şerit.
 * Önbellekteki veri gösterilmeye devam eder, kullanıcı verinin "son bilinen" olduğunu anlar.
 */
export function OfflineBanner() {
  const state = useNetState();
  if (state === "online") return null;

  const text =
    state === "offline"
      ? "İnternet yok — son kaydedilen veriler gösteriliyor"
      : "Sunucuya ulaşılamıyor — tekrar deneniyor";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-3 pt-[max(6px,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#f59e0b]/30 bg-[#181206]/95 px-3 py-1.5 text-[11px] font-medium text-[#fbbf24] shadow-lg backdrop-blur">
        <WifiOff className="h-3.5 w-3.5" />
        <span>{text}</span>
      </div>
    </div>
  );
}
