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
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.grid}>
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
      className={`${styles.card} ${isInView ? styles.cardVisible : ""}`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className={styles.imageContainer}>
        {service.image ? (
          // URL de texto libre (el host de medios local del panel, o
          // externa): no pasa por next/image, mismo criterio que /servicios.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.image}
            alt={service.name}
            loading="lazy"
            className={styles.image}
          />
        ) : (
          <div className={styles.iconPlaceholder}>
            <ServiceIcon name={service.icon} className="h-12 w-12" />
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.cardTitle}>{service.name}</h3>

        {service.shortDescription ? (
          <p className={styles.cardDescription}>
            {service.shortDescription}
          </p>
        ) : null}

        <div className={styles.buttonContainer}>
          <Button
            size="md"
            onClick={() => router.push(`/servicios#${service.slug}`)}
          >
            Ver más
          </Button>
        </div>
      </div>
    </div>
  );
}
