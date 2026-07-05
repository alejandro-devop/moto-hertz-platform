"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, lazy, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import Menu from "@/components/menu";
import Footer from "@/components/footer";
import { useInView } from "@/hooks";
import motorcyclesData from "@/data/motorcycles-mock.json";
import styles from "./MotorcycleDetail.module.scss";

const ImageModal = lazy(() => import("@/components/image-modal"));
const Modal = lazy(() => import("@/components/modal"));

type Motorcycle = {
  id: string;
  slug: string;
  name: string;
  category: string;
  year: number;
  price: number;
  currency: string;
  description: string;
  fullDescription: string;
  engine: {
    type: string;
    displacement: string;
    power: string;
    torque: string;
  };
  features: string[];
  colors: string[];
  images: {
    main: string;
    gallery: string[];
  };
  specs: {
    weight: string;
    seatHeight: string;
    fuelCapacity: string;
    transmission: string;
  };
  available: boolean;
  featured: boolean;
};

function RelatedMotorcycleCard({ moto }: { moto: Motorcycle }) {
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <div
      ref={ref}
      className={`${styles.relatedCard} ${isInView ? styles.visible : ""}`}
    >
      <Link href={`/motos/${moto.slug}`} className={styles.relatedLink}>
        <div className={styles.relatedImage}>
          <img src={moto.images.main} alt={moto.name} />
        </div>
        <div className={styles.relatedContent}>
          <h4>{moto.name}</h4>
          <p className={styles.relatedCategory}>{moto.category}</p>
          <p className={styles.relatedPrice}>
            {moto.currency} ${moto.price.toLocaleString()}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function MotorcycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isTestDriveModalOpen, setIsTestDriveModalOpen] = useState(false);

  const motorcycles = motorcyclesData.motorcycles as Motorcycle[];
  const motorcycle = motorcycles.find((m) => m.slug === slug);

  if (!motorcycle) {
    return (
      <>
        <Menu />
        <div className={styles.notFound}>
          <h1>Motocicleta no encontrada</h1>
          <p>La motocicleta que buscas no existe.</p>
          <Link href="/motos" className={styles.backButton}>
            Volver a motocicletas
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  // Motos relacionadas (misma categoría, excluyendo la actual)
  const relatedMotorcycles = motorcycles
    .filter((m) => m.category === motorcycle.category && m.slug !== slug)
    .slice(0, 3);

  return (
    <>
      <Menu />
      <main className={styles.detailPage}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <div className={styles.container}>
            <Link href="/">Inicio</Link>
            <span>/</span>
            <Link href="/motos">Motocicletas</Link>
            <span>/</span>
            <span>{motorcycle.name}</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              {/* Gallery */}
              <div className={styles.gallery}>
                <div
                  className={styles.mainImage}
                  onClick={() => {
                    setModalImageIndex(selectedImage);
                    setIsModalOpen(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={motorcycle.images.gallery[selectedImage]}
                    alt={`${motorcycle.name} - Vista ${selectedImage + 1}`}
                  />
                  {motorcycle.featured && (
                    <span className={styles.featuredBadge}>Destacada</span>
                  )}
                  <div className={styles.zoomHint}>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                      <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" />
                    </svg>
                    <span>Click para ampliar</span>
                  </div>
                </div>
                <div className={styles.thumbnails}>
                  {motorcycle.images.gallery.map((img, index) => (
                    <button
                      key={index}
                      className={`${styles.thumbnail} ${
                        selectedImage === index ? styles.active : ""
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img src={img} alt={`Vista ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className={styles.info}>
                <span className={styles.category}>{motorcycle.category}</span>
                <h1>{motorcycle.name}</h1>
                <p className={styles.description}>{motorcycle.description}</p>

                <div className={styles.price}>
                  <span className={styles.priceLabel}>Precio</span>
                  <div className={styles.priceAmount}>
                    <span className={styles.currency}>
                      {motorcycle.currency}
                    </span>
                    <span className={styles.amount}>
                      ${motorcycle.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Colors */}
                <div className={styles.colors}>
                  <h3>Colores disponibles</h3>
                  <div className={styles.colorOptions}>
                    {motorcycle.colors.map((color, index) => (
                      <button
                        key={index}
                        className={`${styles.colorButton} ${
                          selectedColor === index ? styles.active : ""
                        }`}
                        onClick={() => setSelectedColor(index)}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className={styles.actions}>
                  <button
                    className={styles.primaryButton}
                    onClick={() => setIsQuoteModalOpen(true)}
                  >
                    Solicitar cotización
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => setIsTestDriveModalOpen(true)}
                  >
                    Agendar prueba de manejo
                  </button>
                </div>

                {/* Quick Specs */}
                <div className={styles.quickSpecs}>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Motor</span>
                    <span className={styles.specValue}>
                      {motorcycle.engine.displacement}
                    </span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Potencia</span>
                    <span className={styles.specValue}>
                      {motorcycle.engine.power}
                    </span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Peso</span>
                    <span className={styles.specValue}>
                      {motorcycle.specs.weight}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full Description */}
        <section className={styles.fullDescription}>
          <div className={styles.container}>
            <h2>Descripción completa</h2>
            <p>{motorcycle.fullDescription}</p>
          </div>
        </section>

        {/* Specifications */}
        <section className={styles.specifications}>
          <div className={styles.container}>
            <h2>Especificaciones técnicas</h2>
            <div className={styles.specsGrid}>
              <div className={styles.specGroup}>
                <h3>Motor</h3>
                <div className={styles.specsList}>
                  <div className={styles.specRow}>
                    <span>Tipo</span>
                    <span>{motorcycle.engine.type}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Cilindrada</span>
                    <span>{motorcycle.engine.displacement}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Potencia</span>
                    <span>{motorcycle.engine.power}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Torque</span>
                    <span>{motorcycle.engine.torque}</span>
                  </div>
                </div>
              </div>

              <div className={styles.specGroup}>
                <h3>Dimensiones y Peso</h3>
                <div className={styles.specsList}>
                  <div className={styles.specRow}>
                    <span>Peso</span>
                    <span>{motorcycle.specs.weight}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Altura del asiento</span>
                    <span>{motorcycle.specs.seatHeight}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Capacidad combustible</span>
                    <span>{motorcycle.specs.fuelCapacity}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span>Transmisión</span>
                    <span>{motorcycle.specs.transmission}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={styles.features}>
          <div className={styles.container}>
            <h2>Características destacadas</h2>
            <div className={styles.featuresList}>
              {motorcycle.features.map((feature, index) => (
                <div key={index} className={styles.featureItem}>
                  <svg
                    className={styles.checkIcon}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Motorcycles */}
        {relatedMotorcycles.length > 0 && (
          <section className={styles.related}>
            <div className={styles.container}>
              <h2>También te podría interesar</h2>
              <div className={styles.relatedGrid}>
                {relatedMotorcycles.map((moto) => (
                  <RelatedMotorcycleCard key={moto.id} moto={moto} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />

      {/* Image Modal - Client Side Only */}
      <Suspense fallback={null}>
        <ImageModal
          images={motorcycle.images.gallery}
          initialIndex={modalImageIndex}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          alt={motorcycle.name}
        />
      </Suspense>

      {/* Quote Modal - Client Side Only */}
      <Suspense fallback={null}>
        <Modal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          title="Cotización en desarrollo"
          message="Estamos trabajando para habilitar esta funcionalidad. Pronto podrás solicitar cotizaciones de nuestras motocicletas de manera rápida y sencilla."
          icon="settings"
        />
      </Suspense>

      {/* Test Drive Modal - Client Side Only */}
      <Suspense fallback={null}>
        <Modal
          isOpen={isTestDriveModalOpen}
          onClose={() => setIsTestDriveModalOpen(false)}
          title="Prueba de manejo en desarrollo"
          message="Estamos trabajando para habilitar esta funcionalidad. Pronto podrás agendar pruebas de manejo y experimentar nuestras motocicletas en persona."
          icon="settings"
        />
      </Suspense>
    </>
  );
}
