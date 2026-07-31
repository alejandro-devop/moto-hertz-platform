import { newsService } from '../../../services/news.service';
import { withValidatedResolver } from '../../utils/validation';
import { requireAuth } from '../../utils/error-handler';
import {
  newsAddInputSchema,
  newsEditInputSchema,
  newsIdArgSchema,
  newsListArgsSchema,
  newsSlugArgSchema,
} from '../../../validators/schemas/news.schemas';
import type { News } from '../../../types/services/news.types';
import type { GraphQLContext } from '../../server';

/**
 * `news` es el primer dominio del proyecto donde la lectura pública y la del
 * panel **no** devuelven lo mismo con los mismos argumentos: `onlyPublished`
 * (y, en la lista, también `trashed`) se deciden aquí según haya sesión —
 * nunca según lo que mande quien pregunta. Un `curl` sin `Authorization`
 * jamás puede pedir un borrador ni la papelera, sin importar qué argumentos
 * mande.
 */
export const newsResolvers = {
  /* La columna jsonb `tags` puede ser `null` en filas viejas, pero el SDL
     promete una lista: se normaliza aquí en vez de obligar a cada consumidor
     a hacerlo. */
  News: {
    tags: (item: News) => item.tags ?? [],
  },

  Query: {
    news: withValidatedResolver(
      newsSlugArgSchema,
      async (_: unknown, { slug }: { slug: string }, context: GraphQLContext) => {
        return newsService.getNewsBySlug(slug, { onlyPublished: !context.user });
      },
      'news'
    ),

    newsList: withValidatedResolver(
      newsListArgsSchema,
      async (_: unknown, args: Record<string, unknown>, context: GraphQLContext) => {
        const esAdmin = Boolean(context.user);
        return newsService.listNews({
          ...(args as any),
          /* La papelera nunca es pública, mande lo que mande `trashed`. */
          trashed: esAdmin ? (args.trashed as boolean | undefined) : false,
          onlyPublished: !esAdmin,
        });
      },
      'newsList'
    ),
  },

  Mutation: {
    newsAdd: withValidatedResolver(
      newsAddInputSchema,
      async (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
        requireAuth(context, 'newsAdd');
        return newsService.createNews(input);
      },
      'newsAdd'
    ),

    newsEdit: withValidatedResolver(
      newsEditInputSchema,
      async (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
        requireAuth(context, 'newsEdit');
        const { id, ...rest } = input;
        return newsService.updateNews(id, rest);
      },
      'newsEdit'
    ),

    newsRemove: withValidatedResolver(
      newsIdArgSchema,
      async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
        requireAuth(context, 'newsRemove');
        return newsService.trashNews(id);
      },
      'newsRemove'
    ),

    newsRestore: withValidatedResolver(
      newsIdArgSchema,
      async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
        requireAuth(context, 'newsRestore');
        return newsService.restoreNews(id);
      },
      'newsRestore'
    ),

    newsPurge: withValidatedResolver(
      newsIdArgSchema,
      async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
        requireAuth(context, 'newsPurge');
        return newsService.purgeNews(id);
      },
      'newsPurge'
    ),
  },
};
