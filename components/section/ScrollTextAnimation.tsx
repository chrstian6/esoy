"use client";

import { useState, useEffect, useRef } from "react";

const SCROLL_TEXTS = [
  "Portraits?",
  "Wedding?",
  "Birthdays?",
  "Fun shoot?",
  "We got you, plan it with us",
  "See below",
];

export default function StickyTextSection() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
        if (entry.isIntersecting) {
          // Immediately show all content when section is 10% revealed
          gsap.to(sticky, { opacity: 1, duration: 0.3 });
          gsap.to(textRef.current, { opacity: 1, scale: 1, duration: 0.3 });
          setCurrentTextIndex(0);
        } else {
          // Reset to hidden state when scrolling back up
          gsap.set(sticky, { opacity: 0 });
          gsap.set(textRef.current, { opacity: 0, scale: 0.9 });
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" } // Trigger when 10% revealed
    );

    observer.observe(container);

    const handleScroll = () => {
      if (!isActive) return;

      const containerRect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress through the container
      const scrollProgress = Math.min(
        1,
        Math.max(
          0,
          (window.scrollY - container.offsetTop + windowHeight) /
            container.offsetHeight
        )
      );

      // Update text based on scroll progress
      const textIndex = Math.min(
        Math.floor(scrollProgress * SCROLL_TEXTS.length),
        SCROLL_TEXTS.length - 1
      );
      setCurrentTextIndex(textIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isActive]);

  return (
    <div ref={containerRef} className="relative h-[200vh]">
      <div
        ref={stickyRef}
        className={`w-full h-screen flex items-center justify-center text-center fixed top-0 left-0 bg-gradient-to-b from-gray-100 to-black`}
        style={{ opacity: 0 }} // Start hidden
      >
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* Main text */}
          <h2
            ref={textRef}
            className="text-4xl md:text-6xl lg:text-7xl font-bold px-4 relative z-10"
            style={{ opacity: 0, transform: "scale(0.9)" }} // Start hidden and slightly scaled down
          >
            {SCROLL_TEXTS[currentTextIndex]}
          </h2>

          {/* Scroll hint - only shown when active */}
          {isActive && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-white z-20">
              <svg
                className="w-8 h-8 animate-bounce"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M19 14l-7 7-7-7m14-8l-7 7-7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
