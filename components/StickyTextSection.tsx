"use client";

import { useState, useEffect, useRef } from "react";

const SCROLL_TEXTS = [
  "Portraits?",
  "Wedding?",
  "Birthdays?",
  "Fun shoot?",
  "Count me in—let's plan together.",
  "Scroll down for more.",
];

export default function StickyTextSection() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [fadeProgress, setFadeProgress] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const bgElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
        if (entry.isIntersecting) {
          setFadeProgress(1);
          setCurrentTextIndex(0);
        }
      },
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );  

    observer.observe(container);

    const handleScroll = () => {
      if (!isActive) return;

      const containerRect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate how much of the next section is visible (0 to 1)
      const nextSectionVisibleRatio = Math.max(
        0,
        (windowHeight - containerRect.bottom) / windowHeight
      );

      // Start fading out when even 5% of the next section is visible
      const fadeOutThreshold = 0.05;
      const fadeOutAmount = Math.min(
        1,
        Math.max(0, nextSectionVisibleRatio - fadeOutThreshold) /
          (1 - fadeOutThreshold)
      );

      setFadeProgress(1 - fadeOutAmount);

      // Only update text if we're not fading out
      if (fadeOutAmount < 1) {
        const scrollProgress = Math.min(
          1,
          Math.max(
            0,
            (window.scrollY - container.offsetTop + windowHeight) /
              container.offsetHeight
          )
        );

        const textIndex = Math.min(
          Math.floor(scrollProgress * SCROLL_TEXTS.length),
          SCROLL_TEXTS.length - 1
        );
        setCurrentTextIndex(textIndex);
      }

      const bgOpacity = 1 - fadeOutAmount;
      bgElementsRef.current.forEach((el, i) => {
        if (el) {
          const delay = i * 0.05;
          const scale =
            0.9 + Math.sin((1 - fadeOutAmount) * Math.PI * 4 + delay) * 0.1;
          const rotate =
            Math.sin((1 - fadeOutAmount) * Math.PI * 8 + delay) * 5;
          const opacity =
            bgOpacity *
            (0.2 + Math.sin((1 - fadeOutAmount) * Math.PI + delay) * 0.3);
          el.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
          el.style.opacity = `${opacity}`;
          el.style.background = `rgba(251, 218, 97, ${opacity})`;
        }
      });

      particleRefs.current.forEach((el) => {
        if (el) {
          const moveX = (Math.random() - 0.5) * 15;
          const moveY = (Math.random() - 0.5) * 15;
          const opacity =
            (1 - fadeOutAmount) * (0.5 - (1 - fadeOutAmount) * 0.7);
          el.style.transform = `translate(${moveX}px, ${moveY}px)`;
          el.style.opacity = `${opacity}`;
        }
      });

      if (sticky) {
        sticky.style.background = `linear-gradient(to bottom, #f5f5f5, rgba(0, 0, 0, ${fadeOutAmount}))`;
        sticky.style.transition =
          "background 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
        sticky.style.opacity = `${1 - fadeOutAmount}`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isActive]);

  // Create background elements
  const bgElements = Array.from({ length: 4 }).map((_, i) => (
    <div
      key={`bg-${i}`}
      ref={(el) => {
        bgElementsRef.current[i] = el;
      }}
      className="absolute inset-0 rounded-full mix-blend-multiply pointer-events-none"
      style={{
        background: i % 2 === 0 ? "#fbda61" : "#2563eb",
        width: `${20 + i * 15}%`,
        height: `${20 + i * 15}%`,
        left: `${5 + i * 10}%`,
        top: `${5 + i * 10}%`,
        opacity: 0.2,
        transition: "all 0.15s ease-out",
      }}
    />
  ));

  // Create particle elements
  const initialParticles = Array.from({ length: 12 }).map((_, i) => (
    <div
      key={`particle-${i}`}
      ref={(el) => {
        particleRefs.current[i] = el;
      }}
      className="absolute w-2 h-2 rounded-full bg-white mix-blend-screen pointer-events-none"
      style={{
        left: `${i * 8.33}%`,
        top: `${i * 8.33}%`,
        opacity: 0.5,
        transition: "transform 1s ease-out, opacity 0.5s ease-out",
      }}
    />
  ));

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes wave {
        0%, 100% { transform: rotate(0deg) scale(1); }
        25%, 75% { transform: rotate(10deg) scale(1.1); }
        50% { transform: rotate(-10deg) scale(1.1); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
      .animate-wave {
        animation: wave 1s ease-in-out infinite;
      }
      .animate-bounce {
        animation: bounce 0.8s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Update particle positions on client mount
  useEffect(() => {
    particleRefs.current.forEach((el) => {
      if (el) {
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = `${Math.random() * 100}%`;
      }
    });
  }, []);

  // Scroll down hint with SVG arrows
  const scrollHint = (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-white z-20">
      <svg
        className="w-8 h-8 animate-wave"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000000"
        strokeWidth="2"
      >
        <path
          d="M12 5v14m0 0l-6-6m6 6l6-6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className="w-10 h-10 animate-bounce mt-2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000000"
        strokeWidth="2"
      >
        <path
          d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  return (
    <div ref={containerRef} className="relative h-[200vh] hidden lg:block">
      <div
        ref={stickyRef}
        className={`w-full h-screen flex items-center justify-center text-center transition-opacity duration-500 ${
          isActive ? "fixed top-0 left-0" : "absolute top-0 left-0"
        }`}
        style={{
          opacity: fadeProgress,
          pointerEvents: fadeProgress > 0 ? "auto" : "none",
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {bgElements}
          {initialParticles}
          <h2
            className="text-4xl md:text-6xl lg:text-7xl font-bold px-4 relative z-10 transition-all duration-300"
            style={{
              transform: `scale(${fadeProgress})`,
              opacity: fadeProgress,
            }}
          >
            {SCROLL_TEXTS[currentTextIndex]}
          </h2>
          {isActive && fadeProgress > 0.1 && scrollHint}
        </div>
      </div>
    </div>
  );
}
