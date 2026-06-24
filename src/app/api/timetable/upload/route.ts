export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { Timetable } from "@/models/Timetable";
import { normalizeSchedule } from "@/lib/timetable";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      branch,
      course,
      semester,
      academicYear,
      division,
      schedule: rawSchedule,
    } = body || {};

    if (!branch || !course || !division || semester === undefined) {
      return NextResponse.json(
        { success: false, message: "branch, course, division and semester are required" },
        { status: 400 }
      );
    }

    const sem = Number(semester);
    if (Number.isNaN(sem)) {
      return NextResponse.json(
        { success: false, message: "semester must be a number" },
        { status: 400 }
      );
    }

    const schedule = normalizeSchedule(rawSchedule);
    if (!schedule.length) {
      return NextResponse.json(
        { success: false, message: "Schedule is empty after validation" },
        { status: 400 }
      );
    }

    const timetable = await Timetable.findOneAndUpdate(
      { division },
      {
        branch,
        course,
        semester: sem,
        academicYear: academicYear || "2024-2025",
        division,
        schedule,
        source: "upload",
        uploadedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Timetable saved for ${division}. Notifications will use it from the next send.`,
      data: timetable,
    });
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "A timetable for this division already exists and could not be updated." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to save timetable" },
      { status: 500 }
    );
  }
}
