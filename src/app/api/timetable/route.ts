import { NextResponse } from "next/server";
import { Timetable } from "@/models/Timetable";
import connectDB from "@/utils/db";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const division = searchParams.get("division");
    const dayParam = searchParams.get("day"); 

    if (!division) {
      return NextResponse.json(
        { error: "Division required" },
        { status: 400 }
      );
    }

    let targetDay;
    if (dayParam) {
    
      targetDay = dayParam;
     
    } else {
   
      targetDay = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "Asia/Kolkata"
      });
    }

    const timetable = await Timetable.findOne({ division });

    if (!timetable) {
      console.log("❌ No timetable found for division:", division);
      return NextResponse.json(
        { error: "Timetable not found for this division" },
        { status: 404 }
      );
    }


    const daySchedule = timetable.schedule.find(
      (d: any) => d.day.toLowerCase() === targetDay.toLowerCase()
    );

    if (!daySchedule) {
   
      return NextResponse.json({
        success: true,
        division: division,
        requestedDay: targetDay,
        message: `No classes scheduled for ${targetDay}`,
        slots: [],
        debug: {
          availableDays: timetable.schedule.map((d: any) => d.day)
        }
      });
    }

    return NextResponse.json({
      success: true,
      division: division,
      requestedDay: targetDay,
      day: daySchedule.day,
      slots: daySchedule.slots || [],
      isToday: !dayParam 
    });

  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}