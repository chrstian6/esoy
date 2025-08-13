"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/stores";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X, Maximize, RefreshCw } from "lucide-react";
import {
  Dialog as PreviewDialog,
  DialogContent as PreviewDialogContent,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function UploadModal() {
  const { isUploadPhotosOpen, closeUploadPhotos } = useModalStore();
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cleanup previews when modal closes
  useEffect(() => {
    return () => {
      files.forEach((fileObj) => URL.revokeObjectURL(fileObj.preview));
      setFiles([]);
    };
  }, [isUploadPhotosOpen]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files)
      .slice(0, 5 - files.length)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    // Validate files
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 50 * 1024 * 1024; // 10MB
    for (const fileObj of newFiles) {
      if (!validTypes.includes(fileObj.file.type)) {
        toast.error("Invalid file type", {
          description: "Only JPEG, PNG, or WebP images are allowed.",
        });
        URL.revokeObjectURL(fileObj.preview);
        return;
      }
      if (fileObj.file.size > maxSize) {
        toast.error("File too large", {
          description: "Each image must be less than 10MB.",
        });
        URL.revokeObjectURL(fileObj.preview);
        return;
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
    setError(null);
  }, []);

  const openPreview = (index: number) => {
    setCurrentPreviewIndex(index);
    setPreviewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!files.length) {
        setError("Please select at least one photo");
        toast.error("No photos selected", {
          description: "Please select at least one photo to upload",
        });
        setIsLoading(false);
        return;
      }

      if (category === "custom" && !customCategory.trim()) {
        setError("Please enter a custom category name");
        toast.error("Category name required", {
          description: "Please enter a custom category name",
        });
        setIsLoading(false);
        return;
      }

      if (!category) {
        setError("Please select a category");
        toast.error("Category required", {
          description: "Please select a category for your photos",
        });
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      files.forEach((fileObj) => {
        formData.append("photos", fileObj.file);
      });
      formData.append(
        "category",
        category === "custom" ? customCategory.trim() : category
      );

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let result: any = {};
      try {
        result = await response.json();
      } catch {
        throw new Error(
          `Unexpected server response (status ${response.status})`
        );
      }

      if (!response.ok) {
        if (result.message?.toLowerCase().includes("bucket")) {
          throw new Error(
            "Storage bucket not found. Please check your upload configuration."
          );
        }
        throw new Error(
          result.message || `HTTP error! Status: ${response.status}`
        );
      }

      if (result.success) {
        toast.success("Upload successful!", {
          description: "Your photos have been uploaded successfully",
          action: {
            label: (
              <span className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Page
              </span>
            ),
            onClick: () => handleRefresh(),
          },
          duration: 10000, // Show for 10 seconds
        });
        setFiles((prev) => {
          prev.forEach((fileObj) => URL.revokeObjectURL(fileObj.preview));
          return [];
        });
        setCategory("");
        setCustomCategory("");
        closeUploadPhotos();
      } else {
        throw new Error(result.message || "Failed to upload photos");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during upload";
      setError(errorMsg);
      toast.error("Upload failed", {
        description: errorMsg,
      });
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Dialog open={isUploadPhotosOpen} onOpenChange={closeUploadPhotos}>
        <DialogContent className="sm:max-w-[600px] bg-white text-black rounded-lg shadow-lg p-6 border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Upload Photos
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Add up to 5 photos to your portfolio. Max file size: 10MB each.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="photos" className="text-sm font-medium">
                Photos ({files.length}/5)
              </Label>
              <Input
                id="photos"
                name="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                disabled={files.length >= 5 || isLoading}
                className="bg-white border-gray-300 text-black placeholder-gray-500 focus:ring-2 focus:ring-gray-500 transition-all"
              />
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {files.map((fileObj, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="relative cursor-pointer"
                        onClick={() => openPreview(index)}
                      >
                        <img
                          src={fileObj.preview}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-full object-cover rounded-md border border-gray-300 hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-md">
                          <Maximize className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {error && files.length === 0 && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
            <div className="grid w-full gap-1.5">
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-white border-gray-300 text-black focus:ring-2 focus:ring-gray-500">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black border-gray-300">
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="portraits">Portraits</SelectItem>
                  <SelectItem value="birthdays">Birthdays</SelectItem>
                  <SelectItem value="fun-shoot">Fun Shoot</SelectItem>
                  <SelectItem value="custom">Custom Category</SelectItem>
                </SelectContent>
              </Select>
              {error && !category && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
            {category === "custom" && (
              <div className="grid w-full gap-1.5">
                <Label htmlFor="customCategory" className="text-sm font-medium">
                  Custom Category Name
                </Label>
                <Input
                  id="customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category"
                  required
                  minLength={3}
                  maxLength={30}
                  disabled={isLoading}
                  className="bg-white border-gray-300 text-black placeholder-gray-500 focus:ring-2 focus:ring-gray-500 transition-all"
                />
                {error && category === "custom" && !customCategory.trim() && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                type="button"
                className="border-gray-300 text-black hover:bg-gray-100 hover:border-gray-400 rounded-md transition-all duration-200"
                onClick={closeUploadPhotos}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gray-900 text-white hover:bg-gray-800 font-medium rounded-md transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Photos"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Preview Dialog */}
      <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <PreviewDialogContent className="max-w-[90vw] max-h-[90vh] p-0 pb-3 bg-white">
          <DialogTitle className="sr-only">Photo Preview</DialogTitle>
          <div className="relative w-full h-full">
            {files.length > 0 && (
              <>
                <img
                  src={files[currentPreviewIndex].preview}
                  alt={`Preview ${currentPreviewIndex + 1}`}
                  className="w-full h-full object-contain max-h-[80vh]"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {files.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index === currentPreviewIndex
                          ? "bg-gray-900"
                          : "bg-gray-400"
                      }`}
                      onClick={() => setCurrentPreviewIndex(index)}
                    />
                  ))}
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  <span className="bg-white/80 text-gray-900 px-2 py-1 rounded text-sm border border-gray-300">
                    {currentPreviewIndex + 1} / {files.length}
                  </span>
                  <button
                    onClick={() => setPreviewOpen(false)}
                    className="bg-white/80 text-gray-900 p-2 rounded-full hover:bg-white border border-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {files.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentPreviewIndex((prev) =>
                          prev === 0 ? files.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-900 p-2 rounded-full hover:bg-white border border-gray-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPreviewIndex((prev) =>
                          prev === files.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-900 p-2 rounded-full hover:bg-white border border-gray-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </PreviewDialogContent>
      </PreviewDialog>
    </>
  );
}
