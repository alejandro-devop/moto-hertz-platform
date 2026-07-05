"use client";

import Image from "next/image";
import Button from "../button/Button";
import styles from "./Cards.module.scss";
import { useInView } from "@/hooks";

interface ServiceCardData {
  sys?: {
    id: string;
  };
  fields: {
    entryId?: string;
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
    ctaButton?: {
      fields: {
        text: string;
        url: string;
      };
    };
    image?: {
      fields: {
        url: string;
        title?: string;
      };
    };
  };
}

interface CardsProps {
  cards?: ServiceCardData[];
  title?: string;
  subtitle?: string;
}

export default function Cards({
  cards,
  title = "Servicios Yamaha",
  subtitle = "Descubre todos los servicios que tenemos disponibles para ti",
}: CardsProps = {}) {
  // Convert Contentful cards or use default data
  const cardsData =
    cards && cards.length > 0
      ? cards.map((card, index) => {
          // Get image URL directly from fields.url
          const imageUrl = card.fields.image?.fields?.url || "";
          const fullImageUrl = imageUrl.startsWith("//")
            ? `https:${imageUrl}`
            : imageUrl.startsWith("http")
            ? imageUrl
            : imageUrl || "";

          return {
            id: card.sys?.id || index + 1,
            title: card.fields.title?.fields?.text || "Servicio",
            description: card.fields.caption?.fields?.content || "",
            cta: card.fields.ctaButton?.fields?.text || "Ver más",
            ctaUrl: card.fields.ctaButton?.fields?.url || "#",
            image: fullImageUrl,
          };
        })
      : [];

  return (
    <section className="py-16 bg-gray-50">
      <div
        className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8"
        style={{
          marginLeft: "auto",
          marginRight: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center"
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {cardsData.map((card, index) => (
            <ServiceCard key={card.id} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ServiceCardProps {
  card: {
    id: string | number;
    title: string;
    description: string;
    cta: string;
    ctaUrl: string;
    image: string;
  };
  index: number;
}

function ServiceCard({ card, index }: ServiceCardProps) {
  const { ref, isInView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg shadow-md p-6 space-y-4 w-full max-w-sm hover:shadow-lg transition-shadow duration-300 ${
        styles.card
      } ${isInView ? styles.cardVisible : ""}`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg overflow-hidden relative">
        {card.image ? (
          <Image
            src={card.image}
            alt={card.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-white text-4xl font-bold">Y</span>
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 text-center">
        {card.title}
      </h3>

      <p className="text-gray-600 text-center leading-relaxed">
        {card.description}
      </p>

      <div className="flex justify-center pt-6">
        <Button
          size="md"
          className={styles.button}
          onClick={() => {
            if (card.ctaUrl && card.ctaUrl !== "#") {
              window.location.href = card.ctaUrl;
            }
          }}
        >
          {card.cta}
        </Button>
      </div>
    </div>
  );
}
