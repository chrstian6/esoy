"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useModalStore } from "@/lib/stores";
import { updateProfile, getUserProfile } from "@/action/userAction";
import { saveAvatar, editAvatar, deleteAvatar } from "@/action/avatarAction";
import { Cross2Icon, Pencil2Icon } from "@radix-ui/react-icons";
import Spinner from "@/components/Spinner";

const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name is too long"),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
});

export default function ProfileModal() {
  const { isProfileEditOpen, closeProfileEdit } = useModalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<z.infer<
    typeof profileSchema
  > | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      bio: "",
    },
  });

  useEffect(() => {
    async function fetchUserData() {
      if (!isProfileEditOpen) return;

      setIsFetchingProfile(true);
      try {
        const result = await getUserProfile();
        if (result.success && result.data) {
          const avatarUrl = result.data.avatar
            ? `${result.data.avatar.split("?")[0]}`
            : null;
          setCurrentAvatar(avatarUrl);
          form.reset({
            firstName: result.data.firstName || "",
            lastName: result.data.lastName || "",
            bio: result.data.bio || "",
          });
        } else {
          toast.error("Failed to load profile", {
            description: result.message || "Please try again",
          });
        }
      } catch (error) {
        toast.error("Error loading profile", {
          description: "Failed to fetch profile data",
        });
        console.error("Error fetching profile:", error);
      } finally {
        setIsFetchingProfile(false);
      }
    }

    fetchUserData();
  }, [isProfileEditOpen, form]);

  useEffect(() => {
    return () => {
      if (previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
      }
    };
  }, [previewAvatar]);

  const getInitials = () => {
    const firstName = form.getValues("firstName") || "";
    const lastName = form.getValues("lastName") || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please select a JPEG, PNG, or WebP image",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Image must be less than 5MB",
      });
      return;
    }

    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = () => {
      if (image.width < 100 || image.height < 100) {
        toast.error("Image too small", {
          description: "Minimum size is 100x100 pixels",
        });
        URL.revokeObjectURL(image.src);
        return;
      }

      if (previewAvatar) URL.revokeObjectURL(previewAvatar);
      setPreviewAvatar(URL.createObjectURL(file));
      setSelectedFile(file);
    };
    image.onerror = () => {
      toast.error("Error loading image");
      URL.revokeObjectURL(image.src);
    };
  };

  const handleCancel = () => {
    if (previewAvatar) URL.revokeObjectURL(previewAvatar);
    setPreviewAvatar(null);
    setSelectedFile(null);
    closeProfileEdit();
  };

  const handleDeleteAvatar = async () => {
    setIsAvatarLoading(true);
    try {
      const result = await deleteAvatar();
      if (result.success) {
        setCurrentAvatar(null);
        setPreviewAvatar(null);
        setSelectedFile(null);
        toast.success("Avatar removed");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete avatar", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsAvatarLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    setPendingFormData(data);
    setIsSaveConfirmOpen(true);
  };

  const handleSaveConfirm = async () => {
    if (!pendingFormData) return;

    setIsLoading(true);
    try {
      let avatarUrl: string | null = currentAvatar;
      if (selectedFile) {
        setIsAvatarLoading(true);
        const avatarFormData = new FormData();
        avatarFormData.append("avatar", selectedFile);

        const uploadResult = currentAvatar
          ? await editAvatar(avatarFormData)
          : await saveAvatar(avatarFormData);

        if (!uploadResult.success) {
          throw new Error(uploadResult.message || "Failed to upload avatar");
        }
        avatarUrl = uploadResult.avatarUrl || null;
      }

      const profileFormData = new FormData();
      profileFormData.append("firstName", pendingFormData.firstName);
      profileFormData.append("lastName", pendingFormData.lastName);
      if (pendingFormData.bio) {
        profileFormData.append("bio", pendingFormData.bio);
      }
      if (avatarUrl) {
        profileFormData.append("avatar", avatarUrl);
      }

      const updateResult = await updateProfile({}, profileFormData);

      if (updateResult.success) {
        toast.success("Profile updated successfully");
        setCurrentAvatar(avatarUrl);
        closeProfileEdit();
      } else {
        throw new Error(updateResult.message);
      }
    } catch (error) {
      toast.error("Failed to update profile", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
      setIsAvatarLoading(false);
      setIsSaveConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog
        open={isProfileEditOpen}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update your profile details and avatar below.
            </DialogDescription>
          </DialogHeader>

          {isFetchingProfile ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onProfileSubmit)}
                className="space-y-6"
              >
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24 border-2 border-gray-200">
                    {previewAvatar || currentAvatar ? (
                      <AvatarImage src={previewAvatar || currentAvatar || ""} />
                    ) : (
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("avatar-upload")?.click()
                      }
                      disabled={isAvatarLoading}
                    >
                      <Pencil2Icon className="mr-2 h-4 w-4" />
                      Change
                    </Button>
                    {currentAvatar && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsDeleteConfirmOpen(true)}
                        disabled={isAvatarLoading}
                      >
                        <Cross2Icon className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself..."
                          {...field}
                          value={field.value || ""}
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Save Changes
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Confirm Avatar Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete your avatar? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteAvatar}
              disabled={isAvatarLoading}
            >
              {isAvatarLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Confirm Profile Changes
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to save your profile changes?
              {selectedFile && " This includes uploading a new avatar."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              onClick={handleSaveConfirm}
              disabled={isLoading || isAvatarLoading}
            >
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsSaveConfirmOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
