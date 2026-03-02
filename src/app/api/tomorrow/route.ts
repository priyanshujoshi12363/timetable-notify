import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { Timetable } from "@/models/Timetable";
import UserDevice from "@/models/student";
import { sendFCM } from "@/service/fcmSender";
import { sendExpoPush } from "@/service/sendExpoPush";

/* -------------------------------------------- */
/* 🔥 TOMORROW MOTIVATIONAL QUOTES              */
/* -------------------------------------------- */

const tomorrowQuotes = [
  "Prepare today, conquer tomorrow 🚀",
  "Tomorrow is another opportunity to grow 🌱",
  "Rest well. Tomorrow you build your future 💪",
  "Success is built one day at a time ⏳",
  "Get ready to win tomorrow 🏆",
  "Your tomorrow depends on today’s mindset 🔥",
  "Stay focused. Tomorrow is yours 🎯",
  "New day. New goals. New victories ✨",
  "Recharge tonight, perform tomorrow ⚡",
  "Tomorrow is another step toward greatness 🌞"
];

function getTomorrowQuote() {
  return tomorrowQuotes[
    Math.floor(Math.random() * tomorrowQuotes.length)
  ];
}

/* -------------------------------------------- */
/* 🔥 API FUNCTION                              */
/* -------------------------------------------- */

export async function POST() {
  try {
    await connectDB();

    // 🔥 Calculate tomorrow (India timezone)
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const tomorrow = tomorrowDate.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    console.log("📅 Tomorrow:", tomorrow);

    const quote = getTomorrowQuote();

    const timetables = await Timetable.find({
    });

    if (!timetables.length) {
      console.log("❌ No timetables found");
      return NextResponse.json({ success: true });
    }

    for (const timetable of timetables) {

      // 🔥 Find tomorrow schedule
      const schedule = timetable.schedule.find(
        (d: any) =>
          d.day.toLowerCase() === tomorrow.toLowerCase()
      );

      // 🔥 Get users of same division
      const users = await UserDevice.find({
        division: timetable.division,
        branch: timetable.branch,
        course: timetable.course,
        semester: timetable.semester,
        academicYear: timetable.academicYear,
      });

      if (!users.length) {
        console.log("❌ No users found");
        continue;
      }

      const expoTokens: string[] = [];
      const fcmTokens: string[] = [];

      users.forEach((user: any) => {
        if (user.expoToken) {
          expoTokens.push(user.expoToken);
        } else if (user.fcmToken) {
          fcmTokens.push(user.fcmToken);
        }
      });

      console.log("📲 Expo:", expoTokens.length);
      console.log("📲 FCM:", fcmTokens.length);

      /* -------------------------------------------------- */
      /* 🔥 CASE 1: NO CLASSES TOMORROW                    */
      /* -------------------------------------------------- */

      if (!schedule) {

        const noClassMessage = `✨ ${quote}

🎉 No classes tomorrow (${tomorrow}).
Enjoy your day and recharge 💪`;

        if (expoTokens.length) {
          await sendExpoPush(expoTokens, {
            title: "📅 Tomorrow: No Classes",
            body: noClassMessage,
          });
        } else if (fcmTokens.length) {
          await sendFCM(fcmTokens, {
            title: "📅 Tomorrow: No Classes",
            body: noClassMessage,
          });
        }

        continue;
      }

      /* -------------------------------------------------- */
      /* 🔥 BUILD COMPRESSED FULL DAY TIMETABLE            */
      /* -------------------------------------------------- */

      const compressedLines = schedule.slots
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
        .slice(0, 6); // 🔥 Max 6 lines

      const timetableText = compressedLines.join("\n");

      const finalNotificationBody = `✨ ${quote}

📚 ${tomorrow} Schedule:

${timetableText}`;

      /* -------------------------------------------------- */
      /* 🔥 SEND WITH EXPO PRIORITY                        */
      /* -------------------------------------------------- */

      if (expoTokens.length) {
        console.log("🚀 Sending Expo Tomorrow Notification...");
        await sendExpoPush(expoTokens, {
          title: `📅 ${tomorrow}'s Classes`,
          body: finalNotificationBody,
        });
      } else if (fcmTokens.length) {
        console.log("🚀 Sending FCM Tomorrow Notification...");
        await sendFCM(fcmTokens, {
          title: `📅 ${tomorrow}'s Classes`,
          body: finalNotificationBody,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tomorrow notifications sent successfully",
    });

  } catch (error) {
    console.error("🔥 API ERROR:", error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}