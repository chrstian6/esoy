"use server";

import dbConnect from "@/lib/mongodb";
import PhotoModel from "@/models/Photo";
import { Photo } from "@/types/Photo";

// Interface for the transformed photo output (with string IDs)
interface PhotoDTO {
  _id: string;
  userId: string;
  category: string;
  imageUrl: string;
  storagePath: string;
  createdAt: Date;
  __v?: number;
}

type PhotoActionResult<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  photos?: PhotoDTO[];
  categories?: string[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
};

// Get Photos by Category (public access)
export async function getPhotosByCategory(
  category: string,
  limit = 20,
  page = 1
): Promise<PhotoActionResult> {
  try {
    if (!category || category.trim() === "") {
      return { success: false, message: "Category is required", photos: [] };
    }

    await dbConnect();
    const skip = (page - 1) * limit;

    const photos = await PhotoModel.find({ category: category.trim() })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<Photo[]>();

    const totalCount = await PhotoModel.countDocuments({
      category: category.trim(),
    });

    return {
      success: true,
      photos: photos.map((photo) => ({
        _id: photo._id.toString(),
        userId: photo.userId.toString(),
        category: photo.category,
        imageUrl: photo.imageUrl,
        storagePath: photo.storagePath,
        createdAt: photo.createdAt,
        __v: photo.__v,
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error: unknown) {
    console.error("Error fetching photos by category:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch photos",
      photos: [],
      totalCount: 0,
    };
  }
}

// Get All Categories (public access)
export async function getAllCategories(): Promise<PhotoActionResult> {
  try {
    await dbConnect();
    const categories = await PhotoModel.distinct("category");
    // Filter categories to only include those with at least one photo
    const nonEmptyCategories = [];
    for (const category of categories) {
      const count = await PhotoModel.countDocuments({ category });
      if (count > 0) {
        nonEmptyCategories.push(category);
      }
    }
    return { success: true, categories: nonEmptyCategories };
  } catch (error: unknown) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch categories",
      categories: [],
    };
  }
}
