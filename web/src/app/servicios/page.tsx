"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/footer";
import Menu from "@/components/menu";
import { useInView } from "@/hooks";
import { getServices } from "@/services/services";
import type { Service } from "@/types/service";
import { ServiceIcon } from "@/utils/service-icons";
import { partesDePrecio, PRECIO_A_CONVENIR } from "@/utils/service-pricing";
import styles from "./Servicios.module.scss";

/**
 * El precio de la tarjeta y del modal. Con `A_CONVENIR` no se pinta un monto
 * vacío: se dice «A convenir», que es lo que de verdad pasa.
 */
function Precio({ service }: { service: Service }) {
  const { rotulo, monto } = partesDePrecio(service.pricing);
  const nota = service.pricing?.note?.trim();

  return (
    <div className={styles.priceInfo}>
      <span className={styles.from}>{rotulo}</span>
      <span className={styles.amount}>{monto ?? PRECIO_A_CONVENIR}</span>
      {nota && <span className={styles.frequency}>{nota}</span>}
    </div>
  );
}

function ServiceCard({
  service,
  index,
  onShowDetails,
}: {
  service: Service;
  index: number;
  onShowDetails: (service: Service) => void;
}) {
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <article
      id={service.slug}
      ref={ref}
      className={`${styles.serviceCard} ${isInView ? styles.visible : ""}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {service.featured && (
        <span className={styles.featuredBadge}>Destacado</span>
      )}

      {/* La imagen es opcional: sin ella la tarjeta se ve igual, solo sin foto. */}
      {service.image && (
        <div className={styles.cardImage}>
          {/* URL de texto libre (puede ser externa): no pasa por next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={service.image} alt={service.name} loading="lazy" />
        </div>
      )}

      <div className={styles.cardHeader}>
        <span className={styles.icon}>
          <ServiceIcon name={service.icon} />
        </span>
        <div className={styles.headerContent}>
          <h3>{service.name}</h3>
          {service.category && (
            <span className={styles.category}>{service.category}</span>
          )}
        </div>
      </div>

      {service.shortDescription && (
        <p className={styles.shortDescription}>{service.shortDescription}</p>
      )}

      <div className={styles.pricing}>
        <Precio service={service} />
        {service.duration && (
          <div className={styles.duration}>
            <span className={styles.label}>Duración:</span>
            <span className={styles.value}>{service.duration}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => onShowDetails(service)}
      >
        Ver más detalles
      </button>
    </article>
  );
}

function ServiceModal({
  service,
  onClose,
}: {
  service: Service | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (service) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [service]);

  if (!service) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>

        <div className={styles.modalHeader}>
          <span className={styles.modalIcon}>
            <ServiceIcon name={service.icon} />
          </span>
          <div>
            <h2>{service.name}</h2>
            {service.category && (
              <span className={styles.modalCategory}>{service.category}</span>
            )}
          </div>
        </div>

        <div className={styles.modalBody}>
          {service.fullDescription ? (
            <p className={styles.fullDescription}>{service.fullDescription}</p>
          ) : service.shortDescription ? (
            <p className={styles.fullDescription}>{service.shortDescription}</p>
          ) : null}

          <div className={styles.modalPricing}>
            <Precio service={service} />
            {service.duration && (
              <div className={styles.duration}>
                <span className={styles.label}>Duración:</span>
                <span className={styles.value}>{service.duration}</span>
              </div>
            )}
          </div>

          {/* Las listas van en el orden en que se editaron en el panel. */}
          {service.features.length > 0 && (
            <div className={styles.detailSection}>
              <h4>Características incluidas</h4>
              <ul className={styles.featureList}>
                {service.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {service.benefits.length > 0 && (
            <div className={styles.detailSection}>
              <h4>Beneficios</h4>
              <ul className={styles.benefitList}>
                {service.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* El botón lleva a algún lado: antes no hacía nada. Se pide en un
              punto de atención, que es donde se presta el servicio. */}
          <Link href="/puntos-atencion" className={styles.contactButton}>
            Solicitar en un punto de atención
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ServiciosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["services"],
    queryFn: () => getServices({ page: 1, limit: 100 }),
  });

  const services = useMemo(() => data?.services ?? [], [data]);

  const categories = useMemo(() => {
    const nombres = new Set<string>();
    for (const service of services) {
      if (service.category) nombres.add(service.category);
    }
    return [...nombres].sort((a, b) => a.localeCompare(b, "es"));
  }, [services]);

  const filteredServices =
    selectedCategory === "all"
      ? services
      : services.filter((service) => service.category === selectedCategory);

  const featuredServices = services.filter((service) => service.featured);

  return (
    <>
      <Menu />
      <main className={styles.serviciosPage}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Nuestros Servicios</h1>
            <p>
              Mantenimiento, reparación y personalización con los más altos
              estándares de calidad. Tu moto en manos expertas.
            </p>
          </div>
        </section>

        {featuredServices.length > 0 && (
          <section className={styles.featured}>
            <div className={styles.featuredContainer}>
              <h2>Servicios Destacados</h2>
              <div className={styles.featuredGrid}>
                {featuredServices.slice(0, 3).map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    onShowDetails={setSelectedService}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Con una sola categoría el filtro no filtra nada: no se muestra. */}
        {categories.length > 1 && (
          <section className={styles.filters}>
            <div className={styles.filterContainer}>
              <h2>Filtrar por categoría</h2>
              <div className={styles.filterButtons}>
                <button
                  type="button"
                  className={
                    selectedCategory === "all" ? styles.active : undefined
                  }
                  onClick={() => setSelectedCategory("all")}
                >
                  Todos
                </button>
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={
                      selectedCategory === category ? styles.active : undefined
                    }
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {isLoading && (
          <div className={styles.noResults}>
            <p>Cargando servicios...</p>
          </div>
        )}

        {/* Si el backend no responde, la página sigue en pie: el resto del
            sitio no se cae por esta sección. */}
        {isError && (
          <div className={styles.noResults}>
            <p>
              No pudimos cargar los servicios. Intenta de nuevo en un momento.
            </p>
          </div>
        )}

        {!isLoading && !isError && services.length > 0 && (
          <section className={styles.servicesGrid}>
            <div className={styles.gridContainer}>
              {filteredServices.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={index}
                  onShowDetails={setSelectedService}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sin ningún servicio cargado la página no queda en blanco: dice que
            todavía no hay y para dónde ir mientras tanto. */}
        {!isLoading && !isError && services.length === 0 && (
          <div className={styles.emptyState}>
            <h2>Estamos organizando nuestros servicios</h2>
            <p>
              Muy pronto vas a ver aquí todo lo que hacemos en el taller.
              Mientras tanto, escríbenos o pásate por el punto de atención más
              cercano y te contamos.
            </p>
            <Link href="/puntos-atencion" className={styles.emptyAction}>
              Ver puntos de atención
            </Link>
          </div>
        )}

        {!isLoading &&
          !isError &&
          services.length > 0 &&
          filteredServices.length === 0 && (
            <div className={styles.noResults}>
              <p>No se encontraron servicios en esta categoría.</p>
            </div>
          )}
      </main>
      <Footer />
      <ServiceModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </>
  );
}
