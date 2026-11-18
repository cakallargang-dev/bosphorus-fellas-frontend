"use client";

/**
 * Konum paylaşımını uygulama genelinde yürütür.
 *
 * Kullanıcı profilden paylaşımı açtıysa (varsayılan: açık), uygulama açıldığı
 * anda konum takibi kendiliğinden başlar — haritaya girmek veya butona basmak
 * gerekmez. Tercih localStorage'da tutulur, uygulama kapansa da hatırlanır.
 *
 * Akış:
 *  - Oturum varsa ve tercih açıksa → startTracking
 *  - Uygulama öne geldiğinde takip durmuşsa → yeniden başlat
 *  - Sekme arka plana düşerse → web'de GPS okuması zaten durur; yeniden başlatılır
 */

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { isSharingEnabled, isTracking, startTracking, stopTracking } from "@/lib/location";

export function LocationTracker() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Oturum yoksa takibi bırak
      void stopTracking();
      return;
    }

    let cancelled = false;

    const boot = async () => {
      if (cancelled || !isSharingEnabled() || isTracking()) return;
      try {
        // onPosition boş: harita dışındaki sayfalarda da sunucuya ping gider
        await startTracking();
      } catch {
        // İzin yok / konum alınamadı → tercihi BOZMA, sessizce bekle.
        // Kullanıcı izni verdikten sonra görünürlük olayında yeniden denenir.
      }
    };

    void boot();

    /**
     * iOS PWA arka plandan dönerken watchPosition ölü kalabiliyor.
     * Görünür olduğunda takip yoksa kaldığı yerden devam ettir.
     */
    const onVisible = () => {
      if (document.visibilityState === "visible") void boot();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAuthenticated, user]);

  return null;
}
