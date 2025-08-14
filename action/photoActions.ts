"use server";

import dbConnect from "@/lib/mongodb";
import PhotoModel from "@/models/Photo";
import { Photo } from "@/types/Photo";

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

// Cache for categories
let categoriesCache: string[] | null = null;
let categoriesCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get Photos by Category with caching
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

    const [photos, totalCount] = await Promise.all([
      PhotoModel.find({ category: category.trim() })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Photo[]>(),
      PhotoModel.countDocuments({ category: category.trim() }),
    ]);

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

// Get All Categories with caching
export async function getAllCategories(): Promise<PhotoActionResult> {
  try {
    // Return cached categories if available and not expired
    if (categoriesCache && Date.now() - categoriesCacheTime < CACHE_DURATION) {
      return { success: true, categories: categoriesCache };
    }

    await dbConnect();
    const categories = await PhotoModel.distinct("category");

    // Filter categories to only include those with at least one photo
    const countPromises = categories.map((category) =>
      PhotoModel.countDocuments({ category })
    );
    const counts = await Promise.all(countPromises);

    const nonEmptyCategories = categories.filter(
      (_, index) => counts[index] > 0
    );

    // Update cache
    categoriesCache = nonEmptyCategories;
    categoriesCacheTime = Date.now();

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
