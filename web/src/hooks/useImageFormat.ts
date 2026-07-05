import { useState, useEffect } from "react";

interface ImageFormatSupport {
  avif: boolean;
  webp: boolean;
  loading: boolean;
}

/**
 * Hook para detectar soporte de formatos de imagen modernos
 * Retorna el mejor formato soportado por el navegador
 */
export function useImageFormatSupport(): ImageFormatSupport {
  const [support, setSupport] = useState<ImageFormatSupport>({
    avif: false,
    webp: false,
    loading: true,
  });

  useEffect(() => {
    const checkImageSupport = async () => {
      const results = await Promise.allSettled([
        checkAVIFSupport(),
        checkWebPSupport(),
      ]);

      setSupport({
        avif: results[0].status === "fulfilled" ? results[0].value : false,
        webp: results[1].status === "fulfilled" ? results[1].value : false,
        loading: false,
      });
    };

    checkImageSupport();
  }, []);

  return support;
}

/**
 * Hook para obtener la mejor extensión de imagen soportada
 */
export function useBestImageFormat(): {
  extension: string;
  loading: boolean;
} {
  const support = useImageFormatSupport();

  if (support.loading) {
    return { extension: ".jpg", loading: true };
  }

  if (support.avif) {
    return { extension: ".avif", loading: false };
  }

  if (support.webp) {
    return { extension: ".webp", loading: false };
  }

  return { extension: ".jpg", loading: false };
}

/**
 * Hook para generar rutas de imágenes con el mejor formato
 */
export function useOptimizedImageSrc(basePath: string): {
  src: string;
  loading: boolean;
} {
  const { extension, loading } = useBestImageFormat();

  return {
    src: loading ? basePath + ".jpg" : basePath + extension,
    loading,
  };
}

/**
 * Hook para generar múltiples rutas de imágenes optimizadas
 */
export function useOptimizedImagesSrc(basePaths: string[]): {
  srcs: string[];
  loading: boolean;
} {
  const { extension, loading } = useBestImageFormat();

  return {
    srcs: basePaths.map((path) => (loading ? path + ".jpg" : path + extension)),
    loading,
  };
}

// Función auxiliar para verificar soporte AVIF
function checkAVIFSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = () => resolve(true);
    avif.onerror = () => resolve(false);
    avif.src =
      "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=";
  });
}

// Función auxiliar para verificar soporte WebP
function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webp = new Image();
    webp.onload = () => resolve(true);
    webp.onerror = () => resolve(false);
    webp.src =
      "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
  });
}
