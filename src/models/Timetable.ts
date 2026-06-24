import mongoose, { Schema, models, model } from "mongoose";

const BatchSchema = new Schema(
  {
    batch: String,
    subject: String,
    faculty: { type: String, default: null },
    room: { type: String, default: null }
  },
  { _id: false }
);

const SlotSchema = new Schema(
  {
    time: String,
    subject: { type: String, default: null },
    faculty: { type: String, default: null },
    room: { type: String, default: null },
    batches: { type: [BatchSchema], default: [] }
  },
  { _id: false }
);

const DaySchema = new Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ]
    },
    slots: { type: [SlotSchema], default: [] }
  },
  { _id: false }
);

const TimetableSchema = new Schema(
  {
    branch: { type: String, required: true },
    course: { type: String, required: true },
    semester: { type: Number, required: true },
    academicYear: { type: String },
    division: { type: String, required: true, unique: true },
    schedule: { type: [DaySchema], default: [] },

    source: { type: String, enum: ["seed", "upload"], default: "seed" },
    uploadedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Timetable =
  models.Timetable || model("Timetable", TimetableSchema);