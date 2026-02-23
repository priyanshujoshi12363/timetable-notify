import mongoose from "mongoose";
import { Timetable } from "@/models/Timetable";
import { BTech_CSE_AIML } from "@/data/time_table/BTech_CSE_AIML";
export const seedSemester2Timetable = async () => {
  try {
    console.log("Connecting to DB...");

    await mongoose.connect(process.env.MONGODB_URI as string);

    console.log("Connected.");

    // Remove existing semester 2 AIML data (optional safety)
    await Timetable.deleteMany({
      branch: "CSE",
      course: "AIML",
      semester: 2
    });

    const formattedData = BTech_CSE_AIML.map((item: any) => ({
      branch: "CSE",
      course: "AIML",
      semester: 2,
      academicYear: "2024-2025",
      division: item.class,
      schedule: item.schedule
    }));

    await Timetable.insertMany(formattedData);

    console.log("✅ Semester 2 Timetable Inserted Successfully");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error seeding timetable:", error);
    process.exit(1);
  }
};