import { createMockBanner } from '../../helpers/mocks';

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
  transaction: jest.fn(),
};

jest.mock('../../../src/shared/database/drizzle', () => ({
  getDb: () => mockDb,
}));

import { bannerService } from '../../../src/services/banner.service';
import { BadRequestError, NotFoundError } from '../../../src/shared/errors';

describe('bannerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBannerById', () => {
    it('returns the banner when found', async () => {
      const banner = createMockBanner();
      mockDb.select.mockReturnValueOnce(createQueryMock([banner]));

      const result = await bannerService.getBannerById(banner.id);

      expect(result).toEqual(banner);
    });

    it('throws NotFoundError when no banner matches', async () => {
      mockDb.select.mockReturnValueOnce(createQueryMock([]));

      await expect(bannerService.getBannerById('missing-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listBanners', () => {
    it('returns a paginated collection', async () => {
      const banner = createMockBanner();
      mockDb.select
        .mockReturnValueOnce(createQueryMock([banner]))
        .mockReturnValueOnce(createQueryMock([{ value: 1 }]));

      const result = await bannerService.listBanners({ page: 1, limit: 50 });

      expect(result).toEqual({
        banners: [banner],
        page: 1,
        limit: 50,
        total: 1,
      });
    });
  });

  /* Un banner nuevo se agrega al final: la posición sale de cuántos hay hoy
     en el sitio (sin contar la papelera). */
  describe('createBanner · posición', () => {
    it('appends the new banner after the ones that already exist', async () => {
      const banner = createMockBanner({ position: 2 });
      mockDb.select.mockReturnValueOnce(createQueryMock([{ value: 2 }]));
      const values = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([banner]),
      });
      mockDb.insert.mockReturnValueOnce({ values });

      await bannerService.createBanner({
        title: banner.title,
        image: banner.image,
        slot: 'HOME',
      });

      expect(values.mock.calls[0][0].position).toBe(2);
    });
  });

  describe('updateBanner', () => {
    it('leaves untouched columns alone (undefined never overwrites)', async () => {
      const banner = createMockBanner();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([banner]) }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([banner]));
      mockDb.update.mockReturnValueOnce({ set });

      await bannerService.updateBanner(banner.id, { title: 'Otro título' });

      const cambios = set.mock.calls[0][0];
      expect(cambios.title).toBe('Otro título');
      expect(cambios.image).toBeUndefined();
    });

    it('clears an explicit null (vigencia) instead of ignoring it', async () => {
      const banner = createMockBanner({ endsAt: new Date('2026-08-01') });
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...banner, endsAt: null }]),
        }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([banner]));
      mockDb.update.mockReturnValueOnce({ set });

      await bannerService.updateBanner(banner.id, { endsAt: null });

      expect(set.mock.calls[0][0].endsAt).toBeNull();
    });
  });

  /* Papelera: `trashBanner` no borra, marca. PATRON.md §1.1. */
  describe('trashBanner', () => {
    it('marks the banner as deleted instead of removing the row', async () => {
      const banner = createMockBanner();
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([banner]) }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([banner]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await bannerService.trashBanner(banner.id);

      expect(result).toBe(true);
      expect(mockDb.delete).not.toHaveBeenCalled();
      expect(set.mock.calls[0][0].deletedAt).toBeInstanceOf(Date);
    });

    it('is idempotent: trashing what is already in the trash does nothing', async () => {
      const banner = createMockBanner({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([banner]));

      await expect(bannerService.trashBanner(banner.id)).resolves.toBe(true);
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe('restoreBanner', () => {
    it('clears deletedAt', async () => {
      const banner = createMockBanner({ deletedAt: new Date('2026-01-01') });
      const set = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...banner, deletedAt: null }]),
        }),
      });
      mockDb.select.mockReturnValueOnce(createQueryMock([banner]));
      mockDb.update.mockReturnValueOnce({ set });

      const result = await bannerService.restoreBanner(banner.id);

      expect(result.deletedAt).toBeNull();
      expect(set.mock.calls[0][0].deletedAt).toBeNull();
    });
  });

  describe('purgeBanner', () => {
    it('deletes for real when the banner is already in the trash', async () => {
      const banner = createMockBanner({ deletedAt: new Date('2026-01-01') });
      mockDb.select.mockReturnValueOnce(createQueryMock([banner]));
      mockDb.delete.mockReturnValueOnce({ where: jest.fn().mockResolvedValueOnce(undefined) });

      await expect(bannerService.purgeBanner(banner.id)).resolves.toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('refuses to skip the trash', async () => {
      const banner = createMockBanner();
      mockDb.select.mockReturnValueOnce(createQueryMock([banner]));

      await expect(bannerService.purgeBanner(banner.id)).rejects.toThrow(BadRequestError);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });

  /* El orden es el dato: `reorderBanners` reescribe la posición de todos los
     banners que llegan, en el índice en que llegan. */
  describe('reorderBanners', () => {
    it('sets position to the index of each id in the array', async () => {
      const primero = createMockBanner({ id: 'b', position: 1 });
      const segundo = createMockBanner({ id: 'a', position: 0 });
      const sets: any[] = [];

      const tx = {
        update: jest.fn(() => ({
          set: jest.fn((valores: any) => {
            sets.push(valores);
            return { where: jest.fn().mockResolvedValue(undefined) };
          }),
        })),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(tx));
      mockDb.select.mockReturnValueOnce(createQueryMock([primero, segundo]));

      const result = await bannerService.reorderBanners('HOME', ['b', 'a']);

      expect(sets).toHaveLength(2);
      expect(sets[0].position).toBe(0);
      expect(sets[1].position).toBe(1);
      expect(result).toEqual([primero, segundo]);
    });
  });
});
