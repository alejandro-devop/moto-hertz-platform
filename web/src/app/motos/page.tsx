"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import Footer from "@/components/footer";
import Menu from "@/components/menu";
import SearchableSelect from "@/components/searchable-select/SearchableSelect";
import { useInView } from "@/hooks";
import { categorySlug, getMotorcycles } from "@/services/motorcycles";
import { getPageContentMap } from "@/services/page-content";
import type { Motorcycle } from "@/types/motorcycle";
import styles from "./Motos.module.scss";

/** Mismo texto que antes estaba quemado acá: ahora es el valor por defecto
 * hasta que alguien lo edite desde `/paginas` del panel. */
const DEFAULT_HEADING = "Nuestras Motocicletas";
const DEFAULT_CAPTION =
  "Descubre la línea completa de motocicletas Yamaha. Potencia, tecnología y diseño en cada modelo.";

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
        <img src={moto.images?.main} alt={moto.name} loading="lazy" />
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3>{moto.name}</h3>
          <span className={styles.category}>{moto.category}</span>
        </div>
        <div className={styles.engineInfo}>
          <div className={styles.engineSpec}>
            <span className={styles.label}>Motor</span>
            <span className={styles.value}>{moto.engine?.displacement}</span>
          </div>
          <div className={styles.engineSpec}>
            <span className={styles.label}>Potencia</span>
            <span className={styles.value}>{moto.engine?.power}</span>
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
              {moto.price
                ? `$${Number(moto.price).toLocaleString()}`
                : "Consultar"}
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
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["motorcycles"],
    queryFn: () => getMotorcycles({ page: 1, limit: 100 }),
  });

  const { data: pageContent } = useQuery({
    queryKey: ["page-content", "motos"],
    queryFn: () => getPageContentMap("motos"),
  });

  const motorcycles = data?.motorcycles ?? [];

  const categories = useMemo(() => {
    const names = new Set<string>();
    for (const moto of motorcycles) {
      if (moto.category) names.add(moto.category);
    }
    return [...names].map((name) => ({ id: categorySlug(name), name }));
  }, [motorcycles]);

  const brands = useMemo(() => {
    const names = new Set<string>();
    for (const moto of motorcycles) {
      if (moto.brand) names.add(moto.brand);
    }
    return [...names].sort();
  }, [motorcycles]);

  const filteredMotorcycles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return motorcycles.filter((moto) => {
      if (
        selectedCategory !== "all" &&
        (!moto.category || categorySlug(moto.category) !== selectedCategory)
      ) {
        return false;
      }
      if (selectedBrand && moto.brand !== selectedBrand) {
        return false;
      }
      if (term && !moto.name.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [motorcycles, selectedCategory, selectedBrand, searchTerm]);

  return (
    <>
      <Menu />
      <main className={styles.motosPage}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>{pageContent?.heading || DEFAULT_HEADING}</h1>
            <p>{pageContent?.caption || DEFAULT_CAPTION}</p>
          </div>
        </section>

        <section className={styles.filters}>
          <div className={styles.filterContainer}>
            <div className={styles.searchAndBrand}>
              <div className={styles.searchField}>
                <h2>Buscar por nombre</h2>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Ej: MT-03, NMAX..."
                  aria-label="Buscar moto por nombre"
                />
              </div>

              {brands.length > 0 && (
                <div className={styles.brandField}>
                  <h2>Marca</h2>
                  <SearchableSelect
                    options={brands}
                    value={selectedBrand}
                    onChange={setSelectedBrand}
                    allLabel="Todas las marcas"
                    placeholder="Buscar marca..."
                    ariaLabel="Filtrar por marca"
                  />
                </div>
              )}
            </div>

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

        {isLoading && (
          <div className={styles.noResults}>
            <p>Cargando motocicletas...</p>
          </div>
        )}

        {isError && (
          <div className={styles.noResults}>
            <p>No se pudo cargar el catálogo. Intenta de nuevo más tarde.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <section className={styles.motorcyclesGrid}>
            <div className={styles.gridContainer}>
              {filteredMotorcycles.map((moto, index) => (
                <MotorcycleCard key={moto.id} moto={moto} index={index} />
              ))}
            </div>
          </section>
        )}

        {!isLoading && !isError && filteredMotorcycles.length === 0 && (
          <div className={styles.noResults}>
            <p>No se encontraron motocicletas con esos filtros.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
