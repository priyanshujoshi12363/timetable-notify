import { NextRequest, NextResponse } from "next/server";
import UserDevice from "@/models/student";
import { Timetable } from "@/models/Timetable";
import { messaging } from "@/lib/firebaseAdmin";
import connectDB from "@/utils/db";
export async function POST(req: NextRequest) {
  try {

    await connectDB()
    const { token, type } = await req.json();

    if (!token || !type) {
      return NextResponse.json(
        { error: "Token and type (today/tomorrow) required" },
        { status: 400 }
      );
    }

    const user = await UserDevice.findOne({ fcmToken: token });

    if (!user) {
      return NextResponse.json(
        { error: "User not found for this token" },
        { status: 404 }
      );
    }

    const date = new Date();

    if (type === "tomorrow") {
      date.setDate(date.getDate() + 1);
    }

    const dayName = date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    const timetable = await Timetable.findOne({
      branch: user.branch,
      course: user.course,
      division: user.division,
      semester: user.semester,
      academicYear: user.academicYear,
    });

    if (!timetable) {
      return NextResponse.json(
        { error: "Timetable not found" },
        { status: 404 }
      );
    }

    const schedule = timetable.schedule.find(
      (d: any) => d.day.toLowerCase() === dayName.toLowerCase()
    );

    if (!schedule) {
      return NextResponse.json(
        { error: "No schedule for this day" },
        { status: 404 }
      );
    }

    const message = schedule.slots
      .map((slot: any) => {
        if (slot.subject) {
          return `${slot.time} → ${slot.subject} (${slot.room})`;
        }

        if (slot.batches && slot.batches.length > 0) {
          return slot.batches
            .map(
              (b: any) =>
                `${slot.time} → Batch ${b.batch} ${b.subject} (${b.room})`
            )
            .join("\n");
        }

        return null;
      })
      .filter(Boolean)
      .join("\n\n");

    await messaging.send({
      token,
      data: {
        title:
          type === "today"
            ? "📅 Today's Classes"
            : "📅 Tomorrow's Classes",
        body: message,
      },
      webpush: {
        headers: { Urgency: "high" },
        fcmOptions: { link: "/" },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}