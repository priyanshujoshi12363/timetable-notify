import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDevice extends Document {
  course: string;
  branch: string;
  division: string;
  fcmToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserDeviceSchema: Schema<IUserDevice> = new Schema(
  {
    course: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    division: {
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

// Index for faster filtering
UserDeviceSchema.index({ course: 1, branch: 1, division: 1 });

const UserDevice: Model<IUserDevice> =
  mongoose.models.UserDevice ||
  mongoose.model<IUserDevice>("UserDevice", UserDeviceSchema);

export default UserDevice;