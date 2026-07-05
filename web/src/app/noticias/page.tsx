"use client";

import { useState } from "react";
import Link from "next/link";
import Menu from "@/components/menu";
import Footer from "@/components/footer";
import { useInView } from "@/hooks";
import newsData from "@/data/news-mock.json";
import styles from "./Noticias.module.scss";

type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  publishedAt: string;
  updatedAt: string;
  featured: boolean;
  tags: string[];
  image: {
    main: string;
    thumbnail: string;
    alt: string;
  };
  readTime: string;
};

function NewsCard({ article, index }: { article: NewsArticle; index: number }) {
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <article
      ref={ref}
      className={`${styles.newsCard} ${isInView ? styles.visible : ""}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {article.featured && (
        <span className={styles.featuredBadge}>Destacada</span>
      )}
      <div className={styles.imageContainer}>
        <img src={article.image.main} alt={article.image.alt} loading="lazy" />
        <span className={styles.category}>{article.category}</span>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3>{article.title}</h3>
          <div className={styles.meta}>
            <span className={styles.date}>
              {formatDate(article.publishedAt)}
            </span>
            <span className={styles.readTime}>{article.readTime}</span>
          </div>
        </div>
        <p className={styles.excerpt}>{article.excerpt}</p>
        <div className={styles.tags}>
          {article.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.author}>
            <div className={styles.authorAvatar}>
              {article.author.name.charAt(0)}
            </div>
            <span className={styles.authorName}>{article.author.name}</span>
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
  const articles = newsData.news as NewsArticle[];

  // Extraer categorías únicas
  const categories = Array.from(
    new Set(articles.map((article) => article.category))
  );

  const filteredArticles =
    selectedCategory === "all"
      ? articles
      : articles.filter((article) => article.category === selectedCategory);

  // Artículos destacados
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
              del mundo de las motocicletas Yamaha.
            </p>
          </div>
        </section>

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
      </main>
      <Footer />
    </>
  );
}
