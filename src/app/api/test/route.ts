import { NextResponse } from "next/server";
import { messaging } from "@/lib/firebaseAdmin";
export async function GET() {
  try {
    const token = "cemqOPy-kbnNSLmVdonhI1:APA91bEJqnAAYE4TEnoxdGVAhoUUcqLZN_soXNZ3tjlBmlDmVRC5OZOWfE-WdeBuCOpGtLFYwGaFMJHo7BR4Fm3nrAucvIib0aHpc_QwYcwjPiW_o_n-g20";

    const response = await messaging.send({
      token,
      notification: {
        title: "🔥 Direct Test",
        body: "If you see this, backend is working!",
      },
      webpush: {
        notification: {
          icon: "https://your-app.onrender.com/og-image.png",
        },
        fcmOptions: {
          link: "/",
        },
      },
    });

    console.log("Single send success:", response);

    return NextResponse.json({
      success: true,
      message: "Notification sent",
    });

  } catch (error: any) {
    console.error("Single send error:", error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}