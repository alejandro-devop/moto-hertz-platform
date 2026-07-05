"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

// Cargar el Banner completo de manera muy diferida
const LazyBanner = dynamic(() => import("./Banner"), {
  loading: () => <BannerSkeleton />,
  ssr: false,
});

// Componente skeleton optimizado para LCP
function BannerSkeleton() {
  return (
    <section className="banner-critical">
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          minHeight: "400px",
        }}
      >
        <Image
          src="/assets/banner-gallery/banner-1.webp"
          alt="Yamaha Oriente"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          style={{ objectFit: "cover" }}
          quality={90}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            flexDirection: "column",
            gap: "1.5rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: "bold",
              margin: 0,
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            Yamaha Oriente
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
              maxWidth: "600px",
              margin: 0,
              lineHeight: 1.4,
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            Descubre la nueva generación de motocicletas Yamaha
          </p>
          <button
            style={{
              padding: "1rem 2rem",
              backgroundColor: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1.1rem",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "1rem",
              transition: "transform 0.2s",
              boxShadow: "0 4px 12px rgba(0,102,204,0.3)",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.transform = "translateY(0)")
            }
          >
            Explorar Modelos
          </button>
        </div>
      </div>
    </section>
  );
}

export default function BannerWrapper() {
  const [shouldLoadFull, setShouldLoadFull] = useState(false);

  useEffect(() => {
    // Usar requestIdleCallback para cargar el banner completo cuando el browser esté idle
    const loadFullBanner = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            setShouldLoadFull(true);
          },
          { timeout: 2000 }
        );
      } else {
        // Fallback para navegadores sin requestIdleCallback
        setTimeout(() => {
          setShouldLoadFull(true);
        }, 1500);
      }
    };

    // Cargar solo después de que la página haya terminado de cargar
    if (document.readyState === "complete") {
      loadFullBanner();
    } else {
      window.addEventListener("load", loadFullBanner);
      return () => window.removeEventListener("load", loadFullBanner);
    }
  }, []);

  return shouldLoadFull ? <LazyBanner /> : <BannerSkeleton />;
}
