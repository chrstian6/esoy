"use client";
import React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import { X } from "lucide-react";
import Image from "next/image";
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

type PhotoActionResult<T = unknown> = {
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

interface PhotoItemProps {
  photo: PhotoDTO;
  category: string;
  index: number;
  isAuthenticated: boolean;
  selectedPhotoId: string | null;
  deletePhotoId: string | null;
  onImageClick: (photoId: string) => void;
  onDeleteClick: (photoId: string) => void;
  onDelete: (photoId: string) => void;
  getImageSource: (imageUrl: string) => string;
  setSelectedPhotoId: (id: string | null) => void;
  setDeletePhotoId: (id: string | null) => void;
}

const PhotoItem = React.memo(
  ({
    photo,
    category,
    index,
    isAuthenticated,
    selectedPhotoId,
    deletePhotoId,
    onImageClick,
    onDeleteClick,
    onDelete,
    getImageSource,
    setSelectedPhotoId,
    setDeletePhotoId,
  }: PhotoItemProps) => {
    return (
      <div className="relative overflow-hidden group break-inside-avoid mb-4">
        <Dialog
          open={selectedPhotoId === photo._id}
          onOpenChange={(open) => setSelectedPhotoId(open ? photo._id : null)}
        >
          <DialogTrigger asChild>
            <div className="relative">
              <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />
              <Image
                className="w-full h-auto rounded-lg hover:scale-105 transition-transform duration-300 transform-gpu cursor-pointer relative z-10"
                src={getImageSource(photo.imageUrl)}
                alt={`${category} photo ${index + 1}`}
                width={400}
                height={300}
                onClick={() => onImageClick(photo._id)}
              />
            </div>
          </DialogTrigger>
          <DialogContent className="p-0 border-0 bg-transparent max-w-[90vw] max-h-[90vh]">
            <VisuallyHidden>
              <DialogTitle>
                Full-screen view of ${category} photo ${index + 1}
              </DialogTitle>
            </VisuallyHidden>
            <div className="relative flex items-center justify-center w-full h-full bg-black/80">
              <Skeleton className="absolute inset-0" />
              <Image
                className="max-w-full max-h-[90vh] object-contain relative z-10"
                src={getImageSource(photo.imageUrl)}
                alt={`${category} photo ${index + 1}`}
                width={800}
                height={600}
              />
              <button
                onClick={() => setSelectedPhotoId(null)}
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
            onOpenChange={(open) => setDeletePhotoId(open ? photo._id : null)}
          >
            <DialogTrigger asChild>
              <button
                onClick={() => onDeleteClick(photo._id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <VisuallyHidden>
                <DialogTitle>Confirm photo deletion</DialogTitle>
              </VisuallyHidden>
              <div className="flex flex-col items-center gap-4 p-4">
                <p className="text-center">
                  Are you sure you want to delete this photo?
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="destructive"
                    onClick={() => onDelete(photo._id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDeletePhotoId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }
);

PhotoItem.displayName = "PhotoItem";

export default function TabsSection({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabCategory;
  setActiveTab: (value: TabCategory) => void;
}) {
  const [categories, setCategories] = useState<string[]>([]);
  const [photosByCategory, setPhotosByCategory] = useState<
    Record<string, PhotoDTO[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});

  // Memoize the current photos based on activeTab
  const currentPhotos = useMemo(() => {
    return photosByCategory[activeTab] || [];
  }, [activeTab, photosByCategory]);

  // Cache an image with retry logic
  const cacheImage = useCallback(async (imageUrl: string) => {
    try {
      if ("caches" in window) {
        const cache = await caches.open(IMAGE_CACHE_NAME);

        // Check if already cached
        const cachedResponse = await cache.match(imageUrl);
        if (cachedResponse) return;

        // Fetch with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch(imageUrl, { signal: controller.signal });
          clearTimeout(timeout);

          if (response.ok) {
            await cache.put(imageUrl, response.clone());
            setCachedImages((prev) => ({ ...prev, [imageUrl]: imageUrl }));
          }
        } catch {
          clearTimeout(timeout);
          console.error("Error caching image");
        }
      }
    } catch {
      console.error("Error accessing cache");
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    async function verifyAuth() {
      try {
        const authResult = await checkAuth();
        setIsAuthenticated(authResult.success && !!authResult.sessionToken);
      } catch {
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
      } catch {
        console.error("Error initializing cache");
      }
    }
    initializeCache();
  }, []);

  // Fetch categories (only once)
  useEffect(() => {
    async function fetchCategories() {
      setIsLoadingCategories(true);
      try {
        const result = await getAllCategories();
        if (result.success && result.categories) {
          setCategories(result.categories);
          if (!activeTab || !result.categories.includes(activeTab)) {
            setActiveTab(result.categories[0] || "");
          }
        } else {
          setCategories([]);
          toast.error(result.message || "Failed to load categories");
        }
      } catch {
        setCategories([]);
        toast.error("Failed to load categories");
      } finally {
        setIsLoadingCategories(false);
      }
    }

    if (categories.length === 0) {
      fetchCategories();
    }
  }, [activeTab, setActiveTab, categories.length]);

  // Fetch photos when activeTab changes
  useEffect(() => {
    if (!activeTab) return;

    async function fetchPhotos() {
      try {
        // Only fetch if we don't already have photos for this category
        if (!photosByCategory[activeTab]) {
          const result = await getPhotosByCategory(activeTab);
          if (result.success && result.photos) {
            setPhotosByCategory((prev) => ({
              ...prev,
              [activeTab]: result.photos || [],
            }));

            // Cache new images in the background
            result.photos?.forEach((photo) => {
              if (!cachedImages[photo.imageUrl]) {
                cacheImage(photo.imageUrl);
              }
            });
          } else {
            setPhotosByCategory((prev) => ({
              ...prev,
              [activeTab]: [],
            }));
            toast.error(result.message || "Failed to load photos");
          }
        }
      } catch {
        setPhotosByCategory((prev) => ({
          ...prev,
          [activeTab]: [],
        }));
        toast.error("Failed to load photos");
      }
    }

    fetchPhotos();
  }, [activeTab, cachedImages, cacheImage, photosByCategory]);

  const handleDelete = useCallback(
    async (photoId: string) => {
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
          const photoToDelete = currentPhotos.find(
            (photo) => photo._id === photoId
          );
          if (photoToDelete && "caches" in window) {
            const cache = await caches.open(IMAGE_CACHE_NAME);
            await cache.delete(photoToDelete.imageUrl);
            setCachedImages((prev) => {
              const newCache = { ...prev };
              delete newCache[photoToDelete.imageUrl];
              return newCache;
            });
          }

          // Update the photos for the current category
          setPhotosByCategory((prev) => ({
            ...prev,
            [activeTab]: prev[activeTab].filter(
              (photo) => photo._id !== photoId
            ),
          }));

          if (selectedPhotoId === photoId) {
            setSelectedPhotoId(null);
          }
          setDeletePhotoId(null);
        } else {
          toast.error(result.message || "Failed to delete photo");
        }
      } catch {
        toast.error("Failed to delete photo");
      }
    },
    [activeTab, currentPhotos, selectedPhotoId]
  );

  const handleImageClick = useCallback((photoId: string) => {
    setSelectedPhotoId(photoId);
  }, []);

  const handleDeleteClick = useCallback((photoId: string) => {
    setDeletePhotoId(photoId);
  }, []);

  const getImageSource = useCallback(
    (imageUrl: string) => {
      return cachedImages[imageUrl] || imageUrl;
    },
    [cachedImages]
  );

  // Memoize the tabs list to prevent re-renders
  const tabsList = useMemo(
    () => (
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
    ),
    [categories]
  );

  // Memoize the tabs content to prevent unnecessary re-renders
  const tabsContent = useMemo(() => {
    return categories.map((category) => (
      <TabsContent key={category} value={category} className="mt-0">
        <div className="relative">
          <div className="min-h-[32rem] h-auto pb-8">
            <div className="max-h-[80vh] overflow-y-auto scrollbar-hidden will-change-transform">
              {photosByCategory[category]?.length === 0 ? (
                <div className="min-h-[32rem] flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    No photos in this category
                  </p>
                </div>
              ) : (
                <div className="columns-2 md:columns-4 gap-4">
                  {photosByCategory[category]?.map((photo, index) => (
                    <PhotoItem
                      key={photo._id}
                      photo={photo}
                      category={category}
                      index={index}
                      isAuthenticated={isAuthenticated}
                      selectedPhotoId={selectedPhotoId}
                      deletePhotoId={deletePhotoId}
                      onImageClick={handleImageClick}
                      onDeleteClick={handleDeleteClick}
                      onDelete={handleDelete}
                      getImageSource={getImageSource}
                      setSelectedPhotoId={setSelectedPhotoId}
                      setDeletePhotoId={setDeletePhotoId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    ));
  }, [
    categories,
    photosByCategory,
    isAuthenticated,
    selectedPhotoId,
    deletePhotoId,
    handleImageClick,
    handleDeleteClick,
    handleDelete,
    getImageSource,
  ]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-12 mt-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="columns-2 md:columns-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg mb-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-12 mt-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabCategory)}
      >
        <div className="relative">
          <div className="pt-2 pb-4 bg-background/95 backdrop-blur-sm z-20">
            {isLoadingCategories ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              tabsList
            )}
          </div>

          <div className="mt-4">
            {categories.length === 0 ? (
              <div className="min-h-[32rem] flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  No photos available. Upload a photo to create a category!
                </p>
              </div>
            ) : (
              tabsContent
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
