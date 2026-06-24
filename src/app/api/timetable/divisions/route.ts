export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { Timetable } from "@/models/Timetable";

export async function GET() {
  try {
    await connectDB();

    const docs = await Timetable.find(
      {},
      { division: 1, branch: 1, course: 1, semester: 1, _id: 0 }
    )
      .sort({ course: 1, division: 1 })
      .lean();

    return NextResponse.json({ success: true, divisions: docs });
  } catch (error: any) {
    console.error("divisions error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal error", divisions: [] },
      { status: 500 }
    );
  }
}
