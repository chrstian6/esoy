import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import dbConnect from "@/lib/mongodb";
import PhotoModel from "@/models/Photo";
import User from "@/models/User";
import { Types } from "mongoose";
import { checkAuth } from "@/action/authActions";
import { revalidatePath } from "next/cache";

// Type definitions
type FileUploadResult = {
  storagePath: string;
  imageUrl: string;
};

interface PhotoDTO {
  _id: string;
  userId: string;
  category: string;
  imageUrl: string;
  storagePath: string;
  createdAt: Date;
  __v?: number;
}

type PhotoActionResult = {
  success: boolean;
  message?: string;
  photos?: PhotoDTO[];
  categories?: string[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  data?: { photoIds?: string[] };
};

// Constants
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 10MB per file
const MAX_FILES = 5;

// Helper function to validate photo files
function validatePhotos(photos: File[]): { valid: boolean; message?: string } {
  if (!photos.length || photos.length > MAX_FILES) {
    return { valid: false, message: `Please select 1-${MAX_FILES} photos` };
  }

  for (const file of photos) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        message: "Only JPEG, PNG, or WebP images are allowed",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, message: "Image size must be less than 10MB" };
    }
  }

  return { valid: true };
}

// Helper to get authenticated user ID
async function getAuthenticatedUserId(
  sessionToken: string
): Promise<Types.ObjectId> {
  await dbConnect();
  const user = await User.findOne({ sessionToken }).select("_id");
  if (!user) {
    throw new Error("User not found");
  }
  return user._id;
}

// POST /api/upload
export async function POST(
  request: NextRequest
): Promise<NextResponse<PhotoActionResult>> {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if (!authResult.success || !authResult.sessionToken) {
      return NextResponse.json(
        { success: false, message: authResult.message || "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const photos = formData.getAll("photos") as File[];
    const category = formData.get("category") as string;

    // Validate inputs
    const photoValidation = validatePhotos(photos);
    if (!photoValidation.valid) {
      return NextResponse.json(
        { success: false, message: photoValidation.message },
        { status: 400 }
      );
    }

    if (!category || category.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Category is required" },
        { status: 400 }
      );
    }

    const userId = await getAuthenticatedUserId(authResult.sessionToken);
    const uploadedPhotos: FileUploadResult[] = [];

    // Upload photos sequentially
    for (const file of photos) {
      const fileExt = file.name.split(".").pop();
      const fileName = `photos/${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${fileExt}`;

      // Upload to Supabase
      const { error: uploadError } = await supabaseAdmin.storage
        .from("photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        // Clean up previously uploaded files
        for (const uploaded of uploadedPhotos) {
          await supabaseAdmin.storage
            .from("photos")
            .remove([uploaded.storagePath]);
        }
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from("photos")
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        // Clean up uploaded file
        await supabaseAdmin.storage.from("photos").remove([fileName]);
        throw new Error("Failed to get public URL");
      }

      uploadedPhotos.push({
        storagePath: fileName,
        imageUrl: `${publicUrlData.publicUrl}?t=${Date.now()}`, // Cache busting
      });
    }

    // Save to MongoDB
    await dbConnect();
    const createdPhotos = await PhotoModel.insertMany(
      uploadedPhotos.map((photo) => ({
        userId,
        category: category.trim(),
        imageUrl: photo.imageUrl,
        storagePath: photo.storagePath,
        createdAt: new Date(),
      }))
    );

    // Revalidate the root path to refresh dynamic tabs in TabsSection.tsx
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: `${photos.length} photo${
        photos.length > 1 ? "s" : ""
      } uploaded successfully`,
      data: {
        photoIds: createdPhotos.map((p) => p._id.toString()),
      },
    });
  } catch (err: unknown) {
    console.error("Error uploading photos:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to upload photos",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/upload?photoId=<photoId>
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<PhotoActionResult>> {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if (!authResult.success || !authResult.sessionToken) {
      return NextResponse.json(
        { success: false, message: authResult.message || "Not authenticated" },
        { status: 401 }
      );
    }

    // Get photoId from query parameters
    const photoId = request.nextUrl.searchParams.get("photoId");
    if (!photoId || !Types.ObjectId.isValid(photoId)) {
      return NextResponse.json(
        { success: false, message: "Valid photoId is required" },
        { status: 400 }
      );
    }

    const userId = await getAuthenticatedUserId(authResult.sessionToken);

    // Find the photo
    await dbConnect();
    const photo = await PhotoModel.findOne({
      _id: new Types.ObjectId(photoId),
      userId,
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, message: "Photo not found or not authorized" },
        { status: 404 }
      );
    }

    // Delete from Supabase storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from("photos")
      .remove([photo.storagePath]);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to delete photo from storage: ${deleteError.message}`,
        },
        { status: 500 }
      );
    }

    // Delete from MongoDB
    await PhotoModel.deleteOne({ _id: new Types.ObjectId(photoId), userId });

    // Revalidate the root path to refresh dynamic tabs in TabsSection.tsx
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (err: unknown) {
    console.error("Error deleting photo:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to delete photo",
      },
      { status: 500 }
    );
  }
}
