"use client";

import { useEffect, useState, useRef } from "react";

interface UseSimpleParallaxOptions {
  speed?: number;
  enableOnMobile?: boolean;
}

export function useSimpleParallax<T extends HTMLElement = HTMLDivElement>(
  options: UseSimpleParallaxOptions = {}
) {
  const { speed = 0.5, enableOnMobile = false } = options;
  const [translateY, setTranslateY] = useState(0);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    // Check if device supports parallax
    const isMobile = window.innerWidth < 768;
    if (!enableOnMobile && isMobile) {
      return;
    }

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const elementTop = rect.top + scrolled;
      const windowHeight = window.innerHeight;

      // Calculate when element enters viewport
      const elementInView =
        scrolled + windowHeight > elementTop &&
        scrolled < elementTop + rect.height;

      if (elementInView) {
        // Simple parallax calculation
        const yPos = -(scrolled - elementTop) * speed;
        setTranslateY(yPos);

        // Debug log
        console.log("Parallax calculated:", {
          scrolled,
          elementTop,
          yPos,
          speed,
          transform: `translateY(${yPos}px)`,
        });
      }
    };

    // Initial calculation
    handleScroll();

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [speed, enableOnMobile]);

  return {
    ref: elementRef,
    translateY,
    transform: `translateY(${translateY}px)`,
  };
}
