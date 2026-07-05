"use client";

import Image from "next/image";
import Button from "../button/Button";
import { useSmartParallax, useInView } from "../../hooks";
import styles from "./SecondBanner.module.scss";

interface SecondBannerProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundImage?: {
    fields: {
      url: string;
      title?: string;
      description?: string;
    };
  };
  parallaxSpeed?: number;
}

export default function SecondBanner({
  title = "TIENDA YAMAHA",
  description = "Compra repuestos originales, prendas de moda y accesorios exclusivos para vivir cada kilómetro con estilo.",
  ctaLabel = "Comprar ahora",
  ctaUrl = "#",
  backgroundImage,
  parallaxSpeed = 0.3,
}: SecondBannerProps = {}) {
  // Hook para el efecto parallax inteligente y centrado
  const backgroundParallax = useSmartParallax(parallaxSpeed);

  // Hook para el efecto fade-in
  const { ref: fadeRef, isInView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  // Get image URL from Contentful
  const imageUrl = backgroundImage?.fields?.url || "";
  const fullImageUrl = imageUrl.startsWith("//")
    ? `https:${imageUrl}`
    : imageUrl || "/assets/separator.jpg";
  const imageAlt = backgroundImage?.fields?.title || title;

  const handleClick = () => {
    if (ctaUrl && ctaUrl !== "#") {
      window.location.href = ctaUrl;
    }
  };

  return (
    <section
      ref={fadeRef}
      className={`${styles.banner} ${isInView ? styles.bannerVisible : ""}`}
    >
      {/* Background Image with Parallax */}
      <div
        ref={backgroundParallax.ref as React.RefObject<HTMLDivElement>}
        className={styles.backgroundContainer}
        style={backgroundParallax.style}
      >
        <Image
          src={fullImageUrl}
          alt={imageAlt}
          fill
          className={styles.backgroundImage}
          priority
        />
      </div>

      {/* Overlay */}
      <div className={styles.overlay}></div>

      {/* Content */}
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>

          <p className={styles.description}>{description}</p>

          <div className={styles.ctaContainer}>
            <Button
              size="lg"
              onClick={handleClick}
              className={styles.ctaButton}
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
