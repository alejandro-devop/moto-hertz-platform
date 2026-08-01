"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import Menu from "@/components/menu";
import Banner from "@/components/banner/Banner";
import MotosSection from "@/components/motos-section/MotosSection";
import Cards from "@/components/cards/Cards";
import SecondBanner from "@/components/second-banner/SecondBanner";
import NewsSection from "@/components/news-section/NewsSection";
import { getBanners } from "@/services/banners";
import { getMotorcycles } from "@/services/motorcycles";
import { getServices } from "@/services/services";
import { getNews } from "@/services/news";

// Cargar componentes no críticos de manera diferida
const Footer = dynamic(() => import("@/components/footer"), {
  loading: () => (
    <div
      className="content-skeleton"
      style={{ height: "200px", marginTop: "2rem" }}
    />
  ),
});

/** Mismo texto que antes estaba quemado acá: valor por defecto hasta que
 * alguien cargue un banner real en el slot SECUNDARIO desde `/banners`. */
const DEFAULT_SECOND_BANNER = {
  title: "Financia tu próxima Yamaha",
  description:
    "Planes de crédito flexibles para que estrenes tu moto sin complicaciones.",
  ctaLabel: "Conocer planes",
  ctaUrl: "/motos",
  backgroundImage:
    "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=1600",
};

/**
 * La home. Desde la Fase 5 del plan CMS ya no lee el "layout" tipo
 * Contentful de `web/src/data/home-mock.json` (borrado en esta fase): el
 * carrusel sale de `home_banners` (administrable en `/banners` del panel) y
 * las franjas de servicios/noticias muestran lo mismo que ya se administra en
 * `/servicios` y `/noticias` — la home dejó de inventar sus propias tarjetas.
 *
 * El segundo banner ancho también se administra desde `/banners` (slot
 * `SECUNDARIO`) desde que se resolvió el pedido de MEJORAS.md de administrar
 * todos los banners del sitio, no solo el carrusel — antes quedaba fijo en
 * este componente. Los títulos de cada sección (`Motos Destacadas`,
 * `Servicios Yamaha`...) siguen fijos en el código, fuera de ese alcance.
 */
export default function Home() {
  const { data: bannerData } = useQuery({
    queryKey: ["home-banners"],
    queryFn: () => getBanners({ limit: 10, slot: "HOME" }),
  });

  const { data: secondBannerData } = useQuery({
    queryKey: ["home-second-banner"],
    queryFn: () => getBanners({ limit: 1, slot: "SECUNDARIO" }),
  });
  const secondBanner = secondBannerData?.banners[0];

  /* Franja de motos destacadas, antes de servicios (decidido con el
     usuario): solo las que estén marcadas `featured: true` en el panel. Si
     no hay ninguna, `MotosSection` no se pinta. */
  const { data: motorcycleData } = useQuery({
    queryKey: ["home-motorcycles"],
    queryFn: () => getMotorcycles({ page: 1, limit: 6, featured: true }),
  });

  /* Los servicios y noticias más recientes: no hace falta una query nueva,
     son las mismas que ya usan `/servicios` y `/noticias`. */
  const { data: serviceData } = useQuery({
    queryKey: ["home-services"],
    queryFn: () => getServices({ page: 1, limit: 3 }),
  });

  const { data: newsData } = useQuery({
    queryKey: ["home-news"],
    queryFn: () => getNews({ page: 1, limit: 2 }),
  });

  return (
    <div className="min-h-screen">
      <Menu />

      <Banner slides={bannerData?.banners} autoPlayInterval={5000} />

      <MotosSection motorcycles={motorcycleData?.motorcycles} />

      <Cards services={serviceData?.services} />

      <SecondBanner
        title={secondBanner?.title || DEFAULT_SECOND_BANNER.title}
        description={
          secondBanner?.subtitle || DEFAULT_SECOND_BANNER.description
        }
        ctaLabel={secondBanner?.linkLabel || DEFAULT_SECOND_BANNER.ctaLabel}
        ctaUrl={secondBanner?.link || DEFAULT_SECOND_BANNER.ctaUrl}
        backgroundImage={
          secondBanner?.image || DEFAULT_SECOND_BANNER.backgroundImage
        }
        parallaxSpeed={0.1}
      />

      <NewsSection news={newsData?.news} />

      <Footer />
    </div>
  );
}
