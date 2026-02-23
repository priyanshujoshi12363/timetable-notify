import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { BTech_CSE_AIML } from "@/data/time_table/BTech_CSE_AIML";
import { Timetable } from "@/models/Timetable";
export async function GET() {
  try {
    await connectDB();

    await Timetable.deleteMany({
      branch: "CSE",
      course: "AIML",
      semester: 2
    });

    const formatted = BTech_CSE_AIML.map((item: any) => ({
      branch: "CSE",
      course: "AIML",
      semester: 2,
      academicYear: "2024-2025",
      division: item.class,
      schedule: item.schedule
    }));

    await Timetable.insertMany(formatted);

    return NextResponse.json({
      message: "Semester 2 timetable inserted successfully"
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}