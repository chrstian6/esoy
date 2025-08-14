"use server";

import { sendEmail } from "@/lib/nodemailer";
import mongoose from "mongoose";
import User from "@/models/User";
import { z } from "zod";

interface EmailActionResult {
  success: boolean;
  message?: string;
}

// Updated Zod schema without email validation for recipient
const InquirySchema = z.object({
  package: z
    .string()
    .min(1, "Package is required")
    .max(500, "Package must be 500 characters or less"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less")
    .transform((val) => val.trim()),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or less")
    .transform((val) => val.trim()),
  facebook: z
    .string()
    .min(1, "Facebook name or link is required")
    .max(200, "Facebook name or link must be 200 characters or less")
    .transform((val) => val.trim()),
  address: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or less")
    .transform((val) => val.trim()),
  contactNumber: z
    .string()
    .min(1, "Contact number is required")
    .regex(
      /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
      "Invalid contact number"
    )
    .transform((val) => val.trim()),
  email: z
    .string()
    .min(1, "Email is required")
    .transform((val) => val.trim()), // Removed email validation
});

const BookingSchema = InquirySchema.extend({
  date: z
    .string()
    .min(1, "Event date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)")
    .transform((val) => val.trim()),
});

export async function sendInquiryEmail(
  data: unknown
): Promise<EmailActionResult> {
  try {
    const parsedData = InquirySchema.safeParse(data);
    if (!parsedData.success) {
      console.error("Validation failed:", parsedData.error);
      return {
        success: false,
        message: parsedData.error.issues[0]?.message || "Invalid data",
      };
    }

    const { email, ...inquiryData } = parsedData.data;

    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    // Get your business email from DB
    const user = await User.findOne();
    if (!user?.email) {
      return { success: false, message: "Business email not configured" };
    }

    // 1. Send inquiry to YOUR email (from DB)
    await sendEmail({
      to: user.email,
      subject: `New Inquiry from ${inquiryData.firstName} ${inquiryData.lastName}`,
      html: `
        <h2>New Inquiry</h2>
        <p><strong>Message:</strong> ${inquiryData.package}</p>
        <p><strong>Name:</strong> ${inquiryData.firstName} ${inquiryData.lastName}</p>
        <p><strong>Contact:</strong> ${inquiryData.contactNumber}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Facebook:</strong> ${inquiryData.facebook}</p>
        <p><strong>Address:</strong> ${inquiryData.address}</p>
      `,
    });

    // 2. Send auto-reply to CLIENT email (from form)
    await sendEmail({
      to: email,
      subject: `Thank you for your inquiry`,
      html: `
        <h2>Hi ${inquiryData.firstName},</h2>
        <p>I've received your inquiry and will respond shortly.</p>
        <p>Thank you for choosing GLN Photos!</p>
      `,
    });

    return { success: true, message: "Inquiry sent successfully" };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      message: "Failed to send inquiry",
    };
  }
}

export async function sendBookingEmail(
  data: unknown
): Promise<EmailActionResult> {
  try {
    const parsedData = BookingSchema.safeParse(data);
    if (!parsedData.success) {
      return {
        success: false,
        message: parsedData.error.issues[0]?.message || "Invalid data",
      };
    }

    const { email, date, ...bookingData } = parsedData.data;

    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    // Get your business email from DB
    const user = await User.findOne();
    if (!user?.email) {
      return { success: false, message: "Business email not configured" };
    }

    // 1. Send booking to YOUR email (from DB)
    await sendEmail({
      to: user.email,
      subject: `New Booking for ${date}`,
      html: `
        <h2>New Booking</h2>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Booked For:</strong> ${bookingData.package}</p>
        <p><strong>Name:</strong> ${bookingData.firstName} ${bookingData.lastName}</p>
        <p><strong>Contact:</strong> ${bookingData.contactNumber}</p>
        <p><strong>Email:</strong> ${email}</p>
      `,
    });

    // 2. Send confirmation to CLIENT email (from form)
    await sendEmail({
      to: email,
      subject: `Booking Received for ${date}`,
      html: `
        <h2>Hi ${bookingData.firstName},</h2>
        <p>I've received your booking request for ${date}.</p>
        <p>’ll be giving you a call shortly to confirm the availability and discuss the details.</p>
         <p>Thank you for choosing GLN Photos!</p>
      `,
    });

    return { success: true, message: "Booking request sent" };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      message: "Failed to send booking",
    };
  }
}
