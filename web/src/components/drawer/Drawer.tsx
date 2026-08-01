"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./Drawer.module.scss";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Cierra el drawer y abre el buscador global (mismo overlay que el botón de lupa del desktop). */
  onOpenSearch: () => void;
  children?: React.ReactNode;
}

export default function Drawer({ isOpen, onClose, onOpenSearch, children }: DrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const menuItems = [
    { label: "Motocicletas", href: "/motos" },
    { label: "Servicios", href: "/servicios" },
    { label: "Noticias", href: "/noticias" },
    { label: "Puntos de atención", href: "/puntos-atencion" },
    { label: "Servicio al cliente", href: "/servicio-al-cliente" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.open : ""}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.open : ""}`}>
        <div className={styles.drawerContent}>
          {/* Close Button */}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ✕
          </button>

          {/* Menu Items */}
          <nav>
            <ul className={styles.menuList}>
              {menuItems.map((item, index) => (
                <li key={index} className={styles.menuItem}>
                  <Link
                    href={item.href}
                    className={styles.menuLink}
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Search */}
          <button
            type="button"
            className={styles.searchTrigger}
            onClick={onOpenSearch}
          >
            Buscar en el catálogo
          </button>

          {/* Custom children if provided */}
          {children}
        </div>
      </div>
    </>
  );
}
