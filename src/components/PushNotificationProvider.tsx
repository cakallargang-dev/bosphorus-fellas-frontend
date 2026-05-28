"use client";

import { usePushNotifications } from "@/lib/usePushNotifications";

export function PushNotificationProvider() {
  usePushNotifications();
  return null;
}
