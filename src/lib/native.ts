// Native platform utilities for Capacitor
// Only runs in native context (iOS/Android), falls back gracefully on web

import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

// ─── Biometric (Face ID) ───

let BiometricAuth: any = null;

async function getBiometric() {
  if (!isNative) return null;
  if (!BiometricAuth) {
    const mod = await import('@aparajita/capacitor-biometric-auth');
    BiometricAuth = mod.BiometricAuth;
  }
  return BiometricAuth;
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const bio = await getBiometric();
    if (!bio) return false;
    const result = await bio.checkBiometry();
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometric(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const bio = await getBiometric();
    if (!bio) return false;
    await bio.authenticate({
      reason: 'ManCave girişi için kimlik doğrulama',
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Push Notifications ───

let PushNotificationsModule: any = null;

async function getPush() {
  if (!isNative) return null;
  if (!PushNotificationsModule) {
    const mod = await import('@capacitor/push-notifications');
    PushNotificationsModule = mod.PushNotifications;
  }
  return PushNotificationsModule;
}

export async function registerPushNotifications(): Promise<string | null> {
  if (!isNative) return null;
  try {
    const push = await getPush();
    if (!push) return null;

    // Request permission
    const permStatus = await push.requestPermissions();
    if (permStatus.receive !== 'granted') return null;

    // Register
    await push.register();

    return new Promise((resolve) => {
      push.addListener('registration', (token: { value: string }) => {
        resolve(token.value);
      });

      push.addListener('registrationError', () => {
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

export function onPushNotification(
  callback: (data: { title?: string; body?: string }) => void
): () => void {
  if (!isNative) return () => {};
  
  let cleanups: (() => void)[] = [];

  getPush().then((push) => {
    if (!push) return;

    const l1 = push.addListener('pushNotificationReceived', (notification: any) => {
      callback(notification);
    });

    const l2 = push.addListener('pushNotificationActionPerformed', (action: any) => {
      callback(action.notification);
    });

    cleanups = [() => l1.remove(), () => l2.remove()];
  });

  return () => cleanups.forEach((fn) => fn());
}
