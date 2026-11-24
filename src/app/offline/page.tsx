"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#162544]/70">
        <WifiOff className="h-6 w-6 text-[#3b82f6]" />
      </div>
      <h1 className="text-[19px] font-semibold tracking-tight text-[#e6edf5]">
        İnternet bağlantısı yok
      </h1>
      <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#7a8da4]">
        Bağlantı gelince bu sayfayı yenilediğinde her şey kaldığı yerden devam eder.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 rounded-xl border border-[#162544] bg-[#0f1d32]/70 px-5 py-2.5 text-[13px] font-medium text-[#e6edf5] active:scale-95"
      >
        Tekrar dene
      </button>
    </main>
  );
}
