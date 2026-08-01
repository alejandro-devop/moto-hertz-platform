"use client";

import { useRouter } from "next/navigation";
import Button from "../button/Button";
import styles from "./Cards.module.scss";
import { useInView } from "@/hooks";
import type { Service } from "@/types/service";
import { ServiceIcon } from "@/utils/service-icons";

interface CardsProps {
  /** Servicios reales del backend (Fase 5 del plan CMS), no plantilla. */
  services?: Service[];
  title?: string;
  subtitle?: string;
}

/**
 * La franja de servicios de la home. El título y el subtítulo quedan fijos
 * en el código (alcance mínimo de la Fase 5); las tarjetas son las que ya se
 * administran en `/servicios` del panel — la home ya no inventa las suyas.
 */
export default function Cards({
  services,
  title = "Servicios Yamaha",
  subtitle = "Descubre todos los servicios que tenemos disponibles para ti",
}: CardsProps = {}) {
  if (!services || services.length === 0) return null;

  return (
    <section className={`${styles.section} py-16 bg-gray-50`}>
      <div
        className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8"
        style={{
          marginLeft: "auto",
          marginRight: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-center text-gray-600">{subtitle}</p>

        <div
          className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center"
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ServiceCardProps {
  service: Service;
  index: number;
}

function ServiceCard({ service, index }: ServiceCardProps) {
  const router = useRouter();
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg shadow-md p-6 space-y-4 w-full max-w-sm hover:shadow-lg transition-shadow duration-300 ${
        styles.card
      } ${isInView ? styles.cardVisible : ""}`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg overflow-hidden relative">
        {service.image ? (
          // URL de texto libre (el host de medios local del panel, o
          // externa): no pasa por next/image, mismo criterio que /servicios.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.image}
            alt={service.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ServiceIcon name={service.icon} className="h-12 w-12 text-white" />
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 text-center">
        {service.name}
      </h3>

      {service.shortDescription ? (
        <p className="text-gray-600 text-center leading-relaxed">
          {service.shortDescription}
        </p>
      ) : null}

      <div className="flex justify-center pt-6">
        <Button
          size="md"
          className={styles.button}
          onClick={() => router.push(`/servicios#${service.slug}`)}
        >
          Ver más
        </Button>
      </div>
    </div>
  );
}
