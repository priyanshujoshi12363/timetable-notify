import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export async function sendExpoPush(
  tokens: string[],
  payload: { title: string; body: string }
) {
  try {
    const validTokens = tokens.filter((token) =>
      Expo.isExpoPushToken(token)
    );

    if (!validTokens.length) {
      console.log("No valid Expo tokens found.");
      return;
    }

    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title: payload.title,
      body: payload.body,
      priority: "high",
    }));

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    console.log(`Expo push sent to ${validTokens.length} users`);
  } catch (error) {
    console.error("Expo Push Error:", error);
  }
}