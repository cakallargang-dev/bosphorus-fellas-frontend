"use client";

import { useEffect, useState } from "react";

/**
 * Bağlantı durumu.
 * - `offline`: tarayıcı çevrimdışı.
 * - `serverDown`: tarayıcı çevrimiçi ama API yanıt vermiyor (ör. Railway uyuyor).
 */
export type NetState = "online" | "offline" | "serverDown";

export function useOnline() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine !== false
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  return online;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

async function probe(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`${API_BASE}/api/ping`, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export function useNetState(): NetState {
  const online = useOnline();
  const [serverOk, setServerOk] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!online) return;
      const ok = await probe();
      if (!cancelled) setServerOk(ok);
    };
    run();
    const id = setInterval(run, 30000);
    window.addEventListener("online", run);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("online", run);
    };
  }, [online]);

  if (!online) return "offline";
  if (!serverOk) return "serverDown";
  return "online";
}
