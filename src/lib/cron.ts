import cron from "node-cron";
import { sendDailyTimetable } from "@/service/sendNotification";

export function startCron() {
  console.log("Cron jobs started 🚀");

  // 🕗 8:00 AM - Today
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("Running 8 AM job...");
      await sendDailyTimetable("today");
    },
    { timezone: "Asia/Kolkata" }
  );

  // 🌙 8:00 PM - Tomorrow
  cron.schedule(
    "0 20 * * *",
    async () => {
      console.log("Running 8 PM job...");
      await sendDailyTimetable("tomorrow");
    },
    { timezone: "Asia/Kolkata" }
  );

  // 🧪 TEST JOBS (TEMPORARY)

  // 2:20 AM
  cron.schedule(
    "20 2 * * *",
    async () => {
      console.log("Running 2:20 AM test...");
      await sendDailyTimetable("today");
    },
    { timezone: "Asia/Kolkata" }
  );

  // 2:40 AM
  cron.schedule(
    "40 2 * * *",
    async () => {
      console.log("Running 2:40 AM test...");
      await sendDailyTimetable("today");
    },
    { timezone: "Asia/Kolkata" }
  );

  // 3:00 AM
  cron.schedule(
    "0 3 * * *",
    async () => {
      console.log("Running 3:00 AM test...");
      await sendDailyTimetable("today");
    },
    { timezone: "Asia/Kolkata" }
  );

  // 4:00 AM
  cron.schedule(
    "0 4 * * *",
    async () => {
      console.log("Running 4:00 AM test...");
      await sendDailyTimetable("today");
    },
    { timezone: "Asia/Kolkata" }
  );
}