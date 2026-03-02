import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { Timetable } from "@/models/Timetable";
import UserDevice from "@/models/student";
import { sendFCM } from "@/service/fcmSender";
import { sendExpoPush } from "@/service/sendExpoPush";

const quotes = [
  "Push yourself, because no one else is going to do it for you 💪",
  "Small progress each day adds up to big results 🚀",
  "Discipline beats motivation. Stay consistent 🔥",
  "Your future is created by what you do today 📚",
  "Dream big. Start small. Act now ⚡",
  "Success doesn't come to you. You go to it 🎯",
  "Focus on growth, not excuses 🌱",
  "Make today count. You won't get it back ⏳",
  "Winners are not people who never fail, but who never quit 🏆",
  "Hard work today builds freedom tomorrow 🌞"
];

function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "today";

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    console.log("📅 Today:", today);
    console.log("📌 Type:", type);

    const timetables = await Timetable.find({
      division: "2CSE AIML 30"
    });

    if (!timetables.length) {
      console.log("⚠️ No timetables found");
      return NextResponse.json({ success: true, message: "No timetable found" });
    }

    const quote = getRandomQuote();

    for (const timetable of timetables) {

      const schedule = timetable.schedule.find(
        (d: any) => d.day.toLowerCase() === today.toLowerCase()
      );

      const users = await UserDevice.find({
        division: timetable.division,
        branch: timetable.branch,
        course: timetable.course,
        semester: timetable.semester,
        academicYear: timetable.academicYear,
      }).lean();;


      if (!users.length) {
        console.log("⚠️ No users found for division:", timetable.division);
        continue;
      }

      const expoTokens: string[] = [];
      const fcmTokens: string[] = [];

      users.forEach((user: any) => {
        if (user.expoToken) expoTokens.push(user.expoToken);
        if (user.fcmToken) fcmTokens.push(user.fcmToken);
      });

      console.log("👥 Users:", users.length);
      console.log("📲 Expo Tokens:", expoTokens.length);
      console.log("📲 FCM Tokens:", fcmTokens.length);

      // ===== NO CLASS TODAY =====
      if (!schedule) {
        const body = `✨ ${quote}\n\n😌 Today is ${today}. No classes scheduled.\nRecharge yourself and come back stronger 💪`;

        const payload = {
          title: "🎉 No Classes Today!",
          body,
        };

        if (expoTokens.length) {
          await sendExpoPush(expoTokens, payload);
        }

        if (fcmTokens.length) {
          await sendFCM(fcmTokens, payload);
        }

        continue;
      }

      // ===== FILTER SLOTS =====
      let filteredSlots = schedule.slots;

      const timeGroups: any = {
        morning: ["09:30-10:25", "10:25-11:20"],
        afternoon: ["12:20-01:15", "01:15-02:10"],
        evening: ["02:30-03:25", "03:25-04:20"],
      };

      if (type !== "today" && timeGroups[type]) {
        filteredSlots = schedule.slots.filter((slot: any) =>
          timeGroups[type].includes(slot.time)
        );
      }

      if (!filteredSlots.length) {
        console.log("⚠️ No matching slots for type:", type);
        continue;
      }

      const slotMessage = filteredSlots
        .map((slot: any) => {
          if (slot.subject) {
            return `${slot.time.split("-")[0]} ${slot.subject}`;
          }
          if (slot.batches?.length) {
            return `${slot.time.split("-")[0]} ${slot.batches
              .map((b: any) => b.subject)
              .join("/")}`;
          }
          return null;
        })
        .filter(Boolean)
        .join("\n");

      const body = `✨ ${quote}\n\n📚 ${
        type === "today"
          ? `${today} Full Schedule`
          : `${type.charAt(0).toUpperCase() + type.slice(1)} Classes`
      }:\n\n${slotMessage}`;

      const payload = {
        title:
          type === "today"
            ? "📚 Today's Classes"
            : `📖 ${type.charAt(0).toUpperCase() + type.slice(1)} Classes`,
        body,
      };

      // ===== SEND TO BOTH TYPES =====
      if (expoTokens.length) {
        await sendExpoPush(expoTokens, payload);
      }

      if (fcmTokens.length) {
        await sendFCM(fcmTokens, payload);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notifications processed for ${type}`,
    });

  } catch (error: any) {
    console.error("🔥 API ERROR:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}