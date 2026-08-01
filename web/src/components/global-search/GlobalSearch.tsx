"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import styles from "./GlobalSearch.module.scss";
import { getMotorcycles } from "@/services/motorcycles";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_RESULTS = 6;

/**
 * Reemplaza la burbuja lateral angosta que había en el menú (un `<input>`
 * sin `onChange`, decorativo) por un overlay a pantalla completa. Busca por
 * nombre en el mismo catálogo de motos que `/motos` — mismo criterio
 * cliente-side que esa página (ver «Ninguna lista del panel busca ni ordena
 * en el backend» en MEJORAS.md, no es un atajo nuevo de este componente.
 * «Ver todos los resultados» manda a `/motos?q=<término>`, que esa página
 * lee para arrancar con el mismo filtro puesto.
 */
export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ["motorcycles"],
    queryFn: () => getMotorcycles({ page: 1, limit: 100 }),
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      // Esperar al frame siguiente: recién montado, el input todavía no es foco-able.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return (data?.motorcycles ?? [])
      .filter((moto) => moto.name.toLowerCase().includes(term))
      .slice(0, MAX_RESULTS);
  }, [data, query]);

  function verTodos() {
    const term = query.trim();
    router.push(term ? `/motos?q=${encodeURIComponent(term)}` : "/motos");
    onClose();
  }

  function irAMoto(slug: string) {
    router.push(`/motos/${slug}`);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label="Cerrar búsqueda"
      />

      <div className={styles.panel}>
        <form
          className={styles.searchBar}
          onSubmit={(event) => {
            event.preventDefault();
            verTodos();
          }}
        >
          <svg
            className={styles.searchIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar una moto por nombre..."
            className={styles.input}
            aria-label="Buscar en el catálogo"
          />
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar búsqueda"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>

        {query.trim() && (
          <div className={styles.results}>
            {results.length > 0 ? (
              <>
                <ul className={styles.resultsList}>
                  {results.map((moto) => (
                    <li key={moto.id}>
                      <button
                        type="button"
                        className={styles.resultItem}
                        onClick={() => irAMoto(moto.slug)}
                      >
                        <span className={styles.resultThumb}>
                          {moto.images?.main ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={moto.images.main} alt="" loading="lazy" />
                          ) : null}
                        </span>
                        <span className={styles.resultInfo}>
                          <span className={styles.resultName}>{moto.name}</span>
                          {moto.category && (
                            <span className={styles.resultCategory}>{moto.category}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className={styles.viewAll} onClick={verTodos}>
                  Ver todos los resultados en el catálogo
                </button>
              </>
            ) : (
              <p className={styles.noResults}>
                No encontramos motos que coincidan con «{query.trim()}».
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
