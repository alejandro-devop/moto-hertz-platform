"use client";

import dynamic from "next/dynamic";
import Menu from "@/components/menu";
import { useHomeDataSimple } from "@/hooks";
import { ContentRenderPage } from "@/components/contentful";

// Cargar componentes no críticos de manera diferida
const Footer = dynamic(() => import("@/components/footer"), {
  loading: () => (
    <div
      className="content-skeleton"
      style={{ height: "200px", marginTop: "2rem" }}
    />
  ),
});

export default function Home() {
  // Obtener datos de Contentful
  const { data: homeData, loading, error } = useHomeDataSimple();

  // Manejar estado de error
  if (error) {
    console.error("Error loading home data:", error);
    return (
      <div className="min-h-screen">
        <Menu />
        <div className="container mx-auto p-8">
          <h1 className="text-2xl font-bold text-red-600">
            Error loading page
          </h1>
          <p>{error.message}</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Manejar estado de carga
  if (loading || !homeData) {
    return (
      <div className="min-h-screen">
        <Menu />
        <div className="container mx-auto p-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 mb-4"></div>
            <div className="h-64 bg-gray-200 mb-4"></div>
            <div className="h-64 bg-gray-200"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Menu />
      <ContentRenderPage data={homeData} />
      <Footer />
    </div>
  );
}
