import { NextResponse } from "next/server";
import { Timetable } from "@/models/Timetable";
import connectDB from "@/utils/db";
export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const division = searchParams.get("division");

  if (!division) {
    return NextResponse.json(
      { error: "Division required" },
      { status: 400 }
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata"
  });

  const timetable = await Timetable.findOne({ division });

  if (!timetable) {
    return NextResponse.json(
      { error: "Timetable not found" },
      { status: 404 }
    );
  }

  const todaySchedule = timetable.schedule.find(
    (d: any) => d.day === today
  );

  return NextResponse.json({
    day: today,
    slots: todaySchedule?.slots || []
  });
}