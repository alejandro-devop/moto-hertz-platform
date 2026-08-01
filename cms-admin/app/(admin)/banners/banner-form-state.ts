import { z } from 'zod';
import { toDateInput } from '@/lib/format';
import { erroresDeZod, textoOpcional } from '@/lib/form-state';
import type { ResultadoValidacion } from '@/lib/use-ficha-state';
import type { Banner, BannerFormInput, BannerSlot } from '@/lib/graphql/banners';
import { seccionDeCampo, type SeccionId } from './form-sections';

/**
 * El formulario es plano. `position` no está aquí: la fija el backend al
 * crear (se agrega al final de su slot) y solo cambia con el reordenar de la
 * lista, no desde la ficha.
 */
export interface FormState {
  slot: BannerSlot;
  title: string;
  subtitle: string;
  image: string;
  imageMobile: string;
  link: string;
  linkLabel: string;
  active: boolean;
  /** `'YYYY-MM-DD'`, o `''` = ya vigente / no vence (según el campo). */
  startsAt: string;
  endsAt: string;
}

export const EMPTY_FORM: FormState = {
  slot: 'HOME',
  title: '',
  subtitle: '',
  image: '',
  imageMobile: '',
  link: '',
  linkLabel: '',
  /* Un banner nuevo arranca activo: es lo que evita el paso extra de tener
     que activarlo después de crearlo. */
  active: true,
  startsAt: '',
  endsAt: '',
};

export function bannerToForm(banner: Banner): FormState {
  return {
    slot: banner.slot,
    title: banner.title,
    subtitle: banner.subtitle ?? '',
    image: banner.image,
    imageMobile: banner.imageMobile ?? '',
    link: banner.link ?? '',
    linkLabel: banner.linkLabel ?? '',
    active: banner.active,
    startsAt: toDateInput(banner.startsAt),
    endsAt: toDateInput(banner.endsAt),
  };
}

export function formToInput(form: FormState): BannerFormInput {
  const trim = textoOpcional;

  return {
    slot: form.slot,
    title: form.title.trim(),
    subtitle: trim(form.subtitle),
    image: form.image.trim(),
    imageMobile: trim(form.imageMobile),
    link: trim(form.link),
    linkLabel: trim(form.linkLabel),
    active: form.active,
    /* `''` (sin fecha) viaja como `null` explícito: así una vigencia que ya
       tenía fecha se puede volver a quitar, no solo dejarla intacta —mismo
       gesto que `publishedAt` en noticias. */
    startsAt: form.startsAt ? `${form.startsAt}T00:00:00.000Z` : null,
    endsAt: form.endsAt ? `${form.endsAt}T23:59:59.999Z` : null,
  };
}

/* -------------------------------------------------------------------------- *
 * Validación
 * -------------------------------------------------------------------------- */

const esquema = z
  .object({
    title: z.string().trim().min(1, 'Ponle un título: es lo que se lee sobre la imagen.').max(255),
    subtitle: z.string().trim().max(500, 'Máximo 500 caracteres.'),
    image: z.string().trim().min(1, 'Falta la imagen de escritorio: sin ella el banner sale en blanco.'),
    linkLabel: z.string().trim().max(100, 'El texto del botón es corto: máximo 100 caracteres.'),
  })
  .partial({ subtitle: true, linkLabel: true });

export function validar(form: FormState): ResultadoValidacion<SeccionId> {
  const errores = erroresDeZod(
    esquema.safeParse({
      title: form.title,
      subtitle: form.subtitle,
      image: form.image,
      linkLabel: form.linkLabel,
    })
  );

  /* El fin no puede ser antes que el inicio: la misma regla que valida el
     backend, dicha en el idioma de la ficha. */
  if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
    errores.endsAt = 'La fecha de fin no puede ser anterior a la de inicio.';
  }

  const primerCampo = Object.keys(errores)[0];
  return {
    errores,
    primeraSeccion: primerCampo ? seccionDeCampo(primerCampo) : undefined,
  };
}
