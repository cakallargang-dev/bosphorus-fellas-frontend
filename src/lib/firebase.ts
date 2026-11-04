"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Not: Firebase yalnızca tarayıcıda, ihtiyaç anında başlatılır.
// Build sırasında (SSR/prerender) getAuth() çağrılmadığı için
// "auth/invalid-api-key" hatası oluşmaz.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDL2BT0zawaeVREbD9i0wDenTurxjjgkkg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bosphorus-fellas-8a8c4.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bosphorus-fellas-8a8c4",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:334699713519:web:02a1ab4aaac6e7ad891c1a",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "334699713519",
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

function ensureApp(): FirebaseApp {
  if (!cachedApp) {
    cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return cachedApp;
}

/** Sadece event handler içinde çağır (SSR'de çalıştırma). */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(ensureApp());
    // Firebase doğrulama SMS'i bu dile göre gönderilir (TR).
    try {
      cachedAuth.languageCode = "tr";
    } catch {}
  }
  return cachedAuth;
}

/** 0555 111 22 33 → +905551112233 */
export function toE164(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("90")) return "+" + digits;
  if (digits.startsWith("0")) return "+90" + digits.slice(1);
  if (digits.length === 10) return "+90" + digits;
  return "+" + digits;
}

/** Firebase hata kodlarını kullanıcı diline çevirir. */
export function humanizeAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || "");
  const code = (err as { code?: string })?.code || raw;
  if (/too-many-requests/i.test(code)) return "Çok fazla deneme yapıldı. 10-15 dk sonra tekrar deneyin.";
  if (/invalid-phone-number/i.test(code)) return "Telefon numarası geçersiz görünüyor (05XX XXX XX XX).";
  if (/quota-exceeded/i.test(code)) return "SMS kotası doldu, daha sonra tekrar deneyin.";
  if (/billing|operation-not-allowed/i.test(code)) return "SMS servisi şu an kapalı, yönetime bildirin.";
  if (/captcha|error-code:\s*-?\d+/i.test(code))
    return "Tarayıcı doğrulaması başarısız. Sayfayı Safari veya Chrome'da açıp tekrar deneyin (uygulama içi tarayıcılar SMS gönderemiyor).";
  return raw || "İşlem tamamlanamadı";
}

/**
 * reCAPTCHA container'ını hazırlar.
 * Uygulama içi tarayıcıda görünür captcha sağ alta sıkıştığı için
 * ekranın ortasında modal olarak açılır.
 */
export function mountRecaptchaHolder(): { holder: HTMLDivElement; cleanup: () => void } {
  const holder = document.createElement("div");
  holder.id = "recaptcha-holder-" + Date.now();

  if (typeof document === "undefined" || !isInAppBrowser()) {
    document.body.appendChild(holder);
    return { holder, cleanup: () => holder.remove() };
  }

  const overlay = document.createElement("div");
  overlay.id = "recaptcha-overlay-" + Date.now();
  overlay.setAttribute(
    "style",
    "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.8);padding:16px"
  );
  const card = document.createElement("div");
  card.setAttribute(
    "style",
    "background:#fff;color:#111;border-radius:14px;padding:18px;max-width:340px;width:100%;text-align:center;font:14px system-ui,sans-serif"
  );
  const title = document.createElement("p");
  title.textContent = "Devam etmek için aşağıdaki kutuyu işaretleyin";
  title.setAttribute("style", "margin:0 0 12px;font-weight:600");
  const center = document.createElement("div");
  center.setAttribute("style", "display:flex;justify-content:center;min-height:78px");
  center.appendChild(holder);
  const cancel = document.createElement("button");
  cancel.textContent = "İptal";
  cancel.setAttribute("style", "margin-top:14px;background:#eee;border:0;border-radius:8px;padding:10px 18px;font-size:14px");
  cancel.onclick = () => overlay.remove();
  card.append(title, center, cancel);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  return { holder, cleanup: () => overlay.remove() };
}

/** Uygulama içi (Instagram/Telegram/Facebook) tarayıcı tespiti. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|FB_IAB|Instagram|Telegram|MicroMessenger|TikTok/i.test(navigator.userAgent);
}
