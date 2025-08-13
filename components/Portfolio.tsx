"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProfileSection from "./section/ProfileSection";
import TabsSection, { TabCategory } from "./section/TabsSection";
import PricingSection from "./section/PricingSection";
import LoginModal from "@/components/LoginModal";
import SettingsModal from "@/components/SettingsModal";
import PortraitsSections from "@/components/section/PortraitsSection";
import StickyTextSection from "./StickyTextSection";
import InquireSection from "@/components/section/InquireSection";
import Image from "next/image";

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState<TabCategory>("wedding");
  const heroRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const logoRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  const images = [
    "/images/tawhay1.jpg",
    "/images/yude.jpg",
    "/images/baybay.jpg",
  ];

  // Image slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Animation effects on mount
  useEffect(() => {
    // Logo animation
    if (logoRef.current) {
      logoRef.current.style.opacity = "0";
      logoRef.current.style.transform = "translateY(-20px)";
      logoRef.current.style.transition =
        "opacity 0.8s ease-out, transform 0.8s ease-out";

      setTimeout(() => {
        if (logoRef.current) {
          logoRef.current.style.opacity = "1";
          logoRef.current.style.transform = "translateY(0)";
        }
      }, 200);
    }

    // Heading animation
    if (headingRef.current) {
      headingRef.current.style.opacity = "0";
      headingRef.current.style.transform = "translateY(20px)";
      headingRef.current.style.transition =
        "opacity 0.8s ease-out 0.3s, transform 0.8s ease-out 0.3s";

      setTimeout(() => {
        if (headingRef.current) {
          headingRef.current.style.opacity = "1";
          headingRef.current.style.transform = "translateY(0)";
        }
      }, 500);
    }

    // Buttons animation
    if (buttonsRef.current) {
      buttonsRef.current.style.opacity = "0";
      buttonsRef.current.style.transform = "translateY(20px)";
      buttonsRef.current.style.transition =
        "opacity 0.8s ease-out 0.6s, transform 0.8s ease-out 0.6s";

      setTimeout(() => {
        if (buttonsRef.current) {
          buttonsRef.current.style.opacity = "1";
          buttonsRef.current.style.transform = "translateY(0)";
        }
      }, 800);
    }
  }, []);

  return (
    <div className="bg-background">
      {/* === Hero Section === */}
      <div
        ref={heroRef}
        className="w-full h-screen text-white flex items-center justify-center z-0 relative overflow-hidden"
        style={{
          backgroundImage: `url(${images[currentSlide]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "background-image 1s ease-in-out",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>

        {/* Logo with animation */}
        <div
          ref={logoRef}
          className="absolute top-4 left-4 z-10 md:top-6 md:left-6 lg:top-8 lg:left-8"
        >
          <Image
            src="/images/logo2.png"
            alt="Gleen Photography Logo"
            width={75}
            height={75}
            priority
          />
        </div>

        <div className="w-full h-20 bg-black flex items-center justify-between px-4 md:px-6 lg:px-10 absolute bottom-0">
          {/* Heading with animation */}
          <div ref={headingRef}>
            <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold">
              <span className="font-black">GLN Photos</span>{" "}
              <span className="text-sm md:text-base lg:text-lg italic font-light">
                by Gleen
              </span>
            </h1>
          </div>

          <hr className="border-white w-1/4" />

          {/* Buttons with animation */}
          <div
            ref={buttonsRef}
            className="flex flex-row items-center space-x-4"
          >
            <Button
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white cursor-pointer transition flex-1 text-sm md:text-base lg:text-lg px-4 py-2 rounded-none"
              onClick={() => {
                const profileSection =
                  document.getElementById("profile-section");
                profileSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View My Work
            </Button>
            <Button
              variant="outline"
              className="bg-white text-black border-white hover:bg-black hover:text-white cursor-pointer transition flex-1 text-sm md:text-base lg:text-lg px-4 py-2 rounded-none"
            >
              Set up a Shoot
            </Button>
          </div>
        </div>
      </div>

      <PortraitsSections />

      {/* New Sticky Text Section */}
      <StickyTextSection />

      <ProfileSection />
      <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />
      <PricingSection />
      <InquireSection />

      {/* === Footer Section === */}

      {/* === Modals === */}
      <LoginModal />
      <SettingsModal />
    </div>
  );
}
