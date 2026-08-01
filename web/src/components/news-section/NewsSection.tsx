"use client";

import { useRouter } from "next/navigation";
import Button from "../button/Button";
import styles from "./NewsSection.module.scss";
import { useInView } from "@/hooks";
import type { News } from "@/types/news";

interface NewsSectionProps {
  /** Noticias reales del backend (Fase 5 del plan CMS), no plantilla. */
  news?: News[];
  title?: string;
  subtitle?: string;
}

/**
 * La franja de noticias de la home. El título y el subtítulo quedan fijos en
 * el código (alcance mínimo de la Fase 5); las tarjetas salen de las
 * noticias ya administradas en `/noticias` del panel.
 */
export default function NewsSection({
  news,
  title = "Últimas Noticias",
  subtitle = "Mantente al día con las últimas novedades, lanzamientos y tecnologías del mundo Yamaha",
}: NewsSectionProps = {}) {
  if (!news || news.length === 0) return null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    /* Forzar UTC: el mismo cuidado que ya tienen las páginas de /noticias
       (ver `backend/CLAUDE.md`, sección `news`) para no mostrar la fecha un
       día antes en zonas detrás de UTC (Colombia, UTC-5). */
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <section className={styles.newsSection}>
      <div className={styles.container}>
        <h2 className="title">{title}</h2>
        <p className="paragraph">{subtitle}</p>

        <div className={styles.grid}>
          {news.map((item, index) => (
            <NewsArticle
              key={item.id}
              item={item}
              index={index}
              formatDate={formatDate}
            />
          ))}
        </div>

        <div className={styles.ctaContainer}>
          <Button variant="primary" size="lg">
            Ver todas las noticias
          </Button>
        </div>
      </div>
    </section>
  );
}

interface NewsArticleProps {
  item: News;
  index: number;
  formatDate: (date?: string | null) => string;
}

function NewsArticle({ item, index, formatDate }: NewsArticleProps) {
  const router = useRouter();
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <article
      ref={ref}
      className={`${styles.article} ${isInView ? styles.articleVisible : ""}`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className={styles.imageContainer}>
        {item.image ? (
          // URL de texto libre (el host de medios local del panel, o
          // externa): no pasa por next/image, mismo criterio que /noticias.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className={styles.image}
          />
        ) : null}
        {item.category ? (
          <div className={styles.categoryBadge}>
            <span>{item.category}</span>
          </div>
        ) : null}
      </div>

      <div className={styles.content}>
        <div className={styles.dateContainer}>
          <time>{formatDate(item.publishedAt)}</time>
        </div>
        <h3 className={styles.articleTitle}>{item.title}</h3>
        {item.excerpt ? <p className={styles.excerpt}>{item.excerpt}</p> : null}
        <div className={styles.buttonContainer}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push(`/noticias/${item.slug}`)}
          >
            Leer más
          </Button>
        </div>
      </div>
    </article>
  );
}
