export const runtime = "nodejs";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { parseTimetablePdf } from "@/lib/pdfTimetable";
import { normalizeSchedule } from "@/lib/timetable";

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No PDF uploaded (field 'file')" },
        { status: 400 }
      );
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json(
        { success: false, message: "Please upload a PDF file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, message: "PDF too large (max 15MB)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { meta, schedule: rawSchedule } = await parseTimetablePdf(buffer);
    const schedule = normalizeSchedule(rawSchedule);

    if (!schedule.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Read the PDF but couldn't find any classes. The layout may differ from the expected format.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, meta, schedule });
  } catch (error: any) {
    console.error("PDF PARSE ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to parse PDF" },
      { status: 500 }
    );
  }
}
