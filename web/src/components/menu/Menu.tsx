"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Drawer from "../drawer";
import GlobalSearch from "../global-search/GlobalSearch";
import Icon from "../icon";
import { useSiteSettings } from "@/hooks";
import styles from "./Menu.module.scss";

export default function Menu() {
  const settings = useSiteSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // El nav es de vidrio siempre (blanco + alfa + blur): esto solo sube la
  // opacidad al scrollear, nunca lo vuelve invisible ni opaco al 100%.
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: "Motocicletas", href: "/motos" },
    { label: "Servicios", href: "/servicios" },
    { label: "Noticias", href: "/noticias" },
    { label: "Puntos de atención", href: "/puntos-atencion" },
    { label: "Servicio al cliente", href: "/servicio-al-cliente" },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <>
      <nav
        className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}
      >
        <div className={styles.container}>
          <div className={styles.navContent}>
            {/* Logo */}
            <Link href="/" className={styles.logoContainer}>
              {/* Puede venir del host de medios local del panel (si se
                  cargó un logo desde /configuracion), así que es un <img>
                  de verdad, nunca next/image — mismo criterio que
                  Cards/NewsSection/SecondBanner. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logo || "/assets/logos/placeholder-logo.svg"}
                alt={settings.siteName}
                className={styles.logo}
              />
            </Link>

            {/* Desktop Menu */}
            <div className={styles.desktopMenu}>
              <nav>
                <ul className={styles.menuList}>
                  {menuItems.map((item, index) => (
                    <li key={index} className={styles.menuItem}>
                      <Link href={item.href} className={styles.menuLink}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Search Button */}
              <button
                className={styles.searchButton}
                onClick={toggleSearch}
                aria-label="Abrir búsqueda"
              >
                <Icon name="search" size={20} />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label="Abrir menú"
            >
              <div
                className={`${styles.hamburgerIcon} ${
                  isMobileMenuOpen ? styles.open : ""
                }`}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        onOpenSearch={() => {
          closeMobileMenu();
          setIsSearchOpen(true);
        }}
      />

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
