import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers";
import WelcomeModal from "@/components/welcome-modal";
import { getSiteSettingsConFallback } from "@/services/site-settings";
import "./globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Mejora la experiencia de carga
  preload: true,
  fallback: ["system-ui", "arial"], // Fallback inmediato
  // Optimización de subsetting
  adjustFontFallback: false,
  weight: ["400", "500", "600", "700"], // Solo los pesos que usamos
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // No precargar la fuente mono ya que no es crítica
  fallback: ["'Courier New'", "monospace"],
  // Optimización de subsetting
  adjustFontFallback: false,
  weight: ["400", "500"], // Solo los pesos que usamos
});

/**
 * Metadatos de SEO desde `site_settings` (Fase 6 del plan CMS): título,
 * descripción, palabras clave e imagen para compartir en redes (Open
 * Graph/Twitter). Antes de esta fase el sitio no tenía `openGraph`, `keywords`
 * ni `twitter` — no era texto quemado que se movió, era una laguna real.
 *
 * `generateMetadata` corre en el servidor en cada request (Next 15 no cachea
 * `fetch` por defecto): un cambio en el panel se ve en la siguiente carga de
 * página, sin esperar un redeploy. `getSiteSettingsConFallback` nunca
 * rechaza — si el backend no responde, el sitio arranca con el título y la
 * descripción que ya tenía antes de esta fase, nunca con una pestaña en blanco.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsConFallback();
  const title = settings.seoTitle?.trim() || settings.siteName;
  const description =
    settings.seoDescription?.trim() || `Sitio web de ${settings.siteName}`;
  const images = settings.seoImage ? [{ url: settings.seoImage }] : undefined;

  return {
    title,
    description,
    keywords: settings.seoKeywords.length > 0 ? settings.seoKeywords : undefined,
    icons: {
      icon: "/assets/logos/favicon.ico",
    },
    manifest: "/manifest.json",
    openGraph: {
      title,
      description,
      siteName: settings.siteName,
      type: "website",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {/* Preconectar a Google Fonts para reducir latencia */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* DNS prefetch para otros recursos que podrían usarse */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Resource hints para mejores Core Web Vitals */}
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <QueryProvider>{children}</QueryProvider>
        <WelcomeModal />
      </body>
    </html>
  );
}
