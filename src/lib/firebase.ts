"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

/** 0555 111 22 33 → +905551112233 */
export function toE164(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("90")) return "+" + digits;
  if (digits.startsWith("0")) return "+90" + digits.slice(1);
  if (digits.length === 10) return "+90" + digits;
  return "+" + digits;
}
