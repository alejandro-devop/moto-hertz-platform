"use client";

import { useEffect, useState, useRef } from "react";

export function useSmartParallax(speed: number = 0.1) {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Solo aplicar parallax cuando el elemento esté en viewport
      const isInViewport = rect.top < windowHeight && rect.bottom > 0;

      if (isInViewport) {
        // Calcular la posición del elemento relativa al centro del viewport
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = windowHeight / 2;

        // Distancia del centro del elemento al centro del viewport
        const distanceFromCenter = viewportCenter - elementCenter;

        // Aplicar parallax basado en la distancia del centro
        // Máximo movimiento de 20px en cualquier dirección
        const maxMovement = 20;
        const parallaxOffset = Math.max(
          -maxMovement,
          Math.min(maxMovement, distanceFromCenter * speed)
        );

        setOffset(parallaxOffset);

        // Debug menos verboso
        if (Math.abs(parallaxOffset) > 0) {
          console.log("📏 Smart Parallax:", {
            distanceFromCenter: Math.round(distanceFromCenter),
            parallaxOffset: Math.round(parallaxOffset),
            speed,
          });
        }
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
