import { pageContentService } from '../../../services/page-content.service';
import { withValidatedResolver } from '../../utils/validation';
import { requireAuth } from '../../utils/error-handler';
import {
  pageContentArgsSchema,
  pageContentSetManyArgsSchema,
} from '../../../validators/schemas/page-content.schemas';
import type { GraphQLContext } from '../../server';

export const pageContentResolvers = {
  Query: {
    pageContent: withValidatedResolver(
      pageContentArgsSchema,
      async (_: unknown, { page }: { page: string }) => pageContentService.getPageContent(page),
      'pageContent'
    ),
  },

  Mutation: {
    pageContentSetMany: withValidatedResolver(
      pageContentSetManyArgsSchema,
      async (
        _: unknown,
        { page, fields }: { page: string; fields: { field: string; value: string }[] },
        context: GraphQLContext
      ) => {
        requireAuth(context, 'pageContentSetMany');
        return pageContentService.setPageContentMany(page, fields);
      },
      'pageContentSetMany'
    ),
  },
};
