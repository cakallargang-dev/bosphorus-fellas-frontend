"use client";

/**
 * Başvuru formu kaldırıldı (kullanıcı isteği, 2026-11).
 * Kayıt = üyelik. Eski /apply linkleri kayıt sayfasına yönlendirilir.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApplyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/kayit");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030711]">
      <span className="text-[13px] text-[#7a8da4]">Kayıt sayfasına yönlendiriliyor…</span>
    </div>
  );
}
