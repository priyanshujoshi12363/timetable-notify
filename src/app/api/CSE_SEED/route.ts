import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { Timetable } from "@/models/Timetable";
import { timetableData } from "@/data/time_table/Btech_CSE_CORE";
export async function GET() {
  try {
    await connectDB();

    const transformedData = {
      branch: "CSE",
      course: "B.Tech",
      semester: 2,
      academicYear: "2025-26",
      division: timetableData.class.replace(/\s+/g, "_"),
      schedule: timetableData.schedule
    };

    await Timetable.deleteMany({ division: transformedData.division });

    const created = await Timetable.create(transformedData);

    return NextResponse.json({
      success: true,
      message: "Timetable seeded successfully",
      data: created
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error
    });
  }
}