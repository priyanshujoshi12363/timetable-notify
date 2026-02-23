import { messaging } from "@/lib/firebaseAdmin";

export async function sendFCM(
  tokens: string[],
  payload: { title: string; body: string }
) {
  if (!tokens?.length) return;

  try {
    const chunkSize = 500;

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);

      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        android: { priority: "high" },
      });

      console.log(
        `Chunk sent: ${response.successCount} success, ${response.failureCount} failed`
      );
    }
  } catch (error) {
    console.error("Error sending FCM:", error);
  }
}