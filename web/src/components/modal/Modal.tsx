"use client";

import { useEffect } from "react";
import Icon from "../icon";
import styles from "./Modal.module.scss";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  icon = "info",
}: ModalProps) {
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <Icon name="close" size={24} />
        </button>

        <div className={styles.iconWrapper}>
          <Icon name={icon} size={48} />
        </div>

        <h2 className={styles.title}>{title}</h2>

        <p className={styles.message}>{message}</p>

        <button className={styles.actionButton} onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
