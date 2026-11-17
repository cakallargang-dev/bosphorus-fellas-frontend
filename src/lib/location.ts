"use client";

/**
 * Konum servisi — web ve native (iOS/Android) tek arayüz.
 *
 * Web: navigator.geolocation (yalnız uygulama açıkken).
 * Native: @capacitor-community/background-geolocation → ekran kapalıyken de çalışır.
 *         Android'de kalıcı bildirim gösterir (zorunlu), iOS'ta "Her zaman" izni ister.
 */

import { Capacitor, registerPlugin } from "@capacitor/core";
import { locationApi } from "@/lib/api";

export type PositionHandler = (p: {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
}) => void;

/** Sunucuya gönderme aralığı (ms) */
const PING_MS = 20_000;

type WatcherHandle = { stop: () => Promise<void> };

let handle: WatcherHandle | null = null;

/**
 * Eklenti saf native (JS kodu yok, sadece tip tanımı) → registerPlugin ile bağlanır.
 * Dinamik import Turbopack'te "module not found" verir, o yüzden bu yol kullanılıyor.
 */
let pluginCache: any = null;
async function nativePlugin() {
  if (pluginCache) return pluginCache;
  pluginCache = registerPlugin("BackgroundGeolocation");
  return pluginCache;
}

export const isNative = () => Capacitor.isNativePlatform();

/**
 * Konum dinlemeyi başlatır. İlk konum gelince resolve olur.
 * Hata durumunda anlamlı Türkçe mesajla reject eder.
 */
export async function startTracking(onPosition: PositionHandler): Promise<void> {
  await stopTracking();

  let last: Parameters<PositionHandler>[0] | null = null;
  let firstResolve: (() => void) | null = null;
  let firstReject: ((e: Error) => void) | null = null;

  const first = new Promise<void>((resolve, reject) => {
    firstResolve = resolve;
    firstReject = reject;
  });

  const push = (p: Parameters<PositionHandler>[0]) => {
    last = p;
    onPosition(p);
    firstResolve?.();
    firstResolve = null;
  };

  /* ---------- Native (arka plan) ---------- */
  if (isNative()) {
    const BackgroundGeolocation = await nativePlugin();

    const watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "Konvoy için konumun paylaşılıyor. Durdurmak için dokun.",
        backgroundTitle: "Bosphorus Fellas — Canlı konum",
        requestPermissions: true,
        stale: false,
        distanceFilter: 15,
      },
      (location: any, error: any) => {
        if (error) {
          if (error.code === "NOT_AUTHORIZED") {
            firstReject?.(new Error("Konum izni verilmedi"));
            firstReject = null;
          }
          return;
        }
        if (location) {
          push({
            lat: location.latitude,
            lng: location.longitude,
            heading: Number.isFinite(location.bearing) ? location.bearing : null,
            speed: Number.isFinite(location.speed) ? location.speed : null,
            accuracy: Number.isFinite(location.accuracy) ? location.accuracy : null,
          });
        }
      }
    );

    const timer = setInterval(() => {
      if (last) locationApi.ping(last).catch(() => {});
    }, PING_MS);

    handle = {
      stop: async () => {
        clearInterval(timer);
        try {
          await BackgroundGeolocation.removeWatcher({ id: watcherId });
        } catch {
          /* yut */
        }
      },
    };

    // 20 sn içinde konum gelmezse kullanıcıyı bekletmeyelim
    const timeout = setTimeout(() => firstReject?.(new Error("Konum alınamadı")), 20_000);
    await first.finally(() => clearTimeout(timeout));
    return;
  }

  /* ---------- Web (ön plan) ---------- */
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Bu cihaz konumu desteklemiyor");
  }

  const toPos = (pos: GeolocationPosition): Parameters<PositionHandler>[0] => ({
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    heading: Number.isFinite(pos.coords.heading) ? pos.coords.heading : null,
    speed: Number.isFinite(pos.coords.speed) ? pos.coords.speed : null,
    accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
  });

  const watchId = navigator.geolocation.watchPosition(
    (pos) => push(toPos(pos)),
    (err) => {
      firstReject?.(
        new Error(
          err.code === err.PERMISSION_DENIED
            ? "Konum izni verilmedi — telefon ayarlarından izin ver"
            : "Konum alınamadı"
        )
      );
      firstReject = null;
    },
    { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
  );

  const timer = setInterval(() => {
    if (last) locationApi.ping(last).catch(() => {});
  }, PING_MS);

  handle = {
    stop: async () => {
      clearInterval(timer);
      navigator.geolocation.clearWatch(watchId);
    },
  };

  await first;
}

export async function stopTracking(): Promise<void> {
  if (handle) {
    await handle.stop();
    handle = null;
  }
}
