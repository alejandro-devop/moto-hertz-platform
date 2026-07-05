"use client";

import { useState, useEffect } from "react";
import Menu from "@/components/menu";
import Footer from "@/components/footer";
import { useInView } from "@/hooks";
import servicesData from "@/data/services-mock.json";
import styles from "./Servicios.module.scss";

type Service = {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  features: string[];
  benefits: string[];
  pricing: {
    from: number;
    currency: string;
    frequency: string;
  };
  duration: string;
  featured: boolean;
  image: string;
};

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
      ref={ref}
      className={`${styles.serviceCard} ${isInView ? styles.visible : ""}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {service.featured && (
        <span className={styles.featuredBadge}>Destacado</span>
      )}
      <div className={styles.cardHeader}>
        <span className={styles.icon}>{service.icon}</span>
        <div className={styles.headerContent}>
          <h3>{service.name}</h3>
          <span className={styles.category}>{service.category}</span>
        </div>
      </div>

      <p className={styles.shortDescription}>{service.shortDescription}</p>

      <div className={styles.pricing}>
        <div className={styles.priceInfo}>
          <span className={styles.from}>Desde</span>
          <span className={styles.amount}>
            ${service.pricing.from.toLocaleString()}
          </span>
          <span className={styles.frequency}>{service.pricing.frequency}</span>
        </div>
        <div className={styles.duration}>
          <span className={styles.label}>Duración:</span>
          <span className={styles.value}>{service.duration}</span>
        </div>
      </div>

      <button
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
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        <div className={styles.modalHeader}>
          <span className={styles.modalIcon}>{service.icon}</span>
          <div>
            <h2>{service.name}</h2>
            <span className={styles.modalCategory}>{service.category}</span>
          </div>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.fullDescription}>{service.fullDescription}</p>

          <div className={styles.modalPricing}>
            <div className={styles.priceInfo}>
              <span className={styles.from}>Desde</span>
              <span className={styles.amount}>
                ${service.pricing.from.toLocaleString()}
              </span>
              <span className={styles.frequency}>
                {service.pricing.frequency}
              </span>
            </div>
            <div className={styles.duration}>
              <span className={styles.label}>Duración:</span>
              <span className={styles.value}>{service.duration}</span>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4>Características incluidas</h4>
            <ul className={styles.featureList}>
              {service.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className={styles.detailSection}>
            <h4>Beneficios</h4>
            <ul className={styles.benefitList}>
              {service.benefits.map((benefit, idx) => (
                <li key={idx}>{benefit}</li>
              ))}
            </ul>
          </div>

          <button className={styles.contactButton}>Solicitar servicio</button>
        </div>
      </div>
    </div>
  );
}

export default function ServiciosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const services = servicesData.services as Service[];

  // Extraer categorías únicas
  const categories = Array.from(
    new Set(services.map((service) => service.category))
  ).sort();

  const filteredServices =
    selectedCategory === "all"
      ? services
      : services.filter((service) => service.category === selectedCategory);

  // Servicios destacados
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
              estándares de calidad. Tu Yamaha en manos expertas.
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

        <section className={styles.filters}>
          <div className={styles.filterContainer}>
            <h2>Filtrar por categoría</h2>
            <div className={styles.filterButtons}>
              <button
                className={
                  selectedCategory === "all" ? styles.active : undefined
                }
                onClick={() => setSelectedCategory("all")}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
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

        {filteredServices.length === 0 && (
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
