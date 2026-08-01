import { z } from 'zod';
import { siteSettingsService } from '../../../services/site-settings.service';
import { withValidatedResolver } from '../../utils/validation';
import { requireAuth } from '../../utils/error-handler';
import { siteSettingsEditInputSchema } from '../../../validators/schemas/site-settings.schemas';
import type { GraphQLContext } from '../../server';

/** `siteSettings` no recibe argumentos: nada que validar más allá de la forma vacía. */
const sinArgumentosSchema = z.object({});

export const siteSettingsResolvers = {
  Query: {
    siteSettings: withValidatedResolver(
      sinArgumentosSchema,
      async () => siteSettingsService.getSiteSettings(),
      'siteSettings'
    ),
  },

  Mutation: {
    siteSettingsEdit: withValidatedResolver(
      siteSettingsEditInputSchema,
      async (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
        requireAuth(context, 'siteSettingsEdit');
        return siteSettingsService.updateSiteSettings(input);
      },
      'siteSettingsEdit'
    ),
  },
};
