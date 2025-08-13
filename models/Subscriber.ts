import { Schema, model, models } from "mongoose";
import dbConnect from "@/lib/mongodb";

export interface ISubscriber {
  email: string;
  subscriberId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastEmailSent?: Date;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid email address!`,
      },
    },
    subscriberId: {
      type: String,
      required: true,
      unique: true,
      default: () => generateSubscriberId(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastEmailSent: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Generate a unique subscriber ID
function generateSubscriberId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SUB-${id}-${Date.now().toString(36).slice(-4)}`;
}

// Pre-save hook to ensure email is lowercase
subscriberSchema.pre("save", function (next) {
  this.email = this.email.toLowerCase();
  next();
});

// Export the model
const Subscriber =
  models.Subscriber || model<ISubscriber>("Subscriber", subscriberSchema);

export default Subscriber;
