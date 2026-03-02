import { NextResponse } from "next/server";
import { messaging } from "@/lib/firebaseAdmin";
export async function GET() {
  try {
    const token = "cXAnYHyTEVLE4LkuRtFD7-:APA91bGuDaJQITI5651qysgCaTe5Z479EfXOiny1yLhWmy_LaQif9wQAsItHzXefOmSxnFApklRwnMi2uuSB49O-jPNVAD4IeDz83R1lxCcgeYfAwFDqqUU";

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