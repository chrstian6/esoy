// models/Photo.ts
import mongoose, { Schema } from "mongoose";
import { Photo } from "@/types/Photo";

const photoSchema = new Schema<Photo>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  storagePath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Photo ||
  mongoose.model<Photo>("Photo", photoSchema);
