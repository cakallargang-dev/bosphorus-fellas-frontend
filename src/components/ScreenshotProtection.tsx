"use client";

import { useEffect } from "react";

/**
 * Prevents casual screenshotting and content copying.
 * Not 100% foolproof (nothing is on the web), but adds significant friction.
 */
export function ScreenshotProtection() {
  useEffect(() => {
    // ── Disable right-click ──
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // ── Disable drag (prevents image save) ──
    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // ── Block common save/inspect shortcuts ──
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S — Save page
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / Cmd+Option+I — DevTools
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C / Cmd+Option+C — Element picker
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J / Cmd+Option+J — Console
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U / Cmd+U — View source
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return false;
      }
      // Ctrl+P / Cmd+P — Print
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        return false;
      }
      // F12 — DevTools
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
    };

    // ── Detect DevTools via size delta (blur removed per user request) ──
    // Kept disabled — uncomment the block below to re-enable.
    /*
    let devToolsWarned = false;
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (!devToolsWarned) {
          devToolsWarned = true;
          document.body.style.filter = "blur(8px)";
          document.body.style.pointerEvents = "none";
          setTimeout(() => {
            document.body.style.filter = "";
            document.body.style.pointerEvents = "";
            devToolsWarned = false;
          }, 500);
        }
      }
    };
    const dtInterval = setInterval(detectDevTools, 2000);
    */

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown);

    // ── CSS: disable text selection & iOS callout ──
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
      /* Re-enable selection for inputs and textareas */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown);
      const el = document.getElementById("screenshot-protection");
      if (el) el.remove();
    };
  }, []);

  return null;
}
