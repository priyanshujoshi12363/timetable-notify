"use client";

import { useEffect } from "react";
import { app } from "@/lib/firebase";
export default function NotificationListener() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initMessaging = async () => {
      if (typeof window === "undefined") return;

      const { getMessaging, onMessage } = await import("firebase/messaging");

      const messaging = getMessaging(app);

      unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message:", payload);

        if (Notification.permission === "granted") {
          new Notification(
            payload.notification?.title || "New Notification",
            {
              body: payload.notification?.body,
              icon: payload.notification?.icon || "/favicon.ico",
            }
          );
        }
      });
    };

    initMessaging();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return null;
}