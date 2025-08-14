"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import ProfileSection from "@/components/section/ProfileSection";
import TabsSection, { TabCategory } from "@/components/section/TabsSection";
import PricingSection from "@/components/section/PricingSection";
import LoginModal from "@/components/LoginModal";
import SettingsModal from "@/components/SettingsModal";
import PortraitsSections from "@/components/section/PortraitsSection";
import StickyTextSection from "@/components/StickyTextSection";
import InquireSection from "@/components/section/InquireSection";
import NewsletterSection from "@/components/section/NewsLetterSection";
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

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

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
          <div ref={headingRef} className="flex flex-col leading-tight">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
              <span className="font-black">GLN Photos</span>
            </h1>
            <span className="text-xs sm:text-sm md:text-base lg:text-lg italic font-light -mt-1">
              by Gleen
            </span>
          </div>

          {/* Spacer with proper margins */}
          <hr className="border-white mx-4 flex-1 max-w-[100px] sm:max-w-[150px] md:max-w-[200px]" />

          {/* Buttons container */}
          <div
            ref={buttonsRef}
            className="flex flex-row items-center space-x-2 sm:space-x-4"
          >
            <Button
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white hover:text-black cursor-pointer transition flex-1 text-xs sm:text-sm md:text-base lg:text-lg px-3 sm:px-4 py-1 sm:py-2 rounded-none"
              onClick={() => scrollToSection("profile-section")}
            >
              View My Work
            </Button>
            <Button
              variant="outline"
              className="hidden sm:flex bg-white text-black border-white hover:bg-black hover:text-white cursor-pointer transition flex-1 text-xs sm:text-sm md:text-base lg:text-lg px-3 sm:px-4 py-1 sm:py-2 rounded-none"
              onClick={() => scrollToSection("pricing-section")}
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

      {/* Wrap components that might use useSearchParams in Suspense */}
      <Suspense fallback={<div>Loading...</div>}>
        <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />
        <PricingSection />
        <NewsletterSection />
        <InquireSection />
      </Suspense>

      {/* === Footer Section === */}
      {/* === Modals === */}
      <LoginModal />
      <SettingsModal />
    </div>
  );
}
