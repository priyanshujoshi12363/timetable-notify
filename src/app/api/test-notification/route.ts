import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { sendDailyTimetable } from "@/service/sendNotification";
export async function GET() {
  await connectDB();

  await sendDailyTimetable("today");

  return NextResponse.json({
    success: true,
    message: "Notification test triggered",
  });
}