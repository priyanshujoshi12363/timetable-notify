"use client";

import { getToken  , getMessaging} from "firebase/messaging";
import { app } from "./firebase";
export async function generateFCMToken(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Permission denied");
      return null;
    }
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
    });

    return token;
  } catch (error) {
    console.error("FCM error:", error);
    return null;
  }
}