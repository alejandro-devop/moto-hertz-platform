import { z } from 'zod';

/**
 * Redes sociales y la imagen de SEO son URLs de verdad, a diferencia de
 * `banner.link` (que puede ser una ruta interna como `/motos`): se validan
 * como URL absoluta. Ver la nota de la migración `011` sobre por qué los
 * cuatro enlaces sociales se siembran en `NULL` en vez de con las anclas
 * (`#facebook`...) que hoy trae `footer-data.json`.
 */
const urlSchema = z
  .string()
  .trim()
  .url('Tiene que ser una URL completa (empezar por http:// o https://).')
  .max(500);

/**
 * El mismo criterio de `web/src/utils/service-point-hours.ts` (`urlWhatsApp`):
 * solo importan los dígitos, y hacen falta entre 7 y 15 (el rango de un
 * número de teléfono en formato E.164).
 */
const whatsappSchema = z
  .string()
  .trim()
  .max(50)
  .refine((valor) => {
    const digitos = valor.replace(/\D/g, '');
    return digitos.length >= 7 && digitos.length <= 15;
  }, 'El número de WhatsApp debe tener entre 7 y 15 dígitos (con o sin +, espacios o guiones).');

/**
 * `siteSettingsEdit` es la única mutación de este dominio: no hay `Add` ni
 * `Remove`. Todos los campos son opcionales porque la ficha del panel los
 * manda todos juntos cada vez que se guarda (no hay parches parciales reales
 * como en el resto de los dominios), pero al menos uno tiene que llegar.
 */
export const siteSettingsEditInputSchema = z
  .object({
    siteName: z.string().trim().min(1, 'El sitio necesita un nombre.').max(255).optional(),
    phone: z.string().trim().max(50).optional(),
    email: z.string().trim().email('Correo inválido').max(255).optional(),
    whatsapp: whatsappSchema.optional(),
    address: z.string().trim().max(500).optional(),
    socialFacebook: urlSchema.optional(),
    socialInstagram: urlSchema.optional(),
    socialTwitter: urlSchema.optional(),
    socialYoutube: urlSchema.optional(),
    seoTitle: z.string().trim().max(255).optional(),
    seoDescription: z.string().trim().max(500).optional(),
    seoKeywords: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    seoImage: urlSchema.optional(),
    logo: urlSchema.optional(),
  })
  .refine((d) => Object.keys(d).some((k) => (d as Record<string, unknown>)[k] !== undefined), {
    message: 'At least one field is required to update',
  });
