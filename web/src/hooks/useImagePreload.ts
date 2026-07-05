import { useState, useEffect, useCallback } from "react";

interface UseImagePreloadOptions {
  images: string[];
  preloadCount?: number;
  onImageLoad?: (src: string) => void;
}

export function useImagePreload({
  images,
  preloadCount = 3,
  onImageLoad,
}: UseImagePreloadOptions) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [preloadedCount, setPreloadedCount] = useState(0);

  const preloadImage = useCallback(
    (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, src]));
          onImageLoad?.(src);
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    },
    [onImageLoad]
  );

  useEffect(() => {
    // Precargar las primeras imágenes
    const imagesToPreload = images.slice(0, preloadCount);

    Promise.allSettled(imagesToPreload.map((src) => preloadImage(src))).then(
      () => {
        setPreloadedCount(imagesToPreload.length);
      }
    );

    // Precargar el resto de manera progresiva
    if (images.length > preloadCount) {
      const remainingImages = images.slice(preloadCount);

      // Usar requestIdleCallback para precargar cuando el navegador esté inactivo
      const preloadRemaining = () => {
        if ("requestIdleCallback" in window) {
          requestIdleCallback(() => {
            remainingImages.forEach((src) => preloadImage(src));
          });
        } else {
          // Fallback para navegadores que no soportan requestIdleCallback
          setTimeout(() => {
            remainingImages.forEach((src) => preloadImage(src));
          }, 2000);
        }
      };

      preloadRemaining();
    }
  }, [images, preloadCount, preloadImage]);

  return {
    loadedImages,
    preloadedCount,
    isImageLoaded: useCallback(
      (src: string) => loadedImages.has(src),
      [loadedImages]
    ),
  };
}
