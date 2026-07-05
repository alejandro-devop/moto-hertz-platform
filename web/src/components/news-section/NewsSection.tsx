"use client";

import Image from "next/image";
import Button from "../button/Button";
import styles from "./NewsSection.module.scss";
import { useInView } from "@/hooks";

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
  slug: string;
}

interface ContentfulNewsCard {
  sys?: {
    id: string;
  };
  fields: {
    entryId?: string;
    image?: {
      fields: {
        url?: string;
        file?: {
          url: string;
        };
        title?: string;
      };
    };
    title?: {
      fields: {
        text: string;
      };
    };
    caption?: {
      fields: {
        content: string;
      };
    };
    category?: {
      fields: {
        text: string;
      };
    };
    publishedDate?: string;
    slug?: string;
  };
}

interface NewsSectionProps {
  news?: ContentfulNewsCard[];
  title?: string;
  subtitle?: string;
}

const newsData: NewsItem[] = [
  {
    id: 1,
    title: "Nueva Yamaha MT-09 2024: Más potencia y tecnología",
    excerpt:
      "La renovada MT-09 llega con un motor mejorado de 890cc, nueva electrónica y un diseño más agresivo que mantiene la esencia naked de Yamaha.",
    date: "2024-03-15",
    category: "Lanzamientos",
    image: "/assets/news/mt-09-2024.jpg",
    slug: "nueva-yamaha-mt-09-2024",
  },
  {
    id: 2,
    title: "Yamaha R1M: La superbike de competición llega a las calles",
    excerpt:
      "Con tecnología derivada directamente de MotoGP, la R1M establece nuevos estándares en el segmento de las superbikes de alta gama.",
    date: "2024-03-10",
    category: "Deportivas",
    image: "/assets/news/r1m-2024.jpg",
    slug: "yamaha-r1m-superbike-competicion",
  },
  {
    id: 3,
    title: "Aventura sin límites: Yamaha Ténéré 700 World Raid",
    excerpt:
      "La versión más extrema de la Ténéré está diseñada para los aventureros más exigentes, con equipamiento premium y capacidades todoterreno mejoradas.",
    date: "2024-03-05",
    category: "Aventura",
    image: "/assets/news/tenere-700-world-raid.jpg",
    slug: "yamaha-tenere-700-world-raid-aventura",
  },
  {
    id: 4,
    title: "Yamaha NMAX 155: La revolución del scooter urbano",
    excerpt:
      "El nuevo NMAX combina eficiencia, tecnología y diseño premium para redefinir la movilidad urbana en el segmento de scooters de 155cc.",
    date: "2024-02-28",
    category: "Urbanas",
    image: "/assets/news/nmax-155-2024.jpg",
    slug: "yamaha-nmax-155-revolucion-scooter-urbano",
  },
];

export default function NewsSection({
  news,
  title = "Últimas Noticias",
  subtitle = "Mantente al día con las últimas novedades, lanzamientos y tecnologías del mundo Yamaha",
}: NewsSectionProps = {}) {
  // Convert Contentful news to NewsItem format or use fallback
  const newsItems: NewsItem[] =
    news && news.length > 0
      ? news.map((item, index) => {
          // Get image URL - might be in url or file.url
          const imageUrl =
            item.fields.image?.fields?.url ||
            item.fields.image?.fields?.file?.url ||
            "";
          const fullImageUrl = imageUrl.startsWith("//")
            ? `https:${imageUrl}`
            : imageUrl.startsWith("http")
            ? imageUrl
            : imageUrl || "/assets/news/placeholder.jpg";

          return {
            id: index + 1,
            title: item.fields.title?.fields?.text || "Noticia",
            excerpt: item.fields.caption?.fields?.content || "",
            date: item.fields.publishedDate || new Date().toISOString(),
            category: item.fields.category?.fields?.text || "General",
            image: fullImageUrl,
            slug: item.fields.slug || "#",
          };
        })
      : newsData;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className={styles.newsSection}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {newsItems.map((item, index) => (
            <NewsArticle
              key={item.id}
              item={item}
              index={index}
              formatDate={formatDate}
            />
          ))}
        </div>

        <div className={styles.ctaContainer}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => console.log("Navegando a todas las noticias")}
          >
            Ver todas las noticias
          </Button>
        </div>
      </div>
    </section>
  );
}

interface NewsArticleProps {
  item: NewsItem;
  index: number;
  formatDate: (date: string) => string;
}

function NewsArticle({ item, index, formatDate }: NewsArticleProps) {
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
        <Image
          src={item.image}
          alt={item.title}
          fill
          className={styles.image}
          style={{ objectFit: "cover" }}
        />
        <div className={styles.categoryBadge}>
          <span>{item.category}</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.dateContainer}>
          <time>{formatDate(item.date)}</time>
        </div>
        <h3 className={styles.articleTitle}>{item.title}</h3>
        <p className={styles.excerpt}>{item.excerpt}</p>
        <div className={styles.buttonContainer}>
          <Button variant="primary" size="sm">
            Leer más
          </Button>
        </div>
      </div>
    </article>
  );
}
