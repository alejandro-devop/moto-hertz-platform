import Icon from "../icon";
import styles from "./Footer.module.scss";
import footerData from "./footer-data.json";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Company Info */}
          <div className={styles.section}>
            <h3 className={styles.companyTitle}>{footerData.company.name}</h3>
            <p className={styles.description}>
              {footerData.company.description}
            </p>
            {footerData.company.locations.map((location, index) => (
              <div key={index} className={styles.locationInfo}>
                <Icon name="location" size={16} />
                <div>
                  <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                    {location.title}
                  </div>
                  <span>{location.value}</span>
                  {location.phone && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <Icon name="phone" size={14} />
                      <span style={{ fontSize: "0.9rem" }}>
                        {location.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
              <div className={styles.contactItem}>
                <Icon name="phone" size={16} />
                <span>{footerData.contact.phone}</span>
              </div>
              <div className={styles.contactItem}>
                <Icon name="email" size={16} />
                <span>{footerData.contact.email}</span>
              </div>
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
            <p className={styles.copyright}>{footerData.copyright}</p>
            <div className={styles.socialLinks}>
              {footerData.social.links.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  className={styles.socialLink}
                  aria-label={social.label}
                >
                  <Icon name={social.platform} size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
