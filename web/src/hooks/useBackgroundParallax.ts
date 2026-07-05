"use client";

import { useEffect, useState, useRef } from "react";

interface UseBackgroundParallaxOptions {
  speed?: number;
  enableOnMobile?: boolean;
  offset?: number; // Offset inicial para centrar mejor la imagen
}

export function useBackgroundParallax<T extends HTMLElement = HTMLDivElement>(
  options: UseBackgroundParallaxOptions = {}
) {
  const { speed = 0.3, enableOnMobile = true, offset = 0 } = options;
  const [transform, setTransform] = useState(`translateY(${offset}px)`);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    // Check if device supports parallax (avoid on mobile if disabled)
    const isMobile = window.innerWidth < 768;
    if (!enableOnMobile && isMobile) {
      setTransform(`translateY(${offset}px)`);
      return;
    }

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate the scroll progress of the element through the viewport
      // 0 = element bottom just entered viewport
      // 1 = element top just left viewport
      const elementHeight = rect.height;
      const scrollProgress =
        (windowHeight - rect.top) / (windowHeight + elementHeight);

      // Clamp the progress between 0 and 1
      const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

      // Calculate parallax offset based on scroll progress
      // Center the movement around the middle of the scroll range
      const parallaxRange = 100; // Maximum pixels of movement
      const centerOffset = (clampedProgress - 0.5) * parallaxRange * speed;

      setTransform(`translateY(${offset + centerOffset}px)`);
    };

    // Add scroll listener with passive option for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Calculate initial offset
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [speed, enableOnMobile, offset]);

  return {
    ref: elementRef,
    transform,
  };
}
