import { messaging } from "@/lib/firebaseAdmin";

export async function sendFCM(
  tokens: string[],
  payload: { title: string; body: string }
) {
  if (!tokens?.length) return;

  try {
    const baseUrl = "https://timetable-notify.onrender.com";

    const response = await messaging.sendEachForMulticast({
      tokens,

      notification: {
        title: payload.title,
        body: payload.body,
      },

      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          icon: `${baseUrl}/favicon.ico`,
          badge: `${baseUrl}/favicon.ico`,
          requireInteraction: true, // 👈 stays until user closes
          tag: "daily-timetable", // prevents stacking duplicates
          renotify: true,
        },
        fcmOptions: {
          link: "/", // open homepage
        },
      },
    });

    console.log(
      `Success: ${response.successCount}, Failed: ${response.failureCount}`
    );

  } catch (error) {
    console.error("Error sending FCM:", error);
  }
}