"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import Menu from "@/components/menu";
import Footer from "@/components/footer";
import { useSiteSettings } from "@/hooks";
import { getNews, getNewsBySlug } from "@/services/news";
import { sanitizeNewsContent } from "@/utils/sanitize-news-content";
import type { News } from "@/types/news";
import styles from "./NewsDetail.module.scss";

function formatDate(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  /* Ver la misma nota en `../page.tsx`: la fecha se eligió como calendario
     (UTC medianoche) y hay que leerla en UTC para no correrla un día. */
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function RelatedCard({ article }: { article: News }) {
  return (
    <Link href={`/noticias/${article.slug}`} className={styles.relatedCard}>
      {article.image && (
        <div className={styles.relatedImage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.image} alt={article.title} loading="lazy" />
        </div>
      )}
      <div className={styles.relatedContent}>
        <h4>{article.title}</h4>
      </div>
    </Link>
  );
}

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: article, isLoading } = useQuery({
    queryKey: ["news", slug],
    queryFn: () => getNewsBySlug(slug),
  });

  const { data: allNews } = useQuery({
    queryKey: ["news"],
    queryFn: () => getNews({ page: 1, limit: 100 }),
  });

  /* Autor por defecto de una noticia sin firma: el nombre del sitio, no
     "Yamaha Oriente" escrito a mano (Fase 6 del plan CMS). */
  const { siteName } = useSiteSettings();

  if (isLoading) {
    return (
      <>
        <Menu />
        <div className={styles.notFound}>
          <p>Cargando...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Menu />
        <div className={styles.notFound}>
          <h1>Noticia no encontrada</h1>
          <p>
            La noticia que buscas no existe, o todavía no se ha publicado.
          </p>
          <Link href="/noticias" className={styles.backButton}>
            Volver a noticias
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const relacionadas = (allNews?.news ?? [])
    .filter((n) => n.category === article.category && n.slug !== article.slug)
    .slice(0, 3);

  const contenido = sanitizeNewsContent(article.content);

  return (
    <>
      <Menu />
      <main className={styles.detailPage}>
        <div className={styles.breadcrumb}>
          <div className={styles.container}>
            <Link href="/">Inicio</Link>
            <span>/</span>
            <Link href="/noticias">Noticias</Link>
            <span>/</span>
            <span>{article.title}</span>
          </div>
        </div>

        <div className={styles.container}>
          <header className={styles.header}>
            {article.category && (
              <span className={styles.category}>{article.category}</span>
            )}
            <h1 className={styles.title}>{article.title}</h1>
            <div className={styles.meta}>
              <span>
                <span className={styles.authorAvatar}>
                  {(article.author?.trim().charAt(0) || "?").toUpperCase()}
                </span>
                {article.author?.trim() || siteName}
              </span>
              <span>{formatDate(article.publishedAt)}</span>
              {article.readTime && <span>{article.readTime} de lectura</span>}
            </div>
          </header>

          {article.image && (
            <div className={styles.coverImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.image} alt={article.title} />
            </div>
          )}

          {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}

          {contenido ? (
            <div
              className={styles.content}
              // El HTML ya se saneó dos veces (backend y `sanitizeNewsContent`
              // arriba): es seguro pintarlo tal cual. Ver `backend/CLAUDE.md`,
              // sección `news`.
              dangerouslySetInnerHTML={{ __html: contenido }}
            />
          ) : null}

          {article.tags.length > 0 && (
            <div className={styles.tags}>
              {article.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {relacionadas.length > 0 && (
          <section className={styles.related}>
            <h2>También te podría interesar</h2>
            <div className={styles.relatedGrid}>
              {relacionadas.map((n) => (
                <RelatedCard key={n.id} article={n} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
