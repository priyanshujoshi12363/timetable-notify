import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import UserDevice from "@/models/student";
import connectDB from "@/utils/db";

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("userId");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Document id is required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid document id format" },
        { status: 400 }
      );
    }

    const deletedDoc = await UserDevice.findByIdAndDelete(id);

    if (!deletedDoc) {
      return NextResponse.json(
        { success: false, message: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Device deleted permanently" },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Error deleting device:", error);

    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}