"use client";

import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
export default function NotificationListener() {
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
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

    return () => unsubscribe();
  }, []);

  return null;
}