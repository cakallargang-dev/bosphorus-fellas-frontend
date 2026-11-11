"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const TOKEN_KEY = "mancave_token";

type Status = "unsupported" | "default" | "granted" | "denied" | "loading";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function useWebPush() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    if (!supported) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission === "granted") {
      // SW hazırsa mevcut aboneliği tekrar senkronize et
      setStatus("granted");
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (reg) => {
          const existing = await reg.pushManager.getSubscription();
          if (existing) await syncSubscription(existing);
        })
        .catch(() => undefined);
    } else if (Notification.permission === "denied") {
      setStatus("denied");
    } else {
      setStatus("default");
    }
  }, []);

  async function syncSubscription(sub: PushSubscription) {
    const token = getToken();
    if (!token) return;
    const raw = sub.toJSON();
    await fetch(`${API_BASE}/api/notifications/web/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription: {
          endpoint: raw.endpoint,
          keys: { p256dh: raw.keys?.p256dh, auth: raw.keys?.auth },
        },
      }),
    }).catch(() => undefined);
  }

  const enable = useCallback(async () => {
    setError(null);

    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Bu tarayıcı bildirimleri desteklemiyor");
      return;
    }

    // iOS'ta yalnızca ana ekrana eklenmiş uygulamada çalışır
    if (isIOS() && !isStandalone()) {
      setError(
        "iPhone'da bildirimler için siteyi Safari'de açıp Paylaş → Ana Ekrana Ekle ile eklemelisin."
      );
      return;
    }

    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        setError(permission === "denied" ? "Bildirim izni reddedildi" : null);
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const keyRes = await fetch(`${API_BASE}/api/notifications/vapid-public-key`);
      const keyJson = await keyRes.json();
      const publicKey: string | undefined = keyJson?.data?.publicKey;

      if (!publicKey) {
        setError("Sunucu bildirim anahtarını vermedi");
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await syncSubscription(sub);
      setStatus("granted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bildirimler açılamadı");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const token = getToken();
        await fetch(`${API_BASE}/api/notifications/web/unsubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => undefined);
        await sub.unsubscribe();
      }
      setStatus("default");
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, error, enable, disable };
}
