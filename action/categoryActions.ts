"use server";

import mongoose from "mongoose";
import Photo from "@/models/Photo";
import { checkAuth } from "@/action/authActions";

interface CategoryActionResult {
  success: boolean;
  message?: string;
  data?: any;
}

// Fetch unique categories from Photo documents
export async function getCategories(): Promise<CategoryActionResult> {
  try {
    const authResult = await checkAuth();
    if (!authResult.success) {
      return { success: false, message: "Unauthorized" };
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const categories = await Photo.distinct("category");
    return {
      success: true,
      data: categories.map((name) => ({ id: name, name })), // Use name as ID for simplicity
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}

// Check if a category can be deleted (no associated photos)
export async function deleteCategory(
  categoryName: string
): Promise<CategoryActionResult> {
  try {
    const authResult = await checkAuth();
    if (!authResult.success) {
      return { success: false, message: "Unauthorized" };
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    // Check if category has photos
    const photoCount = await Photo.countDocuments({ category: categoryName });
    if (photoCount > 0) {
      return {
        success: false,
        message: `Cannot delete '${categoryName}' because it has ${photoCount} associated photo(s)`,
      };
    }

    // Since categories are strings, no actual deletion from DB; mark as unused
    // If you want to update Photo documents, modify here (e.g., set category to null)
    return {
      success: true,
      message: `Category '${categoryName}' marked as unused`,
    };
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}
