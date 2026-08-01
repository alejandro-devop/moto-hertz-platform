"use client";

import { useRouter } from "next/navigation";
import Button from "../button/Button";
import styles from "./MotosSection.module.scss";
import { useInView } from "@/hooks";
import type { Motorcycle } from "@/types/motorcycle";

interface MotosSectionProps {
  /** Solo motos con `featured: true` (decidido con el usuario). */
  motorcycles?: Motorcycle[];
  title?: string;
  subtitle?: string;
}

/**
 * La franja de motos destacadas de la home, antes de la de servicios. Mismo
 * lenguaje visual que `Cards` (servicios) y `NewsSection` (noticias): tarjeta
 * blanca con sombra, imagen de borde a borde con badge, botón rojo de marca.
 * Si no hay ninguna moto marcada como destacada en el panel, la sección no
 * se pinta — no inventa contenido de relleno.
 */
export default function MotosSection({
  motorcycles,
  title = "Motos Destacadas",
  subtitle = "Una selección de nuestro catálogo, elegida a mano",
}: MotosSectionProps = {}) {
  const router = useRouter();

  if (!motorcycles || motorcycles.length === 0) return null;

  return (
    <section className={styles.motosSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.grid}>
          {motorcycles.map((moto, index) => (
            <MotoCard key={moto.id} moto={moto} index={index} />
          ))}
        </div>

        <div className={styles.ctaContainer}>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/motos")}
          >
            Ver todo el catálogo
          </Button>
        </div>
      </div>
    </section>
  );
}

function MotoCard({ moto, index }: { moto: Motorcycle; index: number }) {
  const router = useRouter();
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <article
      ref={ref}
      className={`${styles.card} ${isInView ? styles.cardVisible : ""}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={styles.imageContainer}>
        {moto.images?.main ? (
          // URL de texto libre (medios del panel o externa): mismo criterio
          // que /servicios y /noticias, nunca next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={moto.images.main}
            alt={moto.name}
            loading="lazy"
            className={styles.image}
          />
        ) : null}
        {moto.category ? (
          <div className={styles.categoryBadge}>
            <span>{moto.category}</span>
          </div>
        ) : null}
      </div>

      <div className={styles.content}>
        <h3 className={styles.cardTitle}>{moto.name}</h3>
        <p className={styles.price}>
          {moto.price
            ? `$${Number(moto.price).toLocaleString()} ${moto.currency}`
            : "Consultar precio"}
        </p>
        <div className={styles.buttonContainer}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push(`/motos/${moto.slug}`)}
          >
            Ver detalles
          </Button>
        </div>
      </div>
    </article>
  );
}
