import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers";
import WelcomeModal from "@/components/welcome-modal";
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

export const metadata: Metadata = {
  title: "Yamaha Oriente",
  description: "Sitio web de Yamaha Oriente",
  icons: {
    icon: "/assets/logos/favicon.ico",
  },
  manifest: "/manifest.json",
};

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
