/**
 * `news` es el primer dominio del proyecto donde la lectura pública y la del
 * panel devuelven cosas distintas con los mismos argumentos. La decisión vive
 * en el resolver (`onlyPublished` / `trashed` según haya `context.user`), así
 * que es ahí donde se prueba — el service solo obedece la opción que le
 * llega, ver `tests/unit/services/news.service.test.ts`.
 */

const mockNewsService = {
  listNews: jest.fn(),
  getNewsBySlug: jest.fn(),
};

jest.mock('../../../src/services/news.service', () => ({
  newsService: mockNewsService,
}));

import { newsResolvers } from '../../../src/graphql/modules/news/news.resolvers';
import type { GraphQLContext } from '../../../src/graphql/server';

const SIN_SESION: GraphQLContext = {};
const CON_SESION: GraphQLContext = { user: { id: 1, email: 'admin@yamahaoriente.com' } };

describe('newsResolvers · regla pública vs. panel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNewsService.listNews.mockResolvedValue({ news: [], page: 1, limit: 50, total: 0 });
    mockNewsService.getNewsBySlug.mockResolvedValue({ id: '1', slug: 'x', title: 'x' });
  });

  describe('Query.newsList', () => {
    it('sin sesión: fuerza onlyPublished y nunca deja pedir la papelera', async () => {
      await newsResolvers.Query.newsList({}, { trashed: true }, SIN_SESION);

      expect(mockNewsService.listNews).toHaveBeenCalledWith(
        expect.objectContaining({ onlyPublished: true, trashed: false })
      );
    });

    it('sin sesión, aunque no se pida trashed: sigue sin ver borradores ni futuras', async () => {
      await newsResolvers.Query.newsList({}, {}, SIN_SESION);

      expect(mockNewsService.listNews).toHaveBeenCalledWith(
        expect.objectContaining({ onlyPublished: true, trashed: false })
      );
    });

    it('con sesión: ve todo (borradores y programadas incluidos) y respeta trashed', async () => {
      await newsResolvers.Query.newsList({}, { trashed: true }, CON_SESION);

      expect(mockNewsService.listNews).toHaveBeenCalledWith(
        expect.objectContaining({ onlyPublished: false, trashed: true })
      );
    });

    it('con sesión y sin pedir trashed: activos, pero sigue viendo borradores y programadas', async () => {
      await newsResolvers.Query.newsList({}, {}, CON_SESION);

      const llamada = mockNewsService.listNews.mock.calls[0][0];
      expect(llamada.onlyPublished).toBe(false);
      /* Sin sesión se fuerza a `false`; con sesión se respeta lo que llegó
         (aquí, nada, así que no filtra por papelera). */
      expect(llamada.trashed).toBeFalsy();
    });
  });

  describe('Query.news (detalle por slug)', () => {
    it('sin sesión: la vista pública no puede ver un borrador ni algo programado', async () => {
      await newsResolvers.Query.news({}, { slug: 'una-noticia' }, SIN_SESION);

      expect(mockNewsService.getNewsBySlug).toHaveBeenCalledWith('una-noticia', {
        onlyPublished: true,
      });
    });

    it('con sesión: el panel puede previsualizar cualquier estado', async () => {
      await newsResolvers.Query.news({}, { slug: 'una-noticia' }, CON_SESION);

      expect(mockNewsService.getNewsBySlug).toHaveBeenCalledWith('una-noticia', {
        onlyPublished: false,
      });
    });
  });
});
