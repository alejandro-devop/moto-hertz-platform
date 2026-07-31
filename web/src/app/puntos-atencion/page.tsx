"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Menu from "@/components/menu";
import Footer from "@/components/footer";
import { useInView } from "@/hooks";
import { getServicePoints } from "@/services/service-points";
import type { ServicePoint, ServicePointType } from "@/types/service-point";
import { tramosDeHorario, urlWhatsApp } from "@/utils/service-point-hours";
import styles from "./PuntosAtencion.module.scss";

/** El catálogo cerrado del backend, en español. */
const ETIQUETA_TIPO: Record<ServicePointType, string> = {
  SEDE: "Sede",
  CONCESIONARIO: "Concesionario",
  DISTRIBUIDOR: "Distribuidor",
};

function direccionCompleta(point: ServicePoint): string {
  const { street, neighborhood, city, state } = point.address ?? {};
  return [street, neighborhood, city, state].filter(Boolean).join(", ");
}

/**
 * A dónde lleva «Cómo llegar»: el enlace que pegaron en el panel y, si no hay,
 * una búsqueda de Google Maps por la dirección. Nunca un enlace roto.
 */
function urlComoLlegar(point: ServicePoint): string | null {
  if (point.location?.mapsUrl) return point.location.mapsUrl;
  const direccion = direccionCompleta(point);
  if (!direccion) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${point.name}, ${direccion}`,
  )}`;
}

/**
 * El mapa incrustado solo existe si el punto tiene coordenadas, que salen del
 * enlace de Google Maps que se pegó en el panel. Es el `output=embed` de Maps:
 * no necesita clave de API.
 */
function urlMapaIncrustado(point: ServicePoint): string | null {
  const { lat, lng } = point.location ?? {};
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return `https://www.google.com/maps?q=${lat},${lng}&hl=es&z=16&output=embed`;
}

function ServicePointCard({
  point,
  index,
}: {
  point: ServicePoint;
  index: number;
}) {
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  const direccion = direccionCompleta(point);
  const tramos = tramosDeHorario(point.hours);
  const whatsapp = urlWhatsApp(point.whatsapp);
  const comoLlegar = urlComoLlegar(point);
  const mapa = urlMapaIncrustado(point);

  return (
    <article
      id={point.slug}
      ref={ref}
      className={`${styles.servicePointCard} ${isInView ? styles.visible : ""}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {mapa && (
        <div className={styles.mapContainer}>
          <iframe
            src={mapa}
            title={`Mapa de ${point.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      )}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <span className={styles.typeBadge}>{ETIQUETA_TIPO[point.type]}</span>
          <h3>{point.name}</h3>
          {point.address?.city && (
            <p className={styles.city}>
              {[point.address.city, point.address.state]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>

        <div className={styles.contactInfo}>
          {direccion && (
            <div className={styles.infoItem}>
              <span className={styles.icon}>📍</span>
              <div>
                <strong>Dirección</strong>
                <p>{direccion}</p>
              </div>
            </div>
          )}

          {point.phone && (
            <div className={styles.infoItem}>
              <span className={styles.icon}>📞</span>
              <div>
                <strong>Teléfono</strong>
                <p>
                  <a href={`tel:${point.phone.replace(/\s+/g, "")}`}>
                    {point.phone}
                  </a>
                </p>
              </div>
            </div>
          )}

          {point.email && (
            <div className={styles.infoItem}>
              <span className={styles.icon}>📧</span>
              <div>
                <strong>Correo</strong>
                <p>
                  <a href={`mailto:${point.email}`}>{point.email}</a>
                </p>
              </div>
            </div>
          )}
        </div>

        {tramos.length > 0 && (
          <div className={styles.hours}>
            <strong>Horarios de atención</strong>
            <div className={styles.hoursList}>
              {tramos.map((tramo) => (
                <div key={tramo.dias} className={styles.hourRow}>
                  <span>{tramo.dias}</span>
                  <span>{tramo.horas}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(comoLlegar || whatsapp) && (
          <div className={styles.cardActions}>
            {comoLlegar && (
              <a
                href={comoLlegar}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapButton}
              >
                <span className={styles.icon}>🗺️</span>
                Cómo llegar
              </a>
            )}
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappButton}
              >
                <span className={styles.icon}>💬</span>
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function PuntosAtencionPage() {
  const [selectedCity, setSelectedCity] = useState<string>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["service-points"],
    queryFn: () => getServicePoints({ page: 1, limit: 100 }),
  });

  const servicePoints = useMemo(() => data?.servicePoints ?? [], [data]);

  const cities = useMemo(() => {
    const names = new Set<string>();
    for (const point of servicePoints) {
      if (point.address?.city) names.add(point.address.city);
    }
    return [...names].sort((a, b) => a.localeCompare(b, "es"));
  }, [servicePoints]);

  const filteredPoints = servicePoints.filter(
    (point) => selectedCity === "all" || point.address?.city === selectedCity,
  );

  return (
    <>
      <Menu />
      <main className={styles.puntosAtencionPage}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Puntos de Atención</h1>
            <p>
              Encuentra la sede más cercana. Estamos listos para atenderte.
            </p>
          </div>
        </section>

        {cities.length > 1 && (
          <section className={styles.filters}>
            <div className={styles.filterContainer}>
              <h2>Filtrar por ciudad</h2>
              <div className={styles.filterButtons}>
                <button
                  className={selectedCity === "all" ? styles.active : undefined}
                  onClick={() => setSelectedCity("all")}
                >
                  Todas
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    className={
                      selectedCity === city ? styles.active : undefined
                    }
                    onClick={() => setSelectedCity(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {!isLoading && !isError && servicePoints.length > 0 && (
          <section className={styles.stats}>
            <div className={styles.statsContainer}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {servicePoints.length}
                </span>
                <span className={styles.statLabel}>Puntos de atención</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{cities.length}</span>
                <span className={styles.statLabel}>Ciudades</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {filteredPoints.length}
                </span>
                <span className={styles.statLabel}>Resultados</span>
              </div>
            </div>
          </section>
        )}

        {isLoading && (
          <div className={styles.noResults}>
            <p>Cargando puntos de atención...</p>
          </div>
        )}

        {/* Si el backend no responde, la página sigue en pie: el resto del
            sitio no se cae por esta sección. */}
        {isError && (
          <div className={styles.noResults}>
            <p>
              No pudimos cargar los puntos de atención. Intenta de nuevo en un
              momento.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <section className={styles.servicePointsGrid}>
            <div className={styles.gridContainer}>
              {filteredPoints.map((point, index) => (
                <ServicePointCard key={point.id} point={point} index={index} />
              ))}
            </div>
          </section>
        )}

        {!isLoading && !isError && filteredPoints.length === 0 && (
          <div className={styles.noResults}>
            <p>
              No se encontraron puntos de atención con los filtros
              seleccionados.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
