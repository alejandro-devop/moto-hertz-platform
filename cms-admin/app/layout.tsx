import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/**
 * IBM Plex Sans y Plex Mono son la misma superfamilia: el texto de la interfaz
 * y las cifras de las columnas comparten proporciones y tono, en vez de
 * parecer dos decisiones distintas.
 */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Plex Mono para datos: referencias, fechas, kilometraje y columnas de precio. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Motos Hot Wheels — Administración",
  description: "Panel de administración del catálogo y el contenido del sitio",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* La barra inferior de navegación vive sobre el área segura del teléfono. */
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1113" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* Las variables de `next/font` van en <html>: `globals.css` las consume
       desde `:root`, y si vivieran en <body> no existirían al resolverse ahí. */
    <html lang="es" className={`${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
