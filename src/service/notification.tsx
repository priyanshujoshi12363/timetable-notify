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

      unsubscribe = onMessage(messaging, async (payload) => {
        console.log("Foreground message:", payload);

        if (Notification.permission !== "granted") return;

        const title =
          payload.data?.title || payload.notification?.title || "Class Compass";
        const body = payload.data?.body || payload.notification?.body || "";

        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.showNotification(title, { body, icon: "/icon.png" });
        } else {
          new Notification(title, { body, icon: "/icon.png" });
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