import { bannerService } from '../../../services/banner.service';
import { withValidatedResolver } from '../../utils/validation';
import { requireAuth } from '../../utils/error-handler';
import {
  bannerAddInputSchema,
  bannerEditInputSchema,
  bannerIdArgSchema,
  bannerReorderArgsSchema,
  bannersListArgsSchema,
} from '../../../validators/schemas/banner.schemas';
import type { GraphQLContext } from '../../server';

/**
 * `banner` es el segundo dominio del proyecto (después de `news`) donde la
 * lectura pública y la del panel difieren con los mismos argumentos:
 * `onlyVisible` (y `trashed`) se deciden aquí según haya sesión, nunca según
 * lo que mande quien pregunta.
 */
export const bannerResolvers = {
  Query: {
    banners: withValidatedResolver(
      bannersListArgsSchema,
      async (_: unknown, args: Record<string, unknown>, context: GraphQLContext) => {
        const esAdmin = Boolean(context.user);
        return bannerService.listBanners({
          ...(args as any),
          /* La papelera nunca es pública, mande lo que mande `trashed`. */
          trashed: esAdmin ? (args.trashed as boolean | undefined) : false,
          onlyVisible: !esAdmin,
        });
      },
      'banners'
    ),
  },

  Mutation: {
    bannerAdd: withValidatedResolver(
      bannerAddInputSchema,
      async (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
        requireAuth(context, 'bannerAdd');
        return bannerService.createBanner(input);
      },
      'bannerAdd'
    ),

    bannerEdit: withValidatedResolver(
      bannerEditInputSchema,
      async (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
        requireAuth(context, 'bannerEdit');
        const { id, ...rest } = input;
        return bannerService.updateBanner(id, rest);
      },
      'bannerEdit'
    ),

    bannerRemove: withValidatedResolver(
      bannerIdArgSchema,
      async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
        requireAuth(context, 'bannerRemove');
        return bannerService.trashBanner(id);
      },
      'bannerRemove'
    ),

    bannerRestore: withValidatedResolver(
      bannerIdArgSchema,
      async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
        requireAuth(context, 'bannerRestore');
        return bannerService.restoreBanner(id);
      },
      'bannerRestore'
    ),

    bannerPurge: withValidatedResolver(
      bannerIdArgSchema,
      async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
        requireAuth(context, 'bannerPurge');
        return bannerService.purgeBanner(id);
      },
      'bannerPurge'
    ),

    bannerReorder: withValidatedResolver(
      bannerReorderArgsSchema,
      async (_: unknown, { ids }: { ids: string[] }, context: GraphQLContext) => {
        requireAuth(context, 'bannerReorder');
        return bannerService.reorderBanners(ids);
      },
      'bannerReorder'
    ),
  },
};
