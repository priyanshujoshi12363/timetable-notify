export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { Timetable } from "@/models/Timetable";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const division = searchParams.get("division");
    if (!division) {
      return NextResponse.json({ success: false, message: "division required" }, { status: 400 });
    }

    const timetable = await Timetable.findOne({ division }).lean();
    if (!timetable) {
      return NextResponse.json({ success: true, exists: false });
    }

    return NextResponse.json({ success: true, exists: true, timetable });
  } catch (error: any) {
    console.error("get timetable error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}
