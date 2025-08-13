"use server";

import { supabaseAdmin } from "@/lib/supabase";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { revalidatePath } from "next/cache";

// Helper function to validate and process the image file
const processAvatarFile = async (file: File) => {
  if (!file) {
    return { error: "No file provided" };
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "Only JPEG, PNG, or WebP images are allowed" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Image size must be less than 5MB" };
  }

  return { success: true };
};

export async function saveAvatar(formData: FormData) {
  try {
    await dbConnect();
    const user = await User.findOne({}).select("sessionToken sessionExpires");
    if (!user || !user.sessionToken || user.sessionExpires < new Date()) {
      return { success: false, message: "Not authenticated" };
    }

    const file = formData.get("avatar") as File;
    const validation = await processAvatarFile(file);
    if (validation.error) {
      return { success: false, message: validation.error };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `public/${user._id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, message: "Failed to upload avatar" };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      return { success: false, message: "Failed to get public URL" };
    }

    // Force cache invalidation by adding timestamp
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    await User.findOneAndUpdate(
      { sessionToken: user.sessionToken },
      { $set: { avatar: avatarUrl } },
      { new: true }
    );

    revalidatePath("/");
    return {
      success: true,
      message: "Avatar saved successfully",
      avatarUrl: avatarUrl,
    };
  } catch (error) {
    console.error("Error saving avatar:", error);
    return { success: false, message: "Failed to save avatar" };
  }
}

export async function editAvatar(formData: FormData) {
  try {
    await dbConnect();
    const user = await User.findOne({}).select(
      "sessionToken sessionExpires avatar _id"
    );
    if (!user || !user.sessionToken || user.sessionExpires < new Date()) {
      return { success: false, message: "Not authenticated" };
    }

    const file = formData.get("avatar") as File;
    const validation = await processAvatarFile(file);
    if (validation.error) {
      return { success: false, message: validation.error };
    }

    // Delete existing avatar if present
    if (user.avatar) {
      const oldFileName = user.avatar.split("/").slice(-1)[0].split("?")[0];
      const { error: deleteError } = await supabaseAdmin.storage
        .from("avatars")
        .remove([oldFileName]);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        // Continue with upload even if delete fails
      }
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `public/${user._id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, message: "Failed to upload new avatar" };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      return { success: false, message: "Failed to get public URL" };
    }

    // Force cache invalidation by adding timestamp
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    await User.findOneAndUpdate(
      { sessionToken: user.sessionToken },
      { $set: { avatar: avatarUrl } },
      { new: true }
    );

    revalidatePath("/");
    return {
      success: true,
      message: "Avatar updated successfully",
      avatarUrl: avatarUrl,
    };
  } catch (error) {
    console.error("Error editing avatar:", error);
    return { success: false, message: "Failed to edit avatar" };
  }
}

export async function deleteAvatar() {
  try {
    await dbConnect();
    const user = await User.findOne({}).select(
      "sessionToken sessionExpires avatar _id"
    );
    if (!user || !user.sessionToken || user.sessionExpires < new Date()) {
      return { success: false, message: "Not authenticated" };
    }

    if (!user.avatar) {
      return { success: false, message: "No avatar to delete" };
    }

    const fileName = user.avatar.split("/").slice(-1)[0].split("?")[0];
    const { error: deleteError } = await supabaseAdmin.storage
      .from("avatars")
      .remove([fileName]);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return { success: false, message: "Failed to delete avatar" };
    }

    await User.findOneAndUpdate(
      { sessionToken: user.sessionToken },
      { $set: { avatar: null } },
      { new: true }
    );

    revalidatePath("/");
    return { success: true, message: "Avatar deleted successfully" };
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return { success: false, message: "Failed to delete avatar" };
  }
}
