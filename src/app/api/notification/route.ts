import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { sendDailyTimetable } from "@/service/sendNotification";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); 

    if (type !== "today" && type !== "tomorrow") {
      return NextResponse.json(
        { success: false, message: "Invalid type" },
        { status: 400 }
      );
    }

    await sendDailyTimetable(type as "today" | "tomorrow");

    return NextResponse.json({
      success: true,
      message: `Notification sent for ${type}`,
    });

  } catch (error) {
    console.error("Cron notification error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}