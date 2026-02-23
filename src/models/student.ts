import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDevice extends Document {
  branch: string;
  course: string;
  division: string;
  semester: number;
  academicYear: string;

  fcmToken: string;

  createdAt: Date;
  updatedAt: Date;
}

const UserDeviceSchema: Schema<IUserDevice> = new Schema(
  {
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    division: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    fcmToken: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

UserDeviceSchema.index({
  branch: 1,
  course: 1,
  division: 1,
  semester: 1,
  academicYear: 1,
});

const UserDevice: Model<IUserDevice> =
  mongoose.models.UserDevice ||
  mongoose.model<IUserDevice>("UserDevice", UserDeviceSchema);

export default UserDevice;