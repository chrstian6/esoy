// otpActions.ts
"use server";

import { z } from "zod";
import { randomBytes } from "crypto";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { sendEmail } from "@/lib/nodemailer";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { headers, cookies } from "next/headers";

// Interfaces
interface AuthResult {
  success: boolean;
  message: string;
  email?: string;
  sessionToken?: string;
  sessionData?: {
    expiresIn?: number;
    [key: string]: any;
  };
  error?: string | null;
}

interface RedisSession {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string | null;
  sessionExpires: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastAccessed: string;
  [key: string]: any;
}

// Constants
const OTP_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded confusing characters
const SESSION_PREFIX = "session:";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const OTP_EXPIRY_MINUTES = 5;
const OTP_RATE_LIMIT = 5;

// Rate limiter configuration
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(OTP_RATE_LIMIT, "5 m"),
  prefix: "@upstash/ratelimit:otp",
});

// ------------------
// UTILITY FUNCTIONS
// ------------------
async function getClientInfo() {
  const headersList = await headers();
  return {
    ip:
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown",
    userAgent: headersList.get("user-agent") || "unknown",
  };
}

async function safeRedisSetex(
  key: string,
  ttl: number,
  value: string
): Promise<boolean> {
  try {
    const result = await redis.setex(key, ttl, value);
    return result === "OK";
  } catch (error) {
    console.error("Redis setex error:", error);
    return false;
  }
}

// ------------------
// SEND OTP
// ------------------
export async function sendOtp(): Promise<{
  success: boolean;
  message: string;
  remainingAttempts?: number;
  retryAfter?: number;
}> {
  try {
    const { ip } = await getClientInfo();

    // Rate limiting
    const { success, reset, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return {
        success: false,
        message: `Too many attempts. Try again after ${new Date(
          reset
        ).toLocaleTimeString()}.`,
        retryAfter: Math.floor((reset - Date.now()) / 1000),
      };
    }

    await dbConnect();
    const user = await User.findOne({}).select("email");
    if (!user) return { success: false, message: "No user found" };

    // Ensure email exists before sending
    if (!user.email) {
      return { success: false, message: "No email associated with user" };
    }

    // Generate OTP
    const bytes = randomBytes(6);
    const otp = Array.from(bytes)
      .map((b) => OTP_CHARS[b % OTP_CHARS.length])
      .join("");

    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in DB
    await User.findOneAndUpdate(
      { email: user.email },
      { otp, otpExpires },
      { upsert: true }
    );

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Your Access Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Access Code</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; letter-spacing: 3px; font-weight: bold;">${otp}</span>
          </div>
          <p style="color: #666;">This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p style="color: #666;">Remaining attempts: ${
            remaining - 1
          }/${OTP_RATE_LIMIT}</p>
        </div>
      `,
    });

    return {
      success: true,
      message: "OTP sent successfully",
      remainingAttempts: remaining - 1,
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return { success: false, message: "Failed to send OTP" };
  }
}

// ------------------
// VERIFY OTP
// ------------------
export async function verifyOtp(data: { otp: string }): Promise<{
  success: boolean;
  message: string;
  sessionToken?: string;
}> {
  try {
    await dbConnect();
    const otp = data.otp.toUpperCase().replace(/\s/g, "");

    const user = await User.findOne({ otp }).select(
      "_id email firstName lastName bio avatar"
    );
    if (!user) return { success: false, message: "Invalid OTP" };

    if (user.otpExpires && user.otpExpires < new Date()) {
      await User.updateOne({ otp }, { $unset: { otp: "", otpExpires: "" } });
      return { success: false, message: "OTP expired" };
    }

    const sessionToken = randomBytes(32).toString("hex");
    const sessionExpires = new Date(Date.now() + SESSION_TTL * 1000);
    const { ip, userAgent } = await getClientInfo();

    const sessionData: RedisSession = {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      bio: user.bio || "",
      avatar: user.avatar || null,
      sessionExpires: sessionExpires.toISOString(),
      createdAt: new Date().toISOString(),
      userAgent,
      ip,
      lastAccessed: new Date().toISOString(),
    };

    // Store in Redis with validation
    const redisStored = await safeRedisSetex(
      `${SESSION_PREFIX}${sessionToken}`,
      SESSION_TTL,
      JSON.stringify(sessionData)
    );

    if (!redisStored) {
      throw new Error("Failed to store session in Redis");
    }

    // Update database
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $unset: { otp: "", otpExpires: "" },
        $set: {
          sessionToken,
          sessionExpires,
          lastLogin: new Date(),
          loginIp: ip,
        },
      }
    );

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("session", JSON.stringify({ token: sessionToken }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL,
      path: "/",
    });

    return {
      success: true,
      message: "OTP verified successfully",
      sessionToken,
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: "Verification failed" };
  }
}
