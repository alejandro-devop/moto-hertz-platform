"use client";

import Icon from "../icon";
import styles from "./Footer.module.scss";
import footerData from "./footer-data.json";
import { useSiteSettings } from "@/hooks";
import { urlWhatsApp } from "@/utils/service-point-hours";

/**
 * Contacto, redes sociales y el nombre del sitio salen de `site_settings`
 * (Fase 6 del plan CMS), no de este JSON: `footer-data.json` se quedó solo
 * con lo que sigue fijo en el código (enlaces rápidos, soporte, newsletter y
 * la descripción de la empresa — fuera de alcance de esta fase).
 *
 * `useQuery` nunca deja la página rota si el backend no responde: mientras
 * carga o si falla, se pinta `SITE_SETTINGS_FALLBACK` (los mismos valores que
 * ya siembra la migración `011`), así el pie de página nunca desaparece.
 */
export default function Footer() {
  const settings = useSiteSettings();

  const redes = [
    { platform: "facebook", href: settings.socialFacebook, label: "Facebook" },
    {
      platform: "instagram",
      href: settings.socialInstagram,
      label: "Instagram",
    },
    { platform: "twitter", href: settings.socialTwitter, label: "Twitter" },
    { platform: "youtube", href: settings.socialYoutube, label: "YouTube" },
  ].filter(
    (red): red is { platform: string; href: string; label: string } =>
      Boolean(red.href),
  );

  const whatsappUrl = urlWhatsApp(settings.whatsapp);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Company Info */}
          <div className={styles.section}>
            <h3 className={styles.companyTitle}>{settings.siteName}</h3>
            <p className={styles.description}>
              {footerData.company.description}
            </p>
            {settings.address && (
              <div className={styles.locationInfo}>
                <Icon name="location" size={16} />
                <span>{settings.address}</span>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              {footerData.quickLinks.title}
            </h4>
            <ul className={styles.linkList}>
              {footerData.quickLinks.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={styles.link}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{footerData.support.title}</h4>
            <ul className={styles.linkList}>
              {footerData.support.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={styles.link}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{footerData.contact.title}</h4>
            <div className={styles.contactInfo}>
              {settings.phone && (
                <div className={styles.contactItem}>
                  <Icon name="phone" size={16} />
                  <span>{settings.phone}</span>
                </div>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.contactItem}
                >
                  <Icon name="phone" size={16} />
                  <span>WhatsApp: {settings.whatsapp}</span>
                </a>
              )}
              {settings.email && (
                <div className={styles.contactItem}>
                  <Icon name="email" size={16} />
                  <span>{settings.email}</span>
                </div>
              )}
            </div>

            {/* Newsletter */}
            <div className={styles.newsletter}>
              <h5 className={styles.newsletterTitle}>
                {footerData.newsletter.title}
              </h5>
              <p className={styles.newsletterDescription}>
                {footerData.newsletter.description}
              </p>
              <div className={styles.newsletterForm}>
                <input
                  type="email"
                  placeholder={footerData.newsletter.placeholder}
                  className={styles.emailInput}
                />
                <button className={styles.subscribeButton}>
                  {footerData.newsletter.buttonText}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomContent}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} {settings.siteName}. Todos los
              derechos reservados.
            </p>
            {redes.length > 0 && (
              <div className={styles.socialLinks}>
                {redes.map((social) => (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.socialLink}
                    aria-label={social.label}
                  >
                    <Icon name={social.platform} size={20} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
