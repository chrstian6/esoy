import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  otp?: string;
  otpExpires?: Date;
  sessionToken?: string;
  sessionExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    bio: { type: String },
    avatar: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
    sessionToken: { type: String },
    sessionExpires: { type: Date },
  },
  { collection: "User" }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);
