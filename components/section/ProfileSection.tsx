// components/section/ProfileSection.tsx
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useModalStore } from "@/lib/stores";
import { getUserProfile } from "@/action/userAction";
import { checkAuth, getSessionData } from "@/action/authActions";
import { Loader2 } from "lucide-react";

export default function ProfileSection() {
  const { openLoginModal, openSettingsModal } = useModalStore();
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function fetchAuthStatus() {
      try {
        const authResult = await checkAuth();
        setIsAuthenticated(authResult.success);

        if (authResult.success && authResult.sessionToken) {
          // Try to get profile data from Redis session
          const sessionData = await getSessionData(authResult.sessionToken);
          if (sessionData) {
            setCurrentAvatar(sessionData.avatar || null);
            setFirstName(sessionData.firstName || "Gleen");
            setLastName(sessionData.lastName || "Photography");
            setBio(
              sessionData.bio ||
                "Professional photographer specializing in weddings, events, and portraits."
            );
            setLoadingProfile(false);
            return;
          }
        }

        // Fallback to database fetch if no session data
        const profileResult = await getUserProfile();
        if (profileResult.success && profileResult.data) {
          const avatarUrl = profileResult.data.avatar
            ? `${profileResult.data.avatar.split("?")[0]}`
            : null;
          setCurrentAvatar(avatarUrl);
          setFirstName(profileResult.data.firstName || "Gleen");
          setLastName(profileResult.data.lastName || "Photography");
          setBio(
            profileResult.data.bio ||
              "Professional photographer specializing in weddings, events, and portraits."
          );
        } else {
          setCurrentAvatar(null);
          setFirstName("Gleen");
          setLastName("Photography");
          setBio(
            "Professional photographer specializing in weddings, events, and portraits."
          );
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setCurrentAvatar(null);
        setFirstName("Gleen");
        setLastName("Photography");
        setBio(
          "Professional photographer specializing in weddings, events, and portraits."
        );
      } finally {
        setLoadingAuth(false);
        setLoadingProfile(false);
      }
    }

    fetchAuthStatus();
  }, []);

  const getInitials = () => {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return firstName || lastName ? `${firstInitial}${lastInitial}` : "GP";
  };

  const handleSettingsClick = () => {
    if (isAuthenticated) {
      openSettingsModal();
    } else {
      openLoginModal();
    }
  };

  if (loadingAuth || loadingProfile) {
    return (
      <div id="profile-section" className="bg-background pt-8 z-30">
        <Card className="profile-card mx-auto max-w-4xl bg-card/95 backdrop-blur-sm border-border shadow-sm rounded-xl relative">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          <CardContent className="flex flex-col items-center md:flex-row md:items-start gap-6 pt-8 px-6 md:px-8 bg-transparent">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex-1 w-full space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse max-w-xs mx-auto md:mx-0"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse max-w-xl mx-auto md:mx-0"></div>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="flex-1 max-w-xs h-10 bg-gray-200 rounded-md animate-pulse"></div>
                <span className="text-muted-foreground mx-2">|</span>
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="profile-section" className="bg-white pt-8 px-4 z-30">
      <Card className="profile-card mx-auto max-w-4xl bg-card/95 backdrop-blur-sm border-border shadow-sm rounded-xl relative">
        <Avatar
          className="absolute top-4 right-4 w-10 h-10 cursor-pointer ring-2 ring-primary/30 ring-offset-2 ring-offset-card"
          onClick={handleSettingsClick}
        >
          <AvatarImage src={currentAvatar || undefined} alt="Profile Picture" />
          <AvatarFallback>
            {isAuthenticated ? (
              getInitials()
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </AvatarFallback>
        </Avatar>
        <CardContent className="flex flex-col items-center md:flex-row md:items-start gap-6 pt-8 px-6 md:px-8 bg-transparent">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
            <AvatarImage
              src={currentAvatar || undefined}
              alt="Profile Picture"
            />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 w-full text-center md:text-left">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {`${firstName} ${lastName}` || "Gleen Photography"}
            </h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl leading-relaxed">
              {bio ||
                "Professional photographer specializing in weddings, events, and portraits."}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-4 w-full">
              <Button
                variant="default"
                size="lg"
                className="flex-1 max-w-xs rounded-md hover:bg-primary/90 transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Book a Schedule
              </Button>
              <span className="text-muted-foreground mx-2">|</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50"
                  asChild
                >
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50"
                  asChild
                >
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.148 3.227-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50"
                  asChild
                >
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contact"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
