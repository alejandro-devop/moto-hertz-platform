import { mediaService } from '../../../services/media.service';
import { withValidatedResolver } from '../../utils/validation';
import { requireAuth } from '../../utils/error-handler';
import { mediaIdArgSchema, mediaListArgsSchema } from '../../../validators/schemas/media.schemas';

/**
 * A diferencia del catálogo, aquí **también la query exige sesión**: la
 * biblioteca de medios es una herramienta del panel. El sitio público no la
 * consulta — muestra las URLs que ya tiene guardadas en cada contenido.
 */
export const mediaResolvers = {
  Query: {
    mediaList: withValidatedResolver(
      mediaListArgsSchema,
      async (_: unknown, args: Record<string, unknown>, context) => {
        requireAuth(context, 'mediaList');
        return mediaService.listMedia(args as any);
      },
      'mediaList'
    ),
  },

  Mutation: {
    mediaRemove: withValidatedResolver(
      mediaIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'mediaRemove');
        return mediaService.trashMedia(id);
      },
      'mediaRemove'
    ),

    mediaRestore: withValidatedResolver(
      mediaIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'mediaRestore');
        return mediaService.restoreMedia(id);
      },
      'mediaRestore'
    ),

    mediaPurge: withValidatedResolver(
      mediaIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'mediaPurge');
        return mediaService.purgeMedia(id);
      },
      'mediaPurge'
    ),
  },
};
