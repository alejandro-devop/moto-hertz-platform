"use client";

import { useState, useEffect } from "react";
import styles from "./WelcomeModal.module.scss";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verificar si es la primera visita
    const hasVisited = localStorage.getItem("hasVisitedSite");

    if (!hasVisited) {
      setIsOpen(true);
      localStorage.setItem("hasVisitedSite", "true");
    }
  }, []);

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

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose}>
          ✕
        </button>

        <div className={styles.modalBody}>
          <div className={styles.icon}>🚧</div>
          <h2>Bienvenido a Yamaha</h2>
          <p className={styles.subtitle}>Sitio en Construcción</p>

          <div className={styles.message}>
            <p>
              Estamos trabajando para ofrecerte la mejor experiencia digital.
              Algunas secciones pueden estar en desarrollo o mostrar contenido
              de prueba.
            </p>
            <p>
              Gracias por tu paciencia mientras construimos algo increíble para
              ti.
            </p>
          </div>

          <button className={styles.continueButton} onClick={handleClose}>
            Continuar al sitio
          </button>
        </div>
      </div>
    </div>
  );
}
