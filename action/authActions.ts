// authActions.ts
"use server";

import { redis } from "@/lib/redis";
import { headers, cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

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
const SESSION_PREFIX = "session:";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// ------------------
// UTILITY FUNCTIONS
// ------------------
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
// CHECK AUTH
// ------------------
export async function checkAuth(): Promise<AuthResult> {
  try {
    const headersList = await headers();
    let sessionToken: string | null =
      headersList.get("authorization")?.split(" ")[1] || "";

    // Fallback to cookie if no auth header
    if (!sessionToken) {
      sessionToken = await getTokenFromSession();
    }

    if (!sessionToken) {
      return { success: false, message: "No session token found" };
    }

    // Check Redis first
    const cachedSessionStr = await redis.get(
      `${SESSION_PREFIX}${sessionToken}`
    );
    if (typeof cachedSessionStr === "string") {
      const sessionData = JSON.parse(cachedSessionStr) as RedisSession;

      if (new Date(sessionData.sessionExpires) > new Date()) {
        // Update last accessed time
        const updatedSession: RedisSession = {
          ...sessionData,
          lastAccessed: new Date().toISOString(),
        };

        await safeRedisSetex(
          `${SESSION_PREFIX}${sessionToken}`,
          SESSION_TTL,
          JSON.stringify(updatedSession)
        );

        return {
          success: true,
          message: "Authenticated",
          email: sessionData.email,
          sessionToken,
          sessionData: {
            ...sessionData,
            expiresIn:
              Math.floor(
                new Date(sessionData.sessionExpires).getTime() - Date.now()
              ) / 1000,
          },
        };
      } else {
        // Clean up expired session
        await redis.del(`${SESSION_PREFIX}${sessionToken}`);
      }
    }

    // Fallback to database check
    await dbConnect();
    const user = await User.findOne({ sessionToken }).select(
      "_id email sessionExpires firstName lastName bio avatar"
    );

    if (!user || !user.sessionExpires || user.sessionExpires < new Date()) {
      if (user) {
        // Clean up expired session
        await User.updateOne(
          { sessionToken },
          { $unset: { sessionToken: "", sessionExpires: "" } }
        );
      }
      return { success: false, message: "Session expired" };
    }

    // Refresh Redis cache
    const sessionData: RedisSession = {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      bio: user.bio || "",
      avatar: user.avatar || null,
      sessionExpires: user.sessionExpires.toISOString(),
      lastAccessed: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      ip: "unknown", // Fallback value
      userAgent: "unknown", // Fallback value
      createdAt: new Date().toISOString(), // Fallback value
    };

    await safeRedisSetex(
      `${SESSION_PREFIX}${sessionToken}`,
      SESSION_TTL,
      JSON.stringify(sessionData)
    );

    return {
      success: true,
      message: "Authenticated",
      email: user.email,
      sessionToken,
    };
  } catch (error) {
    console.error("Authentication check failed:", error);
    return { success: false, message: "Authentication error" };
  }
}

// ------------------
// SIGN OUT
// ------------------
export async function signOut(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    let sessionToken = "";

    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        sessionToken = sessionData.token || "";
      } catch (error) {
        console.error("Error parsing session cookie:", error);
      }
    }

    // Fallback to checking headers
    if (!sessionToken) {
      const headersList = await headers();
      sessionToken = headersList.get("authorization")?.split(" ")[1] || "";
    }

    if (sessionToken) {
      // Delete from Redis
      await redis.del(`${SESSION_PREFIX}${sessionToken}`);

      // Update database
      await dbConnect();
      await User.updateOne(
        { sessionToken },
        { $unset: { sessionToken: "", sessionExpires: "" } }
      );
    }

    // Clear cookie
    cookieStore.delete("session");

    return {
      success: true,
      message: "Signed out successfully",
      sessionToken,
    };
  } catch (error) {
    console.error("Error during sign out:", error);
    return {
      success: false,
      message: "Sign out failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ------------------
// GET TOKEN FROM SESSION COOKIE
// ------------------
export async function getTokenFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) return null;

    try {
      const sessionData = JSON.parse(sessionCookie.value);
      return typeof sessionData.token === "string" ? sessionData.token : null;
    } catch (e) {
      console.error("Invalid session cookie format");
      return null;
    }
  } catch (error) {
    console.error("Error getting session token:", error);
    return null;
  }
}

// ------------------
// SESSION UTILITIES
// ------------------
export async function getSessionData(
  token: string
): Promise<RedisSession | null> {
  try {
    const sessionStr = await redis.get(`${SESSION_PREFIX}${token}`);
    if (typeof sessionStr !== "string") return null;

    return JSON.parse(sessionStr) as RedisSession;
  } catch (error) {
    console.error("Error getting session data:", error);
    return null;
  }
}

export async function revokeSession(token: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await redis.del(`${SESSION_PREFIX}${token}`);

    await dbConnect();
    await User.updateOne(
      { sessionToken: token },
      { $unset: { sessionToken: "", sessionExpires: "" } }
    );

    return { success: true, message: "Session revoked" };
  } catch (error) {
    console.error("Error revoking session:", error);
    return { success: false, message: "Failed to revoke session" };
  }
}

// ------------------
// REDIS TESTING UTILITIES
// ------------------
export async function testRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch (error) {
    console.error("Redis connection test failed:", error);
    return false;
  }
}

export async function verifySessionStorage(token: string): Promise<boolean> {
  try {
    const exists = await redis.exists(`${SESSION_PREFIX}${token}`);
    if (exists !== 1) return false;

    const ttl = await redis.ttl(`${SESSION_PREFIX}${token}`);
    return ttl > 0;
  } catch (error) {
    console.error("Session verification error:", error);
    return false;
  }
}
