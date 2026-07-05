"use client";

import { useEffect, useState, useRef } from "react";

export function useVisibleParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      // Get current scroll position
      const scrollY = window.pageYOffset;

      // Calculate parallax with limited range
      const maxOffset = 30; // Límite máximo de movimiento en píxeles
      let parallaxOffset = scrollY * speed;

      // Clamp the offset to prevent excessive movement
      parallaxOffset = Math.max(
        -maxOffset,
        Math.min(maxOffset, parallaxOffset)
      );

      setOffset(parallaxOffset);

      // Debug logs - menos verboso
      if (scrollY % 50 === 0) {
        // Solo log cada 50px de scroll
        console.log("🚀 PARALLAX:", {
          scrollY,
          speed,
          parallaxOffset,
          maxOffset,
        });
      }
    };

    // Add event listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    // Initial call
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [speed]);

  return {
    ref: elementRef,
    style: {
      transform: `translateY(${offset}px)`,
    },
  };
}
