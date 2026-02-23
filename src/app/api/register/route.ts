import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import UserDevice from "@/models/student";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const { course, branch, division, fcmToken } = body;

    if (!course || !branch || !division || !fcmToken) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    if (typeof fcmToken !== "string" || fcmToken.length < 20) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid FCM token",
        },
        { status: 400 }
      );
    }


    const device = await UserDevice.findOneAndUpdate(
      { fcmToken },
      { course, branch, division },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Device registered successfully",
        data: device,
      },
      { status: 200 }
    );
 } catch (error: any) {
  console.error("FULL ERROR:", error);

  return NextResponse.json(
    {
      success: false,
      message: error.message,
      stack: error.stack
    },
    { status: 500 }
  );
}
}