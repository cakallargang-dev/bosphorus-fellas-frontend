"use client";

import { useEffect, useState } from "react";

/**
 * Ekran goruntusu / video kaydi korumasi.
 *
 * Katmanlar:
 *  1) FLAG_SECURE    — Android WebView'da gercek ekran goruntusunu engeller (Capacitor)
 *  2) Visibility/Blur — ekran goruntusu veya app degistirme aninda logo perdesi
 *  3) Keyboard/CSS   — kopyalama, sag tik, kaydetme ve uzun basma engeli
 *
 * Not: Web'de (Safari/Chrome) ekran goruntusu alinmasini teknik olarak engellemek
 * mumkun degildir; bu katmanlar caydirici ve tespit edicidir.
 */
export function ScreenshotProtection() {
  const [shield, setShield] = useState(false);

  useEffect(() => {
    // ── 1) Android: native FLAG_SECURE ──
    const win = window as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        Plugins?: Record<string, { setSecure?: (o: { secure: boolean }) => Promise<void> }>;
      };
    };
    if (win.Capacitor?.isNativePlatform?.() === true) {
      win.Capacitor?.Plugins?.Screenshot?.setSecure?.({ secure: true }).catch(() => {});
    }

    // ── 2) Tespit: ekran goruntusu / app degistirme ──
    let timer: ReturnType<typeof setTimeout> | null = null;
    let wasHidden = false;

    // Ekran goruntusu sonrasi uzun sure logo perdesi: cekilen goruntu koyu cikar
    const SHIELD_MS = 6000;
    const showShield = (ms = SHIELD_MS) => {
      setShield(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setShield(false), ms);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
        showShield();
      }
    };

    const onBlur = () => showShield();

    // iOS Safari: dokunma sonrasi kisa sure periyodik kontrol (gorsel/gizlilik
    // sonrasi geri donuslerde de perde)
    const onPageShow = () => showShield();

    const onKeyDownCapture = (e: KeyboardEvent) => {
      // PrintScreen / Win+Shift+S / Cmd+Shift+3-4-5
      const k = e.key.toLowerCase();
      if (
        k === "printscreen" ||
        (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(k)) ||
        (e.metaKey && e.shiftKey && k === "s")
      ) {
        showShield();
      }
    };

    // ── 3) Kopyalama / kaydetme engelleri ──
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const onCopy = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        ((e.ctrlKey || e.metaKey) && ["s", "u", "p", "c"].includes(k)) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "c", "j"].includes(k)) ||
        k === "f12"
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", () => {
      // Odak geri geldiginde (ekran goruntusu ekrani / app degisimi) perde
      if (wasHidden) {
        wasHidden = false;
        showShield();
      }
    });
    document.addEventListener("keydown", onKeyDownCapture, true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("copy", onCopy);
    document.addEventListener("keydown", onKeyDown);

    // ── CSS: secim ve uzun basma engeli ──
    const style = document.createElement("style");
    style.id = "screenshot-protection";
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      img, video, canvas {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      @media print {
        body { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("keydown", onKeyDownCapture, true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("keydown", onKeyDown);
      document.getElementById("screenshot-protection")?.remove();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!shield) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#030711]"
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand-mark-hero.webp"
        alt=""
        className="w-[110px] h-[110px] object-contain opacity-90"
      />
    </div>
  );
}
