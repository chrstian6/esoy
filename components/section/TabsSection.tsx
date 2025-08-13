"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, X } from "lucide-react";
import { getAllCategories, getPhotosByCategory } from "@/action/photoActions";
import { checkAuth } from "@/action/authActions";
import { toast } from "sonner";

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

export type TabCategory = string;

const IMAGE_CACHE_NAME = "image-cache-v1";

export default function TabsSection({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabCategory;
  setActiveTab: (value: TabCategory) => void;
}) {
  const [categories, setCategories] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PhotoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});

  // Check authentication status
  useEffect(() => {
    async function verifyAuth() {
      try {
        const authResult = await checkAuth();
        setIsAuthenticated(authResult.success && !!authResult.sessionToken);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    verifyAuth();
  }, []);

  // Initialize cache
  useEffect(() => {
    async function initializeCache() {
      try {
        if ("caches" in window) {
          const cache = await caches.open(IMAGE_CACHE_NAME);
          const cachedRequests = await cache.keys();
          const cachedUrls = cachedRequests.map((request) => request.url);

          const cachedImageMap: Record<string, string> = {};
          for (const url of cachedUrls) {
            cachedImageMap[url] = url;
          }
          setCachedImages(cachedImageMap);
        }
      } catch (error) {
        console.error("Error initializing cache:", error);
      }
    }
    initializeCache();
  }, []);

  // Cache an image
  const cacheImage = async (imageUrl: string) => {
    try {
      if ("caches" in window) {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const response = await fetch(imageUrl);
        await cache.put(imageUrl, response.clone());
        setCachedImages((prev) => ({ ...prev, [imageUrl]: imageUrl }));
      }
    } catch (error) {
      console.error("Error caching image:", error);
    }
  };

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      setIsLoadingCategories(true);
      setError(null);
      try {
        const result: PhotoActionResult = await getAllCategories();
        if (result.success && result.categories) {
          setCategories(result.categories);
          if (!activeTab || !result.categories.includes(activeTab)) {
            setActiveTab(result.categories[0] || "");
          }
        } else {
          setError(result.message || "Failed to load categories");
          setCategories([]);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load categories"
        );
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  // Fetch photos
  useEffect(() => {
    if (!activeTab) return;
    async function fetchPhotos() {
      setIsLoadingPhotos(true);
      setError(null);
      try {
        const result: PhotoActionResult = await getPhotosByCategory(activeTab);
        if (result.success && result.photos) {
          setPhotos(result.photos);
          result.photos.forEach((photo) => {
            if (!cachedImages[photo.imageUrl]) {
              cacheImage(photo.imageUrl);
            }
          });
        } else {
          setError(result.message || "Failed to load photos");
          setPhotos([]);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load photos"
        );
        setPhotos([]);
      } finally {
        setIsLoadingPhotos(false);
      }
    }
    fetchPhotos();
  }, [activeTab]);

  const handleDelete = async (photoId: string) => {
    try {
      const response = await fetch(`/api/upload?photoId=${photoId}`, {
        method: "DELETE",
      });
      const result: PhotoActionResult = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! Status: ${response.status}`
        );
      }

      if (result.success) {
        toast.success(result.message || "Photo deleted successfully");
        const photoToDelete = photos.find((photo) => photo._id === photoId);
        if (photoToDelete && "caches" in window) {
          const cache = await caches.open(IMAGE_CACHE_NAME);
          await cache.delete(photoToDelete.imageUrl);
          setCachedImages((prev) => {
            const newCache = { ...prev };
            delete newCache[photoToDelete.imageUrl];
            return newCache;
          });
        }

        const updatedPhotos = await getPhotosByCategory(activeTab);
        if (updatedPhotos.success && updatedPhotos.photos) {
          setPhotos(updatedPhotos.photos);
        }
        if (selectedPhotoId === photoId) {
          setSelectedPhotoId(null);
        }
        setDeletePhotoId(null);
      } else {
        toast.error(result.message || "Failed to delete photo");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete photo"
      );
    }
  };

  const handleImageClick = (photoId: string) => {
    setSelectedPhotoId(photoId);
  };

  const handleDeleteClick = (photoId: string) => {
    setDeletePhotoId(photoId);
  };

  const getImageSource = (imageUrl: string) => {
    return cachedImages[imageUrl] || imageUrl;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-12 mt-4">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="columns-2 md:columns-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg mb-4" />
            ))}
          </div>
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabCategory)}
        >
          <div className="relative">
            <div className="pt-2 pb-4 bg-background/95 backdrop-blur-sm z-20">
              {isLoadingCategories ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <TabsList className="flex w-full bg-muted/20 rounded-lg p-1">
                  {categories.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center w-full">
                      No categories available
                    </p>
                  ) : (
                    categories.map((category) => (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className="flex-1 text-sm font-medium transition-all data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:rounded-md"
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </TabsTrigger>
                    ))
                  )}
                </TabsList>
              )}
            </div>

            <div className="mt-4">
              {isLoadingPhotos ? (
                <div className="columns-2 md:columns-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-lg mb-4" />
                  ))}
                </div>
              ) : error ? (
                <div className="min-h-[32rem] flex items-center justify-center">
                  <p className="text-red-400 text-center">{error}</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="min-h-[32rem] flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    No photos available. Upload a photo to create a category!
                  </p>
                </div>
              ) : (
                categories.map((category) => (
                  <TabsContent key={category} value={category} className="mt-0">
                    <div className="relative">
                      <div className="min-h-[32rem] h-auto pb-8">
                        <div className="max-h-[80vh] overflow-y-auto scrollbar-hidden will-change-transform">
                          {photos.length === 0 ? (
                            <div className="min-h-[32rem] flex items-center justify-center">
                              <p className="text-muted-foreground text-center">
                                No photos in this category
                              </p>
                            </div>
                          ) : (
                            <div className="columns-2 md:columns-4 gap-4">
                              {photos.map((photo, index) => (
                                <div
                                  key={photo._id}
                                  className="relative overflow-hidden group break-inside-avoid mb-4"
                                >
                                  <Dialog
                                    open={selectedPhotoId === photo._id}
                                    onOpenChange={(open) =>
                                      setSelectedPhotoId(
                                        open ? photo._id : null
                                      )
                                    }
                                  >
                                    <DialogTrigger asChild>
                                      <div className="relative">
                                        <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />
                                        <img
                                          className="w-full h-auto rounded-lg hover:scale-105 transition-transform duration-300 transform-gpu cursor-pointer relative z-10"
                                          src={getImageSource(photo.imageUrl)}
                                          alt={`${category} photo ${index + 1}`}
                                          onClick={() =>
                                            handleImageClick(photo._id)
                                          }
                                          loading="lazy"
                                        />
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="p-0 border-0 bg-transparent max-w-[90vw] max-h-[90vh]">
                                      <VisuallyHidden>
                                        <DialogTitle>
                                          Full-screen view of {category} photo{" "}
                                          {index + 1}
                                        </DialogTitle>
                                      </VisuallyHidden>
                                      <div className="relative flex items-center justify-center w-full h-full bg-black/80">
                                        <Skeleton className="absolute inset-0" />
                                        <img
                                          className="max-w-full max-h-[90vh] object-contain relative z-10"
                                          src={getImageSource(photo.imageUrl)}
                                          alt={`${category} photo ${index + 1}`}
                                        />
                                        <button
                                          onClick={() =>
                                            setSelectedPhotoId(null)
                                          }
                                          className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 z-20"
                                        >
                                          <X className="h-6 w-6" />
                                        </button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  {isAuthenticated && (
                                    <Dialog
                                      open={deletePhotoId === photo._id}
                                      onOpenChange={(open) =>
                                        setDeletePhotoId(
                                          open ? photo._id : null
                                        )
                                      }
                                    >
                                      <DialogTrigger asChild>
                                        <button
                                          onClick={() =>
                                            handleDeleteClick(photo._id)
                                          }
                                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-md">
                                        <VisuallyHidden>
                                          <DialogTitle>
                                            Confirm photo deletion
                                          </DialogTitle>
                                        </VisuallyHidden>
                                        <div className="flex flex-col items-center gap-4 p-4">
                                          <p className="text-center">
                                            Are you sure you want to delete this
                                            photo?
                                          </p>
                                          <div className="flex gap-4">
                                            <Button
                                              variant="destructive"
                                              onClick={() =>
                                                handleDelete(photo._id)
                                              }
                                            >
                                              Confirm
                                            </Button>
                                            <Button
                                              variant="outline"
                                              onClick={() =>
                                                setDeletePhotoId(null)
                                              }
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))
              )}
            </div>
          </div>
        </Tabs>
      )}
    </div>
  );
}
