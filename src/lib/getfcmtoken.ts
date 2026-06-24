"use client";

import { getToken, getMessaging, isSupported } from "firebase/messaging";
import { app } from "./firebase";

export async function generateFCMToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;

    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers are not supported in this browser.");
      return null;
    }

    if (!window.isSecureContext) {
      console.warn(
        "Notifications need a secure origin. Open the app at http://localhost:3000 (not a LAN IP) or over HTTPS."
      );
      return null;
    }

    if (!(await isSupported())) {
      console.warn("Firebase Messaging is not supported in this browser.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied.");
      return null;
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error("FCM error:", error);
    return null;
  }
}
