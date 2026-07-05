"use client";

import { useState } from "react";
import Link from "next/link";
import Menu from "@/components/menu";
import Footer from "@/components/footer";
import { useInView } from "@/hooks";
import motorcyclesData from "@/data/motorcycles-mock.json";
import styles from "./Motos.module.scss";

type Motorcycle = {
  id: string;
  slug: string;
  name: string;
  category: string;
  year: number;
  price: number;
  currency: string;
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

type Category = {
  id: string;
  name: string;
  description: string;
};

function MotorcycleCard({ moto, index }: { moto: Motorcycle; index: number }) {
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <article
      ref={ref}
      className={`${styles.motorcycleCard} ${isInView ? styles.visible : ""}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {moto.featured && <span className={styles.featuredBadge}>Destacada</span>}
      <div className={styles.imageContainer}>
        <img src={moto.images.main} alt={moto.name} loading="lazy" />
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3>{moto.name}</h3>
          <span className={styles.category}>{moto.category}</span>
        </div>
        <div className={styles.engineInfo}>
          <div className={styles.engineSpec}>
            <span className={styles.label}>Motor</span>
            <span className={styles.value}>{moto.engine.displacement}</span>
          </div>
          <div className={styles.engineSpec}>
            <span className={styles.label}>Potencia</span>
            <span className={styles.value}>{moto.engine.power}</span>
          </div>
        </div>
        <div className={styles.features}>
          {moto.features.slice(0, 3).map((feature, index) => (
            <span key={index} className={styles.feature}>
              {feature}
            </span>
          ))}
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.price}>
            <span className={styles.currency}>{moto.currency}</span>
            <span className={styles.amount}>
              ${moto.price.toLocaleString()}
            </span>
          </div>
          <Link href={`/motos/${moto.slug}`} className={styles.detailsButton}>
            Ver detalles
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function MotosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const motorcycles = motorcyclesData.motorcycles as Motorcycle[];
  const categories = motorcyclesData.categories as Category[];

  const filteredMotorcycles =
    selectedCategory === "all"
      ? motorcycles
      : motorcycles.filter(
          (moto) =>
            moto.category.toLowerCase().replace(/\s+/g, "-") ===
            selectedCategory
        );

  return (
    <>
      <Menu />
      <main className={styles.motosPage}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Nuestras Motocicletas</h1>
            <p>
              Descubre la línea completa de motocicletas Yamaha. Potencia,
              tecnología y diseño en cada modelo.
            </p>
          </div>
        </section>

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
                Todas
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={
                    selectedCategory === category.id ? styles.active : undefined
                  }
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.motorcyclesGrid}>
          <div className={styles.gridContainer}>
            {filteredMotorcycles.map((moto, index) => (
              <MotorcycleCard key={moto.id} moto={moto} index={index} />
            ))}
          </div>
        </section>

        {filteredMotorcycles.length === 0 && (
          <div className={styles.noResults}>
            <p>No se encontraron motocicletas en esta categoría.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
