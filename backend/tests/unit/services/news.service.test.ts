import { createMockNews } from '../../helpers/mocks';

function createQueryMock(result: unknown) {
  const mock: any = {
    from: jest.fn(() => mock),
    where: jest.fn(() => mock),
    orderBy: jest.fn(() => mock),
    limit: jest.fn(() => mock),
    offset: jest.fn(() => mock),
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
  return mock;
}

const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../../src/shared/database/drizzle', () => ({
  getDb: () => mockDb,
}));

import { newsService } from '../../../src/services/news.service';
import { BadRequestError, NotFoundError } from '../../../src/shared/errors';

describe('newsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNewsBySlug', () => {
    it('returns the news item when found', async () => {
      const noticia = createMockNews();
      mockDb.select.mockReturnValueOnce(createQueryMock([noticia]));

      const result = await newsService.getNewsBySlug('yamaha-mt-10-2024-lanzamiento');

      expect(result).toEqual(noticia);
    });

    it('throws NotFoundError when no news matches', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(newsService.getNewsBySlug('unknown')).rejects.toThrow(NotFoundError);
    });

    /* La condición extra de `onlyPublished` viaja hasta `.where()`: aquí solo
       se comprueba que la opción no rompe el camino feliz. La regla completa
       —quién puede pedirla— se prueba a nivel de resolver, que es donde de
       verdad se decide (ver `tests/unit/graphql/news.resolvers.test.ts`). */
    it('accepts onlyPublished without changing the happy path', async () => {
      const noticia = createMockNews();
      const query = createQueryMock([noticia]);
      mockDb.select.mockReturnValueOnce(query);

      const result = await newsService.getNewsBySlug('yamaha-mt-10-2024-lanzamiento', {
        onlyPublished: true,
      });

      expect(result).toEqual(noticia);
      /* Con `onlyPublished` la condición lleva más piezas (slug + no borrada +
         publicada + no futura) que sin ella (slug + no borrada). */
      expect(query.where).toHaveBeenCalledTimes(1);
    });
  });

  describe('listNews', () => {
    it('returns a paginated collection ordered by most recent first', async () => {
      const noticia = createMockNews();
      mockDb.select
        .mockReturnValueOnce(createQueryMock([noticia]))
        .mockReturnValueOnce(createQueryMock([{ value: 1 }]));

      const result = await newsService.listNews({ page: 1, limit: 50 });

      expect(result).toEqual({
        news: [noticia],
        page: 1,
        limit: 50,
        total: 1,
      });
    });
  });

  describe('createNews · content', () => {
    function capturarInsert(noticia: unknown) {
      const values = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([noticia]),
      });
      mockDb.insert.mockReturnValueOnce({ values });
      return values;
    }

    it('sanitizes disallowed tags out of the HTML content', async () => {
      const noticia = createMockNews();
      const values = capturarInsert(noticia);

      await newsService.createNews({
        slug: noticia.slug,
        title: noticia.title,
        content: '<p>Hola <script>alert(1)</script><strong onclick="x()">mundo</strong></p>',
      });

      expect(values.mock.calls[0][0].content).toBe('<p>Hola <strong>mundo</strong></p>');
    });

    it('keeps allowed tags, including a safe link', async () => {
      const noticia = createMockNews();
      const values = capturarInsert(noticia);

      await newsService.createNews({
        slug: noticia.slug,
        title: noticia.title,
        content: '<p>Lee <a href="https://example.com">la nota completa</a>.</p>',
      });

      expect(values.mock.calls[0][0].content).toContain(
        '<a href="https://example.com" target="_blank" rel="noopener noreferrer">la nota completa</a>'
      );
    });

    it('stores no content as undefined instead of an empty string', async () => {
      const noticia = createMockNews();
      const values = capturarInsert(noticia);

      await newsService.createNews({ slug: noticia.slug, title: noticia.title });

      expect(values.mock.calls[0][0].content).toBeUndefined();
    });

    it('drops empty rows from tags', async () => {
      const noticia = createMockNews();
      const values = capturarInsert(noticia);

      await newsService.createNews({
        slug: noticia.slug,
        title: noticia.title,
        tags: ['  MT-10  ', '   ', 'Lanzamiento'],
      });

      expect(values.mock.calls[0][0].tags).toEqual(['MT-10', 'Lanzamiento']);
    });
  });

  describe('updateNews', () => {
    it('leaves untouched columns alone (undefined never overwrites)', async () => {
      const noticia = createMockNews();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([noticia]) }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([noticia]));
      mockDb.update.mockReturnValueOnce({ set });

      await newsService.updateNews(noticia.id, { title: 'Otro título' });

      const cambios = set.mock.calls[0][0];
      expect(cambios.title).toBe('Otro título');
      expect(cambios.tags).toBeUndefined();
    });

    it('can clear publishedAt back to draft with an explicit null', async () => {
      const noticia = createMockNews();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...noticia, publishedAt: null }]),
        }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([noticia]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await newsService.updateNews(noticia.id, { publishedAt: null });

      expect(result.publishedAt).toBeNull();
      expect(set.mock.calls[0][0].publishedAt).toBeNull();
    });
  });

  /* Papelera: `deleteNews` no borra, marca. PATRON.md §1.1. */
  describe('trashNews', () => {
    it('marks the news item as deleted instead of removing the row', async () => {
      const noticia = createMockNews();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([noticia]) }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([noticia]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await newsService.trashNews(noticia.id);

      expect(result).toBe(true);
      expect(mockDb.delete).not.toHaveBeenCalled();
      expect(set.mock.calls[0][0].deletedAt).toBeInstanceOf(Date);
    });

    it('is idempotent: trashing what is already in the trash does nothing', async () => {
      const noticia = createMockNews({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([noticia]));

      await expect(newsService.trashNews(noticia.id)).resolves.toBe(true);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the news item does not exist', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(newsService.deleteNews('missing-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('restoreNews', () => {
    it('clears deletedAt', async () => {
      const noticia = createMockNews({ deletedAt: new Date('2026-01-01') });
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...noticia, deletedAt: null }]),
        }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([noticia]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await newsService.restoreNews(noticia.id);

      expect(result.deletedAt).toBeNull();
      expect(set.mock.calls[0][0].deletedAt).toBeNull();
    });
  });

  describe('purgeNews', () => {
    it('deletes for real when the news item is already in the trash', async () => {
      const noticia = createMockNews({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([noticia]));
      mockDb.delete.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce(undefined) });

      await expect(newsService.purgeNews(noticia.id)).resolves.toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('refuses to skip the trash', async () => {
      const noticia = createMockNews();
      mockDb.select.mockReturnValueOnce(createQueryMock([noticia]));

      await expect(newsService.purgeNews(noticia.id)).rejects.toThrow(BadRequestError);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });
});
