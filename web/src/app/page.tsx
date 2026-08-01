"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import Menu from "@/components/menu";
import Banner from "@/components/banner/Banner";
import Cards from "@/components/cards/Cards";
import SecondBanner from "@/components/second-banner/SecondBanner";
import NewsSection from "@/components/news-section/NewsSection";
import { getBanners } from "@/services/banners";
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

/**
 * La home. Desde la Fase 5 del plan CMS ya no lee el "layout" tipo
 * Contentful de `web/src/data/home-mock.json` (borrado en esta fase): el
 * carrusel sale de `home_banners` (administrable en `/banners` del panel) y
 * las franjas de servicios/noticias muestran lo mismo que ya se administra en
 * `/servicios` y `/noticias` — la home dejó de inventar sus propias tarjetas.
 *
 * El segundo banner ancho ("Financia tu próxima Yamaha") y los títulos de
 * cada sección quedan fijos aquí a propósito: es el alcance mínimo acordado
 * con el usuario para esta fase (ver `docs/cms-plan/phases/05-home-y-banners.md`).
 */
export default function Home() {
  const { data: bannerData } = useQuery({
    queryKey: ["home-banners"],
    queryFn: () => getBanners({ limit: 10 }),
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

      <Cards services={serviceData?.services} />

      <SecondBanner
        title="Financia tu próxima Yamaha"
        description="Planes de crédito flexibles para que estrenes tu moto sin complicaciones."
        ctaLabel="Conocer planes"
        ctaUrl="/motos"
        backgroundImage="https://images.unsplash.com/photo-1558980664-769d59546b3d?w=1600"
        parallaxSpeed={0.1}
      />

      <NewsSection news={newsData?.news} />

      <Footer />
    </div>
  );
}
