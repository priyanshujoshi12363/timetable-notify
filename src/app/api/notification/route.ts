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

    const quote = getRandomQuote();

    const timetables = await Timetable.find({
    });

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
      });

      if (!users.length) continue;

      const expoTokens: string[] = [];
      const fcmTokens: string[] = [];

      users.forEach((user: any) => {
        if (user.expoToken) expoTokens.push(user.expoToken);
        else if (user.fcmToken) fcmTokens.push(user.fcmToken);
      });

      // No schedule found for today
      if (!schedule) {
        const noClassMessage = `✨ ${quote}\n\n😌 Today is ${today}. No classes scheduled.\nRecharge yourself and come back stronger 💪`;

        if (expoTokens.length) {
          await sendExpoPush(expoTokens, {
            title: "🎉 No Classes Today!",
            body: noClassMessage,
          });
        } else if (fcmTokens.length) {
          await sendFCM(fcmTokens, {
            title: "🎉 No Classes Today!",
            body: noClassMessage,
          });
        }
        continue;
      }

      // Filter slots based on type
      let filteredSlots = schedule.slots;

      if (type === "morning") {
        filteredSlots = schedule.slots.filter((slot: any) =>
          ["09:30-10:25", "10:25-11:20"].includes(slot.time)
        );
      } else if (type === "afternoon") {
        filteredSlots = schedule.slots.filter((slot: any) =>
          ["12:20-01:15", "01:15-02:10"].includes(slot.time)
        );
      } else if (type === "evening") {
        filteredSlots = schedule.slots.filter((slot: any) =>
          ["02:30-03:25", "03:25-04:20"].includes(slot.time)
        );
      }

      if (!filteredSlots.length) continue;

      // Format slot messages
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

      const finalNotificationBody = `✨ ${quote}\n\n📚 ${
        type === "today"
          ? `${today} Full Schedule`
          : `${type.charAt(0).toUpperCase() + type.slice(1)} Classes`
      }:\n\n${slotMessage}`;

      // Send notifications
      if (expoTokens.length) {
        await sendExpoPush(expoTokens, {
          title:
            type === "today"
              ? "📚 Today's Classes"
              : `📖 ${type.charAt(0).toUpperCase() + type.slice(1)} Classes`,
          body: finalNotificationBody,
        });
      } else if (fcmTokens.length) {
        await sendFCM(fcmTokens, {
          title:
            type === "today"
              ? "📚 Today's Classes"
              : `📖 ${type.charAt(0).toUpperCase() + type.slice(1)} Classes`,
          body: finalNotificationBody,
        });
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