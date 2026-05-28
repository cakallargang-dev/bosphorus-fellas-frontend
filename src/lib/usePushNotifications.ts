"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { notificationsApi } from "@/lib/api";
import { registerPushNotifications, onPushNotification, isNative } from "@/lib/native";

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isNative || !isAuthenticated) return;

    let cleanup: (() => void) | undefined;

    const setup = async () => {
      const token = await registerPushNotifications();
      if (token) {
        try {
          await notificationsApi.registerToken(token, "ios");
        } catch {
          // token registered on backend
        }
      }

      cleanup = onPushNotification((notification) => {
        // Handle incoming push notification while app is open
        if (notification.title) {
          // Could show in-app toast or navigate
        }
      });
    };

    setup();

    return () => {
      cleanup?.();
    };
  }, [isAuthenticated]);
}
