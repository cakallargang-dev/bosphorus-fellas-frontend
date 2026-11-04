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
  if (!cachedAuth) cachedAuth = getAuth(ensureApp());
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

/** Uygulama içi (Instagram/Telegram/Facebook) tarayıcı tespiti. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|FB_IAB|Instagram|Telegram|MicroMessenger|TikTok/i.test(navigator.userAgent);
}
