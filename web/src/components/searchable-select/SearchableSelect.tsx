"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SearchableSelect.module.scss";

interface SearchableSelectProps {
  options: string[];
  /** `""` significa "sin filtro" (la opción `allLabel`). */
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Un `<select>` con caja de búsqueda, sin librería: `web` no trae ninguna de
 * combobox (a diferencia de `cms-admin`, que usa shadcn/ui). Pedido del
 * cliente en vez del `<select>` nativo para el filtro de marca de `/motos`.
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  allLabel,
  placeholder = "Buscar...",
  ariaLabel,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Si el valor cambia desde afuera (por ejemplo, un "Limpiar filtros"),
  // reflejarlo en el texto del input.
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery(value || "");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, value]);

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term || term === value.toLowerCase()) return options;
    return options.filter((option) => option.toLowerCase().includes(term));
  }, [options, query, value]);

  function selectOption(option: string) {
    onChange(option);
    setQuery(option);
    setIsOpen(false);
  }

  function clearSelection() {
    onChange("");
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <input
        type="text"
        className={styles.input}
        value={query}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={isOpen}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            setQuery(value || "");
            event.currentTarget.blur();
          }
        }}
      />

      {isOpen && (
        <ul className={styles.options} role="listbox">
          <li>
            <button
              type="button"
              className={value === "" ? styles.active : undefined}
              onClick={clearSelection}
            >
              {allLabel}
            </button>
          </li>
          {filteredOptions.map((option) => (
            <li key={option}>
              <button
                type="button"
                className={value === option ? styles.active : undefined}
                onClick={() => selectOption(option)}
              >
                {option}
              </button>
            </li>
          ))}
          {filteredOptions.length === 0 && (
            <li className={styles.noMatches}>Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  );
}
