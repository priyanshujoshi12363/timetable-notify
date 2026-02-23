import UserDevice from "@/models/student";
import { Timetable } from "@/models/Timetable";
import { sendFCM } from "./fcmSender";
export async function sendDailyTimetable(
  type: "today" | "tomorrow"
) {
  try {
    const date = new Date();

    if (type === "tomorrow") {
      date.setDate(date.getDate() + 1);
    }

    const dayName = date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    console.log(`Sending ${type} timetable for ${dayName}`);

    const users = await UserDevice.find({
      fcmToken: { $ne: null },
    });

    if (!users.length) {
      console.log("No users found.");
      return;
    }

    // 🔥 Group by full academic structure
    const grouped: Record<string, string[]> = {};

    users.forEach((user) => {
      const key = `${user.branch}_${user.course}_${user.division}_${user.semester}_${user.academicYear}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(user.fcmToken);
    });

    for (const key in grouped) {
      const [branch, course, division, semester, academicYear] =
        key.split("_");

      const timetable = await Timetable.findOne({
        branch,
        course,
        division,
        semester: Number(semester),
        academicYear,
      });

      if (!timetable) continue;

      const schedule = timetable.schedule.find(
        (d: any) =>
          d.day.toLowerCase() === dayName.toLowerCase()
      );

      if (!schedule) continue;

      const message = schedule.slots
        .map((slot: any) => {
          if (slot.subject) {
            return `${slot.time} → ${slot.subject} (${slot.room})`;
          }

          if (slot.batches && slot.batches.length > 0) {
            const batchLines = slot.batches
              .map(
                (b: any) =>
                  `   Batch ${b.batch} → ${b.subject} (${b.room})`
              )
              .join("\n");

            return `${slot.time}\n${batchLines}`;
          }

          return null;
        })
        .filter(Boolean)
        .join("\n\n");

      await sendFCM(grouped[key], {
        title:
          type === "today"
            ? "📅 Today's Classes"
            : "📅 Tomorrow's Classes",
        body: message,
      });

      console.log(`Notification sent to ${division}`);
    }
  } catch (error) {
    console.error("Error sending timetable:", error);
  }
}