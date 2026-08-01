"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "./Banner.module.scss";
import { useImagePreload } from "@/hooks/useImagePreload";
import { useIsClient } from "@/hooks/useHydration";
import type { Banner as BannerItem } from "@/types/banner";

// Fallback (mock, sin assets de marca): solo se usa si el backend no devuelve
// ningún banner activo y vigente (carrusel recién estrenado, o todos
// desactivados). Ver `banner.service.ts` del backend.
const bannerImages = [
  "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=1600",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600",
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600",
];

interface BannerProps {
  /** Del backend (Fase 5 del plan CMS), ya activos, vigentes y en orden. */
  slides?: BannerItem[];
  autoPlayInterval?: number;
}

export default function Banner({
  slides,
  autoPlayInterval = 5000,
}: BannerProps = {}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isClient = useIsClient();

  // Los banners reales del panel, o el mock si todavía no hay ninguno activo.
  const bannerSlides =
    slides && slides.length > 0
      ? slides.map((slide) => ({
          imageUrl: slide.image,
          /** Si no hay imagen de móvil, la de escritorio se usa también ahí. */
          imageUrlMobile: slide.imageMobile || slide.image,
          title: slide.title,
          caption: slide.subtitle || "",
          ctaLabel: slide.linkLabel || "",
          ctaUrl: slide.link || "",
          alt: slide.title,
        }))
      : bannerImages.map((img, index) => ({
          imageUrl: img,
          imageUrlMobile: img,
          title: "Yamaha Oriente",
          caption:
            "Descubre la nueva generación de motocicletas Yamaha. Potencia, diseño y tecnología en perfecta armonía.",
          ctaLabel: "Explorar Modelos",
          ctaUrl: "/motos",
          alt: `Banner ${index + 1}`,
        }));

  const imageUrls = bannerSlides.flatMap((slide) =>
    slide.imageUrlMobile === slide.imageUrl
      ? [slide.imageUrl]
      : [slide.imageUrl, slide.imageUrlMobile]
  );

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
          {/* URL de texto libre (puede ser el host de medios local del
              panel, o una externa): no pasa por next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstSlide.imageUrl}
            alt={firstSlide.alt}
            fetchPriority="high"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
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
          const loading = isFirstImage
            ? "eager"
            : shouldLoadEager
              ? "eager"
              : "lazy";
          const tieneMobilPropia = slide.imageUrlMobile !== slide.imageUrl;

          return (
            <div key={index} className={styles.slide}>
              {/* URLs de texto libre (el host de medios local del panel, o
                  externas): no pasan por next/image, mismo criterio que
                  `/servicios` y `/noticias`. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.imageUrl}
                alt={slide.alt}
                className={
                  tieneMobilPropia
                    ? `${styles.image} ${styles.imageDesktop}`
                    : styles.image
                }
                loading={loading}
                fetchPriority={isFirstImage ? "high" : "auto"}
              />
              {tieneMobilPropia ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.imageUrlMobile}
                  alt={slide.alt}
                  className={`${styles.image} ${styles.imageMobile}`}
                  loading={loading}
                  fetchPriority={isFirstImage ? "high" : "auto"}
                />
              ) : null}
              <div className={styles.overlay}>
                <div className={styles.content}>
                  <h1 className={styles.title}>{slide.title}</h1>
                  {slide.caption ? (
                    <p className={styles.subtitle}>{slide.caption}</p>
                  ) : null}
                  {slide.ctaUrl && slide.ctaLabel ? (
                    <a href={slide.ctaUrl} className={styles.ctaButton}>
                      {slide.ctaLabel}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {bannerSlides.length > 1 ? (
        <>
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
            {bannerSlides.map((_: unknown, index: number) => (
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
        </>
      ) : null}
    </section>
  );
}
