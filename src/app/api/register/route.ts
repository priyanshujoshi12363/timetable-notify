import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import UserDevice from "@/models/student";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      branch,
      course,
      division,
      semester,
      fcmToken,
    } = body;

    // 🔥 Default academic year
    const academicYear = "2024-2025";

    // ✅ Validation
    if (
      !branch ||
      !course ||
      !division ||
      !semester ||
      !fcmToken
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    if (typeof semester !== "number") {
      return NextResponse.json(
        {
          success: false,
          message: "Semester must be a number",
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

    // ✅ Upsert device
    const device = await UserDevice.findOneAndUpdate(
      { fcmToken },
      {
        branch,
        course,
        division,
        semester,
        academicYear, // auto set
      },
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
      },
      { status: 500 }
    );
  }
}