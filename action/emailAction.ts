"use server";

import { sendEmail } from "@/lib/nodemailer";
import mongoose from "mongoose";
import User from "@/models/User";
import { z } from "zod";

interface EmailActionResult {
  success: boolean;
  message?: string;
}

// Zod schema for inquiry validation
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
    .email("Invalid email address")
    .transform((val) => val.trim()),
});

// Zod schema for booking validation
const BookingSchema = z.object({
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
    .email("Invalid email address")
    .transform((val) => val.trim()),
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
    // Validate and sanitize inputs with Zod
    const parsedData = InquirySchema.safeParse(data);
    if (!parsedData.success) {
      console.error("Zod validation failed:", parsedData.error);
      const errorMessage =
        parsedData.error.issues?.[0]?.message || "Invalid input data provided";
      return {
        success: false,
        message: errorMessage,
      };
    }

    const sanitizedData = parsedData.data;

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    // Fetch the single user
    const user = await User.findOne();
    if (!user || !user.email) {
      return { success: false, message: "User email not found in database" };
    }

    // Main inquiry email to business
    const mailOptions = {
      to: user.email,
      subject: `New Photography Inquiry from ${sanitizedData.firstName} ${sanitizedData.lastName}`,
      html: `
        <h2>New Photography Inquiry</h2>
        <p><strong>Package:</strong></p>
        <pre style="white-space: pre-wrap;">${sanitizedData.package}</pre>
        <p><strong>First Name:</strong> ${sanitizedData.firstName}</p>
        <p><strong>Last Name:</strong> ${sanitizedData.lastName}</p>
        <p><strong>Facebook Name or Link:</strong> ${sanitizedData.facebook}</p>
        <p><strong>Address:</strong> ${sanitizedData.address}</p>
        <p><strong>Contact Number:</strong> ${sanitizedData.contactNumber}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
      `,
    };

    // Send main inquiry email
    await sendEmail(mailOptions);

    // Auto-reply email to user
    const autoReplyOptions = {
      to: sanitizedData.email,
      subject: `Thank You for Your Photography Inquiry`,
      html: `
        <h2>Thank You, ${sanitizedData.firstName}!</h2>
        <p>I have received your inquiry.</p>
        <p>I will review your request and contact you soon to discuss further details.</p>
        <p>Thank you for choosing my GLN Photos!</p>
        <p>Best regards,<br>Gleen Resuma</p>
      `,
    };

    // Send auto-reply email
    await sendEmail(autoReplyOptions);

    return { success: true, message: "Inquiry sent successfully" };
  } catch (error) {
    console.error("Error sending inquiry email:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to send inquiry",
    };
  }
}

export async function sendBookingEmail(
  data: unknown
): Promise<EmailActionResult> {
  try {
    // Validate and sanitize inputs with Zod
    const parsedData = BookingSchema.safeParse(data);
    if (!parsedData.success) {
      console.error("Zod validation failed:", parsedData.error);
      const errorMessage =
        parsedData.error.issues?.[0]?.message || "Invalid input data provided";
      return {
        success: false,
        message: errorMessage,
      };
    }

    const sanitizedData = parsedData.data;

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    // Fetch the single user
    const user = await User.findOne();
    if (!user || !user.email) {
      return { success: false, message: "User email not found in database" };
    }

    // Main booking email to business
    const mailOptions = {
      to: user.email,
      subject: `New Photography Booking from ${sanitizedData.firstName} ${sanitizedData.lastName}`,
      html: `
        <h2>New Photography Booking</h2>
        <p><strong>Package:</strong></p>
        <pre style="white-space: pre-wrap;">${sanitizedData.package}</pre>
        <p><strong>Event Date:</strong> ${sanitizedData.date}</p>
        <p><strong>First Name:</strong> ${sanitizedData.firstName}</p>
        <p><strong>Last Name:</strong> ${sanitizedData.lastName}</p>
        <p><strong>Facebook Name or Link:</strong> ${sanitizedData.facebook}</p>
        <p><strong>Address:</strong> ${sanitizedData.address}</p>
        <p><strong>Contact Number:</strong> ${sanitizedData.contactNumber}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
      `,
    };

    // Send main booking email
    await sendEmail(mailOptions);

    // Auto-reply email to user
    const autoReplyOptions = {
      to: sanitizedData.email,
      subject: `Thank You for Your Photography Booking Request`,
      html: `
        <h2>Thank You, ${sanitizedData.firstName}!</h2>
        <p>I have received your booking request for the following package:</p>
        <pre style="white-space: pre-wrap;">${sanitizedData.package}</pre>
        <p><strong>Event Date:</strong> ${sanitizedData.date}</p>
        <p>I will review your booking and contact you soon to confirm availability and details.</p>
        <p>Thank you for choosing GLN Photos!</p>
        <p>Best regards,<br>Gleen Resuma</p>
      `,
    };

    // Send auto-reply email
    await sendEmail(autoReplyOptions);

    return { success: true, message: "Booking request sent successfully" };
  } catch (error) {
    console.error("Error sending booking email:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send booking request",
    };
  }
}
