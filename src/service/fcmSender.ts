import { messaging } from "@/lib/firebaseAdmin";
import connectDB from "@/utils/db";
import UserDevice from "@/models/student";

const DEAD_TOKEN_CODES = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
];

export async function sendFCM(
  tokens: string[],
  payload: { title: string; body: string }
) {
  if (!tokens?.length) return;

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      data: {
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        headers: { Urgency: "high", TTL: "86400" },
        fcmOptions: { link: "/" },
      },
    });

    console.log(
      `FCM Success: ${response.successCount}, Failed: ${response.failureCount}`
    );

    const deadTokens: string[] = [];
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        const code = (resp.error as any)?.code || "";
        if (DEAD_TOKEN_CODES.includes(code)) {
          deadTokens.push(tokens[index]);
        }
        console.log("⚠ Failed token:", code, tokens[index]);
      }
    });

    if (deadTokens.length) {
      await connectDB();
      const result = await UserDevice.deleteMany({ fcmToken: { $in: deadTokens } });
      console.log(`🧹 Pruned ${result.deletedCount} expired FCM token(s)`);
    }
  } catch (error) {
    console.error("FCM Send Error:", error);
  }
}
