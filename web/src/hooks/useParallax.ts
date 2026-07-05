"use client";

import { useEffect, useState, useRef } from "react";

interface UseParallaxOptions {
  speed?: number;
  enableOnMobile?: boolean;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: UseParallaxOptions = {}
) {
  const { speed = 0.5, enableOnMobile = true } = options;
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    // Check if device supports parallax (avoid on mobile if disabled)
    const isMobile = window.innerWidth < 768;
    if (!enableOnMobile && isMobile) {
      return;
    }

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const elementTop = rect.top;
      const elementHeight = rect.height;
      const windowHeight = window.innerHeight;

      // Only calculate parallax when element is in viewport
      if (elementTop < windowHeight && elementTop + elementHeight > 0) {
        // Calculate the scroll progress through the element
        // 0 when element top is at bottom of viewport
        // 1 when element bottom is at top of viewport
        const totalScrollDistance = windowHeight + elementHeight;
        const currentScrollDistance = windowHeight - elementTop;
        const scrollProgress = currentScrollDistance / totalScrollDistance;

        // Normalize to range -0.5 to 0.5, centered when element is in middle of viewport
        const normalizedProgress = scrollProgress - 0.5;

        // Apply speed multiplier with a reasonable maximum offset
        const maxOffset = 150; // Aumentar el máximo de movimiento para hacer el efecto más visible
        const rate = normalizedProgress * maxOffset * speed;
        setOffset(rate);
      }
    };

    // Add scroll listener with passive option for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Calculate initial offset
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [speed, enableOnMobile]);

  return {
    ref: elementRef,
    offset,
    transform: `translateY(${offset}px)`,
  };
}
