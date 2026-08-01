import { z } from 'zod';
import { erroresDeZod, textoOpcional } from '@/lib/form-state';
import type { ResultadoValidacion } from '@/lib/use-ficha-state';
import type { SiteSettings, SiteSettingsFormInput } from '@/lib/graphql/site-settings';
import { seccionDeCampo, type SeccionId } from './form-sections';

/**
 * El formulario es plano, como en el resto de los dominios, aunque aquí no
 * haga falta desarmar nada anidado: `site_settings` ya es plano en el
 * backend. Lo único que no es un `string` es `seoKeywords`, que edita
 * `ListaEditable`.
 */
export interface FormState {
  siteName: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialYoutube: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  seoImage: string;
  logo: string;
}

export const EMPTY_FORM: FormState = {
  siteName: '',
  phone: '',
  email: '',
  whatsapp: '',
  address: '',
  socialFacebook: '',
  socialInstagram: '',
  socialTwitter: '',
  socialYoutube: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
  seoImage: '',
  logo: '',
};

export function siteSettingsToForm(config: SiteSettings): FormState {
  return {
    siteName: config.siteName,
    phone: config.phone ?? '',
    email: config.email ?? '',
    whatsapp: config.whatsapp ?? '',
    address: config.address ?? '',
    socialFacebook: config.socialFacebook ?? '',
    socialInstagram: config.socialInstagram ?? '',
    socialTwitter: config.socialTwitter ?? '',
    socialYoutube: config.socialYoutube ?? '',
    seoTitle: config.seoTitle ?? '',
    seoDescription: config.seoDescription ?? '',
    seoKeywords: [...config.seoKeywords],
    seoImage: config.seoImage ?? '',
    logo: config.logo ?? '',
  };
}

/**
 * `siteName` es el único campo obligatorio; el resto son opcionales y viajan
 * con `textoOpcional` (`"" → undefined`, así que un campo vacío no toca la
 * columna — la misma limitación conocida que ya tienen las imágenes
 * opcionales de otros dominios: se reemplaza, no se limpia desde la ficha).
 * `seoKeywords` sí es una lista de verdad y sí se puede vaciar: un arreglo
 * `[]` es un valor legítimo, no se convierte en `undefined`.
 */
export function formToInput(form: FormState): SiteSettingsFormInput {
  const trim = textoOpcional;
  return {
    siteName: form.siteName.trim(),
    phone: trim(form.phone),
    email: trim(form.email),
    whatsapp: trim(form.whatsapp),
    address: trim(form.address),
    socialFacebook: trim(form.socialFacebook),
    socialInstagram: trim(form.socialInstagram),
    socialTwitter: trim(form.socialTwitter),
    socialYoutube: trim(form.socialYoutube),
    seoTitle: trim(form.seoTitle),
    seoDescription: trim(form.seoDescription),
    seoKeywords: form.seoKeywords.map((item) => item.trim()).filter(Boolean),
    seoImage: trim(form.seoImage),
    logo: trim(form.logo),
  };
}

/* -------------------------------------------------------------------------- *
 * Validación — mismas reglas de formato que `site-settings.schemas.ts` del
 * backend, dichas en el idioma de la ficha.
 * -------------------------------------------------------------------------- */

function esUrlValida(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function esCorreoValido(value: string): boolean {
  return value === '' || z.string().email().safeParse(value).success;
}

/** Mismo criterio que `urlWhatsApp` del sitio: solo importan los dígitos. */
function esWhatsappValido(value: string): boolean {
  if (!value) return true;
  const digitos = value.replace(/\D/g, '');
  return digitos.length >= 7 && digitos.length <= 15;
}

const MENSAJE_URL = 'Tiene que ser una URL completa (empezar por http:// o https://).';

const esquema = z.object({
  siteName: z.string().trim().min(1, 'El sitio necesita un nombre.').max(255),
  phone: z.string().trim().max(50),
  email: z.string().trim().max(255).refine(esCorreoValido, 'Correo inválido'),
  whatsapp: z
    .string()
    .trim()
    .max(50)
    .refine(esWhatsappValido, 'Deben ser entre 7 y 15 dígitos (con o sin +, espacios o guiones).'),
  address: z.string().trim().max(500),
  socialFacebook: z.string().trim().max(500).refine(esUrlValida, MENSAJE_URL),
  socialInstagram: z.string().trim().max(500).refine(esUrlValida, MENSAJE_URL),
  socialTwitter: z.string().trim().max(500).refine(esUrlValida, MENSAJE_URL),
  socialYoutube: z.string().trim().max(500).refine(esUrlValida, MENSAJE_URL),
  seoTitle: z.string().trim().max(255),
  seoDescription: z.string().trim().max(500),
  seoImage: z.string().trim().max(500).refine(esUrlValida, MENSAJE_URL),
  logo: z.string().trim().max(500).refine(esUrlValida, MENSAJE_URL),
});

export function validar(form: FormState): ResultadoValidacion<SeccionId> {
  const errores = erroresDeZod(esquema.safeParse(form));

  /* Un renglón vacío en medio de la lista no se guarda, pero avisarlo evita
     que parezca que se perdió lo que se escribió (mismo criterio que
     `features`/`benefits` de `service`). */
  if (form.seoKeywords.length > 0 && form.seoKeywords.every((item) => !item.trim())) {
    errores.seoKeywords = 'Escribe la palabra clave o quita el renglón.';
  }

  const primerCampo = Object.keys(errores)[0];
  return {
    errores,
    primeraSeccion: primerCampo ? seccionDeCampo(primerCampo) : undefined,
  };
}
