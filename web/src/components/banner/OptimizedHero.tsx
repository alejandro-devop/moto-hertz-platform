"use client";

import { memo } from "react";
import Image from "next/image";

// Componente ultra-optimizado para el LCP
const OptimizedHero = memo(() => {
  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "400px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src="/assets/banner-gallery/banner-1.webp"
        alt="Yamaha Oriente - Nueva generación de motocicletas"
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={90}
        style={{
          objectFit: "cover",
          zIndex: 1,
        }}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyOpWlvLdfSNBDkUwtE5qTbqONX8E2DFFYPeVf/2Q=="
      />

      {/* Overlay optimizado */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            fontWeight: "bold",
            color: "white",
            margin: 0,
            marginBottom: "1rem",
            textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
            lineHeight: "1.1",
          }}
        >
          Yamaha Oriente
        </h1>

        <p
          style={{
            fontSize: "clamp(1.1rem, 3vw, 1.8rem)",
            color: "rgba(255,255,255,0.95)",
            maxWidth: "700px",
            margin: "0 0 2rem 0",
            lineHeight: "1.4",
            textShadow: "1px 1px 4px rgba(0,0,0,0.7)",
          }}
        >
          Descubre la nueva generación de motocicletas Yamaha.
          <br />
          Potencia, diseño y tecnología en perfecta armonía.
        </p>

        <button
          style={{
            padding: "1.2rem 2.5rem",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "1.2rem",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,102,204,0.4)",
            transition: "all 0.3s ease",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLElement;
            target.style.transform = "translateY(-3px)";
            target.style.boxShadow = "0 8px 25px rgba(0,102,204,0.6)";
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLElement;
            target.style.transform = "translateY(0)";
            target.style.boxShadow = "0 6px 20px rgba(0,102,204,0.4)";
          }}
        >
          Explorar Modelos
        </button>
      </div>
    </section>
  );
});

OptimizedHero.displayName = "OptimizedHero";

export default OptimizedHero;
