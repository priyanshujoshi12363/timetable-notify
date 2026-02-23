import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/utils/db";
import UserDevice from "@/models/student";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { branch, course, division, semester } = body;

    // Default academic year
    const academicYear = "2024-2025";

    if (!branch || !course || !division || !semester) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (typeof semester !== "number") {
      return NextResponse.json(
        { success: false, message: "Semester must be a number" },
        { status: 400 }
      );
    }

    await connectDB();

    const updatedSubscription = await UserDevice.findByIdAndUpdate(
      id,
      {
        branch,
        course,
        division,
        semester,
        academicYear, // force correct academic year
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedSubscription) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      data: updatedSubscription,
    });

  } catch (error) {
    console.error("Error updating subscription:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}