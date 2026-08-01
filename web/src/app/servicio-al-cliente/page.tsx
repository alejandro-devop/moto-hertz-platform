"use client";

import Link from "next/link";
import Menu from "@/components/menu";
import Footer from "@/components/footer";
import Icon from "@/components/icon";
import { useSiteSettings } from "@/hooks";
import { urlWhatsApp } from "@/utils/service-point-hours";
import styles from "./ServicioAlCliente.module.scss";

/**
 * Alcance decidido con el usuario: solo los canales de contacto de
 * `site_settings` (teléfono, WhatsApp, correo, dirección). Los horarios no
 * están acá porque `site_settings` no los tiene — son por sede, en
 * `/puntos-atencion`.
 */
export default function ServicioAlClientePage() {
  const settings = useSiteSettings();
  const whatsappUrl = urlWhatsApp(settings.whatsapp);

  const canales = [
    settings.phone && {
      icon: "phone",
      label: "Teléfono",
      value: settings.phone,
      href: `tel:${settings.phone.replace(/\s+/g, "")}`,
    },
    whatsappUrl && {
      icon: "phone",
      label: "WhatsApp",
      value: settings.whatsapp as string,
      href: whatsappUrl,
      external: true,
    },
    settings.email && {
      icon: "email",
      label: "Correo",
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    settings.address && {
      icon: "location",
      label: "Dirección",
      value: settings.address,
      href: null,
    },
  ].filter(Boolean) as Array<{
    icon: string;
    label: string;
    value: string;
    href: string | null;
    external?: boolean;
  }>;

  return (
    <>
      <Menu />
      <main className={styles.servicioAlClientePage}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Servicio al Cliente</h1>
            <p>Estos son nuestros canales de contacto directo.</p>
          </div>
        </section>

        <section className={styles.content}>
          {canales.length > 0 ? (
            <div className={styles.channelGrid}>
              {canales.map((canal) => {
                const inner = (
                  <>
                    <Icon name={canal.icon} size={24} />
                    <div>
                      <span className={styles.channelLabel}>
                        {canal.label}
                      </span>
                      <span className={styles.channelValue}>
                        {canal.value}
                      </span>
                    </div>
                  </>
                );

                return canal.href ? (
                  <a
                    key={canal.label}
                    href={canal.href}
                    target={canal.external ? "_blank" : undefined}
                    rel={canal.external ? "noreferrer" : undefined}
                    className={styles.channelCard}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={canal.label} className={styles.channelCard}>
                    {inner}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.noChannels}>
              Todavía no hay canales de contacto configurados.
            </p>
          )}

          <p className={styles.puntosAtencionNote}>
            ¿Buscás horarios o direcciones por sede?{" "}
            <Link href="/puntos-atencion">Mirá nuestros puntos de atención</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
