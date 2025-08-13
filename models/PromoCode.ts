// models/PromoCode.ts
import { Schema, model, models } from "mongoose";

export interface IPromoCode {
  _id?: Schema.Types.ObjectId;
  code: string;
  expiresAt: Date;
  usageLimit: number;
  usedCount: number;
  isUnique: boolean;
  recipients: string[];
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number; // Added for Mongoose version key
}

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, required: true, default: 1 },
    usedCount: { type: Number, required: true, default: 0 },
    isUnique: { type: Boolean, required: true, default: false },
    recipients: { type: [String], required: true },
  },
  { timestamps: true }
);

const PromoCode =
  models.PromoCode || model<IPromoCode>("PromoCode", promoCodeSchema);

export default PromoCode;
