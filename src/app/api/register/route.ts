import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import UserDevice from "@/models/student";

export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      branch,
      course,
      division,
      semester,
      fcmToken,
      expoToken,
      deviceId,
      academicYear: academicYearInput,
    } = await req.json();

    const academicYear = academicYearInput || "2024-2025";

    if (!branch || !course || !division || !semester) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!fcmToken && !expoToken) {
      return NextResponse.json(
        { success: false, message: "At least one token is required" },
        { status: 400 }
      );
    }

    if (typeof semester !== "number") {
      return NextResponse.json(
        { success: false, message: "Semester must be a number" },
        { status: 400 }
      );
    }

    if (fcmToken && (typeof fcmToken !== "string" || fcmToken.length < 20)) {
      return NextResponse.json(
        { success: false, message: "Invalid FCM token" },
        { status: 400 }
      );
    }

    if (expoToken && !expoToken.startsWith("ExponentPushToken")) {
      return NextResponse.json(
        { success: false, message: "Invalid Expo token" },
        { status: 400 }
      );
    }

    const base = { branch, course, division, semester, academicYear };

    let device = null;

    if (deviceId) {
      if (fcmToken) {
        await UserDevice.deleteMany({ fcmToken, deviceId: { $ne: deviceId } });
      }
      if (expoToken) {
        await UserDevice.deleteMany({ expoToken, deviceId: { $ne: deviceId } });
      }

      device = await UserDevice.findOneAndUpdate(
        { deviceId },
        {
          ...base,
          deviceId,
          ...(fcmToken ? { fcmToken } : {}),
          ...(expoToken ? { expoToken } : {}),
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      const searchConditions: any[] = [];
      if (fcmToken) searchConditions.push({ fcmToken });
      if (expoToken) searchConditions.push({ expoToken });

      if (searchConditions.length > 0) {
        device = await UserDevice.findOne({ $or: searchConditions });
      }

      if (device) {
        Object.assign(device, base);
        if (fcmToken) device.fcmToken = fcmToken;
        if (expoToken) device.expoToken = expoToken;
        await device.save();
      } else {
        device = await UserDevice.create({
          ...base,
          fcmToken: fcmToken || undefined,
          expoToken: expoToken || undefined,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Device registered successfully",
        data: device,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
