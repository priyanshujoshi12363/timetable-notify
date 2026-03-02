import { messaging } from "@/lib/firebaseAdmin";

export async function sendFCM(
  tokens: string[],
  payload: { title: string; body: string }
) {
  if (!tokens?.length) return;

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
        },
      },
    });

    console.log(
      `FCM Success: ${response.successCount}, Failed: ${response.failureCount}`
    );

    // 🔥 Just log bad tokens, don't remove them
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        console.log(
          "⚠ Skipped invalid token:",
          tokens[index]
        );
      }
    });

  } catch (error) {
    console.error("FCM Send Error:", error);
  }
}