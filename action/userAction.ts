// userActions.ts
"use server";

import { z } from "zod";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

const profileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  bio: z.string().max(500).optional().or(z.literal("")),
});

export async function getUserEmail() {
  try {
    await dbConnect();
    const user = await User.findOne({}).select("email");
    return user
      ? { success: true, email: user.email }
      : { success: false, message: "No user found", email: null };
  } catch (error) {
    console.error("Error getting user email:", error);
    return { success: false, message: "Database error", email: null };
  }
}

export async function getUserProfile() {
  try {
    await dbConnect();
    const user = await User.findOne({}).select("firstName lastName bio avatar");
    if (!user) {
      return {
        success: false,
        message: "No user found",
        data: null,
      };
    }
    return {
      success: true,
      message: "User profile fetched successfully",
      data: {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        avatar: user.avatar || null,
      },
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      message: "Failed to fetch user profile",
      data: null,
    };
  }
}

export async function updateProfile(
  _prevState: any,
  formData: FormData
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await dbConnect();
    const rawData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      bio: (formData.get("bio") as string) || "",
    };

    try {
      const validatedData = profileSchema.parse(rawData);

      const user = await User.findOne({});
      if (!user) {
        return { success: false, message: "No user found" };
      }

      await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            bio: validatedData.bio || null,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true, message: "Profile updated successfully" };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues
          .map((issue) => issue.message)
          .join(", ");
        return {
          success: false,
          message: errorMessages,
        };
      }
      throw error;
    }
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, message: "Profile update failed" };
  }
}
