import { eq } from 'drizzle-orm';
import { getDb } from '../shared/database/drizzle';
import { siteSettings } from '../shared/database/schema';
import { NotFoundError } from '../shared/errors';
import type { SiteSettings, UpdateSiteSettingsInput } from '../types/services/site-settings.types';

/** La única fila que existe: fijada por el `CHECK (id = 1)` de la migración `011`. */
const ID_UNICO = 1;

/**
 * `site_settings` es un registro único: no hay `list`, `create` ni `delete`,
 * solo leer y actualizar la misma fila. En un ambiente migrado correctamente
 * siempre hay fila (la migración `011` la siembra) — si no la hay, es que
 * falta correr `npm run migrate`, y eso se reporta como error explícito en
 * vez de devolver `null` y dejar que `web`/el panel adivinen por qué.
 */
async function getSiteSettings(): Promise<SiteSettings> {
  const db = getDb();
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, ID_UNICO)).limit(1);
  if (!row) {
    throw new NotFoundError(
      'site_settings no tiene fila inicial: falta aplicar la migración 011 (npm run migrate).'
    );
  }
  return row as SiteSettings;
}

async function updateSiteSettings(input: UpdateSiteSettingsInput): Promise<SiteSettings> {
  await getSiteSettings();
  const db = getDb();
  const [row] = await db
    .update(siteSettings)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(siteSettings.id, ID_UNICO))
    .returning();
  return row as SiteSettings;
}

export const siteSettingsService = {
  getSiteSettings,
  updateSiteSettings,
};
