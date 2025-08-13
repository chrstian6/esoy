// types/Photo.ts
import { Types } from "mongoose";

export interface Photo {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  category: string;
  imageUrl: string;
  storagePath: string;
  createdAt: Date;
  __v?: number;
}
