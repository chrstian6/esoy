"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/stores";
import { signOut, checkAuth, getSessionData } from "@/action/authActions";
import Spinner from "@/components/Spinner";
import ProfileModal from "./settings/ProfileModal";
import UploadModal from "./settings/UploadModal";
import CategoryManagementModal from "./settings/CategoryManagementModal";
import NewsletterModal from "./settings/NewsletterModal";
import PromoCodeManagementModal from "./settings/PromoCodeManagementModal";

interface SessionInfo {
  email?: string;
  sessionExpires?: string;
  ip?: string;
  userAgent?: string;
  lastAccessed?: string;
}

export default function SettingsModal() {
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    openProfileEdit,
    isProfileEditOpen,
    openUploadPhotos,
    isUploadPhotosOpen,
    openCategoryManagement,
    isCategoryManagementOpen,
    isNewsletterModalOpen,
    openNewsletterModal,
    closeNewsletterModal,
    isPromoCodeManagementOpen,
    openPromoCodeManagement,
  } = useModalStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const verifyInitialSession = async () => {
      try {
        const authResult = await checkAuth();
        setIsAuthenticated(authResult.success);

        if (authResult.success && authResult.sessionToken) {
          const session = await getSessionData(authResult.sessionToken);
          setSessionInfo({
            email: authResult.email,
            ...(session || {}),
          });
        }
      } catch (err) {
        console.error("Initial session check error:", err);
      } finally {
        setInitialCheckDone(true);
      }
    };

    verifyInitialSession();
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      if (!isSettingsModalOpen) return;

      setIsLoading(true);
      try {
        const authResult = await checkAuth();
        setIsAuthenticated(authResult.success);

        if (authResult.success) {
          if (authResult.sessionToken) {
            const session = await getSessionData(authResult.sessionToken);
            setSessionInfo({
              email: authResult.email,
              ...(session || {}),
            });
          }
        } else {
          toast.error(authResult.message || "Session expired");
          closeSettingsModal();
        }
      } catch (err) {
        console.error("Session verification error:", err);
        toast.error("Authentication error");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [isSettingsModalOpen, closeSettingsModal]);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const result = await signOut();
      if (result.success) {
        toast.success(result.message);
        setIsAuthenticated(false);
        setSessionInfo(null);
        closeSettingsModal();
        window.location.reload();
      } else {
        toast.error(result.message || "Sign out failed");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Sign out failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialCheckDone) {
    return null;
  }

  if (!isAuthenticated && isSettingsModalOpen) {
    return null;
  }

  return (
    <>
      <Dialog
        open={isSettingsModalOpen}
        onOpenChange={() => !isLoading && closeSettingsModal()}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[60vw] xl:max-w-[50vw] max-h-[90vh] flex flex-col">
          {/* Fixed Header */}
          <DialogHeader className="sticky top-0 bg-none z-10 pb-4 border-b">
            <DialogTitle className="text-xl sm:text-2xl font-semibold">
              Settings
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Manage your account settings and preferences.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 py-2">
            {sessionInfo?.email && (
              <div className="p-3 bg-muted rounded-lg mb-4">
                <p className="text-sm sm:text-base font-medium">
                  Logged in as: {sessionInfo.email}
                </p>
                {sessionInfo.sessionExpires && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Session expires:{" "}
                    {new Date(sessionInfo.sessionExpires).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Settings Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Profile Section */}
              <div className="flex flex-col p-4 border rounded-lg h-full">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium">Profile</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Update your profile information
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openProfileEdit}
                  disabled={isLoading}
                  className="text-sm sm:text-base mt-2 w-full sm:w-auto"
                >
                  Edit
                </Button>
              </div>

              {/* Photos Section */}
              <div className="flex flex-col p-4 border rounded-lg h-full">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium">Photos</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Upload and manage your photos
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openUploadPhotos}
                  disabled={isLoading}
                  className="text-sm sm:text-base mt-2 w-full sm:w-auto"
                >
                  Upload
                </Button>
              </div>

              {/* Category Management Section */}
              <div className="flex flex-col p-4 border rounded-lg h-full">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium">
                    Categories
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Manage your photo categories
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCategoryManagement}
                  disabled={isLoading}
                  className="text-sm sm:text-base mt-2 w-full sm:w-auto"
                >
                  Manage
                </Button>
              </div>

              {/* Newsletter Section */}
              <div className="flex flex-col p-4 border rounded-lg h-full">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium">
                    Newsletter
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Send promotions and updates
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openNewsletterModal}
                  disabled={isLoading}
                  className="text-sm sm:text-base mt-2 w-full sm:w-auto"
                >
                  Make Update
                </Button>
              </div>

              {/* Promo Codes Section */}
              <div className="flex flex-col p-4 border rounded-lg h-full">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium">
                    Promo Codes
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    View and redeem promo codes
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openPromoCodeManagement}
                  disabled={isLoading}
                  className="text-sm sm:text-base mt-2 w-full sm:w-auto"
                >
                  Manage
                </Button>
              </div>
            </div>
          </div>

          {/* Fixed Footer with Sign Out Button */}
          <div className="bottom-0 bg-background pt-4 pb-2 border-t">
            <Button
              variant="destructive"
              className="w-full text-sm sm:text-base"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Signing Out...
                </>
              ) : (
                "Sign Out"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isProfileEditOpen && <ProfileModal />}
      {isUploadPhotosOpen && <UploadModal />}
      {isCategoryManagementOpen && <CategoryManagementModal />}
      {isNewsletterModalOpen && (
        <NewsletterModal
          onClose={closeNewsletterModal}
          isOpen={isNewsletterModalOpen}
        />
      )}
      {isPromoCodeManagementOpen && <PromoCodeManagementModal />}
    </>
  );
}
