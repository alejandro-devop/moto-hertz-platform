"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import styles from "./Banner.module.scss";
import { useImagePreload } from "@/hooks/useImagePreload";
import { useIsClient } from "@/hooks/useHydration";

// Fallback images (mock, sin assets de marca) usados solo si no llegan slides
const bannerImages = [
  "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=1600",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600",
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600",
];

// Types for Contentful data
interface BannerSlide {
  sys?: {
    id: string;
  };
  fields: {
    entryId?: string;
    image?: {
      fields: {
        file: {
          url: string;
        };
        title?: string;
        description?: string;
      };
    };
    title?: string;
    caption?: string;
    ctaButton?: {
      fields: {
        label?: string;
        url?: string;
        style?: string;
      };
    };
  };
}

interface BannerProps {
  slides?: BannerSlide[];
  autoPlayInterval?: number;
}

export default function Banner({
  slides,
  autoPlayInterval = 5000,
}: BannerProps = {}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isClient = useIsClient();

  // Use Contentful slides if provided, otherwise fallback to static images
  const bannerSlides =
    slides && slides.length > 0
      ? slides.map((slide) => {
          // Get image URL from Contentful - URLs already include protocol or start with //
          const imageUrl = slide.fields.image?.fields.file?.url || "";
          // If URL starts with //, add https:, otherwise use as is
          const fullImageUrl = imageUrl.startsWith("//")
            ? `https:${imageUrl}`
            : imageUrl || bannerImages[0];

          return {
            imageUrl: fullImageUrl,
            title: slide.fields.title || "Yamaha Oriente",
            caption:
              slide.fields.caption ||
              "Descubre la nueva generación de motocicletas Yamaha.",
            ctaLabel:
              slide.fields.ctaButton?.fields.label || "Explorar Modelos",
            ctaUrl: slide.fields.ctaButton?.fields.url || "#",
            ctaStyle: slide.fields.ctaButton?.fields.style || "primary",
            alt:
              slide.fields.image?.fields.title ||
              slide.fields.title ||
              "Banner",
          };
        })
      : bannerImages.map((img, index) => ({
          imageUrl: img,
          title: "Yamaha Oriente",
          caption:
            "Descubre la nueva generación de motocicletas Yamaha. Potencia, diseño y tecnología en perfecta armonía.",
          ctaLabel: "Explorar Modelos",
          ctaUrl: "#",
          ctaStyle: "primary",
          alt: `Banner ${index + 1}`,
        }));

  const imageUrls = bannerSlides.map((slide) => slide.imageUrl);

  // Precargar imágenes de manera inteligente
  const { isImageLoaded } = useImagePreload({
    images: imageUrls,
    preloadCount: 3, // Precargar solo las primeras 3 imágenes
  });

  // Navigate to next slide
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  }, [bannerSlides.length]);

  // Navigate to previous slide
  const prevSlide = useCallback(() => {
    setCurrentSlide(
      (prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length
    );
  }, [bannerSlides.length]);

  // Navigate to specific slide
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Auto-play functionality - solo después de la hidratación y optimizado
  useEffect(() => {
    if (!isClient || isHovered) return;

    // Usar requestAnimationFrame para sincronizar con el refresh rate
    let animationId: number;
    let lastTime = 0;

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= autoPlayInterval) {
        nextSlide();
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered, nextSlide, isClient, autoPlayInterval]);

  // Keyboard navigation - solo en el cliente
  useEffect(() => {
    if (!isClient) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        prevSlide();
      } else if (event.key === "ArrowRight") {
        nextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, isClient]);

  // No renderizar hasta que el cliente esté listo
  if (!isClient) {
    const firstSlide = bannerSlides[0];
    return (
      <section className="banner-critical">
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
          <Image
            src={firstSlide.imageUrl}
            alt={firstSlide.alt}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.gallery}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={styles.imageContainer}
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {bannerSlides.map((slide, index: number) => {
          // Determinar la estrategia de carga para cada imagen
          const isCurrentSlide = index === currentSlide;
          const isPrevSlide =
            index ===
            (currentSlide - 1 + bannerSlides.length) % bannerSlides.length;
          const isNextSlide =
            index === (currentSlide + 1) % bannerSlides.length;

          // Solo las imágenes visibles y adyacentes se cargan con eager
          const shouldLoadEager = isCurrentSlide || isPrevSlide || isNextSlide;
          const isFirstImage = index === 0;

          return (
            <div key={index} className={styles.slide}>
              <Image
                src={slide.imageUrl}
                alt={slide.alt}
                fill
                className={styles.image}
                priority={isFirstImage} // Solo la primera imagen tiene prioridad máxima
                loading={
                  isFirstImage ? "eager" : shouldLoadEager ? "eager" : "lazy"
                }
                sizes="100vw"
                quality={85} // Calidad fija para evitar múltiples descargas
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyOpWlvLdfSNBDkUwtE5qTbqONX8E2DFFYPeVf/2Q=="
              />
              <div className={styles.overlay}>
                <div className={styles.content}>
                  <h1 className={styles.title}>{slide.title}</h1>
                  <p className={styles.subtitle}>{slide.caption}</p>
                  <a
                    href={slide.ctaUrl}
                    className={styles.ctaButton}
                    data-style={slide.ctaStyle}
                  >
                    {slide.ctaLabel}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <button
        className={`${styles.navButton} ${styles.prevButton}`}
        onClick={prevSlide}
        aria-label="Slide anterior"
      >
        &#8249;
      </button>

      <button
        className={`${styles.navButton} ${styles.nextButton}`}
        onClick={nextSlide}
        aria-label="Siguiente slide"
      >
        &#8250;
      </button>

      {/* Dots Indicator */}
      <div className={styles.dotsContainer}>
        {bannerSlides.map((_: any, index: number) => (
          <button
            key={index}
            className={`${styles.dot} ${
              index === currentSlide ? styles.dotActive : ""
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
