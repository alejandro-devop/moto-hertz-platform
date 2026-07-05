"use client";

import { useState } from "react";
import Menu from "@/components/menu";
import Footer from "@/components/footer";
import { useInView } from "@/hooks";
import servicePointsData from "@/data/service-points-mock.json";
import styles from "./PuntosAtencion.module.scss";

type ServicePoint = {
  id: string;
  slug: string;
  name: string;
  type: string;
  address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  whatsapp: string;
  email: string;
  location: {
    lat: number;
    lng: number;
  };
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  services: string[];
  featured: boolean;
  image: string;
};

function ServicePointCard({
  point,
  index,
  onShowMap,
}: {
  point: ServicePoint;
  index: number;
  onShowMap: (point: ServicePoint) => void;
}) {
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  const fullAddress = `${point.address.street}, ${point.address.neighborhood}, ${point.address.city}, ${point.address.state}`;

  const getGoogleMapsUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${point.location.lat},${point.location.lng}`;
  };

  const getWhatsAppUrl = () => {
    const phone = point.whatsapp.replace(/[^0-9]/g, "");
    return `https://wa.me/${phone}`;
  };

  return (
    <article
      ref={ref}
      className={`${styles.servicePointCard} ${isInView ? styles.visible : ""}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {point.featured && (
        <span className={styles.featuredBadge}>Destacado</span>
      )}
      <div className={styles.imageContainer}>
        <img src={point.image} alt={point.name} loading="lazy" />
        <span className={styles.typebadge}>{point.type}</span>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3>{point.name}</h3>
          <p className={styles.city}>
            {point.address.city}, {point.address.state}
          </p>
        </div>

        <div className={styles.contactInfo}>
          <div className={styles.infoItem}>
            <span className={styles.icon}>📍</span>
            <div>
              <strong>Dirección</strong>
              <p>{fullAddress}</p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.icon}>📞</span>
            <div>
              <strong>Teléfono</strong>
              <p>
                <a href={`tel:${point.phone}`}>{point.phone}</a>
              </p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.icon}>📧</span>
            <div>
              <strong>Email</strong>
              <p>
                <a href={`mailto:${point.email}`}>{point.email}</a>
              </p>
            </div>
          </div>
        </div>

        <div className={styles.hours}>
          <strong>Horarios de atención</strong>
          <div className={styles.hoursList}>
            <div className={styles.hourRow}>
              <span>Lun - Vie:</span>
              <span>{point.hours.monday}</span>
            </div>
            <div className={styles.hourRow}>
              <span>Sábado:</span>
              <span>{point.hours.saturday}</span>
            </div>
            <div className={styles.hourRow}>
              <span>Domingo:</span>
              <span>{point.hours.sunday}</span>
            </div>
          </div>
        </div>

        <div className={styles.services}>
          <strong>Servicios disponibles</strong>
          <ul>
            {point.services.map((service, idx) => (
              <li key={idx}>{service}</li>
            ))}
          </ul>
        </div>

        <div className={styles.cardActions}>
          <a
            href={getGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapButton}
          >
            <span className={styles.icon}>🗺️</span>
            Ver en mapa
          </a>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappButton}
          >
            <span className={styles.icon}>💬</span>
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}

export default function PuntosAtencionPage() {
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const servicePoints = servicePointsData.servicePoints as ServicePoint[];

  // Extraer ciudades únicas
  const cities = Array.from(
    new Set(servicePoints.map((point) => point.address.city))
  ).sort();

  const filteredPoints = servicePoints.filter((point) => {
    return selectedCity === "all" || point.address.city === selectedCity;
  });

  const handleShowMap = (point: ServicePoint) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${point.location.lat},${point.location.lng}`,
      "_blank"
    );
  };

  return (
    <>
      <Menu />
      <main className={styles.puntosAtencionPage}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Puntos de Atención</h1>
            <p>
              Encuentra el concesionario o taller autorizado Yamaha más cercano
              a tu ubicación. Estamos listos para atenderte.
            </p>
          </div>
        </section>

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
                  className={selectedCity === city ? styles.active : undefined}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{servicePoints.length}</span>
              <span className={styles.statLabel}>Puntos de atención</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{cities.length}</span>
              <span className={styles.statLabel}>Ciudades</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{filteredPoints.length}</span>
              <span className={styles.statLabel}>Resultados</span>
            </div>
          </div>
        </section>

        <section className={styles.servicePointsGrid}>
          <div className={styles.gridContainer}>
            {filteredPoints.map((point, index) => (
              <ServicePointCard
                key={point.id}
                point={point}
                index={index}
                onShowMap={handleShowMap}
              />
            ))}
          </div>
        </section>

        {filteredPoints.length === 0 && (
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
