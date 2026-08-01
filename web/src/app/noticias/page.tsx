"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import Menu from "@/components/menu";
import Footer from "@/components/footer";
import { useInView, useSiteSettings } from "@/hooks";
import { getNews } from "@/services/news";
import type { News } from "@/types/news";
import styles from "./Noticias.module.scss";

function formatDate(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  /* `publishedAt` se elige como fecha de calendario en el panel (un
     `<input type="date">`, guardado como medianoche UTC) — hay que leerla
     también en UTC, o un lector en una zona detrás de UTC (Colombia,
     UTC-5) la ve un día antes de lo que se eligió. Mismo criterio que
     `cms-admin/lib/format.ts` (`FECHA_LARGA`). */
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function NewsCard({ article, index }: { article: News; index: number }) {
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });
  /* Autor por defecto de una noticia sin firma: el nombre del sitio
     (`site_settings.siteName`, Fase 6 del plan CMS), no "Yamaha Oriente"
     escrito a mano. */
  const { siteName } = useSiteSettings();

  return (
    <article
      ref={ref}
      className={`${styles.newsCard} ${isInView ? styles.visible : ""}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {article.featured && (
        <span className={styles.featuredBadge}>Destacada</span>
      )}
      {article.image && (
        <div className={styles.imageContainer}>
          {/* URL de texto libre (puede ser externa): no pasa por next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.image} alt={article.title} loading="lazy" />
          {article.category && (
            <span className={styles.category}>{article.category}</span>
          )}
        </div>
      )}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3>{article.title}</h3>
          <div className={styles.meta}>
            <span className={styles.date}>{formatDate(article.publishedAt)}</span>
            {article.readTime && (
              <span className={styles.readTime}>{article.readTime}</span>
            )}
          </div>
        </div>
        {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}
        {article.tags.length > 0 && (
          <div className={styles.tags}>
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className={styles.cardFooter}>
          <div className={styles.author}>
            <div className={styles.authorAvatar}>
              {(article.author?.trim().charAt(0) || "?").toUpperCase()}
            </div>
            <span className={styles.authorName}>
              {article.author?.trim() || siteName}
            </span>
          </div>
          <Link
            href={`/noticias/${article.slug}`}
            className={styles.readMoreButton}
          >
            Leer más
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function NoticiasPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["news"],
    queryFn: () => getNews({ page: 1, limit: 100 }),
  });

  const articles = useMemo(() => data?.news ?? [], [data]);

  const categories = useMemo(() => {
    const nombres = new Set<string>();
    for (const article of articles) {
      if (article.category) nombres.add(article.category);
    }
    return [...nombres];
  }, [articles]);

  const filteredArticles =
    selectedCategory === "all"
      ? articles
      : articles.filter((article) => article.category === selectedCategory);

  const featuredArticles = articles.filter((article) => article.featured);

  return (
    <>
      <Menu />
      <main className={styles.noticiasPage}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Noticias y Novedades</h1>
            <p>
              Mantente al día con las últimas noticias, lanzamientos y consejos
              del mundo de las motocicletas.
            </p>
          </div>
        </section>

        {isLoading && (
          <div className={styles.noResults}>
            <p>Cargando noticias...</p>
          </div>
        )}

        {/* Si el backend no responde, la página sigue en pie: el resto del
            sitio no se cae por esta sección. */}
        {isError && (
          <div className={styles.noResults}>
            <p>No pudimos cargar las noticias. Intenta de nuevo en un momento.</p>
          </div>
        )}

        {!isLoading && !isError && articles.length > 0 && (
          <>
            {featuredArticles.length > 0 && (
              <section className={styles.featured}>
                <div className={styles.featuredContainer}>
                  <h2>Artículos Destacados</h2>
                  <div className={styles.featuredGrid}>
                    {featuredArticles.slice(0, 3).map((article, index) => (
                      <NewsCard key={article.id} article={article} index={index} />
                    ))}
                  </div>
                </div>
              </section>
            )}

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
                      Todas
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

            <section className={styles.newsGrid}>
              <div className={styles.gridContainer}>
                {filteredArticles.map((article, index) => (
                  <NewsCard key={article.id} article={article} index={index} />
                ))}
              </div>
            </section>

            {filteredArticles.length === 0 && (
              <div className={styles.noResults}>
                <p>No se encontraron artículos en esta categoría.</p>
              </div>
            )}
          </>
        )}

        {/* Sin ninguna noticia cargada, la página no queda en blanco: dice qué
            pasa y ofrece a dónde ir (mismo gesto que /servicios, Fase 3). */}
        {!isLoading && !isError && articles.length === 0 && (
          <div className={styles.emptyState}>
            <h2>Estamos preparando nuestras noticias</h2>
            <p>
              Muy pronto vas a ver aquí novedades, lanzamientos y consejos.
              Mientras tanto, mira nuestro catálogo o pásate por un punto de
              atención.
            </p>
            <Link href="/motos" className={styles.emptyAction}>
              Ver catálogo de motos
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
