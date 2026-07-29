import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
        },
        cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
          return `${request.url}?${Math.round(
            Date.now() / (1000 * 60 * 60 * 24)
          )}`;
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "gstatic-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "images-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
  ],
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",

  // Optimizaciones para mejorar el rendimiento
  images: {
    // Formatos modernos de imagen
    formats: ["image/webp", "image/avif"],
    // Calidades optimizadas
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Lazy loading por defecto
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Optimización de calidad para reducir tamaño
    minimumCacheTTL: 31536000,
    // Dominios remotos permitidos para imágenes
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/yamaha_oriente_bucket/**",
      },
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "extranet.incolmotos-yamaha.com.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  // Optimizaciones de compilación
  compiler: {
    // Remover console.log en producción
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Configuración experimental para mejorar el rendimiento
  experimental: {
    // Solo mantener optimizaciones estables
    optimizePackageImports: ["react", "react-dom"],
    // Optimizar carga de fuentes
    optimizeServerReact: true,
    // Optimizar chunks
    webpackBuildWorker: true,
  }, // Configurar headers para cache y rendimiento
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Accept-Ranges",
            value: "bytes",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withPWA(nextConfig));
