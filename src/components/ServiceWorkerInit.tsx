"use client";

import { useEffect } from "react";

/**
 * Service worker'ı her açılışta kaydeder (push izni verilmemiş olsa da).
 * Kayıt yoksa çevrimdışıyken uygulama kabuğu önbellekten açılamıyordu —
 * Safari "internet bağlantısı yok" deyip hiç açmıyordu.
 */
export function ServiceWorkerInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* sessizce geç — push hattı kendi kaydını ayrıca dener */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
