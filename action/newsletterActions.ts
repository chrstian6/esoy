"use server";

import { z } from "zod";
import Subscriber from "@/models/Subscriber";
import dbConnect from "@/lib/mongodb";
import PromoCode from "@/models/PromoCode";
import { sendEmail } from "@/lib/nodemailer";

// Email validation schema
const emailSchema = z.string().email();

// Add subscriber function
export async function addSubscriber(email: string) {
  try {
    await dbConnect();

    // Validate email
    const validationResult = emailSchema.safeParse(email);
    if (!validationResult.success) {
      return {
        success: false,
        message:
          validationResult.error.issues[0]?.message || "Invalid email address",
      };
    }

    // Check if email already exists
    const existing = await Subscriber.findOne({ email }).lean();
    if (existing) {
      return {
        success: false,
        message: "This email is already subscribed",
      };
    }

    // Create new subscriber
    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    return {
      success: true,
      message: "Thank you for subscribing!",
      data: {
        subscriberId: newSubscriber.subscriberId,
      },
    };
  } catch (error) {
    console.error("Subscription error:", error);
    return {
      success: false,
      message: "Failed to subscribe. Please try again later.",
    };
  }
}

// Send newsletter function
export async function sendNewsletter(formData: {
  recipientType: string;
  specificEmail?: string;
  subject: string;
  message: string;
  includePromo?: boolean;
  promoCode?: string;
}) {
  try {
    await dbConnect();

    // Build HTML content
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${formData.subject}</h2>
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          ${formData.message.replace(/\n/g, "<br>")}
        </div>
    `;

    if (formData.includePromo && formData.promoCode) {
      htmlContent += `
        <div style="margin: 20px 0; padding: 15px; background-color: #e9f7ef; border-radius: 5px; text-align: center;">
          <h3 style="color: #28a745;">Your Promo Code</h3>
          <p style="font-size: 24px; font-weight: bold; color: #218838;">${formData.promoCode}</p>
          <p style="font-size: 14px; color: #555;">Use this code at checkout to get your discount!</p>
        </div>
      `;
    }

    htmlContent += `</div>`;

    // Handle specific recipient
    if (formData.recipientType === "specific") {
      if (!formData.specificEmail) {
        return {
          success: false,
          message: "Please enter a specific email address",
        };
      }

      const result = await sendEmail({
        to: formData.specificEmail,
        subject: formData.subject,
        html: htmlContent,
      });

      if (!result.success) {
        return { success: false, message: result.error };
      }

      return {
        success: true,
        message: `Newsletter sent successfully to ${formData.specificEmail}`,
      };
    }

    // Handle "all subscribers" case
    const subscribers = await Subscriber.find({ isActive: true }).lean();
    if (subscribers.length === 0) {
      return { success: false, message: "No active subscribers found" };
    }

    const sendResults = await Promise.all(
      subscribers.map((subscriber) =>
        sendEmail({
          to: subscriber.email,
          subject: formData.subject,
          html: htmlContent,
        })
      )
    );

    const failedSends = sendResults.filter((result) => !result.success);
    if (failedSends.length > 0) {
      console.error("Failed to send to some subscribers:", failedSends);
      return {
        success: false,
        message: `Failed to send to ${failedSends.length} subscribers`,
      };
    }

    return {
      success: true,
      message: `Newsletter sent successfully to ${subscribers.length} subscribers`,
    };
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return {
      success: false,
      message: "Failed to send newsletter. Please try again later.",
    };
  }
}

// Get all active subscribers
export async function getAllSubscribers() {
  try {
    await dbConnect();
    const subscribers = await Subscriber.find({ isActive: true })
      .select("email subscriberId createdAt")
      .lean();
    return {
      success: true,
      data: subscribers,
    };
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return {
      success: false,
      message: "Failed to fetch subscribers",
    };
  }
}

// Unsubscribe function
export async function unsubscribe(email: string) {
  try {
    await dbConnect();
    const result = await Subscriber.findOneAndUpdate(
      { email },
      { isActive: false },
      { new: true }
    );

    if (!result) {
      return {
        success: false,
        message: "Subscriber not found",
      };
    }

    return {
      success: true,
      message: "You have been unsubscribed",
    };
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return {
      success: false,
      message: "Failed to unsubscribe",
    };
  }
}

export const getSubscribers = async () => {
  try {
    await dbConnect();
    const subscribers = await Subscriber.find({ isActive: true })
      .select("email")
      .lean();

    return {
      success: true,
      data: subscribers.map((sub) => sub.email),
    };
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return {
      success: false,
      message: "Failed to fetch subscribers",
    };
  }
};

export const storePromoCodes = async (data: {
  code: string;
  expiresAt: string;
  usageLimit: number;
  isUnique: boolean;
  recipients: string[];
}) => {
  try {
    await dbConnect();

    const promoCode = new PromoCode({
      code: data.code,
      expiresAt: new Date(data.expiresAt),
      usageLimit: data.usageLimit,
      isUnique: data.isUnique,
      recipients: data.recipients,
    });

    await promoCode.save();

    return { success: true, message: "Promo code stored successfully" };
  } catch (error) {
    console.error("Error storing promo code:", error);
    return { success: false, message: "Failed to store promo code" };
  }
};

export const validatePromoCode = async (code: string) => {
  try {
    await dbConnect();

    if (!code || code.length < 6) {
      return { success: false, message: "Code must be at least 6 characters" };
    }

    const existingCode = await PromoCode.findOne({ code });
    if (existingCode) {
      return { success: false, message: "This code already exists" };
    }

    return { success: true, message: "Code is valid" };
  } catch (error) {
    console.error("Validation error:", error);
    return { success: false, message: "Error validating code" };
  }
};
