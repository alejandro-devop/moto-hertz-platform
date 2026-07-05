"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Drawer from "../drawer";
import Icon from "../icon";
import styles from "./Menu.module.scss";

export default function Menu() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const menuItems = [
    { label: "Motocicletas", href: "/motos" },
    { label: "Financiación", href: "/en-construccion" },
    { label: "Servicios", href: "/servicios" },
    { label: "Noticias", href: "/noticias" },
    { label: "Puntos de atención", href: "/puntos-atencion" },
    { label: "Servicio al cliente", href: "/en-construccion" },
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
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.navContent}>
            {/* Logo */}
            <Link href="/" className={styles.logoContainer}>
              <Image
                src="/assets/logos/yamaha.svg"
                alt="Yamaha"
                width={120}
                height={40}
                className={styles.logo}
                priority
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
              <div className={styles.searchContainer}>
                <button
                  className={`${styles.searchButton} ${
                    isSearchOpen ? styles.active : ""
                  }`}
                  onClick={toggleSearch}
                  aria-label="Abrir búsqueda"
                >
                  <Icon name={isSearchOpen ? "close" : "search"} size={20} />
                </button>

                {/* Search Dropdown */}
                <div
                  className={`${styles.searchDropdown} ${
                    isSearchOpen ? styles.open : ""
                  }`}
                >
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className={styles.searchInput}
                    autoFocus={isSearchOpen}
                  />
                </div>
              </div>
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
      <Drawer isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
}
